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

  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  eraseFlash: () => Promise<void>;
  resetDevice: () => Promise<void>;

  /** Downloads firmware from a URL and flashes it at the given offset (Quick Start). */
  downloadAndFlash: (fileURL: string, offset: number) => Promise<boolean>;
  /** Flashes a set of already-loaded files (DIY). */
  flashFiles: (files: FlashFile[]) => Promise<boolean>;

  sendCommand: (text: string) => Promise<void>;
}

const EspContext = createContext<EspContextValue | null>(null);

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
    fitRef.current?.fit();
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

  const connect = useCallback(async () => {
    await ensureDevice();
    try {
      const loaderOptions: LoaderOptions = {
        transport: transportRef.current!,
        baudrate: settingsRef.current.flashingBaudrate,
        terminal: espLoaderTerminal,
        serialOptions: getSerialOptions(settingsRef.current),
      };
      const esploader = new ESPLoader(loaderOptions);
      esploaderRef.current = esploader;
      connectedRef.current = true;
      setConnected(true);
      const desc = await esploader.main();
      setChipDesc(desc);
      setChipName(esploader.chip.CHIP_NAME);
      await esploader.flashId();
    } catch {
      // Mirror original behaviour: surface failure via the "default" chip state.
    }
  }, [ensureDevice, espLoaderTerminal]);

  const cleanUp = useCallback(() => {
    deviceRef.current = null;
    transportRef.current = undefined;
    esploaderRef.current = undefined;
    writerRef.current = undefined;
    flashModeRef.current = null;
    setChipName("default");
    setChipDesc("default");
  }, []);

  const disconnect = useCallback(async () => {
    connectedRef.current = false;
    setConnected(false);
    setCliEnabled(false);
    try {
      if (transportRef.current) await transportRef.current.disconnect();
    } catch {
      /* ignore */
    }
    termRef.current?.clear();
    cleanUp();
  }, [cleanUp]);

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

  const writeFlash = useCallback(async (files: FlashFile[]): Promise<boolean> => {
    if (!esploaderRef.current) return false;
    setBusy(true);
    try {
      const flashOptions: FlashOptions = {
        fileArray: files,
        flashSize: "keep",
        flashMode: "keep",
        flashFreq: "keep",
        eraseAll: false,
        compress: true,
      };
      await esploaderRef.current.writeFlash(flashOptions);
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const downloadAndFlash = useCallback(
    async (fileURL: string, offset: number): Promise<boolean> => {
      flashModeRef.current = "quickstart";
      const data = await getImageData(fileURL);
      if (data === undefined) {
        termRef.current?.writeln("Image file not found");
        return false;
      }
      return writeFlash([{ data, address: offset }]);
    },
    [writeFlash],
  );

  const flashFiles = useCallback(
    async (files: FlashFile[]): Promise<boolean> => {
      flashModeRef.current = "diy";
      return writeFlash(files);
    },
    [writeFlash],
  );

  const getConsoleBaudrateForReconnect = useCallback((): number => {
    if (flashModeRef.current === "quickstart" && consoleBaudOverrideRef.current) {
      return consoleBaudOverrideRef.current;
    }
    return settingsRef.current.consoleBaudrate;
  }, []);

  const resetDevice = useCallback(async () => {
    const transport = transportRef.current;
    if (!transport) {
      // Allow opening a console on a fresh port without flashing first.
      await ensureDevice();
    }
    const t = transportRef.current;
    if (!t) return;

    setBusy(true);
    try {
      await t.disconnect();
    } catch {
      /* ignore */
    }
    const consoleBaudrate = getConsoleBaudrateForReconnect();
    await t.connect(consoleBaudrate, getSerialOptions(settingsRef.current));
    setCliEnabled(true);
    setBusy(false);

    await t.setDTR(false);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await t.setDTR(true);

    const decoder = new TextDecoder();
    await t.rawRead(
      (data) => termRef.current?.write(decoder.decode(data, { stream: true })),
      () => !connectedRef.current,
    );
  }, [ensureDevice, getConsoleBaudrateForReconnect]);

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
      connect,
      disconnect,
      eraseFlash,
      resetDevice,
      downloadAndFlash,
      flashFiles,
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
      connect,
      disconnect,
      eraseFlash,
      resetDevice,
      downloadAndFlash,
      flashFiles,
      sendCommand,
    ],
  );

  return <EspContext.Provider value={value}>{children}</EspContext.Provider>;
}
