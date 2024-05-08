const connectButton = document.getElementById("connectButton");
const consoleStartButton = document.getElementById("consoleStartButton");
const terminal = document.getElementById("terminal");
const spinner = document.getElementById("spinner");
const productInfoContainer = document.getElementById("productInfoContainer");
const terminalContainer = document.getElementById("terminalContainer");
const alertContainer = document.getElementById("alert-container");
const lblConnTo = document.getElementById("lblConnTo");
const message = document.getElementById("message");
const commandForm = document.getElementById("commandForm");
const commandInput = document.getElementById("commandInput");
const errorTroubleshootModalToggleButton = document.getElementById("errorTroubleshootModalToggleButton");
const errorTroubleshootModal = document.getElementById("errorTroubleshootModal");
const errorTroubleshootModalTitle = document.getElementById("errorTroubleshootModalTitle");
const waitButton = document.getElementById("waitButton");
const errorMessage = document.getElementById("errorMessage");
const errorMessageDescription = document.getElementById("errorMessageDescription");
const troubleshootAccordionLabel = document.getElementById("troubleshootAccordionLabel");
const troubleshootAccordion = document.getElementById("troubleshootAccordion");
const deviceConnectionDelayTimeout = 30000;
let deviceConnectionTimeout = undefined;
const commandHistory = [];
let historyIndex = -1;
let tomlFileURL = undefined;

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
let consoleBaudrateFromToml;
let esploader;
let connected = false;
let resizeTimeout = false;
let imagePartsArray = undefined;
let imagePartsOffsetArray = undefined;
let reader = undefined;
let writer = undefined;
var config = [];

let serialOptions = {
    dataBits: 8,
    stopBits: 1,
    parity: "none",
    flowControl: "none"
} // For Expresslink [Temporary Provision]

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
        fileArr.push({ data: data, address: parseInt(imagePartsOffsetArray[index]) });
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
        await esploader.writeFlash(flashOptions);
    } catch (error) {
        errorTroubleshootModalToggleButton.click();
        waitButton.style.display = "none";
        errorTroubleshootModalTitle.textContent = "Flashing Error";
        errorMessageDescription.textContent = "There is an error while flashing the firmware onto the device.";
        errorMessage.textContent = `Error: ${error.message}`;
        errorMessage.style.display = "block";
        term.writeln(`\x1b[1;31mError: ${error.message}`);
        throw "Flashing Error";
    }
}

function MDtoHtml() {
    let application = "supported_apps";
    var converter = new showdown.Converter({ tables: true });
    converter.setFlavor('github');
    try {
        fetch(config[config[application][0]].readme.text).then(response => {
            if (response.ok) {
                return response.text();
            }
        }).then(result => {
            let htmlText = converter.makeHtml(result);
            if (htmlText) {
                message.innerHTML = htmlText;
                message.style.display = "block";
                productInfoContainer.classList.add("col-6", "slide-up");
                terminalContainer.classList.remove("col-12", "fade-in");
                terminalContainer.classList.add("col-6", "slide-right");
                utilities.resizeTerminal(fitAddon);
                setTimeout(() => {
                    utilities.resizeTerminal(fitAddon);
                }, 300)
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
                alertContainer.style.display = 'block';
                lblConnTo.innerHTML = `<b style='text-align:center'><span style='color:red;'>Unable to access the TOML file. Please ensure that you have provided the correct TOML file link to the flashConfigURL parameter.</span></b>`;
                lblConnTo.style.display = "block";
            }
            if (xhr.readyState === 4 && xhr.status === 200) {
                config = toml.parse(xhr.responseText);
                connectButton.disabled = false;
            }
        }
        xhr.onerror = function () {
            connectButton.style.display = "none";
            waitButton.style.display = "none";
            troubleshootAccordionLabel.style.display = "none"
            troubleshootAccordion.style.display = "none";
            errorTroubleshootModalTitle.textContent = "Error getting config file";
            errorMessageDescription.innerHTML = `We are encountering issues downloading the configuration file. Please verify if you can 
            download <a href=${tomlFileURL} target="_blank">this file</a>, if not, check your network settings (Firewall, VPN, etc.) and try again.`
            errorTroubleshootModalToggleButton.click();
        }
    } else {
        connectButton.disabled = true;
        alertContainer.style.display = 'block';
        lblConnTo.innerHTML = `<b><span style='color:red;'>Please provide a TOML link supported by the minimal launchpad in flashConfigURL as shown below</span></b>
        <br /><code style="color:#664d03">https://espressif.github.io/esp-launchpad/minimal-launchpad/?flashConfigURL=&ltYOUR_TOML_FILE_LINK&gt</code>`;
        lblConnTo.style.display = "block";
    }
}

await buildMinimalLaunchpadUI();

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
        deviceConnectionTimeout = setTimeout(function() {
            errorTroubleshootModalToggleButton.click();
        }, deviceConnectionDelayTimeout);
        transport = new Transport(device);
    }
    spinner.style.display = "flex";
    spinner.style.flexDirection = "column";
    spinner.style.alignItems = "center";

    try {
        const commonLoaderOptions = {
            transport: transport,
            baudrate: 460800,
            terminal: espLoaderTerminal,
        };

        let loaderOptions;

        if (config.portConnectionOptions?.length) {
            loaderOptions = {
                ...commonLoaderOptions,
                serialOptions,
            };
        } else {
            loaderOptions = commonLoaderOptions;
        }

        esploader = new ESPLoader(loaderOptions);
        connected = true;

        chipDesc = await esploader.main();
        clearTimeout(deviceConnectionTimeout);
        if (errorTroubleshootModal.classList.contains("show")) {
            errorTroubleshootModalToggleButton.click();
        }
        chip = esploader.chip.CHIP_NAME;

        await esploader.flashId();
    } catch (error) {
        clearTimeout(deviceConnectionTimeout);
        if (!errorTroubleshootModal.classList.contains("show")) {
            errorTroubleshootModalToggleButton.click();
        }
        waitButton.style.display = "none";
        errorTroubleshootModalTitle.textContent = "Connection Error";
        errorMessageDescription.textContent = "There is an error while connecting to the device.";
        errorMessage.textContent = `Error: ${error.message}`;
        errorMessage.style.display = "block";
        throw "Connection Error";
    } finally {
        spinner.style.display = "none";
    }
}

