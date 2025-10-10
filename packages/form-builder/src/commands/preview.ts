/**
 * Preview Command - Open form in browser
 */

import { Command } from 'commander';
import chalk from 'chalk';
import open from 'open';
import type { EmmaConfig } from '../config.js';
import { LocalDeployment } from '../local-deployment.js';

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

      const schema = await config.loadFormSchema(formId);
      if (!schema) {
        console.log(chalk.red(`Form "${formId}" not found.`));
        return;
      }

      const deployment = new LocalDeployment(config);

      try {
        const host = options.host || config.get('localServerHost');
        const port = options.port
          ? parseInt(options.port, 10)
          : config.get('localServerPort');

        // Ensure form is deployed/built
        const result = await deployment.ensureDeployed(formId, { host, port });

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
