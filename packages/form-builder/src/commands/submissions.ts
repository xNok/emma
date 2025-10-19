/**
 * Submissions Command - View and export form submissions
 */

import { Command } from 'commander';
import chalk from 'chalk';
import type { EmmaConfig } from '../config.js';
import type { SubmissionRecord } from '@xnok/emma-shared/types';
import fs from 'fs-extra';
import { getSubmissionProvider } from '../submission-providers/index.js';

interface ListOptions {
  snapshot?: string;
  limit?: string;
  status?: string;
}

interface ExportOptions {
  format?: 'json' | 'csv';
  output?: string;
  snapshot?: string;
}

/**
 * List submissions command
 */
function listSubcommand(config: EmmaConfig): Command {
  return new Command('list')
    .description('List submissions for a form')
    .argument('<form-id>', 'Form ID to list submissions for')
    .option('--snapshot <timestamp>', 'Filter by snapshot timestamp')
    .option('--limit <number>', 'Maximum number of submissions to show', '50')
    .option('--status <status>', 'Filter by status (new, read, archived, spam)')
    .action(async (formId: string, options: ListOptions) => {
      if (!config.isInitialized()) {
        console.log(
          chalk.red('Emma is not initialized. Run "emma init" first.')
        );
        return;
      }

      try {
        console.log(
          chalk.cyan(`📥 Fetching submissions for form: ${formId}...`)
        );

        // Get the configured submission provider
        const provider = await getSubmissionProvider();

        if (!provider) {
          console.log(
            chalk.red(
              'No submission provider available. Please configure a database provider.'
            )
          );
          console.log('');
          console.log(chalk.cyan('For Cloudflare D1:'));
          console.log('  export CLOUDFLARE_DATABASE_NAME=emma-forms-db');
          console.log('  wrangler login');
          return;
        }

        const submissions = await provider.querySubmissions({
          formId,
          snapshot: options.snapshot
            ? parseInt(options.snapshot, 10)
            : undefined,
          status: options.status,
          limit: parseInt(options.limit || '50', 10),
        });

        if (submissions.length === 0) {
          console.log(chalk.yellow('No submissions found.'));
          return;
        }

        console.log('');
        console.log(chalk.green(`Found ${submissions.length} submission(s):`));
        console.log('');

        // Group by snapshot
        const bySnapshot = new Map<string, SubmissionRecord[]>();
        for (const sub of submissions) {
          const key = sub.form_snapshot?.toString() || 'no-snapshot';
          if (!bySnapshot.has(key)) {
            bySnapshot.set(key, []);
          }
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          bySnapshot.get(key)!.push(sub);
        }

        // Display grouped by snapshot
        for (const [snapshotKey, subs] of bySnapshot.entries()) {
          if (snapshotKey === 'no-snapshot') {
            console.log(chalk.gray('📸 No Snapshot'));
          } else {
            const timestamp = parseInt(snapshotKey, 10);
            const date = new Date(timestamp * 1000);
            console.log(
              chalk.cyan(
                `📸 Snapshot: ${snapshotKey} (${date.toLocaleDateString()})`
              )
            );
          }

          for (const sub of subs) {
            const date = new Date(sub.created_at * 1000);
            const data = JSON.parse(sub.data) as Record<string, unknown>;
            const preview = Object.entries(data)
              .slice(0, 2)
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ');

            console.log(
              `  ${chalk.gray(sub.id)} - ${date.toLocaleString()} - ${chalk.blue(sub.status)}`
            );
            console.log(`    ${preview}...`);
          }
          console.log('');
        }

        console.log(
          chalk.gray(
            `Tip: Use --snapshot to filter by specific snapshot, or --status to filter by status`
          )
        );
      } catch (error) {
        console.error(
          chalk.red('Error fetching submissions:'),
          error instanceof Error ? error.message : error
        );
        console.log('');
        console.log(
          chalk.yellow(
            'Make sure your database provider is properly configured and authenticated'
          )
        );
      }
    });
}

/**
 * Export submissions command
 */
