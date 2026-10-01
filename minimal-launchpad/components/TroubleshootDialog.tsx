import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@espressif/dashboard-ui-components";
import { TroubleshootingGuide } from "./TroubleshootingGuide";
import type { DialogState } from "../hooks/useMinimalFlow";

const COPY: Record<DialogState["mode"], { title: string; description: React.ReactNode }> = {
  connecting: {
    title: "Connection In Progress",
    description: "It's taking longer than usual for connecting the device.",
  },
  "connection-error": {
    title: "Connection Error",
    description: "There is an error while connecting to the device.",
  },
  "flash-error": {
    title: "Flashing Error",
    description: "There is an error while flashing the firmware onto the device.",
  },
  "config-error": {
    title: "Error getting config file",
    description: "We are encountering issues downloading the configuration file.",
  },
};

/**
 * Modal that cannot be dismissed by clicking outside or pressing Escape; only
 * the footer buttons close it, matching the original static-backdrop modal.
 */
export function TroubleshootDialog({
  state,
  tomlFileURL,
  onWait,
  onTryAgain,
}: {
  state: DialogState | null;
  tomlFileURL?: string;
  onWait: () => void;
  onTryAgain: () => void;
}) {
  const mode = state?.mode ?? "connecting";
  const copy = COPY[mode];
  const showGuide = mode !== "config-error";

  return (
    <Dialog open={state !== null} onOpenChange={() => undefined}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p>
            {copy.description}
            {mode === "config-error" && tomlFileURL && (
              <>
                {" "}
                Please verify that you can download{" "}
                <a className="underline" href={tomlFileURL} target="_blank" rel="noreferrer">
                  this file
                </a>
                . If not, check your network settings (firewall, VPN, etc.) and try again.
              </>
            )}
          </p>
          {state?.message && <p className="errorMessage break-all">Error: {state.message}</p>}
          {showGuide && (
            <>
              <p>Refer to the troubleshooting guide below for assistance in resolving the issue.</p>
              <TroubleshootingGuide />
            </>
          )}
        </div>

        <DialogFooter>
          {mode === "connecting" && (
            <Button
              variant="outline"
              fullWidth={false}
              tooltip="You can wait some more time, and we'll continue to attempt the connection"
              onClick={onWait}
            >
              Wait For Connection
            </Button>
          )}
          <Button variant="outline" fullWidth={false} tooltip="You can try it again !" onClick={onTryAgain}>
            Try Again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
