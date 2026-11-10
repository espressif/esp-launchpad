import { parseElf } from "@espressif/esp-idf-monitor-js";

const ELF_DOWNLOAD_TIMEOUT_MS = 60_000;

async function gunzip(data: ArrayBuffer): Promise<ArrayBuffer> {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).arrayBuffer();
}

/** Downloads an ELF file, gunzips it when needed, and rejects when it is not a valid ELF file. */
export async function fetchElf(url: string): Promise<Uint8Array> {
  const response = await fetch(url, { signal: AbortSignal.timeout(ELF_DOWNLOAD_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  let data = await response.arrayBuffer();
  const magic = new Uint8Array(data, 0, Math.min(2, data.byteLength));
  // The server can decode the gzip data itself (Content-Encoding: gzip).
  if (magic[0] === 0x1f && magic[1] === 0x8b) data = await gunzip(data);
  const bytes = new Uint8Array(data);
  parseElf(bytes);
  return bytes;
}