connectButton.onclick = async () => {
    try {
        if (!connected)
            await connectToDevice();
        if (chipDesc !== "default") {
            terminalContainer.classList.add("fade-in");
            if (config.portConnectionOptions?.length) {
                commandForm.style.display = "block";
            }
            terminalContainer.style.display = 'block';
            setTimeout(() => {
                utilities.resizeTerminal(fitAddon);
            }, 300)
            setImagePartsAndOffsetArray();
            await downloadAndFlash();
            if (config.portConnectionOptions?.length) {
                commandInput.disabled = false;
            }
            consoleStartButton.disabled = false;
            MDtoHtml();
            setTimeout(() => {
                productInfoContainer.classList.add("bounce");
            }, 2500)
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
    if (config.portConnectionOptions?.length) {
        await transport.connect(parseInt(config.portConnectionOptions[0]?.console_baudrate), serialOptions);
    } else {
        consoleBaudrateFromToml = config[config['supported_apps'][0]].console_baudrate;
        await transport.connect(consoleBaudrateFromToml);
    }
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

async function sendCommand() {
    let commandToSend;
    let textEncoder = new TextEncoder();
    if (!device.writable.locked) writer = device.writable.getWriter();
    const cursorPosition = commandInput.selectionStart;
    const textBeforeCursor = commandInput.value.substring(0, cursorPosition - 1);
    const textAfterCursor = commandInput.value.substring(cursorPosition);
    commandToSend = textBeforeCursor + textAfterCursor;
    commandToSend = commandToSend.trim();
    commandHistory.unshift(commandToSend);
    historyIndex = -1;
    commandInput.value = "";
    commandInput.style.height = null;
    commandToSend = commandToSend + "\r\n";
    await writer.write(textEncoder.encode(commandToSend));
    writer.releaseLock();
}

function getHistory(direction) {
    historyIndex = Math.max(Math.min(historyIndex + direction, commandHistory.length - 1),-1);
    if (historyIndex >= 0) {
        commandInput.value = commandHistory[historyIndex];
    } else {
        commandInput.value = "";
    }
    autoResize();
}

commandInput.addEventListener("keyup", async function (event) {
    if (event.code === "Enter" && !event.shiftKey) {
        await sendCommand();
    } else if (event.code === "ArrowUp") {
        getHistory(1);
    } else if (event.code === "ArrowDown") {
        getHistory(-1);
    }
});

commandInput.addEventListener("input", autoResize);

function autoResize() {
    commandInput.style.height = "auto";
    commandInput.style.height = commandInput.scrollHeight + "px";
}

waitButton.onclick = () => {
    clearTimeout(deviceConnectionTimeout);
    deviceConnectionTimeout = setTimeout(function(){
        errorTroubleshootModalToggleButton.click();
    }, deviceConnectionDelayTimeout);
}

$(window).resize(function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        term.resize(utilities.getTerminalColumns(), 23);
        utilities.resizeTerminal(fitAddon);
    }, 300);
});