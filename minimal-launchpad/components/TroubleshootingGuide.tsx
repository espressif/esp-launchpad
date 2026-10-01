import { Accordion } from "@espressif/dashboard-ui-components";

const SUPPORTED_DEVICES = ["ESP32", "ESP32-C3", "ESP32-C6", "ESP32-H2", "ESP32-S2", "ESP32-S3", "ESP8266"];

function Topic({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1">
      <h4 className="text-sm font-semibold">{title}</h4>
      <div className="text-xs leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function Snippet({ children }: { children: React.ReactNode }) {
  return <pre className="command-snippet my-1 whitespace-pre-wrap">{children}</pre>;
}

function GuideBody() {
  return (
    <div className="space-y-4">
      <Topic title="Device Connection Issue">
        <p>
          If your device is not shown in the list that pops up during the connection step, it
          might not be connected properly to the port, or there might be a{" "}
          <strong>browser compatibility issue</strong>. Please ensure that it is properly
          connected to the port. Reseating the cable can also help. If your device is connected
          to any other application, please disconnect it and try again.
        </p>
      </Topic>

      <Topic title="Serial Data Transmission Permission Issue">
        <p>
          For Linux users, the currently logged in user should have read and write access to the
          serial port over USB. On most Linux distributions this is done by adding the user to the
          dialout group:
        </p>
        <Snippet>usermod -a -G dialout $USER</Snippet>
        <p>On Arch Linux this is done by adding the user to the uucp group:</p>
        <Snippet>sudo usermod -a -G uucp $USER</Snippet>
        <p>Make sure you re-login to enable read and write permissions for the serial port.</p>
      </Topic>

      <Topic title="Browser Compatibility Issue">
        <p>
          <span className="text-destructive">
            Your browser of choice doesn&apos;t support the WebSerial API.
          </span>{" "}
          ESP Launchpad makes use of WebSerial to communicate with the device. Please check the
          list of supported browsers{" "}
          <a
            className="underline"
            href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility"
            target="_blank"
            rel="noopener noreferrer"
          >
            here
          </a>
          .
        </p>
      </Topic>

      <Topic title="Insecure Context Issue">
        <p>
          <span className="text-destructive">ESP Launchpad was loaded over HTTP.</span> The
          WebSerial API only works in a secure context (HTTPS or localhost). Please open ESP
          Launchpad via HTTPS or localhost.{" "}
          <a
            className="underline"
            href="https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more
          </a>
          .
        </p>
      </Topic>

      <Topic title="Device Compatibility Issue">
        <p>
          If you are using older devices or older versions of a device, you may face an issue in
          the connection or flashing step. Please retry while holding the BOOT button on the
          device.
        </p>
        <details className="mt-1">
          <summary className="cursor-pointer">List of devices supported by ESP Launchpad</summary>
          <ol className="list-decimal pl-5">
            {SUPPORTED_DEVICES.map((device) => (
              <li key={device}>{device}</li>
            ))}
          </ol>
        </details>
      </Topic>

      <Topic title="Driver Compatibility Issue">
        <p>
          On <strong>Windows</strong> with the latest{" "}
          <strong>Silicon Labs CP210x USB to UART Bridge</strong> driver there are known device
          connection or flashing issues. Downgrading the driver to version <code>6.7.x</code> can
          resolve the issue temporarily.
        </p>
      </Topic>

      <hr className="border-border" />
      <p className="text-center text-xs text-muted-foreground">
        If you are still unable to resolve the problem, please report it on{" "}
        <a
          className="underline"
          href="https://github.com/espressif/esp-launchpad/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          ESP Launchpad Issues
        </a>
        . We will be happy to help!
      </p>
    </div>
  );
}

/** Collapsible troubleshooting guide shown inside the troubleshoot dialog. */
export function TroubleshootingGuide() {
  return (
    <Accordion
      size="sm"
      contentClassName="max-h-[40vh] overflow-y-auto pr-2"
      items={[{ id: "guide", title: "Troubleshooting Guide", content: <GuideBody /> }]}
    />
  );
}
