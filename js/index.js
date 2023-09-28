const baudrates = document.getElementById("baudrates");
const connectButton = document.getElementById("connectButton");
const disconnectButton = document.getElementById("disconnectButton");
const resetButton = document.getElementById("resetButton");
const consoleStartButton = document.getElementById("consoleStartButton");
const resetMessage = document.getElementById("resetMessage");
const eraseButton = document.getElementById("eraseButton");
const programButton = document.getElementById("programButton");
const filesDiv = document.getElementById("files");
const terminal = document.getElementById("terminal");
const ensureConnect = document.getElementById("ensureConnect");
const lblConnTo = document.getElementById("lblConnTo");
const table = document.getElementById('fileTable');
const alertDiv = document.getElementById('alertDiv');
const settingsWarning = document.getElementById("settingsWarning");
const progressMsgQS = document.getElementById("progressMsgQS");
const progressMsgDIY = document.getElementById("progressMsgDIY");
const deviceTypeSelect = document.getElementById("device");
const frameworkSelect = document.getElementById("frameworkSel");
const chipSetsRadioGroup = document.getElementById("chipsets");
const mainContainer = document.getElementById("mainContainer");
const setupPayloadRow = document.getElementById("setupPayloadRow");
const setupPayloadRowQS = document.getElementById("setupPayloadRowQS");
const setupQRCodeContainer = document.getElementById("setupQRCodeContainer");
const setupQRCodeContainerQS = document.getElementById("setupQRCodeContainerQS");
const setupLogoContainer = document.getElementById("setupLogoContainer");
const setupLogoContainerQS = document.getElementById("setupLogoContainerQS");
const appInfoContainer = document.getElementById("appInfoContainer");
const terminalContainer = document.getElementById("terminalContainer");
const appInfo = document.getElementById("appInfo");
const consolePageWrapper = document.getElementById("consolePageWrapper");

let resizeTimeout = false;

import * as utilities from "./utils.js";
import * as esptooljs from "../node_modules/esptool-js/bundle.js";
import * as toml from '../node_modules/smol-toml/dist/index.js';

const ESPLoader = esptooljs.ESPLoader;
const Transport = esptooljs.Transport;

if (utilities.isWebUSBSerialSupported()) {
    document.getElementById("unsupportedBrowserErr").style.display = "inline";
    document.getElementById("main").style.display = "none";
    throw new Error('Unsupported Browser');
}

const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);

let term = new Terminal({cols: utilities.getTerminalColumns(mainContainer), rows: 23, fontSize: 14, scrollback: 9999999});
let fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);
term.open(terminal);
fitAddon.fit();

let reader = undefined;
let device = null;
let transport = undefined;
let chip = "default";
let chipDesc = "default";
let esploader;
let connected = false;
let ios_app_url = "";
let android_app_url = "";
let setup_payload_logo_url = "";
let setup_qrcode_payload = "";
let markdown_payload_url = "";

disconnectButton.style.display = "none";
eraseButton.style.display = "none";
var config = [];
var isDefault = true;

// Build the Quick Try UI using the config toml file. If external path is not specified, pick up the default config
async function buildQuickTryUI() {
    const urlParams = new URLSearchParams(window.location.search);
    var tomlFileURL = window.location.origin + window.location.pathname + "config/rainmaker_config.toml"; // defaulting to rainmaker for now.
    var solution = urlParams.get("solution");
    if (solution){
        if (solution.toLowerCase() == "matter")
            // use the one published by the ci/cd job of matter on the github
            tomlFileURL = "https://espressif.github.io/esp-matter/launchpad.toml";
        else if(solution.toLowerCase() == "rainmaker")
            // use the one bundled in the config
            tomlFileURL = window.location.origin + window.location.pathname + "config/rainmaker_config.toml";
    }
    else {
        var externalURL = urlParams.get('flashConfigURL');
        if(externalURL){
            tomlFileURL = externalURL;
            isDefault = false;
        }
    }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', tomlFileURL, true);
    xhr.send();
    xhr.onload = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            config = toml.parse(xhr.responseText);
            var requestedApp = urlParams.get("app");
            if (requestedApp) {
                // Filter the supported_apps that start with the app name
                const filtered_apps = config.supported_apps.filter(app => app.startsWith(`${requestedApp}-`));

                if (filtered_apps.length > 0) {
                    config["supported_apps"] = filtered_apps;
                } else {
                    alert(`No applications found for ${requestedApp}`);
                }
            }
            if(!isDefault) {
                $("#qtLabel").html("Choose from the firmware images listed below. <Br> You have chosen to try the firmware images from an <b><u>external source</u> - "
                                            + tomlFileURL + "</b>");
            }
            try {
                if (parseFloat(config["esp_toml_version"]) === 1.0)
                    buildQuickTryUI_v1_0();

                else
                    alert("Unsupported config version used!!");
            }
            catch (err){
                alert ("Unsupported config version used -" + err.message);
            }
            return config;
        }
    }
}


