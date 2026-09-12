/**
 * Cloudflare Email Driver for Emma Forms
 * Implements Nitro/UnJS Email Driver Specification (`unemail`)
 */

export interface EmailAttachment {
  filename: string;
  content: string | Uint8Array | ArrayBuffer;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  from: string | { name?: string; email: string };
  replyTo?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  tags?: Record<string, string>;
}

export interface SendEmailResult {
  success: boolean;
  messageId: string;
  provider: string;
  rawResponse?: unknown;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

export interface EmailDriver {
  readonly name: string;
  send(options: SendEmailOptions): Promise<SendEmailResult>;
  verify?(): Promise<boolean>;
}

export type EmailDriverFactory<Options> = (options: Options) => EmailDriver;

export function defineEmailDriver<Options>(
  factory: EmailDriverFactory<Options>
): EmailDriverFactory<Options> {
  return factory;
}

export interface CloudflareWorkerBinding {
  send(
    message: Record<string, unknown>
  ): Promise<{ messageId?: string } | void>;
}

export interface CloudflareDriverOptions {
  accountId?: string;
  apiToken?: string;
  /**
   * Optional Cloudflare Worker native SendEmail binding (env.EMAIL)
   */
  binding?: CloudflareWorkerBinding;
}

interface GlobalScopeWithEnv {
  __env__?: {
    EMAIL?: CloudflareWorkerBinding;
  };
  EMAIL?: CloudflareWorkerBinding;
}

function getGlobalBinding(): CloudflareWorkerBinding | undefined {
  const scope = globalThis as unknown as GlobalScopeWithEnv;
  return scope.__env__?.EMAIL || scope.EMAIL;
}

/**
 * Cloudflare Email Driver implementation.
 * Supports Cloudflare Worker native email binding (env.EMAIL) with REST API fallback.
 */
export const cloudflareEmailDriver: EmailDriverFactory<CloudflareDriverOptions> =
  defineEmailDriver<CloudflareDriverOptions>((opts = {}) => {
    return {
      name: 'cloudflare',

      async send(options: SendEmailOptions): Promise<SendEmailResult> {
        const binding = opts.binding || getGlobalBinding();

        const formattedFrom =
          typeof options.from === 'string'
            ? options.from
            : options.from.name
              ? `${options.from.name} <${options.from.email}>`
              : options.from.email;

        // 1. Native Worker binding dispatch
        if (binding && typeof binding.send === 'function') {
          try {
            const res = await binding.send({
              to: Array.isArray(options.to) ? options.to : [options.to],
              from: formattedFrom,
              subject: options.subject,
              text: options.text || '',
              html: options.html,
              replyTo: options.replyTo,
              cc: options.cc,
              bcc: options.bcc,
              headers: options.headers,
            });

            const resMessageId =
              res && typeof res === 'object' && 'messageId' in res
                ? res.messageId
                : undefined;

            return {
              success: true,
              messageId:
                resMessageId ||
                `cf-worker-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              provider: 'cloudflare',
              rawResponse: res,
            };
          } catch (err) {
            return {
              success: false,
              messageId: '',
              provider: 'cloudflare',
              error: {
                code: 'WORKER_BINDING_ERROR',
                message: err instanceof Error ? err.message : String(err),
                retryable: true,
              },
            };
          }
        }

        // 2. REST API fallback
        if (opts.accountId && opts.apiToken) {
          try {
            const res = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${opts.accountId}/email/sending/send`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${opts.apiToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  to: Array.isArray(options.to) ? options.to : [options.to],
                  from: formattedFrom,
                  subject: options.subject,
                  text: options.text,
                  html: options.html,
                  reply_to: options.replyTo,
                  cc: options.cc,
                  bcc: options.bcc,
                  headers: options.headers,
                }),
              }
            );

            const data = (await res.json()) as {
              success?: boolean;
              result?: { id?: string; message_id?: string };
              errors?: Array<{ code?: number | string; message?: string }>;
            };

            if (res.ok && data.success) {
              return {
                success: true,
                messageId:
                  data.result?.id ||
                  data.result?.message_id ||
                  `cf-api-${Date.now()}`,
                provider: 'cloudflare',
                rawResponse: data,
              };
            }

            return {
              success: false,
              messageId: '',
              provider: 'cloudflare',
              rawResponse: data,
              error: {
                code:
                  data.errors?.[0]?.code !== undefined
                    ? String(data.errors[0].code)
                    : 'CLOUDFLARE_API_ERROR',
                message:
                  data.errors?.[0]?.message ||
                  `Failed to send email via Cloudflare API (status ${res.status})`,
                retryable: res.status >= 500 || res.status === 429,
              },
            };
          } catch (err) {
            return {
              success: false,
              messageId: '',
              provider: 'cloudflare',
              error: {
                code: 'NETWORK_ERROR',
                message: err instanceof Error ? err.message : String(err),
                retryable: true,
              },
            };
          }
        }

        throw new Error(
          'Cloudflare email driver missing EMAIL binding or accountId/apiToken'
        );
      },

      // eslint-disable-next-line @typescript-eslint/require-await
      async verify(): Promise<boolean> {
        const binding = opts.binding || getGlobalBinding();

        if (binding && typeof binding.send === 'function') {
          return true;
        }

        if (Boolean(opts.accountId) && Boolean(opts.apiToken)) {
          return true;
        }

        return false;
      },
    };
  });

/**
 * Alias for cloudflareEmailDriver
 */
export const cloudflareDriver = cloudflareEmailDriver;
