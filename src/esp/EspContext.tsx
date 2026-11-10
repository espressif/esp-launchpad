import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ESPLoader, Transport, type FlashOptions, type LoaderOptions } from "esptool-js";
import { IDFMonitor } from "@espressif/esp-idf-monitor-js";
import type { Terminal } from "xterm";
import type { FitAddon } from "xterm-addon-fit";
import { IconTextActionCard } from "@espressif/dashboard-ui-components";
import { Cpu } from "lucide-react";
import { fitTerminalColumns } from "../lib/terminal";
import {
  defaultSerialSettings,
  getImageData,
  getSerialOptions,
  usbPortFilters,
  withSerialOptions,
  type SerialSettings,
} from "../lib/serial";

export interface FlashFile {
  data: Uint8Array;
  address: number;
}

export type FlashMode = "quickstart" | "diy" | null;

/**
 * What the serial port is currently used for. Flash commands need "bootloader";
 * after `resetDevice()` the chip runs the application ("console") and the
 * esptool session must be re-established first.
 */
type Session = "none" | "bootloader" | "console";

/** Optional overrides for `connect()`. Every field falls back to the Settings tab values. */
export interface ConnectOptions {
  /** Flashing baud rate. Defaults to `settings.flashingBaudrate`. */
  baudrate?: number;
  /** Web Serial options. Defaults to the ones derived from `settings`. */
  serialOptions?: SerialOptions;
  /** Called once a port has been chosen, before the esptool handshake starts. */
  onPortSelected?: () => void;
  /** Clear the terminal before the handshake. Defaults to true; a reconnect passes false to keep the history. */
  clearTerminal?: boolean;
}

export interface ConnectResult {
  ok: boolean;
  /** Chip name reported by esptool (e.g. "ESP32-C3") when `ok` is true. */
  chipName?: string;
  /** True when the user dismissed the port picker without choosing a port. */
  cancelled?: boolean;
  /** Error message when `ok` is false. */
  error?: string;
}

export interface FlashOverrides {
  /** Erase the whole flash before writing. Defaults to false. */
  eraseAll?: boolean;
}

export interface FlashResult {
  ok: boolean;
  /** Error message when `ok` is false. */
  error?: string;
}

/** A firmware part to download and flash at a given address (minimal launchpad). */
export interface FlashPart {
  url: string;
  address: number;
}

/** Optional overrides for `resetDevice()`. */
export interface ResetOptions {
  /** Console baud rate. Defaults to the TOML override (Quick Start) or `settings.consoleBaudrate`. */
  consoleBaudrate?: number;
  /** Web Serial options. Defaults to the ones derived from `settings`. */
  serialOptions?: SerialOptions;
}

interface EspContextValue {
  settings: SerialSettings;
  updateSettings: (patch: Partial<SerialSettings>) => void;

  connected: boolean;
  /** Esptool chip description, or "default" when not detected. */
  chipDesc: string;
  /** Chip name (e.g. "ESP32-C3"), or "default" when not connected. */
  chipName: string;
  /** True while a long-running device operation (flash/erase/reset) is in progress. */
  busy: boolean;
  /** Whether the console CLI input may be used (connected + reset performed). */
  cliEnabled: boolean;

  /** Console baud override coming from the selected app's TOML, if any. */
  setConsoleBaudrateOverride: (value: number | undefined) => void;

  registerTerminal: (term: Terminal, fitAddon: FitAddon) => void;
  fitTerminal: () => void;
  /** Writes a line to the registered terminal (no-op when none is mounted). */
  terminalWriteLine: (text: string) => void;

  /**
   * Opens the port picker (first call) and runs the esptool handshake.
   * Never throws; failures are reported in the result and, as before, via the
   * "default" chip state.
   */
  connect: (options?: ConnectOptions) => Promise<ConnectResult>;
  disconnect: () => Promise<void>;
  eraseFlash: () => Promise<void>;
  resetDevice: (options?: ResetOptions) => Promise<void>;

