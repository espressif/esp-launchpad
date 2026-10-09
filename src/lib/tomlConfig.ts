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

// ── Minimal launchpad ──────────────────────────────────────────────
// Config shape consumed by /minimal-launchpad/?flashConfigURL=<toml>.
// See config/minimal_launchpad_config.toml for the documented template.

export interface MinimalImageParts {
  parts: string[];
  addresses: (string | number)[];
}

export interface MinimalAppConfig {
  icon?: string;
  readme?: { text?: string };
  console_baudrate?: number | string;
  /** Keyed by lowercased chip name, e.g. `image.esp32.parts`. */
  image?: Record<string, MinimalImageParts>;
}

export interface MinimalPortConnectionOptions {
  console_baudrate?: number | string;
}

export interface MinimalLaunchpadConfig {
  esp_toml_version?: number | string;
  supported_apps: string[];
  multipart?: boolean;
  chip?: string;
  /** Presence enables the console CLI and selects the console baud rate. */
  portConnectionOptions?: MinimalPortConnectionOptions[];
  [appName: string]: unknown;
}

export type MinimalConfigLoadResult =
  | { status: "missing-param" }
  | { status: "http-error"; tomlFileURL: string; httpStatus: number }
  | { status: "network-error"; tomlFileURL: string }
  | { status: "invalid"; tomlFileURL: string; error: string }
  | {
      status: "ok";
      tomlFileURL: string;
      config: MinimalLaunchpadConfig;
      appName: string;
      app: MinimalAppConfig;
    };

export const MINIMAL_PARAM = "flashConfigURL";

/**
 * Resolves the TOML URL for the minimal launchpad.
 *
 * Keeps the legacy rule: when the query string holds more than one parameter,
 * everything after `flashConfigURL=` is taken verbatim (not URL-decoded) so a
 * TOML link that carries its own query string keeps working. `crossDomain=true`
 * is the exception: the value is read normally and routed through the CORS proxy.
 */
export function getMinimalTomlUrl(search: string = window.location.search): string | undefined {
  const params = new URLSearchParams(search);
  if (!params.has(MINIMAL_PARAM)) return undefined;

  if (params.get("crossDomain") === "true") {
    const url = params.get(MINIMAL_PARAM);
    return url ? CORS_PROXY + url : undefined;
  }

  const marker = `${MINIMAL_PARAM}=`;
  if (search.includes("&")) {
    const url = search.substring(search.indexOf(marker) + marker.length);
    return url || undefined;
  }
  return params.get(MINIMAL_PARAM) || undefined;
}

/** Fetches and parses the minimal launchpad TOML named by `?flashConfigURL=`. Never throws. */
export async function loadMinimalConfig(
  search: string = window.location.search,
): Promise<MinimalConfigLoadResult> {
  const tomlFileURL = getMinimalTomlUrl(search);
  if (!tomlFileURL) return { status: "missing-param" };

  let text: string;
  try {
    const response = await fetch(tomlFileURL);
    if (!response.ok) return { status: "http-error", tomlFileURL, httpStatus: response.status };
    text = await response.text();
  } catch {
    // Network failure, CORS rejection, or anything that prevented the request from completing.
    return { status: "network-error", tomlFileURL };
  }

  let config: MinimalLaunchpadConfig;
  try {
    config = parseToml(text) as unknown as MinimalLaunchpadConfig;
  } catch (error) {
    return {
      status: "invalid",
      tomlFileURL,
      error: `Unable to parse the TOML file: ${(error as Error).message}`,
    };
  }

  const appName = Array.isArray(config.supported_apps) ? config.supported_apps[0] : undefined;
  const app = appName ? (config[appName] as MinimalAppConfig | undefined) : undefined;
  if (!appName || !app) {
    return {
      status: "invalid",
      tomlFileURL,
      error:
        "The TOML file must list an app in supported_apps and define a matching [app] section.",
    };
  }
  return { status: "ok", tomlFileURL, config, appName, app };
}

export interface MinimalFlashPart {
  url: string;
  address: number;
}

/**
 * Resolves the firmware parts to flash. Mirrors the legacy minimal launchpad:
 * requires `multipart = true` and a root `chip`, then reads
 * `app.image.<chip>.parts` / `.addresses`.
 */
export function getMinimalFlashParts(
  config: MinimalLaunchpadConfig,
  app: MinimalAppConfig,
): { parts: MinimalFlashPart[] } | { error: string } {
  if (!config.multipart || !config.chip) {
    return {
      error:
        'This TOML is not a minimal launchpad config: it must set multipart = true and chip = "<target>".',
    };
  }
  const chipKey = config.chip.toLowerCase();
  const image = app.image?.[chipKey];
  if (
    !image ||
    !Array.isArray(image.parts) ||
    !Array.isArray(image.addresses) ||
    image.parts.length === 0 ||
    image.parts.length !== image.addresses.length
  ) {
    return { error: `image.${chipKey} must define parts and addresses arrays of the same length.` };
  }
  const parts = image.parts.map((url, index) => ({
    url,
    address: parseInt(String(image.addresses[index])),
  }));
  const invalid = parts.find((part) => Number.isNaN(part.address));
  if (invalid) return { error: `Invalid flash address for ${invalid.url}.` };
  return { parts };
}

/** Console baud rate after flashing: portConnectionOptions wins, then the app value, then 115200. */
export function getMinimalConsoleBaudrate(
  config: MinimalLaunchpadConfig,
  app: MinimalAppConfig,
): number {
  const raw = config.portConnectionOptions?.[0]?.console_baudrate ?? app.console_baudrate;
  const value = parseInt(String(raw));
  return Number.isFinite(value) && value > 0 ? value : 115200;
}
