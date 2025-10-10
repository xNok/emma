/**
 * Preview Command - Open form in browser
 */

import { Command } from 'commander';
import chalk from 'chalk';
import open from 'open';
import type { EmmaConfig } from '../config.js';
import { FormManager } from '../form-manager.js';

interface PreviewOptions {
  port?: string;
  host?: string;
  open?: boolean;
}

export function previewCommand(config: EmmaConfig): Command {
  return new Command('preview')
    .description('Open form preview in browser')
    .argument('<form-id>', 'Form ID to preview')
    .option('-p, --port <port>', 'Override default port')
    .option('-h, --host <host>', 'Override default host')
    .option('--no-open', "Don't open browser automatically")
    .action(async (formId: string, options: PreviewOptions) => {
      if (!config.isInitialized()) {
        console.log(
          chalk.red('Emma is not initialized. Run "emma init" first.')
        );
        return;
      }

      const manager = new FormManager(config);

      try {
        // Check if form exists
        const schema = await manager.getForm(formId);
        if (!schema) {
          console.log(chalk.red(`Form "${formId}" not found.`));
          return;
        }

        // Ensure form is built (will build if needed)
        const wasRebuilt = await manager.ensureBuilt(formId);
        if (wasRebuilt) {
          console.log(chalk.green(`✅ Built form "${formId}"\n`));
        }

        const host = options.host || config.get('localServerHost');
        const port = options.port
          ? parseInt(options.port, 10)
          : config.get('localServerPort');

        // Deploy to local server
        const result = await manager.deployForm(formId, { host, port });

        console.log(chalk.cyan('📝 Form Preview'));
        console.log('');
        console.log(`Name: ${schema.name}`);
        console.log(`Theme: ${schema.theme}`);
        console.log(`Fields: ${schema.fields.length}`);
        console.log('');
        console.log(chalk.cyan('URLs:'));
        console.log(`  Form: ${result.formUrl}`);
        console.log(`  API:  ${result.apiUrl}`);
        console.log('');

        if (options.open !== false) {
          console.log(chalk.green('🌐 Opening in browser...'));
          await open(result.formUrl);
        } else {
          console.log(chalk.dim('Use --open to launch browser automatically'));
        }

        console.log('');
        console.log(chalk.cyan('Hugo Integration:'));
        console.log(`  {{< embed-form "${formId}" >}}`);
      } catch (error) {
        console.log(
          chalk.red(
            `Error: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(1);
      }
    });
}
