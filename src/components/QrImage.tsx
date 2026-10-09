import { useEffect, useState } from "react";
import { generateQrDataUrl } from "../lib/qrcode";

/** Renders a QR code for the given text as an <img>. */
export function QrImage({ text, alt = "QR code" }: { text: string; alt?: string }) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    generateQrDataUrl(text)
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!dataUrl) return null;
  return <img src={dataUrl} alt={alt} width={128} height={128} />;
}