  /** Downloads firmware from a URL and flashes it at the given offset (Quick Start). */
  downloadAndFlash: (fileURL: string, offset: number) => Promise<boolean>;
  /** Flashes a set of already-loaded files (DIY). */
  flashFiles: (files: FlashFile[], overrides?: FlashOverrides) => Promise<boolean>;
  /**
   * Downloads several firmware parts and flashes them in one `writeFlash` call
   * (minimal launchpad). Returns the error message on failure.
   */
  downloadAndFlashParts: (parts: FlashPart[], overrides?: FlashOverrides) => Promise<FlashResult>;

  sendCommand: (text: string) => Promise<void>;
}

const EspContext = createContext<EspContextValue | null>(null);

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : String(error);
}

export function useEsp(): EspContextValue {
  const ctx = useContext(EspContext);
  if (!ctx) throw new Error("useEsp must be used within an <EspProvider>");
  return ctx;
}

export function ConnectionStatus() {
  const { connected, chipDesc } = useEsp();
  if (connected && chipDesc !== "default") {
    return (
      <IconTextActionCard
        icon={<Cpu />}
        title="Connected to device"
        description={chipDesc}
        color="secondary"
        size="sm"
        variant="soft"
      />
    );
  }
  if (connected && chipDesc === "default") {
    return (
      <p className="text-sm font-semibold text-destructive">
        Unable to detect device. Please ensure the device is not connected in another application.
      </p>
    );
  }
  return null;
}

