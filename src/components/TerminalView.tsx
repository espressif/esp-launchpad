import { useEffect, useRef } from "react";
import { Terminal as XTerminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { useEsp } from "../esp/EspContext";

/**
 * Hosts the xterm.js terminal and registers it with the device context so that
 * flashing/console output can be streamed to it. Kept mounted for the app's
 * lifetime so logs survive tab switches.
 */
export function TerminalView() {
  const hostRef = useRef<HTMLDivElement>(null);
  const { registerTerminal } = useEsp();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const term = new XTerminal({
      cols: 120,
      rows: 23,
      fontSize: 14,
      scrollback: 9999999,
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(host);
    try {
      fitAddon.fit();
    } catch {
      /* container may not be laid out yet */
    }
    registerTerminal(term, fitAddon);

    const onResize = () => {
      try {
        fitAddon.fit();
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      term.dispose();
    };
  }, [registerTerminal]);

  return <div className="terminal-host" ref={hostRef} />;
}