//Parsing of toml based on v1.0 and builing UI accordingly.
function buildQuickTryUI_v1_0() {
    const supported_apps = config["supported_apps"];
    if(supported_apps) {
        addDeviceTypeOption(supported_apps);
        populateSupportedChipsets(config[supported_apps[0]]);
        if (config[supported_apps[0]].readme?.text) {
            markdown_payload_url = config[supported_apps[0]].readme.text;
        }
    }
    setAppURLs(config[supported_apps[0]]);
}

function addDeviceTypeOption(apps) {
    deviceTypeSelect.innerHTML = "";
    apps.forEach(app => {
            var app_config = config[app];
            var option = document.createElement("option");
            option.value = app;
            option.text = app;
            deviceTypeSelect.appendChild(option);
    });
}

config = await buildQuickTryUI();

/*
function populateDeviceTypes(imageConfig) {
    deviceTypeSelect.innerHTML = "";
    const availableImages = imageConfig["images"];
    availableImages.forEach(image => {
        var imageOption = image.split(':');
        var option = document.createElement("option");
        option.value = imageOption[0];
        option.text = imageOption[1];
        deviceTypeSelect.appendChild(option);
    });
}*/

function populateSupportedChipsets(deviceConfig) {
    chipSetsRadioGroup.innerHTML = "";
    const supportedChipSets = deviceConfig["chipsets"];
    let i = 1;
    let inputElement;

    supportedChipSets.forEach(chipset => {
        //var chipKV = chipset.split(":");
        var div = document.createElement("div");
        div.setAttribute("class", "form-check-inline");

        var lblElement = document.createElement("label");
        lblElement.setAttribute("class", "form-check-label");
        lblElement.setAttribute("for", "radio-" + chipset);
        lblElement.innerHTML = chipset + "&nbsp;";

        inputElement = document.createElement("input");
        inputElement.setAttribute("type", "radio");
        inputElement.setAttribute("class", "form-check-input");
        inputElement.name = "chipType";
        inputElement.id = "radio-" + chipset;
        inputElement.value = deviceConfig["image"][chipset.toLowerCase()];
        if (chipset.toLowerCase() === chip.toLowerCase())
            inputElement.checked = true;

        lblElement.appendChild(inputElement);

        div.appendChild (lblElement);

        chipSetsRadioGroup.appendChild(div);

        i++;
    });

    if (supportedChipSets.length === 1) {
        inputElement.checked = true;
    }
}

function setAppURLs(appConfig) {
    ios_app_url = appConfig.ios_app_url;
    android_app_url = appConfig.android_app_url;
    setup_payload_logo_url = appConfig.setup_payload_logo;
    setup_qrcode_payload = appConfig.setup_payload;
}

$('#frameworkSel').on('change', function() {
    //populateDeviceTypes(config[frameworkSelect.value]);
    addDeviceTypeOption(config["supported_apps"], frameworkSelect.value);
    setAppURLs(frameworkSelect.value);
});

$('#device').on('change', function() {
    populateSupportedChipsets(config[deviceTypeSelect.value]);
    setAppURLs(config[deviceTypeSelect.value]);
    if (config[deviceTypeSelect.value].readme?.text) {
        markdown_payload_url = config[deviceTypeSelect.value].readme.text;
    } else {
        markdown_payload_url = "";
    }
});

$(function () {
    utilities.initializeTooltips();
})

document.getElementById('selectFile1').addEventListener('change', utilities.handleFileSelect);

