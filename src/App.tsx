import { useEffect, useMemo, useRef, useState } from "react";
import { Button, FooterCard, IconTextActionCard } from "@espressif/dashboard-ui-components";
import { EspProvider, useEsp } from "./esp/EspContext";
import { getWebSerialSupportIssue } from "./lib/serial";
import { Navbar } from "./components/Navbar";
import { WebSerialUnsupported } from "./components/WebSerialUnsupported";
import { HomeTab } from "./components/tabs/HomeTab";
import { QuickStartTab } from "./components/tabs/QuickStartTab";
import { DiyTab } from "./components/tabs/DiyTab";
import { ConsoleTab } from "./components/tabs/ConsoleTab";
import { SettingsTab } from "./components/tabs/SettingsTab";
import { AboutTab } from "./components/tabs/AboutTab";
import { FlashStatusDialog, type AppFlashLinks } from "./components/modals/FlashStatusDialog";
import { AppInfoSheet } from "./components/AppInfoSheet";
import type { TabId } from "./types";
import { Cpu, Plug } from "lucide-react";

function TabPanel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <div className={active ? "fade-in-down" : "hidden"}>{children}</div>;
}

function getInitialTab(): TabId {
  const params = new URLSearchParams(window.location.search);
  return params.has("solution") || params.has("flashConfigURL") ? "quickstart" : "home";
}

function Launchpad() {
  const [activeTab, setActiveTab] = useState<TabId>(getInitialTab);
  const [flashModalOpen, setFlashModalOpen] = useState(false);
  const [flashLinks, setFlashLinks] = useState<AppFlashLinks>({});
  const [appInfoHtml, setAppInfoHtml] = useState("");
  const [appInfoOpen, setAppInfoOpen] = useState(false);
  const { fitTerminal, connected, chipDesc, connect } = useEsp();
  const deviceReady = connected && chipDesc !== "default";
  const wasDeviceReady = useRef(deviceReady);

  // The terminal is rendered in a hidden panel; re-fit it when shown.
  useEffect(() => {
    if (activeTab === "console") requestAnimationFrame(fitTerminal);
  }, [activeTab, fitTerminal]);

  // Redirect only when a new connection successfully identifies the device.
  useEffect(() => {
    if (
      !wasDeviceReady.current &&
      deviceReady &&
      (activeTab === "home" || activeTab === "settings" || activeTab === "about")
    ) {
      setActiveTab("console");
    }
    wasDeviceReady.current = deviceReady;
  }, [activeTab, deviceReady]);

  // Callers switch to the console to start a flash/erase, so drop the previous app info.
  const goToConsole = () => {
    setAppInfoHtml("");
    setActiveTab("console");
  };
  const showFlashStatus = (links: AppFlashLinks, readmeHtml: string) => {
    setFlashLinks(links);
    setAppInfoHtml(readmeHtml);
    setFlashModalOpen(true);
  };
  // Show the app info once the flash status dialog is dismissed, so the two never stack.
  const onFlashModalOpenChange = (open: boolean) => {
    setFlashModalOpen(open);
    if (!open && appInfoHtml) setAppInfoOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className={`flex-1 ${activeTab === "home" ? "" : "container mx-auto w-full max-w-6xl px-4 py-6"}`}>
        {activeTab !== "about" && activeTab !== "home" && !connected && (
          <div className="mb-4 space-y-2">
          <IconTextActionCard 
            icon={<Cpu />} 
            title={"ESP Launchpad"}
            description={"Helps you flash the selected firmware image onto your device. Ensure your device is connected to the serial USB port."} 
            color="secondary" size="lg" variant="solid" 
            actions={<Button color="disabled" fullWidth={false} variant="default" onClick={() => void connect()}> <Plug className="h-5 w-5" aria-hidden /> Connect</Button>} />
          </div>
        )}


        <TabPanel active={activeTab === "home"}>
          <HomeTab onTabChange={setActiveTab} />
        </TabPanel>
        <TabPanel active={activeTab === "quickstart"}>
          <QuickStartTab goToConsole={goToConsole} onFlashStatus={showFlashStatus} />
        </TabPanel>
        <TabPanel active={activeTab === "diy"}>
          <DiyTab goToConsole={goToConsole} />
        </TabPanel>
        <TabPanel active={activeTab === "console"}>
          <ConsoleTab onShowAppInfo={appInfoHtml ? () => setAppInfoOpen(true) : undefined} />
        </TabPanel>
        <TabPanel active={activeTab === "settings"}>
          <SettingsTab />
        </TabPanel>
        <TabPanel active={activeTab === "about"}>
          <AboutTab onTabChange={setActiveTab} />
        </TabPanel>
      </main>

      <div className="mt-auto py-3 text-center text-muted-foreground">
      <FooterCard />
      </div>

      <FlashStatusDialog
        open={flashModalOpen}
        onOpenChange={onFlashModalOpenChange}
        links={flashLinks}
      />
      <AppInfoSheet html={appInfoHtml} open={appInfoOpen} onOpenChange={setAppInfoOpen} />
    </div>
  );
}

export default function App() {
  const issue = useMemo(() => getWebSerialSupportIssue(), []);
  if (issue) return <WebSerialUnsupported issue={issue} />;
  return (
    <EspProvider>
      <Launchpad />
    </EspProvider>
  );
}
