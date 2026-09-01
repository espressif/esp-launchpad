import { useEffect, useMemo, useState } from "react";
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
import type { TabId } from "./types";
import { Cpu } from "lucide-react";

function TabPanel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <div className={active ? "fade-in-down" : "hidden"}>{children}</div>;
}

function Launchpad() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [flashModalOpen, setFlashModalOpen] = useState(false);
  const [flashLinks, setFlashLinks] = useState<AppFlashLinks>({});
  const { fitTerminal, connected, connect } = useEsp();

  // The terminal is rendered in a hidden panel; re-fit it when shown.
  useEffect(() => {
    if (activeTab === "console") requestAnimationFrame(fitTerminal);
  }, [activeTab, fitTerminal]);

  const goToConsole = () => setActiveTab("console");
  const showFlashStatus = (links: AppFlashLinks) => {
    setFlashLinks(links);
    setFlashModalOpen(true);
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
            actions={<Button color="disabled" fullWidth={false} variant="default" onClick={() => void connect()}>Connect</Button>} />
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
          <ConsoleTab />
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
        onOpenChange={setFlashModalOpen}
        links={flashLinks}
      />
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
