import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  RadioGroup,
  Select,
  SectionCard,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SimpleCard
} from "@espressif/dashboard-ui-components";
import { ConnectionStatus, useEsp } from "../../esp/EspContext";
import { Box, Cpu } from 'lucide-react'
import {
  getApp,
  loadLaunchpadConfig,
  type AppConfig,
  type LaunchpadConfig,
} from "../../lib/tomlConfig";
import { fetchMarkdownAsHtml } from "../../lib/markdown";
import { QrImage } from "../QrImage";
import type { AppFlashLinks } from "../modals/FlashStatusDialog";
import gplayBadge from "../../../assets/gplay_download.png";
import appstoreBadge from "../../../assets/appstore_download.png";

function appLinksFromConfig(app: AppConfig): AppFlashLinks {
  return {
    androidUrl: app.android_app_url,
    iosUrl: app.ios_app_url,
    setupPayload: app.setup_payload,
    setupPayloadLogo: app.setup_payload_logo,
  };
}

function normalizeChipName(chipName: string): string {
  return chipName.replace(/-/g, "").toLowerCase();
}

function findMatchingChipset(
  chipsets: string[] | undefined,
  chipName: string,
): string | undefined {
  if (!chipsets || chipName === "default") return undefined;
  const normalized = normalizeChipName(chipName);
  return chipsets.find((c) => normalizeChipName(c) === normalized);
}

