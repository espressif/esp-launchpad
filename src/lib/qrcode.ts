import QRCode from "qrcode";

/** Generates a QR code as a PNG data URL, matching the original 128px high-correction codes. */
export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 128,
    margin: 1,
    errorCorrectionLevel: "H",
    color: { dark: "#000000", light: "#ffffff" },
  });
}
