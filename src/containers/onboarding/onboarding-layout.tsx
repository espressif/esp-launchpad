import type { ReactNode } from "react";
import {
  EntryLayout,
  type EntryLayoutProps,
} from "@espressif/dashboard-ui-components/layouts";
import type { AppName } from "@espressif/dashboard-ui-components";
import { appConfig } from "../../app-config";
import { resolveAssetPath } from "../../asset-resolver";

export type OnboardingLayoutProps = Omit<
  EntryLayoutProps,
  "appName" | "heading"
> & {
  /** Overrides `customAuth.onboardingHeading` when set */
  heading?: ReactNode;
};

function defaultBackgroundImageUrl(): string | undefined {
  const path = appConfig.customAuth?.onboardingLayoutBackgroundImage;
  if (!path) return undefined;
  return resolveAssetPath(path);
}

/**
 * Shared {@link EntryLayout} shell for login, signup, and similar entry pages.
 */
export function OnboardingLayout({
  children,
  heading,
  darkMode = false,
  backgroundImageUrl: backgroundImageUrlProp,
  ...rest
}: OnboardingLayoutProps) {
  const backgroundImageUrl =
    backgroundImageUrlProp ?? defaultBackgroundImageUrl();

  const resolvedHeading =
    heading ?? appConfig.customAuth?.onboardingHeading ?? undefined;

  return (
    <div className="w-full [&_.footer-card-wrapper]:hidden xl:[&_.main-content-wrapper]:px-10">
      <EntryLayout
        appName={appConfig.projectName as AppName}
        darkMode={darkMode}
        heading={resolvedHeading}
        backgroundImageUrl={backgroundImageUrl}
        {...rest}
      >
        {children}
      </EntryLayout>
    </div>
  );
}
