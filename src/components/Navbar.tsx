import { useEsp } from "../esp/EspContext";
import type { TabId } from "../types";
import type { LucideIcon } from "lucide-react";
import logo from "../../assets/logo-v1.png";
import connectIcon from "../../assets/icons/connect.png";
import disconnectIcon from "../../assets/icons/disconnect.png";
import { House, Info, Settings, SquareChevronRight, Timer, ToolCase } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@espressif/dashboard-ui-components";


interface NavItem {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: House },
  { id: "quickstart", label: "Quick Start", icon: Timer },
  { id: "diy", label: "DIY", icon: ToolCase },
  { id: "console", label: "Console", icon: SquareChevronRight },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "about", label: "About", icon: Info }
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
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <TabsTrigger key={id} value={id} onClick={() => onTabChange(id)}>
              <Icon className="h-4 w-4" aria-hidden /> {label}
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
