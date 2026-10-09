import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@espressif/dashboard-ui-components";
import { QrImage } from "../QrImage";
import gplayBadge from "../../../assets/gplay_download.png";
import appstoreBadge from "../../../assets/appstore_download.png";

export interface AppFlashLinks {
  androidUrl?: string;
  iosUrl?: string;
  setupPayload?: string;
  setupPayloadLogo?: string;
}

export function FlashStatusDialog({
  open,
  onOpenChange,
  links,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  links: AppFlashLinks;
}) {
  const hasAppLinks = Boolean(links.androidUrl || links.iosUrl);
  const hasSetup = Boolean(links.setupPayload);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-info">ESP Firmware Flashing Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <p>
            Flashing of firmware is completed! Click the <b>Reset Device</b> button on the Console
            tab to reset your device with the newly flashed firmware.
          </p>
          {hasAppLinks && (
            <p className="text-muted-foreground">
              You can download the phone app from the app store and interact with your device. Scan
              the QR code to access the respective apps.
            </p>
          )}
          {hasSetup && (
            <p className="text-muted-foreground">
              To set up the device, use a supported phone app to scan the rightmost QR code.
            </p>
          )}
        </div>

        {(hasAppLinks || hasSetup) && (
          <>
            <hr className="border-border" />
            <div className="flex flex-wrap items-start gap-8">
              {links.androidUrl && (
                <div className="space-y-2">
                  <a href={links.androidUrl} target="_blank" rel="noreferrer">
                    <img src={gplayBadge} alt="Get it on Google Play" height={50} width={130} />
                  </a>
                  <QrImage text={links.androidUrl} alt="Android app QR code" />
                </div>
              )}
              {links.iosUrl && (
                <div className="space-y-2">
                  <a href={links.iosUrl} target="_blank" rel="noreferrer">
                    <img src={appstoreBadge} alt="Download on the App Store" height={50} width={130} />
                  </a>
                  <QrImage text={links.iosUrl} alt="iOS app QR code" />
                </div>
              )}
              {hasSetup && (
                <div className="ml-auto space-y-2">
                  {links.setupPayloadLogo && (
                    <img src={links.setupPayloadLogo} alt="" height={50} width={130} />
                  )}
                  <QrImage text={links.setupPayload!} alt="Device setup QR code" />
                </div>
              )}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