let espLoaderTerminal = {
    clean() {
      term.clear();
    },
    writeLine(data) {
      term.writeln(data);
    },
    write(data) {
      term.write(data);
    }
}

async function connectToDevice() {
    if (device === null) {
        device = await navigator.serial.requestPort({
            filters: utilities.usbPortFilters
        });
        transport = new Transport(device);
    }

    try {
        const loaderOptions = {
            transport,
            baudrate: baudrates.value,
            terminal: espLoaderTerminal
        };
        esploader = new ESPLoader(loaderOptions);
        connected = true;
        chipDesc = await esploader.main_fn();
        chip = esploader.chip.CHIP_NAME;

        await esploader.flash_id();
    } catch(e) {
    }

}

function postConnectControls() {
    if(chipDesc !== "default"){
        lblConnTo.innerHTML = "<b><span style='color:#17a2b8'>Connected to device: </span>" + chipDesc + "</b>";
        $("#programButton").prop("disabled", false);
        $("#programwrapper").tooltip().attr("data-bs-original-title","This will flash the firmware image on your device");
        $("#baudrates").prop("disabled", true);
        $("#flashButton").prop("disabled", false);
        $("#flashWrapper").tooltip().attr('data-bs-original-title', "This will download and flash the firmware image on your device");
        $("#consoleStartButton").prop("disabled", false);
        $("#eraseButton").prop("disabled", false);

        ensureConnect.style.display = "none";
        settingsWarning.style.display = "initial";
        connectButton.style.display = "none";
        disconnectButton.style.display = "initial";
        eraseButton.style.display = "initial";
        filesDiv.style.display = "initial";
        terminalContainer.style.display = "block";
    }
    else
        lblConnTo.innerHTML = "<b><span style='color:red'>Unable to detect device. Please ensure the device is not connected in another application</span></b>";
    lblConnTo.style.display = "block";

    $('input:radio[id="radio-' + chip + '"]').attr('checked', true);
}

connectButton.onclick = async () => {
    if(!connected)
        await connectToDevice();

    postConnectControls();

}


resetButton.onclick = async () => {
    postFlashClick();
    consoleStartButton.disabled = false;
    $('#closeResetModal').click();
    if(transport){
        if(reader !== undefined){
            reader.releaseLock();
        }
        if(device){
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
        } catch (error) {}
      }
}

eraseButton.onclick = async () => {
    postFlashClick();
    terminalContainer.classList.remove("fade-in-down");
    eraseButton.disabled = true;
    $('#v-pills-console-tab').click();
    await esploader.erase_flash();
    postFlashDone();
    eraseButton.disabled = false;
}

addFile.onclick = async () => {
    var rowCount = table.rows.length;
    var row = table.insertRow(rowCount);
    
    //Column 1 - Offset
    var cell1 = row.insertCell(0);
    var element1 = document.createElement("input");
    element1.type = "text";
    element1.id = "offset" + rowCount;
    element1.setAttribute('value', '0x8000');
    cell1.appendChild(element1);
    
    // Column 2 - File selector
    var cell2 = row.insertCell(1);
    var element2 = document.createElement("input");
    element2.type = "file";
    element2.id = "selectFile" + rowCount;
    element2.name = "selected_File" + rowCount;
    element2.addEventListener('change', utilities.handleFileSelect, false);
    cell2.appendChild(element2);
    
    // Column 3  - Remove File
    var cell3 = row.insertCell(2);
    var element3 = document.createElement("input");
    element3.type = "image";
    element3.src = "assets/icons/remove.png";
    var btnName = "rem-" + rowCount;
    element3.name = btnName;
    element3.onclick = function() {
            utilities.removeRow(table, btnName);
            return false;
    }
    cell3.appendChild(element3);
}

// to be called on disconnect - remove any stale references of older connections if any
function cleanUp() {
    device = null;
    transport = undefined;
    chip = "default";
    reader = undefined;
}

