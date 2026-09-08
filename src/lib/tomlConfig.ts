import { parse as parseToml } from "smol-toml";

/** Per-application section of a Launchpad TOML config (v1.0). */
export interface AppConfig {
  description?: string;
  chipsets: string[];
  /** Maps a lowercased chipset name (or dev-kit name) to a firmware image filename. */
  image: Record<string, string>;
  /** Maps a lowercased chipset name to the list of supported dev-kit names. */
  developKits?: Record<string, string[]>;
  readme?: { text?: string };
  console_baudrate?: number;
  ios_app_url?: string;
  android_app_url?: string;
  setup_payload_logo?: string;
  setup_payload?: string;
  offset?: string;
}

/** Root Launchpad TOML config (v1.0). Known fields plus dynamic per-app sections. */
export interface LaunchpadConfig {
  esp_toml_version: number | string;
  firmware_images_url: string;
  config_readme_url?: string;
  supported_apps: string[];
  [appName: string]: unknown;
}

export interface LoadConfigResult {
  config: LaunchpadConfig;
  isDefault: boolean;
  tomlFileURL: string;
  /** Apps that were requested via ?app= but not found. */
  missingApp?: string;
}

const CORS_PROXY = "https://cors-proxy.espressif.tools/?url=";

const SOLUTION_TOML_URLS: Record<string, string> = {
  matter: "https://espressif.github.io/esp-matter/launchpad.toml",
  rainmaker: "https://espressif.github.io/esp-rainmaker/launchpad.toml",
  mcpagent: "https://adwait-esp.github.io/flasher/config/mcp_agent_config.toml",
};

const DEFAULT_TOML_URL = "https://espressif.github.io/esp-rainmaker/launchpad.toml";

function resolveTomlUrl(params: URLSearchParams): { url: string; isDefault: boolean } {
  const solution = params.get("solution");
  if (solution) {
    return { url: SOLUTION_TOML_URLS[solution.toLowerCase()] ?? DEFAULT_TOML_URL, isDefault: true };
  }
  const externalURL = params.get("flashConfigURL");
  if (externalURL) {
    const crossDomain = params.get("crossDomain") === "true";
    return { url: crossDomain ? CORS_PROXY + externalURL : externalURL, isDefault: false };
  }
  return { url: DEFAULT_TOML_URL, isDefault: true };
}

/** Fetches and parses the Launchpad TOML config based on the current URL query params. */
export async function loadLaunchpadConfig(
  search: string = window.location.search,
): Promise<LoadConfigResult> {
  const params = new URLSearchParams(search);
  const { url: tomlFileURL, isDefault } = resolveTomlUrl(params);

  const response = await fetch(tomlFileURL);
  if (!response.ok) {
    throw new Error(`Failed to fetch config (${response.status})`);
  }
  const config = parseToml(await response.text()) as unknown as LaunchpadConfig;

  if (parseFloat(String(config.esp_toml_version)) !== 1.0) {
    throw new Error("Unsupported config version used!");
  }

  let missingApp: string | undefined;
  const requestedApp = params.get("app");
  const exactMatch = params.get("exact") === "true";
  if (requestedApp && Array.isArray(config.supported_apps)) {
    const filtered = config.supported_apps.filter((app) =>
      exactMatch ? app === requestedApp : app.startsWith(requestedApp),
    );
    if (filtered.length > 0) {
      config.supported_apps = filtered;
    } else {
      missingApp = requestedApp;
    }
  }

  return { config, isDefault, tomlFileURL, missingApp };
}

/** Type-safe accessor for a per-app config section. */
export function getApp(config: LaunchpadConfig, appName: string): AppConfig | undefined {
  return config[appName] as AppConfig | undefined;
}
