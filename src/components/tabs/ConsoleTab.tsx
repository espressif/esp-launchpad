import { useState } from "react";
import { Button, SimpleCard, SectionCard } from "@espressif/dashboard-ui-components";
import { useEsp } from "../../esp/EspContext";
import { TerminalView } from "../TerminalView";
import { CliInput } from "../CliInput";
import { ResetDialog } from "../modals/ResetDialog";
import { Cpu, RotateCcw } from "lucide-react";

export function ConsoleTab() {
  const { connected, chipDesc, busy, cliEnabled, resetDevice, sendCommand } = useEsp();
  const deviceReady = connected && chipDesc !== "default";

  const [resetOpen, setResetOpen] = useState(false);

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
          <RotateCcw className="h-5 w-5" aria-hidden /> Reset Device
          </Button>}
         allowCollapse={false}
         defaultOpen={true}
         size="default"
         variant="gradient"
         color="secondary"
        >
        </SectionCard>
      )}

      <TerminalView />

      <div>
      <SimpleCard
        title="Console Command Input"
        description="Reset the device for enabling CLI. Type a command, then press Return or ⌘↩ to send the command to the device.">
        <CliInput disabled={!cliEnabled} onSend={sendCommand} />
      </SimpleCard>
      </div>

      <ResetDialog open={resetOpen} onOpenChange={setResetOpen} onConfirm={() => void resetDevice()} />
    </div>
  );
}
