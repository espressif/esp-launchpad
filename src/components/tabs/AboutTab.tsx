import type { TabId } from "../../types";
import { Alert, Button, Link, PageContainer, SectionCard, ScrollableSections } from '@espressif/dashboard-ui-components'
import tryWithLaunchpad from "../../../assets/try_with_launchpad.png";
import quickstartIcon from "../../../assets/icons/quickstart.png";
import diyIcon from "../../../assets/icons/diy.png";
import { BookOpenIcon, HandshakeIcon } from 'lucide-react'

const EMBED_SNIPPET = `<a href="https://espressif.github.io/esp-launchpad/?flashConfigURL=URL_TO_YOUR_CONFIG_TOML">
  <img alt="Try it with ESP Launchpad" src="https://espressif.github.io/esp-launchpad/assets/try_with_launchpad.png" width="250" height="70">
</a>`;

export function AboutTab({ onTabChange }: { onTabChange: (tab: TabId) => void }) {
  return (
    <PageContainer
        className="p-4"
        noGutters
        elevateHeading
    >
    <ScrollableSections stickyTop="calc(3.25rem + 1rem)">
      <ScrollableSections.Tabs>
        <ScrollableSections.Tab id="intro">{<HandshakeIcon className="h-12 w-12 text-muted-foreground" />} Introduction</ScrollableSections.Tab>
        <ScrollableSections.Tab id="quickStart">{<img src={quickstartIcon} width={18} height={18} />} Quick Start</ScrollableSections.Tab>
        <ScrollableSections.Tab id="diy">{<img src={diyIcon} width={18} height={18} />} DIY</ScrollableSections.Tab>
        <ScrollableSections.Tab id="publishFirmwareApp">{<BookOpenIcon />} Publish Your Own Firmware Apps</ScrollableSections.Tab>
      </ScrollableSections.Tabs>
      <ScrollableSections.Content id="intro" className="md:-mt-[4.25rem] md:scroll-mt-0 md:pt-[4.25rem]">
        {
          <section className="space-y-2">
            <SectionCard
              icon={<HandshakeIcon className="h-5 w-5 text-muted-foreground" />}
              primaryText="Introduction"
              allowCollapse={false}
              defaultOpen={true}
              size="lg"
            >
              <div className="rounded-lg border p-6">
            <p className="text-sm">
              ESP Launchpad is a web based tool, available for flashing firmware applications to the ESP32
              device connected via a USB serial port.
            </p>
            <p className="text-sm"><br />
              There are two modes available for using this tool:
              <br /> 
              1. <Link to="#quickStart" color="secondary">Quick Start</Link> : 
              4 Easy Steps - <code style={{color:"#d63384"}}>Plug Device, Connect, Choose Built-In Firmware Image & Flash!</code>
            </p>
            <p className="text-sm">
              2. <Link to="#diy" color="secondary">DIY</Link> : 
              For Advanced Users, use your own pre-built Firmware Image from local storage and Flash!
            </p>
            <p className="text-sm">
            <br />
            You can even build and <Link to="#publishFirmwareApp" color="secondary">Publish your own Apps</Link> for ESP32 using ESP Launchpad.
            </p>
          </div>
            </SectionCard>
          </section>
        }
      </ScrollableSections.Content>
      <ScrollableSections.Content id="quickStart" className="md:-mt-[4.25rem] md:scroll-mt-0 md:pt-[4.25rem]">
        {
           <section className="space-y-2">
            <SectionCard
              icon={<img src={quickstartIcon} alt="Quick Start" width={24} height={24} />}
              primaryText="Quick Start"
              actions={ <Button color="secondary" fullWidth={false} onClick={() => onTabChange("quickstart")}>
              Try Now!</Button>}
              allowCollapse={false}
              defaultOpen={true}
              size="lg"
            >
              <p className="text-sm">
                ESP currently provides a few built-in, ready-to-use examples that can be flashed on the
                ESP32 devices. Choose one of the built-in firmware applications, plug in your device, use
                the Connect option in the menu, choose the firmware, and click Flash!
              </p>
            </SectionCard>
         </section>
        }
      </ScrollableSections.Content>
      <ScrollableSections.Content id="diy" className="md:-mt-[4.25rem] md:scroll-mt-0 md:pt-[4.25rem]">
        {
          <section className="space-y-2">
            <SectionCard
              icon={<img src={diyIcon} alt="DIY" width={24} height={24} />}
              primaryText="DIY"
              actions={ <Button color="secondary" fullWidth={false} onClick={() => onTabChange("diy")}>
              Try Now!</Button>}
              allowCollapse={false}
              defaultOpen={true}
              size="lg"
            >
              <p className="text-sm">
                You can build your own firmware binaries using the ESP-IDF tools and flash them from your
                local machine. Select the firmware files from local storage, choose the memory address for
                each, then click Flash!
              </p>
            </SectionCard>
          </section>
        }
      </ScrollableSections.Content>
      <ScrollableSections.Content id="publishFirmwareApp" className="md:-mt-[4.25rem] md:scroll-mt-0 md:pt-[4.25rem]">
        {
          <section className="space-y-3">
            <SectionCard
              icon={<BookOpenIcon className="h-5 w-5 text-muted-foreground" />}
              primaryText="Publish your own firmware apps"
              allowCollapse={false}
              defaultOpen={true}
              size="lg"
            >
              <div className="rounded-lg border p-6">
            <p className="text-sm">
              The ESP Launchpad Quick Start page is rendered by referring to a TOML configuration file,
              where you configure where to pick the component images of your firmware and the supported
              hardware. A sample TOML config file can be viewed {""}
              <a
                className="text-primary underline"
                href="https://espressif.github.io/esp-launchpad/config/config.toml"
              >
                here
              </a>
              .
            </p>
            <p className="text-sm">
            Rest of the flashing procedure is same easy 4 step process as the <Link to="#quickStart" color="secondary">Quick Start</Link> one above.
            </p>
            <p className="text-sm">
            Once ready, you can use the following image and add following html code on your website for supporting ESPaunchpad with your configuration. Edit the query parameter in the href, replacing URL_TO_YOUR_CONFIG_TOML value where your TOML config file is hosted.
            </p>
            <br />
            <img src={tryWithLaunchpad} alt="Try it with ESP Launchpad" width={250} height={70} /> <br />
            <textarea
              readOnly
              rows={4}
              className="w-full rounded border border-border bg-background p-2 font-mono text-xs"
              value={EMBED_SNIPPET}
            />
            <br /> <br />
            <Alert color="warning" variant="soft" title="Note:" dismissible hideIcon={true}>
            When using an external TOML source, a message will be displayed: 
            You have chosen to try the firmware images from an external source'
            along with the URL of your configuration file.
            </Alert>
            <br /> <br />
            <h6 className="text-xl font-bold">Using CORS Proxy for external TOML Files </h6>
            <p className="text-sm">
              If your TOML configuration file is hosted on a server that doesn't support CORS (Cross-Origin Resource Sharing), 
              or if you want to load a file from your local PC or from a source other than espressif.github.io, simply add 
              <code style={{color:"#d63384"}}> &crossDomain=true</code> to your URL. The CORS proxy will be applied automatically.
              <br /><br />
              URL Format:  <code style={{color:"#d63384"}}> &crossDomain=true</code> to your flashConfigURL.
            </p>
            <textarea
              readOnly
              rows={2}
              className="w-full rounded border border-border bg-background p-2 font-mono text-xs"
              value={"https://espressif.github.io/esp-launchpad/?flashConfigURL=YOUR_CONFIG_TOML_URL&crossDomain=true"}
            />
            <br /> <br />
            <h2 className="text-lg font-bold">Loading from your local PC:</h2>
            <p className="text-sm">
            To load a TOML file from your local machine, you need to expose it via a tunnel service (e.g., Cloudflare Tunnel, ngrok, or similar). 
            Once your local server is accessible via a public URL, use it with <code style={{color:"#d63384"}}> &crossDomain=true</code>
            </p>
            <br />
            <textarea
              readOnly
              rows={2}
              className="w-full rounded border border-border bg-background p-2 font-mono text-xs"
              value={"https://espressif.github.io/esp-launchpad/?flashConfigURL=https://your-tunnel-url.trycloudflare.com/config.toml&crossDomain=true"}
            />
            <br /> <br />
          <h2 className="text-lg font-bold">Loading from a custom server:</h2>
          <p className="text-sm">If your TOML file is hosted on your own server (e.g., https://mycompany.com):</p>
          <br />
            <textarea
              readOnly
              rows={2}
              className="w-full rounded border border-border bg-background p-2 font-mono text-xs"
              value={"https://espressif.github.io/esp-launchpad/?flashConfigURL=https://mycompany.com/firmware/config.toml&crossDomain=true"}
            />
            </div>
            </SectionCard>
        </section>
        }
      </ScrollableSections.Content>
    </ScrollableSections>
    </PageContainer>
  );
}