disconnectButton.onclick = async () => {
    if(transport){
        if(reader !== undefined){
            reader.releaseLock();
        }
        if(device){
            await device.close();
        }
    }
    terminalContainer.style.display = "none";
    term.clear();
    connected = false;
    $("#baudrates").prop("disabled", false);
    $("#flashButton").prop("disabled", true);
    $("#flashWrapper").tooltip().attr('data-bs-original-title', "Click on 'Connect' button in top Menu");
    $("#programwrapper").tooltip().attr("data-bs-original-title","Click on 'Connect' button in top Menu");
    $("#programButton").prop("disabled", true);
    $("#consoleStartButton").prop("disabled", true);
    settingsWarning.style.display = "none";
    connectButton.style.display = "initial";
    disconnectButton.style.display = "none";
    eraseButton.style.display = "none";
    lblConnTo.style.display = "none";
    alertDiv.style.display = "none";
    ensureConnect.style.display = "initial";
    clearAppInfoHistory();
    cleanUp();
};

consoleStartButton.onclick = async () => {
    if (device === null) {
        device = await navigator.serial.requestPort({
            filters: utilities.usbPortFilters
        });
        transport = new Transport(device);
    }
    $('#resetConfirmation').click();
}


function validate_program_inputs() {
    let offsetArr = [];
    var rowCount = table.rows.length;
    var row;
    let offset = 0;
    let fileData = null;
 
    // check for mandatory fields
    for (let index = 1; index < rowCount; index ++) {
        row = table.rows[index];

        //offset fields checks
        var offSetObj = row.cells[0].childNodes[0];
        offset = parseInt(offSetObj.value);

        // Non-numeric or blank offset
        if (Number.isNaN(offset))
            return "Offset field in row " + index + " is not a valid address!";
        // Repeated offset used
        else if (offsetArr.includes(offset))
            return "Offset field in row " + index + " is already in use!";
        else
            offsetArr.push(offset);

        var fileObj = row.cells[1].childNodes[0];
        fileData = fileObj.data;
        if (fileData == null)
            return "No file selected for row: " + index + "!";

    }
    return "success";
}

programButton.onclick = async () => {
    programButton.disabled = true;
    postFlashClick();
    var err = validate_program_inputs();
    if (err != "success") {
        const alertMsg = document.getElementById("alertmsg");
        alertMsg.innerHTML = "<strong>" + err + "</strong>";
        alertDiv.style.display = "block";
        setTimeout(() => {
            alertDiv.style.display = "none";
        }, 3000);
        programButton.disabled = false;
        postFlashDone();
        return;
    }
    progressMsgDIY.style.display = "inline";
    let fileArr = [];
    let offset = 0x1000;
    var rowCount = table.rows.length;
    var row;
    for (let index = 1; index < rowCount; index ++) {
        row = table.rows[index];
        var offSetObj = row.cells[0].childNodes[0];
        offset = parseInt(offSetObj.value);

        var fileObj = row.cells[1].childNodes[0];
       
        fileArr.push({data:fileObj.data, address:offset});
    }
    clearAppInfoHistory();
    $('#v-pills-console-tab').click();
    try {
        const flashOptions = {
            fileArray : fileArr,
            flashSize: "keep",
            flashMode: undefined,
            flashFreq: undefined,
            eraseAll: false,
            compress: true,
        };
        await esploader.write_flash(flashOptions);
        postFlashDone();
        terminalContainer.classList.remove("fade-in-down");
    } catch (e) {
    }
}

async function downloadAndFlash(fileURL) {
    let data = await utilities.getImageData(fileURL);
    try {
        if (data !== undefined) {
            $('#v-pills-console-tab').click();
            const flashOptions = {
                fileArray : [{data:data, address:0x0000}],
                flashSize: "keep",
                flashMode: undefined,
                flashFreq: undefined,
                eraseAll: false,
                compress: true,
            };
            await esploader.write_flash(flashOptions);
        }
    } catch (e) {
    }
}


