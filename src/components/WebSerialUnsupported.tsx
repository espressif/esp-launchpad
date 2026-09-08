import type { WebSerialSupportIssue } from "../lib/serial";

export function WebSerialUnsupported({ issue }: { issue: Exclude<WebSerialSupportIssue, null> }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      {issue === "unsupported-browser" ? (
        <p className="max-w-2xl text-destructive">
          Your browser of choice doesn&apos;t support the Web Serial API. ESP Launchpad uses Web
          Serial to communicate with the device. Please check the list of supported browsers{" "}
          <a
            className="underline"
            href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility"
            target="_blank"
            rel="noreferrer"
          >
            here
          </a>
          .
        </p>
      ) : (
        <p className="max-w-2xl text-destructive">
          ESP Launchpad uses the Web Serial API, which only works in a secure context (HTTPS or
          localhost). This page was loaded over an insecure connection. Please open ESP Launchpad via
          HTTPS or localhost.{" "}
          <a
            className="underline"
            href="https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts"
            target="_blank"
            rel="noreferrer"
          >
            Learn more
          </a>
          .
        </p>
      )}
    </div>
  );
}
