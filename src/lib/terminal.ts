import type { Terminal } from "xterm";
import type { FitAddon } from "xterm-addon-fit";

/** Fixed terminal height in rows, as in the original launchpad. */
export const TERMINAL_ROWS = 23;

/**
 * Refit the terminal's columns to its container while keeping the row count.
 * Plain `fitAddon.fit()` also recomputes rows from the container height, and
 * because the container's height is itself derived from the terminal, every
 * call could grow it by a row.
 */
export function fitTerminalColumns(term: Terminal, fitAddon: FitAddon): void {
  try {
    const dims = fitAddon.proposeDimensions();
    if (dims && Number.isFinite(dims.cols) && dims.cols > 0 && dims.cols !== term.cols) {
      term.resize(dims.cols, term.rows);
    }
  } catch {
    /* container may not be laid out yet */
  }
}
