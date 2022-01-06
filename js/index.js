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
const consoleDiv = document.getElementById("console");
const lblConnTo = document.getElementById("lblConnTo");
const table = document.getElementById('fileTable');
const alertDiv = document.getElementById('alertDiv');
const settingsWarning = document.getElementById("settingsWarning");
const progressMsgQS = document.getElementById("progressMsgQS");
const progressMsgDIY = document.getElementById("progressMsgDIY");
const deviceTypeSelect = document.getElementById("device");
const frameworkSelect = document.getElementById("frameworkSel");
const chipSetsRadioGroup = document.getElementById("chipsets");

import { Transport } from './webserial.js'
import { ESPLoader } from './ESPLoader.js'

let term = new Terminal({cols:100, rows:25, fontSize: 14});
term.open(terminal);

let device = null;
let transport;
let chip = "default";
let chipDesc = "default"
let esploader;
let file1 = null;
let connected = false;
let ios_app_url = "";
let android_app_url = "";

disconnectButton.style.display = "none";
eraseButton.style.display = "none";
var config = [];
var isDefault = true;

// Build the Quick Try UI using the config toml file. If external path is not specified, pick up the default config
async function buildQuickTryUI() {
    const urlParams = new URLSearchParams(window.location.search);
    var tomlFileURL = urlParams.get('flashConfigURL');
    if(!tomlFileURL)
        tomlFileURL = document.location.href + "/config/default_config.toml";
    else
        isDefault = false;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', tomlFileURL, true);
    xhr.send();
    xhr.onload = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            config = toml.parse(xhr.responseText);

            if(!isDefault) {
                $("#qtLabel").html("Choose from the firmware images listed below. <Br> You have chosen to try the firmware images from an <b><u>external source</u> - "
                                            + tomlFileURL + "</b>");
            }
            try {
                if (parseFloat(config["esp_toml_version"]) === 1.0)
                    buildQuickTryUI_v1_0();

                else
                    alert("Unsupported config version used!!")
            }
            catch (err){
                alert ("Unsupported config version used -" + err.message)
            }

            /*
            const frameworks = config["esp_frameworks"];
            if (frameworks) {
                frameworkSelect.innerHTML = "";
                frameworks.forEach(framework => {
                    //var frameworkOption = framework.split(':');
                    var option = document.createElement("option");
                    option.value = framework.toLowerCase();
                    option.text = framework;
                    frameworkSelect.appendChild(option);
                });
            }*/

            //if(frameworkSelect)
            //{
                //populateDeviceTypes(config[frameworkSelect.value]);
                //populateSupportedChipsets(config[frameworkSelect.value]);
            //}

            return config;
        }
    }
}


//Parsing of toml based on v1.0 and builing UI accordingly.
function buildQuickTryUI_v1_0() {
    const supported_apps = config["supported_apps"]
    if(supported_apps) {
        addDeviceTypeOption(supported_apps);
        populateSupportedChipsets(config[supported_apps[0]]);
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
    supportedChipSets.forEach(chipset => {
        //var chipKV = chipset.split(":");
        var div = document.createElement("div");
        div.setAttribute("class", "form-check-inline");

        var lblElement = document.createElement("label");
        lblElement.setAttribute("class", "form-check-label");
        lblElement.setAttribute("for", "radio-" + chipset);
        lblElement.innerHTML = chipset + "&nbsp;";

        var inputElement = document.createElement("input");
        inputElement.setAttribute("type", "radio");
        inputElement.setAttribute("class", "form-check-input");
        inputElement.name = "chipType";
        inputElement.id = "radio-" + chipset;
        inputElement.value = deviceConfig["image." + chipset.toLowerCase()]
        if (chipset.toLowerCase() === chip.toLowerCase())
            inputElement.checked = true;

        lblElement.appendChild(inputElement);

        div.appendChild (lblElement);

        chipSetsRadioGroup.appendChild(div);

        i++;
    });
}

function setAppURLs(appConfig) {
    ios_app_url = appConfig.ios_app_url;
    android_app_url = appConfig.android_app_url;
}

$('#frameworkSel').on('change', function() {
    //populateDeviceTypes(config[frameworkSelect.value]);
    addDeviceTypeOption(config["supported_apps"], frameworkSelect.value);
    setAppURLs(frameworkSelect.value)
});

$('#device').on('change', function() {
    populateSupportedChipsets(config[deviceTypeSelect.value]);
    setAppURLs(config[deviceTypeSelect.value])
});

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})

function convertUint8ArrayToBinaryString(u8Array) {
	var i, len = u8Array.length, b_str = "";
	for (i=0; i<len; i++) {
		b_str += String.fromCharCode(u8Array[i]);
	}
	return b_str;
}

function convertBinaryStringToUint8Array(bStr) {
	var i, len = bStr.length, u8_array = new Uint8Array(len);
	for (var i = 0; i < len; i++) {
		u8_array[i] = bStr.charCodeAt(i);
	}
	return u8_array;
}

function handleFileSelect(evt) {
    var file = evt.target.files[0];
    var reader = new FileReader();

    reader.onload = (function(theFile) {
        return function(e) {
            file1 = e.target.result;
            evt.target.data = file1;
        };
    })(file);

    reader.readAsBinaryString(file);
}


document.getElementById('selectFile1').addEventListener('change', handleFileSelect, false);

function _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function connectToDevice() {
    let chipDetails = null;
    if (device === null) {
        device = await navigator.serial.requestPort({
            filters: [{ usbVendorId: 0x10c4 }]
        });
        transport = new Transport(device);
    }

    try {
        esploader = new ESPLoader(transport, baudrates.value, term);
        connected = true;

        chipDetails = await esploader.main_fn();
        if (chipDetails) {
            chip = chipDetails[1];
            chipDesc = chipDetails[0];
        }

        await esploader.flash_id();
    } catch(e) {
    }

}

