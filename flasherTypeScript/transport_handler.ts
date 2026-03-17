import { ResponseHandler } from "./response_handler";
import { Response } from "./types";
export class UsbTransport {
  //! Constants about protocol and devices.
  static ENDPOINT_OUT = 0x02;
  static ENDPOINT_IN = 0x02; //0x82;
  static USB_TIMEOUT_MS = 5000;
  static MAX_PACKET_SIZE = 64;
  static SECTOR_SIZE = 1024;
  static DEFAULT_TRANSPORT_TIMEOUT_MS = 1000;

  private device: USBDevice;

  constructor(device: USBDevice) {
    this.device = device;
  }
  async sleep(microseconds: number) {
    return new Promise((resolve) => setTimeout(resolve, microseconds / 1000));
  }
  // static debugLog(message: string) {
  //   const consoleTextarea =
  //     document.querySelector<HTMLTextAreaElement>("#console")!;
  //   consoleTextarea.value += message + "\n";
  //   consoleTextarea.scrollTop = consoleTextarea.scrollHeight;
  // }
  // static clearLog() {
  //   const consoleTextarea =
  //     document.querySelector<HTMLTextAreaElement>("#console")!;
  //   consoleTextarea.value = "";
  // }
  static async scanDevices(): Promise<number> {
    const filters = [
      { vendorId: 0x4348, productId: 0x55e0 },
      { vendorId: 0x1a86, productId: 0x55e0 },
    ];

    const devices = await navigator.usb.getDevices();
    const matchingDevices = devices.filter((device) =>
      filters.some(
        (filter) =>
          device.vendorId === filter.vendorId &&
          device.productId === filter.productId,
      ),
    );

    console.debug(`Found ${matchingDevices.length} WCH ISP USB devices`);
    return matchingDevices.length;
  }

  static async openNth(nth: number): Promise<UsbTransport> {
    const devices = await navigator.usb.getDevices();
    const device = devices[nth];
    if (!device) {
      throw new Error(
        `No WCH ISP USB device found (4348:55e0 or 1a86:55e0 device not found at index #${nth})`,
      );
    }

    console.debug(`Found USB Device ${device.productName}`);

    await device.open();

    // Select configuration and claim interface
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    const config = device.configuration;
    let endpointOutFound = false;
    let endpointInFound = false;

    if (config) {
      console.log("config", config);
      for (const intf of config.interfaces) {
        console.log(intf);
        for (const endpoint of intf.alternate.endpoints) {
          if (endpoint.endpointNumber === this.ENDPOINT_OUT) {
            endpointOutFound = true;
          }
          if (endpoint.endpointNumber === this.ENDPOINT_IN) {
            endpointInFound = true;
          }
        }
      }
    }

    if (!(endpointOutFound && endpointInFound)) {
      throw new Error("USB Endpoints not found");
    }

    await device.claimInterface(0);
    return new UsbTransport(device);
  }

  static async openAny(): Promise<UsbTransport> {
    return this.openNth(0);
  }

  static async closeAny(): Promise<void> {
    const devices = await navigator.usb.getDevices();
    const device = devices[0];
    device.close();
  }

  async sendRaw(raw: Uint8Array): Promise<void> {
    await this.device.transferOut(UsbTransport.ENDPOINT_OUT, raw);
  }

  async recvRaw(): Promise<Uint8Array> {
    const result = await this.device.transferIn(UsbTransport.ENDPOINT_IN, 64);
    if (result.data) {
      return new Uint8Array(
        result.data.buffer,
        result.data.byteOffset,
        result.data.byteLength,
      );
    }
    throw new Error("Failed to receive data");
  }
  async recv(): Promise<Response> {
    const result = await this.device.transferIn(UsbTransport.ENDPOINT_IN, 64);
    if (result.data) {
      return ResponseHandler.fromRaw(
        new Uint8Array(
          result.data.buffer,
          result.data.byteOffset,
          result.data.byteLength,
        ),
      );
    }
    throw new Error("Failed to receive data");
  }
}