// Based on the configured App store links, show the respective download links.
function buildAppLinks(){
    let hrElement = document.getElementById("preview_body").querySelector("hr");
    hrElement.style.display = "block";
    let defaultAppURLsHTML = "Note: You can download phone app from the app store and interact with your device. Scan the QRCode to access the respective apps.";
    let appURLsHTML = "";
    let setupPayloadInfo = "To set up the device, use a supported phone app to scan the QRCode located on the rightmost side.";

    if(android_app_url){
        new QRCode(document.getElementById("qrcodeAndroidApp"), {
            text: android_app_url,
            width: 128,
            height: 128,
            colorDark : "#000000",
            colorLight : "#ffffff",
	        correctLevel : QRCode.CorrectLevel.H
            });

        $("#androidAppLogo").html("<a href='" + android_app_url + "' target='_blank'><img src='./assets/gplay_download.png' height='50' width='130'></a>");

        new QRCode(document.getElementById("qrcodeAndroidAppQS"), {
            text: android_app_url,
            width: 128,
            height: 128,
            colorDark : "#000000",
            colorLight : "#ffffff",
	        correctLevel : QRCode.CorrectLevel.H
            });

        $("#androidAppLogoQS").html("<a href='" + android_app_url + "' target='_blank'><img src='./assets/gplay_download.png' height='50' width='130'></a>");
        appURLsHTML = defaultAppURLsHTML;
    }

    if(ios_app_url){
        new QRCode(document.getElementById("qrcodeIOSApp"), {
            text: ios_app_url,
            width: 128,
            height: 128,
            colorDark : "#000000",
            colorLight : "#ffffff",
	        correctLevel : QRCode.CorrectLevel.H
            });

        $("#iosAppLogo").html("<a href='" + ios_app_url + "' target='_blank'><img src='./assets/appstore_download.png' height='50' width='130'></a>");

        new QRCode(document.getElementById("qrcodeIOSAppQS"), {
            text: ios_app_url,
            width: 128,
            height: 128,
            colorDark : "#000000",
            colorLight : "#ffffff",
	        correctLevel : QRCode.CorrectLevel.H
            });

        $("#iosAppLogoQS").html("<a href='" + ios_app_url + "' target='_blank'><img src='./assets/appstore_download.png' height='50' width='130'></a>");
        appURLsHTML = defaultAppURLsHTML;
    }

    if (setup_qrcode_payload) {
        new QRCode(setupQRCodeContainer, {
            text: setup_qrcode_payload,
            width: 128,
            height: 128,
            colorDark : "#000000",
            colorLight : "#ffffff",
	        correctLevel : QRCode.CorrectLevel.H
            });

        new QRCode(setupQRCodeContainerQS, {
            text: setup_qrcode_payload,
            width: 128,
            height: 128,
            colorDark : "#000000",
            colorLight : "#ffffff",
	        correctLevel : QRCode.CorrectLevel.H
            });

        if (setup_payload_logo_url) {
            setupLogoContainer.innerHTML = `<img src=${setup_payload_logo_url} height='50' width='130' />`;
            setupLogoContainerQS.innerHTML = `<img src=${setup_payload_logo_url} height='50' width='130' />`;
        } else {
            let emptyPayloadLogoCSS = `position:relative; top:50px`
            setupQRCodeContainer.style.cssText = emptyPayloadLogoCSS;
            setupQRCodeContainerQS.style.cssText = emptyPayloadLogoCSS;
        }

        document.getElementById("setupPayloadInfoText").innerText = setupPayloadInfo;
        document.getElementById("setupPayloadInfoTextQS").innerText = setupPayloadInfo;

    } else {
        setupPayloadRow.style.display = "none";
        setupPayloadRowQS.style.display = "none";
    }

    if(appURLsHTML === defaultAppURLsHTML){
        $("#progressMsgQS").html("Firmware Image flashing is complete.<br /><br />" + appURLsHTML);
        $("#appDownloadLink").html(appURLsHTML);
    }else{
        $("#progressMsgQS").html("Firmware Image flashing is complete. ");
        hrElement.style.display = "none";
    }
}

function cleanUpOldFlashHistory() {
    $("#androidAppLogo").html("");
    $("#androidAppLogoQS").html("");
    $("#iosAppLogo").html("");
    $("#iosAppLogoQS").html("");
    $("#progressMsgQS").html("<i>This may take a short while. Check console for the progress</i>");
    $("#qrcodeAndroidApp").html("");
    $("#qrcodeAndroidAppQS").html("");
    $("#qrcodeIOSApp").html("");
    $("#qrcodeIOSAppQS").html("");
    $("#setupLogoContainer").html("");
    $("#setupLogoContainerQS").html("");
    $("#setupPayloadInfoText").text("");
    $("#setupPayloadInfoTextQS").text("");
    $("#setupQRCodeContainer").html("");
    $("#setupQRCodeContainerQS").html("");
    setupQRCodeContainer.style.cssText = "";
    setupQRCodeContainerQS.style.cssText = "";

}

