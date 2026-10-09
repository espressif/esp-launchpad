import { Sheet, SheetContent, SheetTitle } from "@espressif/dashboard-ui-components";
import type { MinimalReadme } from "../hooks/useMinimalConfig";

/** Right-side panel with the app README, opened from the app name above the connect button. */
export function ReadmeSheet({
  open,
  onOpenChange,
  readme,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readme: MinimalReadme;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[50vw]">
        {/* No visible header, as in the original offcanvas; the title stays for screen readers. */}
        <SheetTitle className="sr-only">Application Information</SheetTitle>
        {readme.status === "error" ? (
          <h3 className="p-4 text-lg font-semibold">Unable to load application information.</h3>
        ) : readme.status === "loading" ? (
          <p className="p-4 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="markdown-body p-4" dangerouslySetInnerHTML={{ __html: readme.html }} />
        )}
      </SheetContent>
    </Sheet>
  );
}