function postConnectControls() {
    if(chipDesc !== "default")
        lblConnTo.innerHTML = "<b><span style='color:#17a2b8'>Connected to device: </span>" + chipDesc + "</b>";
    else
        lblConnTo.innerHTML = "<b><span style='color:red'>Unable to detect device. Please ensure the device is not connected in another application</span></b>";
    lblConnTo.style.display = "block";
    $("#baudrates").prop("disabled", true);
    $("#flashButton").prop("disabled", false);
    $("#programButton").prop("disabled", false);
    $("#consoleStartButton").prop("disabled", false);
    settingsWarning.style.display = "initial";
    connectButton.style.display = "none";
    disconnectButton.style.display = "initial";
    eraseButton.style.display = "initial";
    filesDiv.style.display = "initial";
    $('input:radio[id="radio-' + chip + '"]').attr('checked', true);
}

connectButton.onclick = async () => {
    if(!connected)
        await connectToDevice();

    console.log("Settings done for :" + chip);
    postConnectControls();

}

resetButton.onclick = async () => {
    resetMessage.style.display = "none";
    await transport.setDTR(false);
    await new Promise(resolve => setTimeout(resolve, 100));
    await transport.setDTR(true);
    consoleStartButton.style.display = "block";
}

eraseButton.onclick = async () => {
    eraseButton.disabled = true;
    $('#v-pills-console-tab').click();
    await esploader.erase_flash();
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
    element2.addEventListener('change', handleFileSelect, false);
    cell2.appendChild(element2);
    
    // Column 3  - Remove File
    var cell3 = row.insertCell(2);
    var element3 = document.createElement("input");
    element3.type = "button";
    var btnName = "button" + rowCount;
    element3.name = btnName;
    element3.setAttribute('class', "btn");
    element3.setAttribute('value', 'Remove');
    element3.onclick = function() {
            removeRow(btnName);
    }
    cell3.appendChild(element3);
}

function removeRow(btnName) {
    var rowCount = table.rows.length;
    for (var i = 0; i < rowCount; i++) {
        var row = table.rows[i];
        var rowObj = row.cells[2].childNodes[0];
        if (rowObj.name == btnName) {
            table.deleteRow(i);
            rowCount--;
        }
    }
}

// to be called on disconnect - remove any stale references of older connections if any
function cleanUp() {
    device = null;
    transport = null;
    this.chip = null;
}

disconnectButton.onclick = async () => {
    if(transport)
        await transport.disconnect();

    term.clear();
    connected = false;
    $("#baudrates").prop("disabled", false);
    $("#flashButton").prop("disabled", true);
    $("#programButton").prop("disabled", true);
    $("#consoleStartButton").prop("disabled", true);
    settingsWarning.style.display = "none";
    connectButton.style.display = "initial";
    disconnectButton.style.display = "none";
    eraseButton.style.display = "none";
    lblConnTo.style.display = "none";
    alertDiv.style.display = "none";
    cleanUp();
};

consoleStartButton.onclick = async () => {
    if (device === null) {
        device = await navigator.serial.requestPort({
            filters: [{ usbVendorId: 0x10c4 }]
        });
        transport = new Transport(device);
    }
    resetMessage.style.display = "block";
    consoleStartButton.style.display = "none";

    await transport.disconnect();
    await transport.connect();

    while (true) {
        let val = await transport.rawRead();
        if (typeof val !== 'undefined') {
            term.write(val);
        } else {
            break;
        }
    }
    console.log("quitting console");
}


function validate_program_inputs() {
    let offsetArr = []
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
            return "Offset field in row " + index + " is not a valid address!"
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
    return "success"
}

programButton.onclick = async () => {
    var err = validate_program_inputs();
    if (err != "success") {
        const alertMsg = document.getElementById("alertmsg");
        alertMsg.innerHTML = "<strong>" + err + "</strong>";
        alertDiv.style.display = "block";
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
    esploader.write_flash({fileArray: fileArr, flash_size: 'keep'});
    $('#v-pills-console-tab').click();
}

async function downloadAndFlash(fileURL) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', fileURL, true);
    xhr.responseType = "blob";
    xhr.send();
    xhr.onload = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var blob = new Blob([xhr.response], {type: "application/octet-stream"});
            var reader = new FileReader();
            reader.onload = (function(theFile) {
                return function(e) {
                    $('#v-pills-console-tab').click();
                    esploader.write_flash({fileArray: [{data:e.target.result, address:0x0000}], flash_size: 'keep'});
                };
            })(blob);
            reader.readAsBinaryString(blob);
        }
    }
}


// Based on the configured App store links, show the respective download links.
function buildAppLinks(){
    let appURLsHTML = "You can download phone app from the app store and interact with your device. <br>";
    if(android_app_url !== "")
        appURLsHTML += "<a href='" + android_app_url + "' target='_blank'><img src='./assets/gplay_download.png' height='60' width='150'></a>"
    
    if(ios_app_url)
        appURLsHTML += "<a href='" + ios_app_url + "' target='_blank'><img src='./assets/appstore_download.png' height='60' width='150'></a>"
    
    return appURLsHTML;
}


flashButton.onclick = async () => {
    let flashFile = $("input[type='radio'][name='chipType']:checked").val();
    var file_server_url = config.firmware_images_url;

    progressMsgQS.style.display = "inline";

    downloadAndFlash(file_server_url + flashFile);

    $("#progressMsgQS").html(buildAppLinks());
    $("#appDownloadLink").html(buildAppLinks());
    while (esploader.status === "started") {
        await _sleep(3000);
        console.log("waiting for flash write to complete ...");
    }
    $("#statusModal").click();
    esploader.status = "started";
}

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
}
