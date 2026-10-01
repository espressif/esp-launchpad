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
  type SerialSettings,
} from "../lib/serial";

export interface FlashFile {
  data: Uint8Array;
  address: number;
}

export type FlashMode = "quickstart" | "diy" | null;

/** Optional overrides for `connect()`. Every field falls back to the Settings tab values. */
export interface ConnectOptions {
  /** Flashing baud rate. Defaults to `settings.flashingBaudrate`. */
  baudrate?: number;
  /** Web Serial options. Defaults to the ones derived from `settings`. */
  serialOptions?: SerialOptions;
  /** Called once a port has been chosen, before the esptool handshake starts. */
  onPortSelected?: () => void;
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
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | undefined>(undefined);
  const consoleReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | undefined>(undefined);
  const connectedRef = useRef(false);
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

  const startConsoleRead = useCallback(
    async (device: SerialPort, term: Terminal, isActive: () => boolean) => {
      const readable = device.readable;
      if (!readable) return;

      const reader = readable.getReader();
      consoleReaderRef.current = reader;

      try {
        while (isActive() && consoleReaderRef.current === reader) {
          const { value, done } = await reader.read();
          if (done || !value) break;
          term.write(value);
        }
      } catch (error) {
        if (consoleReaderRef.current === reader) {
          term.writeln(`Error: ${(error as Error).message}`);
        }
      } finally {
        try {
          reader.releaseLock();
        } catch {
          /* the reader may already have been released by stopConsoleRead */
        }
        if (consoleReaderRef.current === reader) {
          consoleReaderRef.current = undefined;
        }
      }
    },
    [],
  );

  const stopConsoleRead = useCallback(async () => {
    const reader = consoleReaderRef.current;
    if (!reader) return;

    consoleReaderRef.current = undefined;
    try {
      await reader.cancel();
    } catch (error) {
      console.error(`[esp-launchpad] stopConsoleRead: cancel failed: ${(error as Error).message}`);
    }
    try {
      reader.releaseLock();
    } catch {
      /* the read loop may already have released it */
    }
  }, []);

  const espLoaderTerminal = useMemo(
    () => ({
      clean() {
        termRef.current?.clear();
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
      try {
        const loaderOptions: LoaderOptions = {
          transport: transportRef.current!,
          baudrate: options.baudrate ?? settingsRef.current.flashingBaudrate,
          terminal: espLoaderTerminal,
          serialOptions: options.serialOptions ?? getSerialOptions(settingsRef.current),
        };
        const esploader = new ESPLoader(loaderOptions);
        esploaderRef.current = esploader;
        connectedRef.current = true;
        setConnected(true);
        const desc = await esploader.main();
        setChipDesc(desc);
        setChipName(esploader.chip.CHIP_NAME);
        await esploader.flashId();
        return { ok: true, chipName: esploader.chip.CHIP_NAME };
      } catch (error) {
        // Mirror original behaviour: surface failure via the "default" chip state.
        return { ok: false, error: errorMessage(error) };
      }
    },
    [ensureDevice, espLoaderTerminal],
  );

  const cleanUp = useCallback(() => {
    deviceRef.current = null;
    transportRef.current = undefined;
    esploaderRef.current = undefined;
    writerRef.current = undefined;
    consoleReaderRef.current = undefined;
    flashModeRef.current = null;
    setChipName("default");
    setChipDesc("default");
  }, []);

  const disconnect = useCallback(async () => {
    connectedRef.current = false;
    setConnected(false);
    setCliEnabled(false);
    await stopConsoleRead();
    try {
      if (transportRef.current) await transportRef.current.disconnect();
    } catch {
      /* ignore */
    }
    termRef.current?.clear();
    cleanUp();
  }, [cleanUp, stopConsoleRead]);

  const eraseFlash = useCallback(async () => {
    if (!esploaderRef.current) return;
    setBusy(true);
    try {
      await esploaderRef.current.eraseFlash();
    } catch {
      /* errors are streamed to the terminal */
    } finally {
      setBusy(false);
    }
  }, []);

  const writeFlash = useCallback(
    async (files: FlashFile[], eraseAll = false): Promise<FlashResult> => {
      if (!esploaderRef.current) return { ok: false, error: "Device is not connected" };
      setBusy(true);
      try {
        const flashOptions: FlashOptions = {
          fileArray: files,
          flashSize: "keep",
          flashMode: "keep",
          flashFreq: "keep",
          eraseAll,
          compress: true,
        };
        await esploaderRef.current.writeFlash(flashOptions);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: errorMessage(error) };
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const downloadAndFlash = useCallback(
    async (fileURL: string, offset: number): Promise<boolean> => {
      flashModeRef.current = "quickstart";
      const data = await getImageData(fileURL);
      if (data === undefined) {
        termRef.current?.writeln("Image file not found");
        return false;
      }
      return (await writeFlash([{ data, address: offset }])).ok;
    },
    [writeFlash],
  );

  const flashFiles = useCallback(
    async (files: FlashFile[], overrides: FlashOverrides = {}): Promise<boolean> => {
      flashModeRef.current = "diy";
      return (await writeFlash(files, overrides.eraseAll ?? false)).ok;
    },
    [writeFlash],
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
    const transport = transportRef.current;
    if (!transport) {
      // Allow opening a console on a fresh port without flashing first.
      await ensureDevice();
    }
    const t = transportRef.current;
    if (!t) return;

    setBusy(true);
    await stopConsoleRead();
    try {
      await t.disconnect();
    } catch {
      /* ignore */
    }
    const consoleBaudrate = options.consoleBaudrate ?? getConsoleBaudrateForReconnect();
    await t.connect(consoleBaudrate, options.serialOptions ?? getSerialOptions(settingsRef.current));
    setCliEnabled(true);
    setBusy(false);

    await t.setDTR(false);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await t.setDTR(true);

    const device = deviceRef.current;
    const term = termRef.current;
    if (device && term) {
      await startConsoleRead(device, term, () => connectedRef.current);
    }
  }, [ensureDevice, getConsoleBaudrateForReconnect, startConsoleRead, stopConsoleRead]);

  const sendCommand = useCallback(async (text: string) => {
    const device = deviceRef.current;
    if (!device?.writable) return;
    const encoder = new TextEncoder();
    if (!device.writable.locked) {
      writerRef.current = device.writable.getWriter();
    }
    const writer = writerRef.current;
    if (!writer) return;
    await writer.write(encoder.encode(text + "\r"));
    writer.releaseLock();
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