export function EspProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SerialSettings>(defaultSerialSettings);
  const [connected, setConnected] = useState(false);
  const [chipDesc, setChipDesc] = useState("default");
  const [chipName, setChipName] = useState("default");
  const [busy, setBusy] = useState(false);
  const [cliEnabled, setCliEnabled] = useState(false);

  // Mutable device handles live in refs (they are not render state).
  const deviceRef = useRef<SerialPort | null>(null);
  const transportRef = useRef<Transport | undefined>(undefined);
  const esploaderRef = useRef<ESPLoader | undefined>(undefined);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const monitorRef = useRef<IDFMonitor | null>(null);
  const sessionRef = useRef<Session>("none");
  /** esptool-js clears the terminal in the `ESPLoader` constructor; a reconnect opts out. */
  const clearTerminalOnConnectRef = useRef(true);
  const consoleBaudOverrideRef = useRef<number | undefined>(undefined);
  const flashModeRef = useRef<FlashMode>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const updateSettings = useCallback((patch: Partial<SerialSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const setConsoleBaudrateOverride = useCallback((value: number | undefined) => {
    consoleBaudOverrideRef.current = value;
  }, []);

  const registerTerminal = useCallback((term: Terminal, fitAddon: FitAddon) => {
    termRef.current = term;
    fitRef.current = fitAddon;
  }, []);

  const fitTerminal = useCallback(() => {
    if (termRef.current && fitRef.current) fitTerminalColumns(termRef.current, fitRef.current);
  }, []);

  const terminalWriteLine = useCallback((text: string) => {
    termRef.current?.writeln(text);
  }, []);

  const stopMonitor = useCallback(async () => {
    const monitor = monitorRef.current;
    monitorRef.current = null;
    await monitor?.stop();
  }, []);

  /** Stops the console monitor (it holds the port), then closes the port. */
  const closePort = useCallback(async () => {
    await stopMonitor();
    try {
      await transportRef.current?.disconnect();
    } catch {
      /* the port may already be closed */
    }
  }, [stopMonitor]);

  const espLoaderTerminal = useMemo(
    () => ({
      clean() {
        if (clearTerminalOnConnectRef.current) termRef.current?.clear();
      },
      writeLine(data: string) {
        termRef.current?.writeln(data);
      },
      write(data: string) {
        termRef.current?.write(data);
      },
    }),
    [],
  );

  const ensureDevice = useCallback(async () => {
    if (deviceRef.current === null) {
      deviceRef.current = await navigator.serial.requestPort({ filters: usbPortFilters });
      transportRef.current = new Transport(deviceRef.current);
    }
  }, []);

  const connect = useCallback(
    async (options: ConnectOptions = {}): Promise<ConnectResult> => {
      try {
        await ensureDevice();
      } catch (error) {
        // The user dismissed the port picker (NotFoundError) or the port could not be opened.
        const err = error as Error;
        return { ok: false, cancelled: err?.name === "NotFoundError", error: errorMessage(err) };
      }
      options.onPortSelected?.();
      clearTerminalOnConnectRef.current = options.clearTerminal ?? true;
      try {
        const loaderOptions: LoaderOptions = {
          transport: transportRef.current!,
          baudrate: options.baudrate ?? settingsRef.current.flashingBaudrate,
          terminal: espLoaderTerminal,
          serialOptions: options.serialOptions ?? getSerialOptions(settingsRef.current),
        };
        const esploader = new ESPLoader(loaderOptions);
        esploaderRef.current = esploader;
        setConnected(true);
        const desc = await esploader.main();
        setChipDesc(desc);
        setChipName(esploader.chip.CHIP_NAME);
        await esploader.flashId();
        sessionRef.current = "bootloader";
        return { ok: true, chipName: esploader.chip.CHIP_NAME };
      } catch (error) {
        // Mirror original behaviour: surface failure via the "default" chip state.
        sessionRef.current = "none";
        return { ok: false, error: errorMessage(error) };
      }
    },
    [ensureDevice, espLoaderTerminal],
  );

  const cleanUp = useCallback(() => {
    deviceRef.current = null;
    transportRef.current = undefined;
    esploaderRef.current = undefined;
    monitorRef.current = null;
    sessionRef.current = "none";
    flashModeRef.current = null;
    setChipName("default");
    setChipDesc("default");
  }, []);

  const disconnect = useCallback(async () => {
    setConnected(false);
    setCliEnabled(false);
    await closePort();
    termRef.current?.clear();
    cleanUp();
  }, [cleanUp, closePort]);

  /** Leaves the console and re-runs the esptool handshake so flash commands work again. Throws on failure. */
  const enterBootloaderFromConsole = useCallback(async () => {
    if (sessionRef.current !== "console") return;

    termRef.current?.writeln("Console is active, reconnecting to the bootloader...");
    await closePort();
    setCliEnabled(false);
    const result = await connect({ clearTerminal: false });
    if (!result.ok) throw new Error(result.error ?? "Failed to reconnect to the device");
  }, [closePort, connect]);

  /** Runs one esptool command in a bootloader session while `busy` is set; failures become a `FlashResult`. */
  const runFlashOperation = useCallback(
    async (operation: (loader: ESPLoader) => Promise<unknown>): Promise<FlashResult> => {
      if (sessionRef.current === "none") return { ok: false, error: "Device is not connected" };
      setBusy(true);
      try {
        await enterBootloaderFromConsole();
        const loader = esploaderRef.current;
        if (!loader) throw new Error("Device is not connected");
        await operation(loader);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: errorMessage(error) };
      } finally {
        setBusy(false);
      }
    },
    [enterBootloaderFromConsole],
  );

  /** Shows a failed result in the terminal, for callers that only hand a boolean back to the UI. */
  const reportToTerminal = useCallback((result: FlashResult): boolean => {
    if (!result.ok) termRef.current?.writeln(`Error: ${result.error}`);
    return result.ok;
  }, []);

  const eraseFlash = useCallback(async () => {
    reportToTerminal(await runFlashOperation((loader) => loader.eraseFlash()));
  }, [reportToTerminal, runFlashOperation]);

  const writeFlash = useCallback(
    (files: FlashFile[], eraseAll = false): Promise<FlashResult> => {
      const flashOptions: FlashOptions = {
        fileArray: files,
        flashSize: "keep",
        flashMode: "keep",
        flashFreq: "keep",
        eraseAll,
        compress: true,
      };
      return runFlashOperation((loader) => loader.writeFlash(flashOptions));
    },
    [runFlashOperation],
  );

  const downloadAndFlash = useCallback(
    async (fileURL: string, offset: number): Promise<boolean> => {
      flashModeRef.current = "quickstart";
      const data = await getImageData(fileURL);
      if (data === undefined) {
        termRef.current?.writeln("Image file not found");
        return false;
      }
      return reportToTerminal(await writeFlash([{ data, address: offset }]));
    },
    [reportToTerminal, writeFlash],
  );

  const flashFiles = useCallback(
    async (files: FlashFile[], overrides: FlashOverrides = {}): Promise<boolean> => {
      flashModeRef.current = "diy";
      return reportToTerminal(await writeFlash(files, overrides.eraseAll ?? false));
    },
    [reportToTerminal, writeFlash],
  );

  const downloadAndFlashParts = useCallback(
    async (parts: FlashPart[], overrides: FlashOverrides = {}): Promise<FlashResult> => {
      flashModeRef.current = "quickstart";
      const files: FlashFile[] = [];
      for (const part of parts) {
        const data = await getImageData(part.url);
        if (data === undefined) {
          termRef.current?.writeln(`Image file not found: ${part.url}`);
          return { ok: false, error: `Unable to download firmware image: ${part.url}` };
        }
        files.push({ data, address: part.address });
      }
      return writeFlash(files, overrides.eraseAll ?? false);
    },
    [writeFlash],
  );

  const getConsoleBaudrateForReconnect = useCallback((): number => {
    if (flashModeRef.current === "quickstart" && consoleBaudOverrideRef.current) {
      return consoleBaudOverrideRef.current;
    }
    return settingsRef.current.consoleBaudrate;
  }, []);

  const resetDevice = useCallback(async (options: ResetOptions = {}) => {
    if (!transportRef.current) {
      // Allow opening a console on a fresh port without flashing first.
      await ensureDevice();
    }
    const device = deviceRef.current;
    const term = termRef.current;
    if (!device || !term) return;

    setBusy(true);
    try {
      await closePort();
      sessionRef.current = "console";
      const monitor = new IDFMonitor({
        port: withSerialOptions(device, options.serialOptions ?? getSerialOptions(settingsRef.current)),
        terminal: term,
        baudRate: options.consoleBaudrate ?? getConsoleBaudrateForReconnect(),
        target: chipName === "default" ? undefined : chipName.replace(/-/g, "").toLowerCase(),
        decodeCoredumps: "disable",
      });
      // Ctrl+] in the terminal stops the monitor and closes the port.
      monitor.on("exit", () => {
        if (monitorRef.current !== monitor) return;
        monitorRef.current = null;
        setCliEnabled(false);
      });
      monitorRef.current = monitor;
      await monitor.start();
      setCliEnabled(true);
    } catch (error) {
      monitorRef.current = null;
      term.writeln(`Error: ${errorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  }, [chipName, closePort, ensureDevice, getConsoleBaudrateForReconnect]);

  const sendCommand = useCallback(async (text: string) => {
    await monitorRef.current?.send(text);
  }, []);

  const value = useMemo<EspContextValue>(
    () => ({
      settings,
      updateSettings,
      connected,
      chipDesc,
      chipName,
      busy,
      cliEnabled,
      setConsoleBaudrateOverride,
      registerTerminal,
      fitTerminal,
      terminalWriteLine,
      connect,
      disconnect,
      eraseFlash,
      resetDevice,
      downloadAndFlash,
      flashFiles,
      downloadAndFlashParts,
      sendCommand,
    }),
    [
      settings,
      updateSettings,
      connected,
      chipDesc,
      chipName,
      busy,
      cliEnabled,
      setConsoleBaudrateOverride,
      registerTerminal,
      fitTerminal,
      terminalWriteLine,
      connect,
      disconnect,
      eraseFlash,
      resetDevice,
      downloadAndFlash,
      flashFiles,
      downloadAndFlashParts,
      sendCommand,
    ],
  );

  return <EspContext.Provider value={value}>{children}</EspContext.Provider>;
}
