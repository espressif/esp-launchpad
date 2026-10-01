import { useEffect, useState } from "react";
import { loadMinimalConfig, type MinimalConfigLoadResult } from "../../src/lib/tomlConfig";
import { mdToHtml } from "../../src/lib/markdown";

export type MinimalConfigState = MinimalConfigLoadResult | { status: "loading" };

export interface MinimalReadme {
  /** `none` when the app has no `readme.text`. */
  status: "none" | "loading" | "ready" | "error";
  html: string;
}

/**
 * Loads the TOML named by `?flashConfigURL=` once, then the app README (if any).
 * The README is fetched a single time and reused by both the info panel and the
 * post-flash product column.
 */
export function useMinimalConfig() {
  const [config, setConfig] = useState<MinimalConfigState>({ status: "loading" });
  const [readme, setReadme] = useState<MinimalReadme>({ status: "none", html: "" });

  useEffect(() => {
    let cancelled = false;
    void loadMinimalConfig().then((result) => {
      if (!cancelled) setConfig(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (config.status !== "ok") return;
    const url = config.app.readme?.text;
    if (!url) {
      setReadme({ status: "none", html: "" });
      return;
    }

    let cancelled = false;
    setReadme({ status: "loading", html: "" });
    void (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = mdToHtml(await response.text());
        if (!cancelled) setReadme({ status: "ready", html });
      } catch {
        if (!cancelled) setReadme({ status: "error", html: "" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config]);

  return { config, readme };
}
