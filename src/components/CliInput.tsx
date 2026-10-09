import { useRef } from "react";
import { Textarea } from "@espressif/dashboard-ui-components";
import { getCommandTextFromInput, isApplePlatform } from "../lib/serial";

function CliHints() {
  const apple = isApplePlatform();
  const Kbd = ({ children }: { children: React.ReactNode }) => (
    <kbd className="command-kbd">{children}</kbd>
  );
  return (
    <div className="command-input-hints mt-4 text-xs text-muted-foreground">
      <div className="command-input-hints__chip">
        <span>
          <strong>Send</strong>{" "}
          <span className="command-input-hints__keys">
            {apple ? (
              <>
                <Kbd>↩</Kbd>
                <span className="command-input-hints__sep">or</span>
                <Kbd>⌘</Kbd>
                <span className="command-input-hints__sep">+</span>
                <Kbd>↩</Kbd>
              </>
            ) : (
              <Kbd>Enter</Kbd>
            )}
          </span>
        </span>
      </div>
      <div className="command-input-hints__chip">
        <span>
          <strong>New line</strong>{" "}
          <span className="command-input-hints__keys">
            <Kbd>{apple ? "⇧" : "Shift"}</Kbd>
            <span className="command-input-hints__sep">+</span>
            <Kbd>{apple ? "↩" : "Enter"}</Kbd>
          </span>
        </span>
      </div>
      <div className="command-input-hints__chip">
        <span>
          <strong>History</strong>{" "}
          <span className="command-input-hints__keys">
            <Kbd>↑</Kbd>
            <span className="command-input-hints__sep">/</span>
            <Kbd>↓</Kbd>
          </span>{" "}
          <span className="opacity-70">(this session)</span>
        </span>
      </div>
    </div>
  );
}

/**
 * Console command input shared by the main Console tab and the minimal launchpad:
 * Enter sends, Shift+Enter inserts a newline, Up/Down recall this session's history.
 */
export function CliInput({
  disabled,
  onSend,
}: {
  disabled: boolean;
  onSend: (text: string) => Promise<void> | void;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  const autoResize = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const send = async () => {
    const el = inputRef.current;
    if (!el || el.disabled) return;
    const text = getCommandTextFromInput(el);
    historyRef.current.unshift(text);
    historyIndexRef.current = -1;
    el.value = "";
    el.style.height = "";
    await onSend(text);
  };

  const recallHistory = (direction: 1 | -1) => {
    const el = inputRef.current;
    if (!el) return;
    const history = historyRef.current;
    historyIndexRef.current = Math.max(
      Math.min(historyIndexRef.current + direction, history.length - 1),
      -1,
    );
    el.value = historyIndexRef.current >= 0 ? history[historyIndexRef.current] : "";
    autoResize();
  };

  const onKeyUp = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.code === "Enter" && !event.shiftKey) {
      void send();
    } else if (event.code === "ArrowUp") {
      recallHistory(1);
    } else if (event.code === "ArrowDown") {
      recallHistory(-1);
    }
  };

  return (
    <>
      <Textarea
        ref={inputRef}
        rows={1}
        autoComplete="off"
        disabled={disabled}
        onKeyUp={onKeyUp}
        onInput={autoResize}
        placeholder={
          isApplePlatform()
            ? "Type a command, then press Return or ⌘↩ to send"
            : "Type a command, then press Enter to send"
        }
        size="sm"
      />
      <CliHints />
    </>
  );
}
