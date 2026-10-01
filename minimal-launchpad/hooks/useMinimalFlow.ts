import { useCallback, useEffect, useRef, useState } from "react";
import { useEsp } from "../../src/esp/EspContext";
import {
  getMinimalConsoleBaudrate,
  getMinimalFlashParts,
} from "../../src/lib/tomlConfig";
import type { MinimalConfigState } from "./useMinimalConfig";

/** Flash baud used by the minimal launchpad (kept from the original, independent of Settings). */
export const MINIMAL_FLASH_BAUDRATE = 460800;
/** How long the esptool handshake may take before the troubleshoot dialog opens. */
export const CONNECTION_TIMEOUT_MS = 30000;
/** Delay before the product-info column bounces to draw attention after flashing. */
const BOUNCE_DELAY_MS = 2500;

export type FlowPhase = "idle" | "connecting" | "flashing" | "flashed" | "error";

export type DialogMode = "connecting" | "connection-error" | "flash-error" | "config-error";

export interface DialogState {
  mode: DialogMode;
  message?: string;
}

function normalizeChip(name: string): string {
  return name.replace(/-/g, "").toLowerCase();
}

/**
 * Orchestrates the one-click minimal flow: connect, flash every part, then
 * restart into the console. State here is page-level; device state stays in
 * `EspProvider`.
 */
export function useMinimalFlow(config: MinimalConfigState) {
  const esp = useEsp();
  const [phase, setPhase] = useState<FlowPhase>("idle");
  const [dialog, setDialog] = useState<DialogState | null>(null);
  /** Once the device is identified the console stays visible for the rest of the session. */
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [bounce, setBounce] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  const ready = config.status === "ok" ? config : null;
  const hasCli = Boolean(ready?.config.portConnectionOptions?.length);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  /** (Re)starts the 30 s watchdog that opens the "Connection In Progress" dialog. */
  const armTimer = useCallback(() => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      setDialog((current) => current ?? { mode: "connecting" });
    }, CONNECTION_TIMEOUT_MS);
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  // Once flashed, draw attention to the product-info column after a short delay.
  useEffect(() => {
    if (phase !== "flashed") return;
    const timer = window.setTimeout(() => setBounce(true), BOUNCE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // A network/CORS failure while downloading the TOML opens the dialog in config mode.
  useEffect(() => {
    if (config.status === "network-error") setDialog({ mode: "config-error" });
  }, [config]);

  const restart = useCallback(async () => {
    if (!ready) return;
    await esp.resetDevice({
      consoleBaudrate: getMinimalConsoleBaudrate(ready.config, ready.app),
    });
  }, [esp, ready]);

  const connectAndFlash = useCallback(async () => {
    if (!ready || phase !== "idle") return;
    setPhase("connecting");

    const result = await esp.connect({
      baudrate: MINIMAL_FLASH_BAUDRATE,
      onPortSelected: armTimer,
    });
    clearTimer();

    if (!result.ok) {
      if (result.cancelled) {
        // The user closed the port picker: show the connect button again.
        setPhase("idle");
        return;
      }
      setPhase("error");
      setDialog({ mode: "connection-error", message: result.error });
      return;
    }

    setDialog(null);
    setTerminalVisible(true);
    setPhase("flashing");

    const resolved = getMinimalFlashParts(ready.config, ready.app);
    if ("error" in resolved) {
      esp.terminalWriteLine(`\x1b[1;31mError: ${resolved.error}\x1b[0m`);
      setDialog({ mode: "flash-error", message: resolved.error });
      return;
    }
    if (
      result.chipName &&
      ready.config.chip &&
      normalizeChip(result.chipName) !== normalizeChip(ready.config.chip)
    ) {
      esp.terminalWriteLine(
        `\x1b[1;33mWarning: the connected device is ${result.chipName} but the config targets ${ready.config.chip}.\x1b[0m`,
      );
    }

    const flash = await esp.downloadAndFlashParts(resolved.parts, { eraseAll: true });
    if (!flash.ok) {
      esp.terminalWriteLine(`\x1b[1;31mError: ${flash.error}\x1b[0m`);
      setDialog({ mode: "flash-error", message: flash.error });
      return;
    }

    setPhase("flashed");
    await restart();
  }, [armTimer, clearTimer, esp, phase, ready, restart]);

  /** "Wait For Connection": close the dialog and give the handshake another 30 s. */
  const waitForConnection = useCallback(() => {
    setDialog(null);
    armTimer();
  }, [armTimer]);

  const tryAgain = useCallback(() => {
    window.location.reload();
  }, []);

  return {
    phase,
    dialog,
    terminalVisible,
    bounce,
    hasCli,
    connectAndFlash,
    restart,
    waitForConnection,
    tryAgain,
  };
}
