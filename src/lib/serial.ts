/** USB vendor/product filters for the Web Serial port picker (Espressif + common USB-UART bridges). */
export const usbPortFilters: SerialPortFilter[] = [
  { usbVendorId: 0x10c4, usbProductId: 0xea60 } /* CP2102/CP2102N */,
  { usbVendorId: 0x0403, usbProductId: 0x6010 } /* FT2232H */,
  { usbVendorId: 0x303a, usbProductId: 0x1001 } /* Espressif USB_SERIAL_JTAG */,
  { usbVendorId: 0x303a, usbProductId: 0x1002 } /* Espressif esp-usb-bridge firmware */,
  { usbVendorId: 0x303a, usbProductId: 0x0002 } /* ESP32-S2 USB_CDC */,
  { usbVendorId: 0x303a, usbProductId: 0x0009 } /* ESP32-S3 USB_CDC */,
  { usbVendorId: 0x1a86, usbProductId: 0x55d4 } /* CH9102F */,
  { usbVendorId: 0x1a86, usbProductId: 0x7523 } /* CH340T */,
  { usbVendorId: 0x0403, usbProductId: 0x6001 } /* FT232R */,
];

export type WebSerialSupportIssue = "insecure-context" | "unsupported-browser" | null;

/** Whether `navigator.serial` is exposed. */
export function isWebSerialApiAvailable(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "serial" in navigator &&
    typeof navigator.serial?.requestPort === "function"
  );
}

/** Whether the page is in a secure context (HTTPS or localhost). */
export function isWebSerialSecureContext(): boolean {
  return typeof window !== "undefined" && window.isSecureContext;
}

/** Checks secure context first so HTTP deployments get the correct message when the API is hidden. */
export function getWebSerialSupportIssue(): WebSerialSupportIssue {
  if (!isWebSerialSecureContext()) return "insecure-context";
  if (!isWebSerialApiAvailable()) return "unsupported-browser";
  return null;
}

export function isWebSerialSupported(): boolean {
  return getWebSerialSupportIssue() === null;
}

export interface SerialSettings {
  flashingBaudrate: number;
  consoleBaudrate: number;
  dataBits: 7 | 8;
  stopBits: 1 | 2;
  parity: ParityType;
  flowControl: FlowControlType;
  bufferSize: number;
}

export const defaultSerialSettings: SerialSettings = {
  flashingBaudrate: 921600,
  consoleBaudrate: 115200,
  dataBits: 8,
  stopBits: 1,
  parity: "none",
  flowControl: "none",
  bufferSize: 255,
};

/**
 * Builds Web Serial `SerialOptions` (data/stop/parity/flow/buffer) from settings.
 * @see https://wicg.github.io/serial/#serialoptions-dictionary
 */
export function getSerialOptions(settings: SerialSettings): SerialOptions {
  let bufferSize = settings.bufferSize;
  if (!Number.isFinite(bufferSize) || bufferSize < 1) bufferSize = 255;
  if (bufferSize > 16777216) bufferSize = 16777216;
  return {
    baudRate: settings.consoleBaudrate,
    dataBits: settings.dataBits === 7 ? 7 : 8,
    stopBits: settings.stopBits === 2 ? 2 : 1,
    parity: settings.parity === "even" || settings.parity === "odd" ? settings.parity : "none",
    flowControl: settings.flowControl === "hardware" ? "hardware" : "none",
    bufferSize,
  };
}

/** Detect Apple platforms to tailor keyboard hints in the console CLI. */
export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const p = navigator.platform || "";
  const ua = navigator.userAgent || "";
  if (/Mac|iPhone|iPad|iPod/i.test(p)) return true;
  if (/Mac OS X|iPhone|iPad|iPod/.test(ua)) return true;
  if ((navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform === "macOS")
    return true;
  return false;
}

/** Strips a trailing newline at the cursor before sending a CLI command. */
export function getCommandTextFromInput(textarea: HTMLTextAreaElement): string {
  const commandText = textarea.value;
  const cursorPosition = textarea.selectionStart;
  if (cursorPosition > 0) {
    const ch = commandText.charAt(cursorPosition - 1);
    if (ch === "\n" || ch === "\r") {
      return (commandText.substring(0, cursorPosition - 1) + commandText.substring(cursorPosition)).trim();
    }
  }
  return commandText.trim();
}

/** Fetches a firmware binary in the byte-array format expected by esptool-js. */
export async function getImageData(fileURL: string): Promise<Uint8Array | undefined> {
  try {
    const response = await fetch(fileURL);
    if (!response.ok) return undefined;
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return undefined;
  }
}

/** Reads a local firmware file in the byte-array format expected by esptool-js. */
export async function readFileAsBytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}
