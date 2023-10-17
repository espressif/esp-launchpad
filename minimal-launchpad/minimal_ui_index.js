const connectButton = document.getElementById("connectButton");
const consoleStartButton = document.getElementById("consoleStartButton");
const terminal = document.getElementById("terminal");
const spinner = document.getElementById("spinner");
const productInfoContainer = document.getElementById("productInfoContainer");
const terminalContainer = document.getElementById("terminalContainer");
const alertContainer = document.getElementById("alert-container");
const lblConnTo = document.getElementById("lblConnTo");
const message = document.getElementById("message");

import * as utilities from "../js/utils.js"
import * as esptooljs from "../node_modules/esptool-js/bundle.js";
import * as toml from '../node_modules/smol-toml/dist/index.js';

const ESPLoader = esptooljs.ESPLoader;
const Transport = esptooljs.Transport;

if (utilities.isWebUSBSerialSupported()) {
    document.getElementById("unsupportedBrowserErr").style.display = "inline";
    document.getElementById("main").style.display = "none";
    throw new Error('Unsupported Browser');
}

let term = new Terminal({ cols: utilities.getTerminalColumns(), rows: 23, fontSize: 14, scrollback: 9999999 });
let fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);
term.open(terminal);
fitAddon.fit();

let device = null;
let transport;
let chip = "default";
let chipDesc = "default";
let esploader;
let connected = false;
let resizeTimeout = false;
let imagePartsArray = undefined;
let imagePartsOffsetArray = undefined;
let reader = undefined;
var config = [];

// Code for minimalLaunchpad
function setImagePartsAndOffsetArray() {
    let app = config[config["supported_apps"][0]];
    let chipInConfToml = undefined;
    let appImageObj = undefined;
    if (chip !== "default" && config["multipart"]) {
        chipInConfToml = config["chip"];
        appImageObj = app["image"][chipInConfToml.toLowerCase()];
    }
    if (chip !== "default" && chipInConfToml !== undefined) {
        imagePartsArray = appImageObj["parts"];
        imagePartsOffsetArray = appImageObj["addresses"];
    }
}

async function downloadAndFlash() {
    let fileArr = []
    for (let index = 0; index < imagePartsArray.length; index++) {
        let data = await utilities.getImageData(imagePartsArray[index]);
        fileArr.push({ data: data, address: imagePartsOffsetArray[index] });
    }
    try {
        const flashOptions = {
            fileArray: fileArr,
            flashSize: "keep",
            flashMode: undefined,
            flashFreq: undefined,
            eraseAll: true, // Always erasing before flash
            compress: true,
        };
        await esploader.write_flash(flashOptions);
    } catch (error) {
    }
}

function MDtoHtml() {
    let application = "supported_apps";
    var converter = new showdown.Converter({ tables: true });
    converter.setFlavor('github');
    try {
        fetch(config[config[application][0]].readme.text).then(response => {
            return response.text();
        }).then(result => {
            let htmlText = converter.makeHtml(result);
            if (htmlText) {
                message.innerHTML = htmlText;
                message.style.display = "block";
                productInfoContainer.classList.add("col-6", "slide-up");
                terminalContainer.classList.remove("col-12", "fade-in");
                terminalContainer.classList.add("col-6", "slide-right");
                utilities.resizeTerminal(fitAddon);
            } else {
                message.style.display = "none";
            }
            consoleStartButton.click();
        })
    } catch (error) {
        message.style.display = "none";
    }
}
// Build the Minimal Launchpad UI using the config toml file.
async function buildMinimalLaunchpadUI() {
    let tomlFileURL = undefined;
    const urlParams = new URLSearchParams(window.location.search);
    const url = window.location.search;
    const parameter = "flashConfigURL";
    if (url.includes("&")) {
        tomlFileURL = url.substring(url.search(parameter) + parameter.length + 1);
    } else {
        tomlFileURL = urlParams.get(parameter);
    }
    if (tomlFileURL) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', tomlFileURL, true);
        xhr.send();
        xhr.onload = function () {
            if (xhr.status === 404) {
                connectButton.disabled = true;
                alertContainer.style.display = 'initial';
                lblConnTo.innerHTML = `<b style='text-align:center'><span style='color:red;'>Unable to access the TOML file. Please ensure that you have provided the correct TOML file link to the flashConfigURL parameter.</span></b>`;
                lblConnTo.style.display = "block";
            }
            if (xhr.readyState === 4 && xhr.status === 200) {
                config = toml.parse(xhr.responseText);
                return config;
            }
        }
    } else {
        connectButton.disabled = true;
        alertContainer.style.display = 'initial';
        lblConnTo.innerHTML = `<b><span style='color:red;'>Please provide a TOML link supported by the minimal launchpad in flashConfigURL as shown below</span></b>
        <br /><code style="color:#664d03">https://espressif.github.io/esp-launchpad/minimal-launchpad/?flashConfigURL=&ltYOUR_TOML_FILE_LINK&gt</code>`;
        lblConnTo.style.display = "block";
    }
}

