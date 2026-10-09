import { Button, SimpleCard } from "@espressif/dashboard-ui-components";
import { RotateCcw } from "lucide-react";
import { TerminalView } from "../../src/components/TerminalView";
import { CliInput } from "../../src/components/CliInput";

/**
 * Device console: Restart button, the xterm terminal, and (when the TOML
 * defines `portConnectionOptions`) the command input.
 */
export function MinimalConsole({
  className,
  showCli,
  cliEnabled,
  restartDisabled,
  onRestart,
  onSend,
}: {
  className?: string;
  showCli: boolean;
  cliEnabled: boolean;
  restartDisabled: boolean;
  onRestart: () => void;
  onSend: (text: string) => Promise<void>;
}) {
  return (
    <div className={className}>
      <div className="mb-3 text-right">
        <Button
          variant="outline"
          size="sm"
          fullWidth={false}
          tooltip="Restart your device"
          disabled={restartDisabled}
          onClick={onRestart}
        >
          <RotateCcw className="h-4 w-4" aria-hidden /> Restart Device
        </Button>
      </div>
      {/* The tab sits flush on the terminal's top edge, like the original "devicelog" pill. */}
      <span className="devicelog">Device Console</span>
      <div className="[&_.terminal-host]:rounded-tl-none">
        <TerminalView />
      </div>
      {showCli && (
        <SimpleCard className="mt-3" title="Console Command Input">
          <CliInput disabled={!cliEnabled} onSend={onSend} />
        </SimpleCard>
      )}
    </div>
  );
}