export function QuickStartTab({
  goToConsole,
  onFlashStatus,
}: {
  goToConsole: () => void;
  onFlashStatus: (links: AppFlashLinks) => void;
}) {
  const { connected, chipDesc, chipName, busy, downloadAndFlash, setConsoleBaudrateOverride } =
    useEsp();
  const deviceReady = connected && chipDesc !== "default";

  const [config, setConfig] = useState<LaunchpadConfig | null>(null);
  const [isDefault, setIsDefault] = useState(true);
  const [tomlFileURL, setTomlFileURL] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [missingApp, setMissingApp] = useState<string | undefined>(undefined);

  const [selectedApp, setSelectedApp] = useState("");
  const [selectedChipset, setSelectedChipset] = useState("");
  const [selectedDevKit, setSelectedDevKit] = useState("");

  const [appReadmeHtml, setAppReadmeHtml] = useState("");
  const [configReadmeHtml, setConfigReadmeHtml] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [flashError, setFlashError] = useState<string | null>(null);
  const [postFlashLinks, setPostFlashLinks] = useState<AppFlashLinks | null>(null);

  const app = useMemo(
    () => (config && selectedApp ? getApp(config, selectedApp) : undefined),
    [config, selectedApp],
  );

  const devKits = useMemo<string[] | undefined>(
    () => (app && selectedChipset ? app.developKits?.[selectedChipset.toLowerCase()] : undefined),
    [app, selectedChipset],
  );

  // ── Initial config load ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    loadLaunchpadConfig()
      .then((result) => {
        if (cancelled) return;
        setConfig(result.config);
        setIsDefault(result.isDefault);
        setTomlFileURL(result.tomlFileURL);
        setMissingApp(result.missingApp);
        setSelectedApp(result.config.supported_apps?.[0] ?? "");
        if (result.config.config_readme_url) {
          void fetchMarkdownAsHtml(result.config.config_readme_url).then((html) => {
            if (!cancelled) setConfigReadmeHtml(html);
          });
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Derive per-app state when the selected app changes ──────────
  useEffect(() => {
    if (!app) return;
    //setSelectedChipset(app.chipsets?.[0] ?? "");
    setConsoleBaudrateOverride(app.console_baudrate);
    setPostFlashLinks(null);

    if (app.readme?.text) {
      void fetchMarkdownAsHtml(app.readme.text).then(setAppReadmeHtml);
    } else {
      setAppReadmeHtml("");
    }
  }, [app, setConsoleBaudrateOverride]);

  // ── Default dev kit when the chipset changes ────────────────────
  useEffect(() => {
    setSelectedDevKit(devKits?.[0] ?? "");
  }, [devKits]);

  // ── Auto-select the detected chip when connected ────────────────
  useEffect(() => {
    if (!app || chipName === "default") {
      if (chipName === "default") setSelectedChipset("");
      return;
    }
    setSelectedChipset(findMatchingChipset(app.chipsets, chipName) ?? "");
  }, [app, chipName]);

  const handleAppChange = useCallback(
    (newApp: string) => {
      setSelectedApp(newApp);
      if (config) {
        const appConfig = getApp(config, newApp);
        setSelectedChipset(findMatchingChipset(appConfig?.chipsets, chipName) ?? "");
      }
    }, [config, chipName]);

  const resolveFlashFile = useCallback((): string | undefined => {
    if (!app) return undefined;
    if (devKits && devKits.length > 0) {
      return selectedDevKit ? app.image[selectedDevKit] : undefined;
    }
    return app.image[selectedChipset.toLowerCase()];
  }, [app, devKits, selectedChipset, selectedDevKit]);

  const onFlash = async () => {
    if (!app || !config) return;
    const flashFile = resolveFlashFile();
    if (!flashFile) {
      setFlashError("Please ensure that a chipset type is selected before flashing.");
      setTimeout(() => setFlashError(null), 3000);
      return;
    }
    setFlashError(null);
    setPostFlashLinks(null);
    goToConsole();
    const offset = parseInt(app.offset ?? "0x0000");
    const ok = await downloadAndFlash(config.firmware_images_url + flashFile, offset);
    if (ok) {
      const links = appLinksFromConfig(app);
      onFlashStatus(links);
      setPostFlashLinks(links);
    }
  };

  if (loadError) {
    return (
      <Alert type="error" title="Failed to load configuration">
        {loadError}
      </Alert>
    );
  }
  if (!config || !app) {
    return <p className="text-muted-foreground">Loading firmware configuration…</p>;
  }
  
  return (
    <div>
    {deviceReady && (
      <div className="space-y-1">
        <ConnectionStatus />
        <br /> <Separator /> <br />
      </div>
    )}
    <div className="space-y-5">
      <h5 className="text-base font-semibold">
        {isDefault ? (<p>
          Choose from some of ESP's pre-built, out-of-the-box examples to flash and play.
          </p>
        ) : (
          <Alert type="warning" variant="soft">
          <b>Note:</b> You have chosen to try the firmware images
          from an <b>external source</b> — <span className="break-all">{tomlFileURL}</span>
          </Alert>
        )}
      </h5>
      <Separator />
      {missingApp && (
        <Alert type="warning" title="Application not found">
          No applications found for {missingApp}
        </Alert>
      )}
      <div className="flex items-center gap-4">
      <SectionCard
        icon={<Box className="h-5 w-5 text-muted-foreground" />}
        primaryText="Select Application"
        allowCollapse={false}
        defaultOpen={true}
        size="default"
        variant="gradient"
        color="secondary">
  
        <div className="space-y-1">
          <Select value={selectedApp} onValueChange={handleAppChange}>
            <SelectTrigger className="w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {config.supported_apps.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
            ))}
            </SelectContent>
          </Select>
        </div>
        
        {appReadmeHtml && (
            <Button variant="link" onClick={() => setSheetOpen(true)}>
              Show Application Information
            </Button>
        )}
        {app.description && (
          <div className="space-y-1">
            <label className="text-sm font-medium">Application Description</label>
            <p className="text-sm text-muted-foreground">{app.description}</p>
          </div>
        )}
      </SectionCard>

      <div className="grid max-w-xl gap-4">
      <SectionCard
        icon={<Cpu className="h-5 w-5 text-muted-foreground" />}
        primaryText="ESP Chipset Type"
        allowCollapse={false}
        defaultOpen={true}
        size="default"
        variant="gradient"
        color="secondary">
        {!selectedChipset && deviceReady && (
          <div>
            <Alert type="error" color="error" title="Unsupported chipset type" variant="gradient">Selected application is not supported on your connected device.
            </Alert>
            <br /> <br />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-bold">Application Supported Chipset Types</label>
          <br />
          <Separator /> <br />
          <p className="text-sm text-muted-foreground">
            {app.chipsets.map((chipset, index) => (
              <span key={chipset}>
                {index > 0 && " | "}
                {deviceReady && chipset === selectedChipset ? (
                  <Badge color="secondary" variant="solid">{chipset}</Badge>
                ) : (
                  <Badge variant="outline">{chipset}</Badge>
                )}
              </span>
            ))}
          </p> <br />
        </div>
        <Separator />

        
      </SectionCard>

        {devKits && devKits.length > 0 && (
          <div className="space-y-1">
            <label className="text-sm font-medium">ESP Develop Kits</label>
            <RadioGroup
              orientation="horizontal"
              value={selectedDevKit}
              onValueChange={setSelectedDevKit}
              options={devKits.map((k) => ({ value: k, label: k }))}
            />
          </div>
        )}
      </div>
        

        <div className="flex items-center gap-4">
          <Button color="secondary" disabled={!deviceReady || busy || !selectedChipset} onClick={() => void onFlash()}>
            Flash
          </Button>
          
        </div>

        {flashError && (
          <Alert type="error" title="Unable to flash device">
            {flashError}
          </Alert>
        )}
      </div>

      {configReadmeHtml && (
        <SimpleCard title="Application Configuration">
          <div className="markdown-body" dangerouslySetInnerHTML={{ __html: configReadmeHtml }} />
        </SimpleCard>
      )}

      {postFlashLinks && (postFlashLinks.androidUrl || postFlashLinks.iosUrl || postFlashLinks.setupPayload) && (
        <div className="flex flex-wrap items-start gap-8 pt-2">
          {postFlashLinks.androidUrl && (
            <div className="space-y-2">
              <a href={postFlashLinks.androidUrl} target="_blank" rel="noreferrer">
                <img src={gplayBadge} alt="Get it on Google Play" height={50} width={130} />
              </a>
              <QrImage text={postFlashLinks.androidUrl} alt="Android app QR code" />
            </div>
          )}
          {postFlashLinks.iosUrl && (
            <div className="space-y-2">
              <a href={postFlashLinks.iosUrl} target="_blank" rel="noreferrer">
                <img src={appstoreBadge} alt="Download on the App Store" height={50} width={130} />
              </a>
              <QrImage text={postFlashLinks.iosUrl} alt="iOS app QR code" />
            </div>
          )}
          {postFlashLinks.setupPayload && (
            <div className="space-y-2">
              {postFlashLinks.setupPayloadLogo && (
                <img src={postFlashLinks.setupPayloadLogo} alt="" height={50} width={130} />
              )}
              <QrImage text={postFlashLinks.setupPayload} alt="Device setup QR code" />
            </div>
          )}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Application Information</SheetTitle>
          </SheetHeader>
          <div
            className="markdown-body p-4"
            dangerouslySetInnerHTML={{ __html: appReadmeHtml }}
          />
        </SheetContent>
      </Sheet>
    </div>
    </div>
  );
}
