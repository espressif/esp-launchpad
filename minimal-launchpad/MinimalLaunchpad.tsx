import { useEffect, useState } from "react";
import { Alert, FooterCard } from "@espressif/dashboard-ui-components";
import { useEsp } from "../src/esp/EspContext";
import logo from "../assets/logo-v1.png";
import { useMinimalConfig } from "./hooks/useMinimalConfig";
import { useMinimalFlow } from "./hooks/useMinimalFlow";
import { ConnectPanel } from "./components/ConnectPanel";
import { MinimalConsole } from "./components/MinimalConsole";
import { ReadmeSheet } from "./components/ReadmeSheet";
import { TroubleshootDialog } from "./components/TroubleshootDialog";

const EXAMPLE_URL =
  "https://espressif.github.io/esp-launchpad/minimal-launchpad/?flashConfigURL=<YOUR_TOML_FILE_LINK>";

function ConfigAlert({ config }: { config: ReturnType<typeof useMinimalConfig>["config"] }) {
  switch (config.status) {
    case "missing-param":
      return (
        <Alert type="error" variant="soft">
          <b>
            Please provide a TOML link supported by the minimal launchpad in flashConfigURL as shown
            below
          </b>
          <br />
          <code className="break-all text-xs">{EXAMPLE_URL}</code>
        </Alert>
      );
    case "http-error":
      return (
        <Alert type="error" variant="soft">
          <b>
            Unable to access the TOML file. Please ensure that you have provided the correct TOML
            file link to the flashConfigURL parameter.
          </b>
        </Alert>
      );
    case "invalid":
      return (
        <Alert type="error" variant="soft" title="Invalid configuration">
          {config.error}
        </Alert>
      );
    default:
      return null;
  }
}

export function MinimalLaunchpad() {
  const { config, readme } = useMinimalConfig();
  const flow = useMinimalFlow(config);
  const { busy, cliEnabled, sendCommand, fitTerminal } = useEsp();
  const [readmeOpen, setReadmeOpen] = useState(false);

  const ready = config.status === "ok" ? config : null;
  const showConnect = flow.phase === "idle" || flow.phase === "connecting";
  const showProductInfo = flow.phase === "flashed" && readme.status === "ready" && readme.html !== "";

  // The terminal mounts hidden so esptool output is captured from the first byte;
  // refit it whenever it becomes visible or the layout splits.
  useEffect(() => {
    if (!flow.terminalVisible) return;
    const timer = window.setTimeout(fitTerminal, 300);
    return () => window.clearTimeout(timer);
  }, [flow.terminalVisible, showProductInfo, fitTerminal]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="container mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-3">
        <img src={logo} alt="ESP Launchpad" className="h-9" />
      </header>

      <main className="container mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-6">
        {config.status !== "network-error" && (
          <div className="mx-auto mb-4 w-full max-w-2xl empty:hidden">
            <ConfigAlert config={config} />
          </div>
        )}

        {showConnect && (
          <div className="flex flex-1 flex-col items-center justify-center py-16 fade-in">
            <ConnectPanel
              appName={ready?.appName}
              icon={ready?.app.icon}
              hasReadme={Boolean(ready?.app.readme?.text)}
              onOpenReadme={() => setReadmeOpen(true)}
              connecting={flow.phase === "connecting"}
              disabled={!ready}
              onConnect={() => void flow.connectAndFlash()}
            />
          </div>
        )}

        <div className={flow.terminalVisible ? "split" : "hidden"}>
          {showProductInfo && (
            <div
              className={`productinfocontainer markdown-body slide-up ${flow.bounce ? "bounce" : ""}`}
              dangerouslySetInnerHTML={{ __html: readme.html }}
            />
          )}
          <MinimalConsole
            className={`terminalcontainer ${showProductInfo ? "slide-right" : "full fade-in"}`}
            showCli={flow.hasCli}
            cliEnabled={cliEnabled}
            restartDisabled={flow.phase !== "flashed" || busy}
            onRestart={() => void flow.restart()}
            onSend={sendCommand}
          />
        </div>
      </main>

      <div className="mt-auto py-3 text-center text-muted-foreground">
        <FooterCard />
      </div>

      <TroubleshootDialog
        state={flow.dialog}
        tomlFileURL={config.status === "network-error" ? config.tomlFileURL : undefined}
        onWait={flow.waitForConnection}
        onTryAgain={flow.tryAgain}
      />
      <ReadmeSheet open={readmeOpen} onOpenChange={setReadmeOpen} readme={readme} />
    </div>
  );
}
