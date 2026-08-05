import type { AppConfig } from './types';

export * from './types';
export { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../constants';

/**
 * Define application configuration with type safety
 * @param config - Application configuration object
 * @returns The same configuration object (enables type checking)
 */
export function defineConfig(config: AppConfig): AppConfig {
  return config;
}

// Re-export the app config instance for convenient access via @/lib/app-config
export { default as appConfig } from '../../app.config';