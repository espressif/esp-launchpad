import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@espressif/dashboard-ui-components";

/** Side sheet showing the selected app's readme (already sanitized by `mdToHtml`). */
export function AppInfoSheet({
  html,
  open,
  onOpenChange,
}: {
  html: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Application Information</SheetTitle>
        </SheetHeader>
        <div className="markdown-body p-4" dangerouslySetInnerHTML={{ __html: html }} />
      </SheetContent>
    </Sheet>
  );
}
