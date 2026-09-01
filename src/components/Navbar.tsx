import { useEsp } from "../esp/EspContext";
import type { TabId } from "../types";
import logo from "../../assets/logo-v1.png";
import quickstartIcon from "../../assets/icons/quickstart.png";
import diyIcon from "../../assets/icons/diy.png";
import connectIcon from "../../assets/icons/connect.png";
import disconnectIcon from "../../assets/icons/disconnect.png";
import consoleIcon from "../../assets/icons/console.png";
import settingsIcon from "../../assets/icons/settings.png";
import aboutIcon from "../../assets/icons/about-us.png";
import homeIcon from "../../assets/icons/home.png";
import { Tabs, TabsList, TabsTrigger } from "@espressif/dashboard-ui-components";


interface NavItem {
  id: TabId;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: homeIcon },
  { id: "quickstart", label: "Quick Start", icon: quickstartIcon },
  { id: "diy", label: "DIY", icon: diyIcon },
  { id: "console", label: "Console", icon: consoleIcon },
  { id: "settings", label: "Settings", icon: settingsIcon },
  { id: "about", label: "About", icon: aboutIcon }
];

export function Navbar({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  const { connected, chipDesc, connect, disconnect } = useEsp();
  const deviceReady = connected && chipDesc !== "default";

  return (
    <nav className="sticky top-0 z-50 flex items-center gap-4 border-b border-border bg-background px-4 py-2">
      <button
        type="button"
        className="flex shrink-0 items-center"
        onClick={() => onTabChange("home")}
        aria-label="ESP Launchpad Home"
      >
        <img src={logo} alt="ESP Launchpad" className="h-9" />
      </button>
      <div className="ml-auto flex w-[70%] items-center">
        <Tabs value={activeTab} className="w-full">
        <TabsList variant="rounded" className="w-full">
          {NAV_ITEMS.map((item) => (
            <TabsTrigger key={item.id} value={item.id} onClick={() => onTabChange(item.id)}>
              <img src={item.icon} alt="" className="h-4 w-4" aria-hidden /> {item.label}
            </TabsTrigger>
          ))}
      {deviceReady ? (
          <TabsTrigger onClick={() => void disconnect()} value="disconnect">
            <img src={disconnectIcon} alt="" className="h-4 w-4" aria-hidden />
            Disconnect
          </TabsTrigger>
        ) : (
          <TabsTrigger  onClick={() => void connect()} value="connect">
            <img src={connectIcon} alt="" className="h-4 w-4" aria-hidden />
            Connect
          </TabsTrigger>
        )}
        </TabsList>
        </Tabs>
      </div>
      </nav>
  );
}