function exportSubcommand(config: EmmaConfig): Command {
  return new Command('export')
    .description('Export submissions to JSON or CSV')
    .argument('<form-id>', 'Form ID to export submissions for')
    .option('-f, --format <format>', 'Export format (json or csv)', 'json')
    .option('-o, --output <file>', 'Output file path')
    .option('--snapshot <timestamp>', 'Filter by snapshot timestamp')
    .action(async (formId: string, options: ExportOptions) => {
      if (!config.isInitialized()) {
        console.log(
          chalk.red('Emma is not initialized. Run "emma init" first.')
        );
        return;
      }

      try {
        console.log(
          chalk.cyan(`📥 Exporting submissions for form: ${formId}...`)
        );

        // Get the configured submission provider
        const provider = await getSubmissionProvider();

        if (!provider) {
          console.log(
            chalk.red(
              'No submission provider available. Please configure a database provider.'
            )
          );
          console.log('');
          console.log(chalk.cyan('For Cloudflare D1:'));
          console.log('  export CLOUDFLARE_DATABASE_NAME=emma-forms-db');
          console.log('  wrangler login');
          return;
        }

        const submissions = await provider.querySubmissions({
          formId,
          snapshot: options.snapshot
            ? parseInt(options.snapshot, 10)
            : undefined,
          limit: 10000, // Large limit for export
        });

        if (submissions.length === 0) {
          console.log(chalk.yellow('No submissions found to export.'));
          return;
        }

        const format = options.format || 'json';
        const timestamp = Date.now();
        const defaultFilename = `${formId}-submissions-${timestamp}.${format}`;
        const outputPath = options.output || defaultFilename;

        if (format === 'json') {
          // Export as JSON
          const exportData = submissions.map((sub) => ({
            id: sub.id,
            formId: sub.form_id,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            data: JSON.parse(sub.data),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            meta: sub.meta ? JSON.parse(sub.meta) : null,
            snapshot: {
              timestamp: sub.form_snapshot,
              bundle: sub.form_bundle,
            },
            spamScore: sub.spam_score,
            status: sub.status,
            createdAt: sub.created_at,
          }));

          await fs.writeJson(outputPath, exportData, { spaces: 2 });
        } else if (format === 'csv') {
          // Export as CSV
          const lines: string[] = [];

          // Collect all unique fields
          const allFields = new Set<string>();
          for (const sub of submissions) {
            const data = JSON.parse(sub.data) as Record<string, unknown>;
            Object.keys(data).forEach((key) => allFields.add(key));
          }

          // Header
          const headers = [
            'id',
            'form_id',
            'created_at',
            'status',
            'spam_score',
            'form_snapshot',
            'form_bundle',
            ...Array.from(allFields),
          ];
          lines.push(headers.map((h) => `"${h}"`).join(','));

          // Data rows
          for (const sub of submissions) {
            const data = JSON.parse(sub.data) as Record<string, unknown>;
            const row: string[] = [
              sub.id,
              sub.form_id,
              new Date(sub.created_at * 1000).toISOString(),
              sub.status,
              sub.spam_score.toString(),
              sub.form_snapshot?.toString() || 'N/A',
              sub.form_bundle || 'N/A',
            ];

            // Add field values
            for (const field of allFields) {
              const value = data[field];
              if (value === undefined || value === null) {
                row.push('N/A');
              } else if (Array.isArray(value)) {
                row.push(
                  value
                    .map((el) =>
                      String(el).replace(/;/g, '\\;').replace(/"/g, '""')
                    )
                    .join('; ')
                );
              } else {
                row.push(String(value).replace(/"/g, '""'));
              }
            }

            lines.push(row.map((cell) => `"${cell}"`).join(','));
          }

          await fs.writeFile(outputPath, lines.join('\n'));
        } else {
          console.log(chalk.red('Invalid format. Use "json" or "csv".'));
          return;
        }

        console.log('');
        console.log(
          chalk.green(
            `✓ Exported ${submissions.length} submission(s) to: ${outputPath}`
          )
        );
      } catch (error) {
        console.error(
          chalk.red('Error exporting submissions:'),
          error instanceof Error ? error.message : error
        );
      }
    });
}

/**
 * Main submissions command with subcommands
 */
export function submissionsCommand(config: EmmaConfig): Command {
  const cmd = new Command('submissions')
    .description('View and export form submissions')
    .addCommand(listSubcommand(config))
    .addCommand(exportSubcommand(config));

  return cmd;
}
