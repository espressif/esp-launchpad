# ESP Launchpad

## Prerequisites

- Node.js 20.19 or newer
- npm
- A browser with Web Serial support, such as Google Chrome or Microsoft Edge

## Install

Clone the repository and install the dependencies:

```bash
git clone https://github.com/espressif/esp-launchpad.git
cd esp-launchpad
npm ci
```

## Run locally

Start the Vite development server:

```bash
npm run dev
```

Open the URL printed by Vite, usually [http://localhost:5173](http://localhost:5173).
Localhost is treated as a secure context, which allows supported browsers to use the
Web Serial API.

## Build

Create a production build:

```bash
npm run build
```

The generated files are written to the `dist` directory.

To preview the production build locally:

```bash
npm run preview
```

## Usage

ESP Launchpad is a web based tool, available for flashing firmware application to the ESP32 device connected via USB serial port.

There are two modes available for using this tool:
- Quick Start : 4 Easy Steps - Plug, Connect, Choose Built-In Firmware Image, Flash!
- DIY : For Advanced Users, use your own pre-built Firmware Image from local storage and Flash!


**Quick Start:**

ESP currently provides a few built in, ready to use examples that can be flashed on the ESP32 devices. You can choose one of the built in firmware application for either RainMaker or Matter, and as per the chipset type. Just plug in your ESP32 device to the serial USB port. Use connect option in the menu to connect to your ESP32 device. Choose the firmware from the built-in firmware example set. Click Flash!

The firmware will be flashed on to your connected device. You can watch the progress of the firmware flashing in the console window.

This easy, 4 step process will flash the firmware on to the connected device and bring it into play as you want it to be.

[Try Now](https://espressif.github.io/esp-launchpad/)

**DIY:**

You can build your own firmware binaries using the ESP IDF tools. These firmware images can then be flashed from your local machine to the connected device. Just connect your ESP32 device to the serial USB port. Using the web based tool, connect to your device. You can then select the firmware application from the local storage of the machine. Choose the memory address where to flash the firmware. Firmware can be a single file or a set of
multiple files to be flashed at particular memory addresses.

Click Flash!

The firmware will be flashed on to your connected device. You can watch the progress of the firmware flashing in the console window.

[Try Now !](https://espressif.github.io/esp-launchpad/)



**Minimal Launchpad:**

A one-click variant of the Quick Start flow for publishing a single firmware. Point it at your TOML and it connects, flashes every part listed for the configured chip, and drops into the device console:

```
https://espressif.github.io/esp-launchpad/minimal-launchpad/?flashConfigURL=<URL_TO_YOUR_TOML>
```

The TOML must set `multipart = true`, `chip = "<target>"`, and `image.<chip>.parts` / `image.<chip>.addresses` for the first app in `supported_apps`. Optional keys: `icon`, `readme.text` (Markdown shown in the info panel and after flashing), `console_baudrate`, and a `[[portConnectionOptions]]` table that enables the console command input. A documented template lives in [config/minimal_launchpad_config.toml](config/minimal_launchpad_config.toml). Add `&crossDomain=true` to route the TOML download through the Espressif CORS proxy when the host does not send CORS headers.

Locally, open `http://localhost:5173/minimal-launchpad/?flashConfigURL=<URL>` while `npm run dev` is running.

**Publish your own firmware apps:**

ESP Launchpad also lets you easily publish your firmware apps for others to try.

The ESP Launchpad Quick Start page would be rendered by referring to a TOML configuration file, where you can configure where to pick all the component images of your firmware, and the supported hardware. You could also link to any supported phone apps to work along with this firmware.

You can also include additional information about your application in **Markdown format** within the TOML config file itself. ESP Launchpad will then render the application information and any additional instructions in the browser after flashing the firmware image. A sample TOML config file can be viewed [here](https://github.com/espressif/esp-launchpad/blob/main/config/config.toml)

Rest of the flashing procedure is same easy 4 step process as the Quick Start one above.

Once ready, you can use the following image and URL for supporting ESP Launchpad with your configuration.

```
<a href="https://espressif.github.io/esp-launchpad/">
    <img alt="Try it with ESP Launchpad" src="https://espressif.github.io/esp-launchpad/assets/try_with_launchpad.png" width="250" height="70">
</a>
```