import type { SupportedLanguage } from '../constants';

/**
 * Logo asset configuration
 */
export interface LogoAsset {
  src: string;
  width: number;
  height: number;
}

/**
 * Logo variant with light and dark theme versions
 */
export interface LogoVariant {
  light: LogoAsset;
  dark: LogoAsset;
}

/**
 * Application default settings
 */
export interface AppDefaults {
  sidebarCollapsed: boolean;
  darkMode: boolean;
  language: SupportedLanguage;
}

/**
 * Internationalization configuration
 */
export interface I18nConfig {
  supportedLanguages: readonly SupportedLanguage[];
}

/**
 * Landing page configuration
 */
export interface LandingPageConfig {
  /** Background image path for the onboarding layout right panel */
  onboardingLayoutBackgroundImage?: string;
  /** Heading text displayed over the onboarding layout right panel */
  onboardingHeading?: string;
}

/**
 * Main application configuration
 */
export interface AppConfig {
  /** Application title displayed in browser tab and header */
  title: string;
  /** Internal project name identifier */
  projectName: string;
  /** Prefix for localStorage keys */
  storagePrefix: string;
  /** Default application settings */
  defaults: AppDefaults;
  /** Logo configurations for different contexts */
  logo: {
    minimal: LogoVariant;
    full: LogoVariant;
  };
  /** Path to favicon */
  favicon: string;
  /** Internationalization settings */
  i18n: I18nConfig;
  /** Hide the footer component */
  hideFooter: boolean;
  /** Date format string for detailed date display (tokens: dd, MM, yyyy, HH, mm, ss) */
  dateFormat?: string;
  landingPage?: LandingPageConfig;
}
