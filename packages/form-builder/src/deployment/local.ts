import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import type { EmmaConfig } from '../config.js';
import { FormManager } from '../form-manager.js';
import { LocalDeployment } from '../local-deployment.js';
import type {
  DeploymentProviderDefinition,
  GenericProviderOptions,
} from './index.js';
import type { FormSchema } from '@xnok/emma-shared/types';

export const localProvider: DeploymentProviderDefinition = {
  name: 'local',
  description: 'Deploy locally (simulation)',

  register(parent: Command, config: EmmaConfig) {
    parent
      .command('local')
      .description(this.description)
      .argument('<form-id>', 'Form ID to deploy')
      .option('-p, --port <port>', 'Override default local port')
      .option('-h, --host <host>', 'Override default local host')
      .action(async (formId: string, options: GenericProviderOptions) => {
        await this.execute(config, formId, options);
      });
  },

  async execute(
    config: EmmaConfig,
    formId: string,
    options: GenericProviderOptions
  ): Promise<void> {
    if (!config.isInitialized()) {
      console.log(chalk.red('Emma is not initialized. Run "emma init" first.'));
      return;
    }

    const schema: FormSchema | null = await config.loadFormSchema(formId);
    if (!schema) {
      console.log(chalk.red(`Form "${formId}" not found.`));
      return;
    }

    const manager = new FormManager(config);
    const spinner = ora('Deploying form (local)...').start();

    try {
      await manager.ensureBuilt(formId);

      const deployment = new LocalDeployment(config);
      const host = (options.host as string) || config.get('localServerHost');
      const portOpt = options.port as string | undefined;
      const port = portOpt
        ? parseInt(portOpt, 10)
        : config.get('localServerPort');

      const result = await deployment.deploy(formId, { host, port });

      spinner.succeed('Form deployed locally');

      console.log('');
      console.log(chalk.green('🚀 Local deployment complete!'));
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
        chalk.dim('   Use: emma deploy cloudflare <form-id> for production.')
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
  },
};
