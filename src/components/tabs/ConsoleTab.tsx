import { useEffect, useRef, useState } from "react";
import { Button, SectionCard } from "@espressif/dashboard-ui-components";
import { useEsp } from "../../esp/EspContext";
import { TerminalView } from "../TerminalView";
import { ResetDialog } from "../modals/ResetDialog";
import { getCommandTextFromInput, isApplePlatform } from "../../lib/serial";
import { Cpu } from "lucide-react";


function CliHints() {
  const apple = isApplePlatform();
  const Kbd = ({ children }: { children: React.ReactNode }) => (
    <kbd className="command-kbd">{children}</kbd>
  );
  return (
    <div className="command-input-hints mt-2 text-xs text-muted-foreground">
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

export function ConsoleTab() {
  const { connected, chipDesc, busy, cliEnabled, resetDevice, sendCommand } = useEsp();
  const deviceReady = connected && chipDesc !== "default";

  const [resetOpen, setResetOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.placeholder = isApplePlatform()
        ? "Type a command, then press Return or ⌘↩ to send"
        : "Type a command, then press Enter to send";
    }
  }, []);

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
    await sendCommand(text);
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
    <div className="space-y-3">
      {connected && (
        <SectionCard 
        icon={<Cpu />} 
        primaryText="Connected to device" 
        secondaryText={chipDesc}
         actions={ 
          <Button
            color="warning"
            className="w-auto"
            disabled={!deviceReady || busy}
            onClick={() => setResetOpen(true)}
          >
          Reset Device
          </Button>}
         allowCollapse={false}
         defaultOpen={true}
         size="default"
        >
        </SectionCard>
      )}

      <TerminalView />

      <div>
        <textarea
          ref={inputRef}
          rows={1}
          autoComplete="off"
          disabled={!cliEnabled}
          onKeyUp={onKeyUp}
          onInput={autoResize}
          aria-label="Console command input"
          className="w-full resize-none rounded-md border border-input bg-background p-2 font-mono text-sm shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
        <CliHints />
      </div>

      <ResetDialog open={resetOpen} onOpenChange={setResetOpen} onConfirm={() => void resetDevice()} />
    </div>
  );
}
