import { useEffect, useState } from "react";
import { Button, Spinner } from "@espressif/dashboard-ui-components";
import { ArrowRight } from "lucide-react";

/**
 * App icon, app name and the single "Connect Your Device" button, centred on
 * the page until the device has been identified.
 */
export function ConnectPanel({
  appName,
  icon,
  hasReadme,
  onOpenReadme,
  connecting,
  disabled,
  onConnect,
}: {
  appName?: string;
  icon?: string;
  /** When true the app name opens the README panel; otherwise it is plain text. */
  hasReadme: boolean;
  onOpenReadme: () => void;
  /** Port chosen, esptool handshake running: hide the identity block and show the spinner. */
  connecting: boolean;
  disabled: boolean;
  onConnect: () => void;
}) {
  const [iconFailed, setIconFailed] = useState(false);
  useEffect(() => setIconFailed(false), [icon]);

  if (connecting) {
    return (
      <div className="flex flex-col items-center gap-3 text-muted-foreground" role="status">
        <Spinner size={40} color="secondary" />
        <span className="text-sm">Connecting to your device…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      {appName && (
        <div className="mb-5 flex flex-col items-center gap-2">
          {icon && !iconFailed && (
            <img
              src={icon}
              alt={appName}
              className="max-h-[150px] max-w-[150px] object-contain"
              onError={() => setIconFailed(true)}
            />
          )}
          {hasReadme ? (
            <Button variant="link" className="text-lg font-medium" onClick={onOpenReadme}>
              {appName}
            </Button>
          ) : (
            <span className="text-lg font-medium">{appName}</span>
          )}
        </div>
      )}
      <Button
        color="secondary"
        size="lg"
        className="min-w-[350px]"
        disabled={disabled}
        onClick={onConnect}
        endIcon={<ArrowRight className="h-5 w-5" aria-hidden />}
      >
        Connect Your Device
      </Button>
    </div>
  );
}
