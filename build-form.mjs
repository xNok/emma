import { FormBuilder } from './packages/form-builder/dist/form-builder.js';
import { EmmaConfig } from './packages/form-builder/dist/config.js';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';

async function buildForm() {
  const config = new EmmaConfig();
  config.set('formsDirectory', './forms');
  config.set('buildsDirectory', './builds');
  await config.load()

  const formBuilder = new FormBuilder(config);
  const formId = 'contact-form';
  const schemaPath = path.join(config.getFormsDir(), `${formId}.yaml`);
  const schemaContent = await fs.readFile(schemaPath, 'utf-8');
  const schema = yaml.load(schemaContent);
  schema.formId = formId;

  await formBuilder.build(formId, schema);
}

buildForm().catch(console.error);