ESP Launchpad is a web based tool, available for flashing firmware application to the ESP32 device connected via USB serial port. Just plug in your device to the terminal, connect and choose the firmware application as per the ESP32 chipset type (viz. S2, C3) and flash. This easy, 4 step process will flash the firmware on to the connected device and bring it into play as you want it to be.



Quick Try:

ESP currently provides a few built in, ready to use examples that can be flashed on the ESP32 devices. You can choose one of the built in firmware application for either RainMaker or Matter, and as per the chipset type. Just connect your ESP32 device to the serial USB port. Using the web based tool, connect to your device. Choose the firmware from the built-in firmware example set. Click Flash!

The firmware will be flashed on to your connected device. You can watch the progress of the firmware flashing in the console window.



DIY:

You can build your own firmware binaries using the ESP IDF tools. These firmware images can then be flashed from your local machine to the connected device. Just connect your ESP32 device to the serial USB port. Using the web based tool, connect to your device. You can then select the firmware application from the local storage of the machine. Choose the memory address where to flash the firmware. Firmware can be a single file or a set of multiple files to be flashed at particular memory addresses.

Click Flash!

The firmware will be flashed on to your connected device. You can watch the progress of the firmware flashing in the console window.





Publish your own firmware apps:

You can build your own firmware applications and make them publicly available for flashing via ESP Launchpad web based tool.

A config TOML file is made available for publishing your application. Just provide the configuration values viz. the name of the application, ESP chipset type it supports, URL of the firmware binary image and any supported or linked play-store apps the device may want to connect post flashing of the firmware.

Use the path to your TOML config file as a query parameter to the ESP Launchpad web URL and the Quick Try screen would render the UI and available user input selections as per the config options in the TOML file.

Rest of the flashing procedure is same easy 4 step process as the Quick Try one.