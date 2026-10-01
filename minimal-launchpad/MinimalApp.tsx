import { useMemo } from "react";
import { EspProvider } from "../src/esp/EspContext";
import { getWebSerialSupportIssue } from "../src/lib/serial";
import { WebSerialUnsupported } from "../src/components/WebSerialUnsupported";
import { MinimalLaunchpad } from "./MinimalLaunchpad";

/** Entry for /minimal-launchpad/: Web Serial gate, then the shared device provider. */
export function MinimalApp() {
  const issue = useMemo(() => getWebSerialSupportIssue(), []);
  if (issue) return <WebSerialUnsupported issue={issue} />;
  return (
    <EspProvider>
      <MinimalLaunchpad />
    </EspProvider>
  );
}
