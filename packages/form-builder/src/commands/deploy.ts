/**
 * Deploy Command - Deploy form to local server (simulation)
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import type { EmmaConfig } from '../config.js';
import { LocalDeployment } from '../local-deployment.js';

interface DeployOptions {
  port?: string;
  host?: string;
}

export function deployCommand(config: EmmaConfig): Command {
  return new Command('deploy')
    .description(
      'Deploy form to local server (simulates production deployment)'
    )
    .argument('<form-id>', 'Form ID to deploy')
    .option('-p, --port <port>', 'Override default port')
    .option('-h, --host <host>', 'Override default host')
    .action(async (formId: string, options: DeployOptions) => {
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
      const spinner = ora('Deploying form...').start();

      try {
        const host = options.host || config.get('localServerHost');
        const port = options.port
          ? parseInt(options.port, 10)
          : config.get('localServerPort');

        const result = await deployment.deploy(formId, { host, port });

        spinner.succeed('Form deployed successfully');

        console.log('');
        console.log(chalk.green('🚀 Deployment complete!'));
        console.log('');
        console.log(chalk.cyan('Form URL:'));
        console.log(`  ${result.formUrl}`);
        console.log('');
        console.log(chalk.cyan('API Endpoint:'));
        console.log(`  ${result.apiUrl}`);
        console.log('');
        console.log(chalk.cyan('Hugo Shortcode:'));
        console.log(`  {{< embed-form "${formId}" >}}`);
        console.log('');
        console.log(chalk.dim('💡 This is a local deployment simulation.'));
        console.log(
          chalk.dim(
            '   In production, forms would be deployed to Cloudflare Edge.'
          )
        );
        console.log('');
        console.log(chalk.cyan('Next steps:'));
        console.log(`  $ emma preview ${formId}  # Open form in browser`);
        console.log(`  $ curl -X POST ${result.apiUrl}  # Test API endpoint`);
      } catch (error) {
        spinner.fail('Deployment failed');
        console.log(
          chalk.red(
            `Error: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(1);
      }
    });
}