config = await buildMinimalLaunchpadUI();

$(function () {
    utilities.initializeTooltips();
})

let espLoaderTerminal = {
    clean() {
        term.clear();
    },
    writeLine(data) {
        term.writeln(data);
    },
    write(data) {
        term.write(data)
    }
}

async function connectToDevice() {
    connectButton.style.display = "none";
    if (device === null) {
        device = await navigator.serial.requestPort({
            filters: utilities.usbPortFilters
        });
        transport = new Transport(device);
    }
    spinner.style.display = "flex";
    spinner.style.flexDirection = "column";
    spinner.style.alignItems = "center";

    try {
        const loaderOptions = {
            transport: transport,
            baudrate: 460800,
            terminal: espLoaderTerminal
        };
        esploader = new ESPLoader(loaderOptions);
        connected = true;

        chipDesc = await esploader.main_fn();
        chip = esploader.chip.CHIP_NAME;

        await esploader.flash_id();
    } catch (e) {
    }
    spinner.style.display = "none";
}

connectButton.onclick = async () => {
    try {
        if (!connected)
            await connectToDevice();
        if (chipDesc !== "default") {
            terminalContainer.classList.add("fade-in");
            terminalContainer.style.display = 'initial'
            setImagePartsAndOffsetArray();
            await downloadAndFlash();
            consoleStartButton.disabled = false;
            MDtoHtml();
            setTimeout(() => {
                productInfoContainer.classList.add("bounce");
            }, 2500)
        } else {
            alertContainer.style.display = "initial";
            lblConnTo.innerHTML = "<b><span style='color:red'>Unable to connect device. Please ensure the device is not connected in another application</span></b>";
            lblConnTo.style.display = "block";
            setTimeout(() => {
                alertContainer.style.display = "none";
                connectButton.style.display = "inline-flex";
                connected = false;
            }, 5000)
        }
    } catch (error) {
        if (error.message === "Failed to execute 'requestPort' on 'Serial': No port selected by the user.") {
            connectButton.style.display = "inline-flex";
        }
    }

}

consoleStartButton.onclick = async () => {
    if (transport) {
        if (reader !== undefined) {
            reader.releaseLock();
        }
        if (device) {
            await device.close();
        }
    }
    await transport.connect();
    await transport.setDTR(false);
    await new Promise(resolve => setTimeout(resolve, 100));
    await transport.setDTR(true);
    while (device.readable) {

        if (!device.readable.locked) {
            reader = device.readable.getReader();
        }

        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    // Allow the serial port to be closed later.
                    reader.releaseLock();
                    break;
                }
                if (value) {
                    term.write(value);
                }
            }
        } catch (error) { }
    }
}

$(window).resize(function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => utilities.resizeTerminal(fitAddon), 300);
});