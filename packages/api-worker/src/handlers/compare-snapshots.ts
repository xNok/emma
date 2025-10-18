import { Context } from 'hono';
import { Env } from '../env';
import { FormSchema, FormField } from '@xnok/emma-shared/types';

interface FieldChange {
  fieldId: string;
  type: 'added' | 'removed' | 'modified';
  oldField?: FormField;
  newField?: FormField;
  changes?: {
    property: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
}

interface ComparisonResult {
  success: boolean;
  formId: string;
  snapshot1: {
    timestamp: number;
    bundle: string;
    fieldCount: number;
  };
  snapshot2: {
    timestamp: number;
    bundle: string;
    fieldCount: number;
  };
  changes: {
    added: FieldChange[];
    removed: FieldChange[];
    modified: FieldChange[];
  };
  summary: {
    totalChanges: number;
    addedCount: number;
    removedCount: number;
    modifiedCount: number;
  };
}

/**
 * Compares two form snapshots and identifies changes
 */
export default async function handleCompareSnapshots(
  c: Context<{ Bindings: Env }>
): Promise<Response> {
  try {
    const formId = c.req.param('formId');
    const snapshot1Param = c.req.query('snapshot1');
    const snapshot2Param = c.req.query('snapshot2');

    if (!formId) {
      return c.json({ success: false, error: 'Form ID required' }, 400);
    }

    if (!snapshot1Param || !snapshot2Param) {
      return c.json(
        {
          success: false,
          error: 'Both snapshot1 and snapshot2 parameters are required',
        },
        400
      );
    }

    const snapshot1 = parseInt(snapshot1Param, 10);
    const snapshot2 = parseInt(snapshot2Param, 10);

    if (isNaN(snapshot1) || isNaN(snapshot2)) {
      return c.json(
        { success: false, error: 'Invalid snapshot timestamp' },
        400
      );
    }

    const schemaRepository = c.env.schemaRepository;

    // Get form schema (which should have snapshot history)
    const formSchema = await schemaRepository.getSchema(formId);
    if (!formSchema) {
      return c.json({ success: false, error: 'Form not found' }, 404);
    }

    // Find the two snapshots in the form's history
    const schema1 = findSnapshotSchema(formSchema, snapshot1);
    const schema2 = findSnapshotSchema(formSchema, snapshot2);

    if (!schema1 || !schema2) {
      return c.json(
        { success: false, error: 'One or both snapshots not found' },
        404
      );
    }

    // Compare the two schemas
    const comparison = compareFormSchemas(
      formId,
      snapshot1,
      snapshot2,
      schema1,
      schema2
    );

    return c.json(comparison);
  } catch (error) {
    console.error('Compare snapshots error:', error);
    return c.json(
      {
        success: false,
        error: 'Internal server error',
      },
      500
    );
  }
}

/**
 * Find a schema snapshot by timestamp
 * For now, we'll use the current schema structure
 * In a real implementation, we'd fetch the specific snapshot bundle from R2
 */
function findSnapshotSchema(
  formSchema: FormSchema,
  timestamp: number
): FormSchema | null {
  // In the current implementation, we only have the current schema
  // For a complete implementation, we'd need to fetch historical snapshots from R2
  if (formSchema.currentSnapshot === timestamp) {
    return formSchema;
  }

  // Check if this timestamp exists in the snapshots array
  const snapshotExists = formSchema.snapshots?.some(
    (s) => s.timestamp === timestamp
  );
  if (!snapshotExists) {
    return null;
  }

  // TODO: Fetch the actual snapshot bundle from R2 and parse it
  // For now, we'll return null to indicate this needs implementation
  // This is a limitation that should be documented
  return null;
}

/**
 * Compare two form schemas and identify changes
 */
function compareFormSchemas(
  formId: string,
  snapshot1: number,
  snapshot2: number,
  schema1: FormSchema,
  schema2: FormSchema
): ComparisonResult {
  const fields1 = new Map(schema1.fields.map((f) => [f.id, f]));
  const fields2 = new Map(schema2.fields.map((f) => [f.id, f]));

  const added: FieldChange[] = [];
  const removed: FieldChange[] = [];
  const modified: FieldChange[] = [];

  // Find added and modified fields
  fields2.forEach((field2, fieldId) => {
    const field1 = fields1.get(fieldId);
    if (!field1) {
      // Field was added
      added.push({
        fieldId,
        type: 'added',
        newField: field2,
      });
    } else {
      // Check if field was modified
      const changes = compareFields(field1, field2);
      if (changes.length > 0) {
        modified.push({
          fieldId,
          type: 'modified',
          oldField: field1,
          newField: field2,
          changes,
        });
      }
    }
  });

  // Find removed fields
  fields1.forEach((field1, fieldId) => {
    if (!fields2.has(fieldId)) {
      removed.push({
        fieldId,
        type: 'removed',
        oldField: field1,
      });
    }
  });

  return {
    success: true,
    formId,
    snapshot1: {
      timestamp: snapshot1,
      bundle: `${formId}-${snapshot1}.js`,
      fieldCount: schema1.fields.length,
    },
    snapshot2: {
      timestamp: snapshot2,
      bundle: `${formId}-${snapshot2}.js`,
      fieldCount: schema2.fields.length,
    },
    changes: {
      added,
      removed,
      modified,
    },
    summary: {
      totalChanges: added.length + removed.length + modified.length,
      addedCount: added.length,
      removedCount: removed.length,
      modifiedCount: modified.length,
    },
  };
}

/**
 * Compare two fields and return list of changes
 */
function compareFields(
  field1: FormField,
  field2: FormField
): { property: string; oldValue: unknown; newValue: unknown }[] {
  const changes: { property: string; oldValue: unknown; newValue: unknown }[] =
    [];

  // Compare relevant properties
  const propertiesToCompare: (keyof FormField)[] = [
    'type',
    'label',
    'placeholder',
    'required',
    'helpText',
    'rows',
    'defaultValue',
    'autocomplete',
  ];

  propertiesToCompare.forEach((prop) => {
    const val1 = field1[prop];
    const val2 = field2[prop];

    // Deep comparison for objects/arrays
    if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      changes.push({
        property: prop,
        oldValue: val1,
        newValue: val2,
      });
    }
  });

  // Compare validation rules
  if (JSON.stringify(field1.validation) !== JSON.stringify(field2.validation)) {
    changes.push({
      property: 'validation',
      oldValue: field1.validation,
      newValue: field2.validation,
    });
  }

  // Compare options for select/radio/checkbox
  if (JSON.stringify(field1.options) !== JSON.stringify(field2.options)) {
    changes.push({
      property: 'options',
      oldValue: field1.options,
      newValue: field2.options,
    });
  }

  return changes;
}
