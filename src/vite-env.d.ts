/// <reference types="vite/client" />
/// <reference types="w3c-web-serial" />

interface Window {
  plausible?: (...args: unknown[]) => void;
}
