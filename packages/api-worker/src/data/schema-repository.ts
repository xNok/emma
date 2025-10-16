import { FormSchema } from '@xnok/emma-shared/types';
import { KVNamespace } from '@cloudflare/workers-types';

export interface SchemaRepository {
  getSchema(formId: string): Promise<FormSchema | null>;
}

export class CdnSchemaRepository implements SchemaRepository {
  private cdnUrl: string;

  constructor(cdnUrl: string) {
    this.cdnUrl = cdnUrl;
  }

  async getSchema(formId: string): Promise<FormSchema | null> {
    const response = await fetch(`${this.cdnUrl}/${formId}/${formId}.json`);
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as FormSchema;
  }
}

export class KvCacheSchemaRepository implements SchemaRepository {
  private cache: KVNamespace;
  private primaryRepository: SchemaRepository;
  private cacheTtl: number;

  constructor(
    cache: KVNamespace,
    primaryRepository: SchemaRepository,
    cacheTtl = 3600 // 1 hour
  ) {
    this.cache = cache;
    this.primaryRepository = primaryRepository;
    this.cacheTtl = cacheTtl;
  }

  async getSchema(formId: string): Promise<FormSchema | null> {
    const cachedSchema = await this.cache.get<FormSchema>(formId, 'json');
    if (cachedSchema) {
      return cachedSchema;
    }

    const schema = await this.primaryRepository.getSchema(formId);
    if (schema) {
      await this.cache.put(formId, JSON.stringify(schema), {
        expirationTtl: this.cacheTtl,
      });
    }

    return schema;
  }
}
