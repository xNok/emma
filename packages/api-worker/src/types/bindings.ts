/**
 * Type definitions for Nitro runtime bindings
 * These types provide abstraction over platform-specific implementations
 */

/**
 * Generic database binding interface
 * Compatible with D1, SQLite, and other SQL databases
 */
export interface DatabaseBinding {
  prepare(query: string): PreparedStatement;
  batch(statements: PreparedStatement[]): Promise<unknown[]>;
  exec(query: string): Promise<unknown>;
}

export interface PreparedStatement {
  bind(...values: unknown[]): PreparedStatement;
  run(): Promise<unknown>;
  all(): Promise<unknown>;
  first(): Promise<unknown>;
}

/**
 * Generic key-value storage binding interface
 * Compatible with Cloudflare KV, Redis, and other KV stores
 */
export interface KVBinding {
  get(
    key: string,
    type?: 'text' | 'json' | 'arrayBuffer' | 'stream'
  ): Promise<unknown>;
  put(
    key: string,
    value: string | ArrayBuffer | ReadableStream,
    options?: KVPutOptions
  ): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: KVListOptions): Promise<KVListResult>;
}

export interface KVPutOptions {
  expiration?: number;
  expirationTtl?: number;
  metadata?: Record<string, unknown>;
}

export interface KVListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

export interface KVListResult {
  keys: Array<{ name: string; expiration?: number; metadata?: unknown }>;
  list_complete: boolean;
  cursor?: string;
}