function clearAppInfoHistory(triggeringAction = "") {
    switch (triggeringAction) {
        case "handleFlashCleanup":
            appInfoContainer.classList.remove("slide-up", "bounce");
            terminalContainer.classList.remove("slide-right");
            break;
        default:
            appInfo.innerHTML = "";
            appInfoContainer.style.display = "none";
            appInfoContainer.classList.remove("slide-up", "bounce");
            terminalContainer.classList.add("col-12", "fade-in-down");
            terminalContainer.classList.remove("col-6", "slide-right");
            break;
    }
}

flashButton.onclick = async () => {
    if(chipSetsRadioGroup.querySelectorAll("input[type=radio]:checked").length!== 0){
        let flashFile = $("input[type='radio'][name='chipType']:checked").val();
        var file_server_url = config.firmware_images_url;
    
        progressMsgQS.style.display = "inline";
    
        cleanUpOldFlashHistory();
        clearAppInfoHistory();
        postFlashClick();
        await downloadAndFlash(file_server_url + flashFile);

        if (markdown_payload_url) {
            let response = await fetch(markdown_payload_url);
            let mdContent = await response.text();
            let htmlText = utilities.mdToHtmlConverter(mdContent);

            appInfo.innerHTML = htmlText;
            appInfoContainer.style.display = "block";
            appInfoContainer.classList.add("slide-up");
            terminalContainer.classList.remove("col-12", "fade-in-down");
            terminalContainer.classList.add("col-6", "slide-right");

            setTimeout(() => {
                appInfoContainer.classList.add("bounce");
            }, 2500);

            setTimeout(() => {
                clearAppInfoHistory("handleFlashCleanup");
            }, 5000);

            utilities.resizeTerminal(fitAddon);
        }

        buildAppLinks();
        $("#statusModal").click();
        esploader.status = "started";
        postFlashDone();
        terminalContainer.classList.remove("fade-in-down");
    }else{
        let previousState = lblConnTo.innerHTML;
        let alertChipsetSelectMsg = `<b><span style="color:red">Unable to flash device. Please ensure that chipset type is selected before flashing.</span></b>`;
        lblConnTo.innerHTML = alertChipsetSelectMsg;
        window.scrollTo(0,0);
        setTimeout(() => {
            lblConnTo.innerHTML = previousState;
        }, 3000);
    }
}
let postFlashClick = () => {
    flashButton.disabled = true;
    consoleStartButton.disabled = true;
    programButton.disabled = true;
    eraseButton.disabled = true;
  };
  let postFlashDone = () => {
    flashButton.disabled = false;
    consoleStartButton.disabled = false;
    programButton.disabled = false;
    eraseButton.disabled = false;
  };
/*
connectPreview.onclick = async () => {
    await connectToDevice();
    if (connected) {
        $('#connectPreview').prop("disabled", true)
        $('#flashCustom').prop("value", "Flash Device: " + chip);
        $('#flashCustom').prop("disabled", false);
    }
}

flashCustom.onclick = async () => {
    if(connected) {
        if (chip != 'default'){
            if (config.esp_chipset_type.toLowerCase() === chip.split('-')[0].toLowerCase()) {
                await downloadAndFlash(config.firmware_images_url)
            }
            else
                alert('Incompatible chipset for the firmare!');
        }
        else
            alert('Chipset type not recognizable!');
    }
    postConnectControls();
}*/

$( window ).resize(function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => utilities.resizeTerminal(fitAddon), 300);
});

function removeClassesOnMediaQuery() {
    const mediaQuery = window.matchMedia("(max-width: 992px)");
    function handleMediaQueryChange(mediaQuery) {
        if (mediaQuery.matches) {
            appInfoContainer.classList.remove("col-6");
            terminalContainer.classList.remove("col-6");
            consolePageWrapper.classList.add("flex-column-reverse");
        } else {
            appInfoContainer.classList.add("col-6");
            terminalContainer.classList.add("col-6");
            consolePageWrapper.classList.remove("flex-column-reverse");
        }
    }
    handleMediaQueryChange(mediaQuery);
    mediaQuery.addListener(handleMediaQueryChange);
}

removeClassesOnMediaQuery();