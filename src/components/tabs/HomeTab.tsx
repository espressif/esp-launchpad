
import { OnboardingLayout } from "../../containers/onboarding";
import { useEsp } from "../../esp/EspContext";
import { Button, SimpleClickableCard } from "@espressif/dashboard-ui-components";
import { appConfig } from "../../app-config";
import type { TabId } from "../../types";
import quickstartIcon from "../../../assets/icons/quickstart.png";
import consoleIcon from "../../../assets/icons/console.png";

const FEATURES: { id: TabId; icon: string; title: string; description: string; cta: string }[] = [
  {
    id: "quickstart",
    icon: quickstartIcon,
    title: "Quick Start",
    description:
      "Four easy steps — Plug, Connect, Choose a built-in firmware image, Flash! Ideal for getting started quickly with Espressif hardware.",
    cta: "Get Started",
  },
  {
    id: "console",
    icon: consoleIcon,
    title: "Console",
    description:
      "For users to connect their ESP dev kits to the console and interact with them.",
    cta: "Console",
  },
];

export function HomeTab({ onTabChange }: { onTabChange: (tab: TabId) => void }) {
  const { connect } = useEsp();
  const onboardingHeading =
    appConfig.customAuth?.onboardingHeading ??
    "Build smarter, build faster, build whatever with Espressif's open AIoT platforms";

  return (
    <OnboardingLayout heading={onboardingHeading}>
      <div className="flex flex-col justify-center gap-8 py-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Welcome to ESP Launchpad</h1>
          <p className="text-sm text-muted-foreground">
            A browser-based tool for flashing firmware onto your ESP32 device over USB — no
            installation required. Connect your device and choose a mode below.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-1">
          {FEATURES.map(({ id, icon, title, description, cta }) => (
            <SimpleClickableCard 
            icon={<img src={icon} alt="" className="h-5 w-5" aria-hidden />}
            title={title}
            description={description}
            color="secondary" size="sm" variant="soft"
            onClick={() => onTabChange(id)} 
            />
          ))}
        </div>

        <div className="flex gap-3">
          <Button size="sm"  onClick={() => void connect()} color="secondary">
            Connect
          </Button>
          <Button size="sm" variant="outline" onClick={() => onTabChange("about")} color="secondary">
            Learn More
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
