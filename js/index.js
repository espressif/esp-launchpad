const baudrates1 = document.getElementById("baudrates1");
const baudrates2 = document.getElementById("baudrates2");

// UART-1 & UART-2 connect buttons
const connectButton1 = document.getElementById("connectButton1");
const connectButton2 = document.getElementById("connectButton2");

// UART-1 & UART-2 disconnect buttons
const disconnectButton1 = document.getElementById("disconnectButton1");
const disconnectButton2 = document.getElementById("disconnectButton2");

// UART-1 & UART-2 terminals
const terminal1 = document.getElementById("terminal1");
const terminal2 = document.getElementById("terminal2");

// device reset and confirm buttons
const resetDeviceButton = document.getElementById("resetDeviceButton");
const confirmResetButton = document.getElementById("confirmResetButton");
const consoleButton = document.getElementById("console");

const eraseButton = document.getElementById("eraseButton");
const programButton = document.getElementById("programButton");
const filesDiv = document.getElementById("files");
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

const diyButton = document.getElementById("diy")
let resizeTimeout = false;

// Implementaion of serialBasic terminal1 start

const commandform = document.getElementById("commandform");
const addLine = document.getElementById("addLine");
const carriageReturn = document.getElementById("carriageReturn");
const echoOn = document.getElementById("echoOn");
const command = document.getElementById("command");
const sendButton1 = document.getElementById("sendButton1");
const clearButton1 = document.getElementById("clearButton1");

const addLinedefault = document.getElementById("addLinedefault");
const carriageReturndefault = document.getElementById("carriageReturndefault");
const echoOndefault = document.getElementById("echoOndefault");

let writer2 = undefined,
  reader2 = undefined,
  writer1 = undefined,
  reader1 = undefined,
  historyIndex = -1;
const commandHistory = [];

// Implementaion of serialBasic terminal1 end

// Implementation of console per UART
const entrybuttons = document.getElementById("entrybuttons");
const flashfirmwarebutton = document.getElementById("flashfirmwarebutton");
const consoleworkbutton = document.getElementById("consoleworkbutton");

let isFlash = undefined;
let isConsoleWork = undefined;

import * as esptooljs from "../node_modules/esptool-js/bundle.js";
const ESPLoader = esptooljs.ESPLoader;
const Transport = esptooljs.Transport;

const usbPortFilters = [
    { usbVendorId: 0x10c4, usbProductId: 0xea60 }, /* CP2102/CP2102N */
    { usbVendorId: 0x0403, usbProductId: 0x6010 }, /* FT2232H */
    { usbVendorId: 0x303a, usbProductId: 0x1001 }, /* Espressif USB_SERIAL_JTAG */
    { usbVendorId: 0x303a, usbProductId: 0x1002 }, /* Espressif esp-usb-bridge firmware */
    { usbVendorId: 0x303a, usbProductId: 0x0002 }, /* ESP32-S2 USB_CDC */
    { usbVendorId: 0x303a, usbProductId: 0x0009 }, /* ESP32-S3 USB_CDC */
];

const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)

// Terminal for UART-1 start
let term1 = new Terminal({ cols: getTerminalColumns(), rows: 23, fontSize: 14 });
let fitAddon1 = new FitAddon.FitAddon();
term1.loadAddon(fitAddon1);
term1.open(terminal1);
fitAddon1.fit();
// Terminal for UART-1 end

// Terminal for UART-2 start
let term2 = new Terminal({
  cols: getTerminalColumns(),
  rows: 23,
  fontSize: 14,
});
let fitAddon2 = new FitAddon.FitAddon();
term2.loadAddon(fitAddon2);
term2.open(terminal2);
fitAddon2.fit();
// Terminal for UART-2 end

terminal1.style.display = "none";
terminal2.style.display = "none";
commandform.style.display = "none";

let device1 = null;
let device2 = null;
let transport1 = undefined;
let transport2 = undefined;
let connected1 = false;
let connected2 = false;

//chip detail required for flashing of chips with esploader
let chip = "default";
let chipDesc = "default"
let esploader;
let file1 = null;
let ios_app_url = "";
let android_app_url = "";

disconnectButton1.style.display = "none";
disconnectButton2.style.display = "none";
eraseButton.style.display = "none";
var config = [];
var isDefault = true;

// changes as consolePerUART start
entrybuttons.style.display = "none";
let consoleworkerbaudrate = 115200;

const entrybuttonslabel = document.getElementById("entrybuttonslabel");
const commandformdefault = document.getElementById("commandformdefault");
const commanddefault = document.getElementById("commanddefault");

entrybuttonslabel.style.display = "none";
commandformdefault.style.display = "none";
programButton.disabled = true;

const sendButton2 = document.getElementById("sendButton2");
const clearButton2 = document.getElementById("clearButton2");

let deviceHistoryIndex = -1;
const deviceCommandHistory = [];

let portIsAlredyOpenError =
  "Failed to execute 'open' on 'SerialPort': The port is already open.";
let errorfromtransport2 = undefined;
// changes as consolePerUART end
let espLoaderTerminal = {
    clean() {
      term1.clear();
    },
    writeLine(data) {
      term1.writeln(data);
    },
    write(data) {
      term1.write(data)
    }
  }
//   $('#chipsets').on('change', function() {
//     console.log(chipSetsRadioGroup.getElementsByTagName('input'))
// });
let partsArray = undefined
let addressesArray = undefined
function build_DIY_UI(application){
  let chipType = undefined
  let chipInConfToml = undefined
  let imageString = undefined;
  let addressString = undefined
  if(chip === "default" && config["multipart"]){
    chipInConfToml = config["chip"]
  }
  let chipTypeElement = chipSetsRadioGroup.querySelector("input[type='radio'][name='chipType']:checked")
  if(chipTypeElement){

    if(chipTypeElement.value)
       chipType = chipTypeElement.parentNode.innerText.trim()
  }
  console.log(chipType)
  if(document.getElementById("row0") !== null && config["multipart"])
    document.getElementById("row0").remove()
  console.log(chipInConfToml + "chip")
  console.log(chipType + "chipType")
//  if(chip !== "default" && chip === chipType){

   console.warn("Hey....")
   if(chip==="default" && chipInConfToml !== undefined){
     imageString = "image." + chipInConfToml.toLowerCase() + ".parts"
     addressString = "image." + chipInConfToml.toLowerCase() + ".addresses"
    }else{
      imageString = "image." + chip.toLowerCase() + ".parts"
      addressString = "image." + chip.toLowerCase() + ".addresses"  
   }
   console.log( imageString + ".parts")
   partsArray = config[application][imageString]
   addressesArray = config[application][addressString]
   console.log(partsArray,addressesArray)
  //  let rowCount = 0
  if(partsArray){

    partsArray.forEach(function(curr,index){
 
      var rowCount = table.rows.length;
      console.log(rowCount)
      var row = table.insertRow(rowCount);
      console.log(row)
      //Column 1 - Offset
      var cell1 = row.insertCell(0);
      var element1 = document.createElement("input");
      element1.type = "text";
      element1.id = "offset" + rowCount;
      element1.setAttribute('value',addressesArray[index] );
      cell1.appendChild(element1);
      
      // Column 2 - File selector
      var cell2 = row.insertCell(1);
      var element2 = document.createElement("p");
      element2.innerText = partsArray[index]
      cell2.appendChild(element2);
      
      // Column 3  - Remove File
      var cell3 = row.insertCell(2);
      var element3 = document.createElement("input");
      element3.type = "image";
      element3.src = "assets/icons/remove.png";
      var btnName = "rem-" + rowCount;
      element3.name = btnName;
      element3.onclick = function() {
              removeRow(btnName);
              return false;
      }
      cell3.appendChild(element3);
    })
  }
//  }
//  if(chip !== chipType){
//   diyButton.click()
//  }

}
flashfirmwarebutton.addEventListener("click", async function () {
  isFlash = true;
  isConsoleWork = false;
  entrybuttons.style.display = "none";
  entrybuttonslabel.style.display = "none";
  if (isFlash && !isConsoleWork) {
    try {
      esploader = new ESPLoader(transport1, baudrates1.value, espLoaderTerminal);
      connected1 = true;
      chipDesc = await esploader.main_fn();
      chip = esploader.chip.CHIP_NAME;
      await esploader.flash_id();
    } catch (e) {
    }
  }
  postDevice1ConnectControls();
  commanddefault.disabled = true;
  sendButton1.disabled = true
  console.log(config["multipart"])
  if(config["multipart"]){
    // build_DIY_UI(deviceTypeSelect.value);
    diyButton.click()
    $("#programwrapper")
    .tooltip()
    .attr(
      "data-bs-original-title",
      "This will flash the firmware image on your device"
    );
    
  }
});

async function consoleWorker() {
  while (device1.readable) {
    if (!device1.readable.locked) reader1 = device1.readable.getReader();

    try {
      while (true) {
        const { value, done } = await reader1.read();
        if (done) {
          reader1.releaseLock();
          reader1 = undefined
          break;
        }
        if (value) {
          term1.write(value);
        }
      }
    } catch (error) {
    }
  }
}
let radioButtonsArray = undefined;
const consoleModeclick=function(){
  deviceTypeSelect.disabled = true
  // console.log( Array.from(document.querySelectorAll('input[type="radio"]')))
  radioButtonsArray =  Array.from(document.querySelectorAll('input[type="radio"]'))
  radioButtonsArray.forEach((curr)=>{
    curr.disabled = true
  })
  if( document.getElementById("selectFile1"))
    document.getElementById("selectFile1").disabled = true
  // document.getElementById("offset1").disabled = true
  document.getElementById("addFile").disabled = true
}
const consoleModeDone=function(){
  deviceTypeSelect.disabled = false
  radioButtonsArray.forEach((curr)=>{
    curr.disabled = false
  })
  radioButtonsArray = undefined;
  document.getElementById("selectFile1").disabled = false
  document.getElementById("offset1").disabled = false
  document.getElementById("addFile").disabled = false
}

consoleworkbutton.addEventListener("click", async function () {
  isConsoleWork = true;
  isFlash = false;
  if(config["multipart"]){
    $("#programwrapper")
    .tooltip()
    .attr(
      "data-bs-original-title",
      "This will flash the firmware image on your device"
    );
    
  }
  entrybuttons.style.display = "none";
  entrybuttonslabel.style.display = "none";
  flashButton.disabled = true;
  consoleModeclick();
  try {
    consoleworkerbaudrate = baudrates2.value ? baudrates2.value : 115200;
    await transport1.connect( consoleworkerbaudrate );
    postDevice1ConnectControls();
    entrybuttonslabel.style.display = "none";
    commanddefault.disabled = true;
    sendButton1.disabled = true
    consoleButton.click();
    await consoleWorker();
  } catch (error) {
    isConsoleWork = false;
  }
});
consoleButton.addEventListener("click",function(){
  let initiallblConnToIextContent = lblConnTo.innerHTML
  lblConnTo.innerHTML = `<b><span style='color:red'>Click on Reset Device button after enabled.</span></b>`;
  setTimeout(() => {
    lblConnTo.innerHTML =initiallblConnToIextContent
  }, 2000);
})
// Build the Quick Try UI using the config toml file. If external path is not specified, pick up the default config
async function buildQuickTryUI() {
  const urlParams = new URLSearchParams(window.location.search);
  var tomlFileURL = urlParams.get("flashConfigURL");
  if (!tomlFileURL)
    tomlFileURL = document.location.href + "config/default_config.toml";
  else isDefault = false;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', tomlFileURL, true);
    xhr.send();
    xhr.onload = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            config = toml.parse(xhr.responseText);
            console.log(config)
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
    if(config["multipart"]){
      build_DIY_UI(deviceTypeSelect.value)
      diyButton.click()
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
        console.log(config["multipart"] )
        console.log(config)
        if(config["multipart"] === true)
        {
          console.warn("Hey....")
          let imageString = "image." + chipset.toLowerCase()
          console.log( imageString + ".parts")
          let partsArray = deviceConfig[imageString + ".parts"]
          console.log(partsArray)
          inputElement.value = partsArray[0]
          // build_DIY_UI()
        }else{
          inputElement.value = deviceConfig["image." + chipset.toLowerCase()]
        }
        if(chip)
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

function ClearPreviousRowsOfDIY()
{
  console.log("inside Clear Previous rows od DIY")
  let rowCount = table.rows.length;
  console.log(rowCount)
  while(rowCount>1){

    table.deleteRow(rowCount-1);
    rowCount--;
  }
  }


$('#device').on('change', function() {
    populateSupportedChipsets(config[deviceTypeSelect.value]);
    setAppURLs(config[deviceTypeSelect.value])
    if(config["multipart"]){

      ClearPreviousRowsOfDIY()
      build_DIY_UI(deviceTypeSelect.value)
    }
});
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
    $('[data-toggle="tooltip"]').tooltip({
      trigger: "manual"
  });
  
  $('[data-toggle="tooltip"]').on('mouseleave', function () {
      $(this).tooltip('hide');
  });
  
  $('[data-toggle="tooltip"]').on('mouseenter', function () {
      $(this).tooltip('show');
  });
  
  $('[data-toggle="tooltip"]').on('click', function () {
      $(this).tooltip('hide');
  });
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

async function connectToDevice1() {
  if (device1 === null) {
    device1 = await navigator.serial.requestPort({
      filters: usbPortFilters
    });
    transport1 = new Transport(device1);
  }
}

function postDevice1ConnectControls() {
  if (chip === "default" && isFlash) {
    lblConnTo.innerHTML =
      "<b><span style='color:red'>Unable to detect device,see if secure boot mode is off otherwise please refersh page manually or click navbar refresh button and try again...</span></b>";
    disconnectButton1.children[1].textContent = "Refresh";
    disconnectButton1.children[0].attributes.src.value =
      "assets/icons/refresh.png";
    terminal1.style.display = "none";
    commandformdefault.style.display = "none";
  } else if (chip !== "default" && isFlash && !isConsoleWork) {
    lblConnTo.innerHTML =
      "<b><span style='color:#17a2b8'>Connected to device: </span>" +
      chipDesc +
      "</b>";
    programButton.disabled = false;
    eraseButton.style.display = "initial"
    eraseButton.disabled = false;

  } else if (chip === "default" && !isFlash && isConsoleWork) {
    lblConnTo.innerHTML =
      "<b><span style='color:red'>Connected to device. You are in console mode. </span>";
    ("</b>");
    eraseButton.style.display = "initial"
    eraseButton.disabled = true
  }
  lblConnTo.style.display = "block";
  $("#baudrates1").prop("disabled", true);
  if (isFlash && !isConsoleWork) $("#flashButton").prop("disabled", false);
  else $("#flashButton").prop("disabled", true);

  $("#flashWrapper")
    .tooltip()
    .attr(
      "data-bs-original-title",
      "This will download and flash the firmware image on your device"
    );

  terminal1.style.display = "block";
  commandformdefault.style.display = "block";
  resetDeviceButton.disabled = false;
  ensureConnect.style.display = "none";

  settingsWarning.style.display = "flex";
  settingsWarning.style.justifyContent = "center";
  settingsWarning.style.flexWrap = "wrap";

  connectButton1.style.display = "none";
  disconnectButton1.style.display = "flex";
  filesDiv.style.display = "initial";
  $('input:radio[id="radio-' + chip + '"]').attr("checked", true);
}

connectButton1.onclick = async () => {
  if (!connected1) await connectToDevice1();

  connectButton1.style.display = "none";
  disconnectButton1.removeAttribute("style");
  entrybuttons.removeAttribute("style");
  entrybuttons.classList.add("entrybuttons");

  entrybuttonslabel.removeAttribute("style");
  entrybuttonslabel.classList.add("entrybuttonslabel");
  $("#flashWrapper")
  .tooltip()
  .attr(
    "data-bs-original-title",
    "Click on 'Set Baudrate For Flashing' Button"
  );
  if (config["multipart"]) {
    
    $("#programwrapper")
    .tooltip()
    .attr(
      "data-bs-original-title",
      "Click on 'Set Baudrate For Flashing' Button in Quickstart"
    );
    // diyButton.click()
  }
};

async function connectToDevice2() {
  if (device2 === null) {
    device2 = await navigator.serial.requestPort({
      filters: usbPortFilters
    });
    transport2 = new Transport(device2);
  }
}

function postDevice2ConnectControls(errorfromtransport2) {
  if (errorfromtransport2 === portIsAlredyOpenError) {
    let initiallblConnToIextContent = lblConnTo.innerHTML
    lblConnTo.innerHTML = `<b><span style='color:red'>The port is already open. Please select other port. </span></b>`;
    setTimeout(() => {
      lblConnTo.innerHTML =initiallblConnToIextContent
    }, 2000);
    commandform.style.display = "none";
    terminal2.style.display = "none";
    window.scrollTo(0, 0);
  }
  lblConnTo.style.display = "block";
  $("#baudrates2").prop("disabled", true);
  $("#flashButton").prop("disabled", true);
  $("#flashWrapper")
    .tooltip()
    .attr(
      "data-bs-original-title",
      "This will download and flash the firmware image on your device"
    );
  $("#programButton").prop("disabled", true);
  $("#consoleStartButton").prop("disabled", false);
  ensureConnect.style.display = "none";

  settingsWarning.style.display = "flex";
  settingsWarning.style.justifyContent = "center";
  settingsWarning.style.flexWrap = "wrap";
  if (errorfromtransport2 !== portIsAlredyOpenError) {
    lblConnTo.innerHTML =
      "<b><span style='color:red'>Connected to device. You are in console mode. </span>";
    ("</b>");
    connectButton2.style.display = "none";
    disconnectButton2.style.display = "initial";
    commandform.style.display = "block";
    terminal2.style.display = "block";
  }
}

connectButton2.onclick = async () => {
  errorfromtransport2 = undefined;
  if (!connected2) await connectToDevice2();

  try {
    await transport2.connect( baudrates2.value );
    connected2 = true;
  } catch (error) {
    connected2 = false;
    errorfromtransport2 = error.message;
    cleanUpDevice2();
  }
  
  postDevice2ConnectControls(errorfromtransport2);
  if(device2)
  {

    if (!device2.readable.locked) reader2 = device2.readable.getReader();
  }
};

// basicserialterminal functions start

// Merging two function of same functionality -> sendCommand() listenPort() apeendToTerminal()

async function sendCommand(device,writer,reader,term) {
  let commandToSend;
  let textEncoder = new TextEncoder();
  if (!device.writable.locked) writer = device.writable.getWriter();

  if(device === device1){
    commandToSend = commanddefault.value;
    deviceCommandHistory.unshift(commandToSend);
    deviceHistoryIndex = -1; // No history entry selected
    if (carriageReturndefault.checked == true) commandToSend = commandToSend + "\r";
    if (addLinedefault.checked == true) commandToSend = commandToSend + "\n";
    if (echoOndefault.checked == true) await appendToTerminal(term,"> " + commandToSend);
   commanddefault.value = "";
  } else{
  commandToSend = command.value;
  commandHistory.unshift(commandToSend);
  historyIndex = -1; // No history entry selected
  if (carriageReturn.checked == true) commandToSend = commandToSend + "\r";
  if (addLine.checked == true) commandToSend = commandToSend + "\n";
  if (echoOn.checked == true) await appendToTerminal(term,"> " + commandToSend);
  command.value = "";
}
  await writer.write(textEncoder.encode(commandToSend));
  if (commandToSend.trim().startsWith("\x03")) echo(false);
  writer.releaseLock();
  await listenPort(device,reader,term);
}

async function listenPort(device,reader,term) {
  try {
    while (device.readable) {
      if (!device.readable.locked) reader = device.readable.getReader();
  
      try {
          const { value, done } = await reader.read();
          if (done) {
            // Allow the serial port to be closed later.
            reader.releaseLock();
          }
          if (value) {
            await appendToTerminal(term,value);
        }
      } catch (error) {break}
    }
  } catch (error) {
  }

}

function getHistory(direction) {
  // Clamp the value between -1 and history length
  deviceHistoryIndex = Math.max(
    Math.min(deviceHistoryIndex + direction, deviceCommandHistory.length - 1),
    -1
  );
  if (deviceHistoryIndex >= 0) {
    commanddefault.value = deviceCommandHistory[deviceHistoryIndex];
  } else {
    commanddefault.value = "";
  }
  historyIndex = Math.max(
    Math.min(historyIndex + direction, commandHistory.length - 1),
    -1
  );
  if (historyIndex >= 0) {
    document.getElementById("command").value = commandHistory[historyIndex];
  } else {
    document.getElementById("command").value = "";
  }
}

async function appendToTerminal(term,newStuff) {
  term.write(newStuff);
}

command.addEventListener("keyup", async function (event) {
  if (event.code === "Enter") {
    await sendCommand(device2,writer2,reader2,term2)
  } else if (event.code === "ArrowUp") {
    // Key up
    getHistory(1);
  } else if (event.code === "ArrowDown") {
    // Key down
    getHistory(-1);
  }
});

command.addEventListener("keydown", (event) => {
  if (event.code === "Tab") {
    event.preventDefault();
  }
});
commanddefault.addEventListener("keyup", async function (event) {
  if (event.code === "Enter") {
    await sendCommand(device1,writer1,reader1,term1);
  } else if (event.code === "ArrowUp") {
    // Key up
    getHistory(1);
  } else if (event.code === "ArrowDown") {
    // Key down
    getHistory(-1);
  }
});

sendButton1.addEventListener("click", async function () {
  await sendCommand(device1,writer1,reader1,term1);
});
clearButton1.addEventListener("click", async function () {
  await TerminalClear(term1);
});
sendButton2.addEventListener("click", async function () {
  await sendCommand(device2,writer2,reader2,term2);
});
clearButton2.addEventListener("click", async function () {
  await TerminalClear(term2);
});

async function TerminalClear(term) {
  term.clear();
}
// basicserialterminal functions end

// disconnect buttons for UART-1 & UART-2
disconnectButton1.onclick = async () => {
  if (transport1) {
    if (reader1 !== undefined) {
      reader1.releaseLock();
      reader1 = undefined
    }
    try {
      
      if (device1) {
        await device1.close();
      }
    } catch (error) {
      console.log("hey")
      entrybuttons.style.display = "none";
      entrybuttonslabel.style.display = "none";
    }
  }

  terminal1.style.display = "none";
  commandformdefault.style.display = "none";

  commandform.style.display = "none";
  terminal2.style.display = "none";

  resetDeviceButton.disabled = true;
  term1.clear();
  connected1 = false;
  $("#baudrates1").prop("disabled", false);
  $("#baudrates2").prop("disabled", false);
  $("#flashButton").prop("disabled", true);
  $("#flashWrapper")
    .tooltip()
    .attr("data-bs-original-title", "Click on 'Connect' button in top Menu");
  $("#programwrapper")
   .tooltip()
    .attr("data-bs-original-title","Click on 'Connect' button in top Menu");
  $("#programButton").prop("disabled", true);
  $("#consoleStartButton").prop("disabled", true);
  settingsWarning.style.display = "none";
  connectButton1.style.display = "initial";
  disconnectButton1.style.display = "none";

  eraseButton.style.display = "none";
  lblConnTo.style.display = "none";
  alertDiv.style.display = "none";
  ensureConnect.style.display = "initial";
  cleanUpDevice1();
  if (connected2) disconnectButton2.click();
  if(isConsoleWork) consoleModeDone()
  isFlash = undefined
  isConsoleWork = undefined
};

disconnectButton2.onclick = async () => {
  if (transport2) {
    if (reader2 !== undefined) {
      reader2.releaseLock();

    }

    if (device2) {
      await device2.close();
    }
  }
  commandform.style.display = "none";
  terminal2.style.display = "none";

  term2.clear();

  connected2 = false;
  $("#baudrates1").prop("disabled", false);
  $("#flashButton").prop("disabled", true);
  $("#flashWrapper")
    .tooltip()
    .attr("data-bs-original-title", "Click on 'Connect' button in top Menu");
  $("#programButton").prop("disabled", true);
  $("#consoleStartButton").prop("disabled", true);
  settingsWarning.style.display = "none";

  connectButton2.style.display = "initial";
  disconnectButton2.style.display = "none";

  eraseButton.style.display = "none";
  alertDiv.style.display = "none";
  cleanUpDevice2();
};
// disconnect buttons for UART-1 & UART-2

// reset and confirm reset functionallity start
resetDeviceButton.onclick = async () => {
  commanddefault.disabled = false;
  sendButton1.disabled = false
  programButton.disabled = true
  eraseButton.disabled = true
  flashButton.disabled = true
  if(isConsoleWork && !isFlash)
  {
   $("#resetConfirmation").click();
   while (device1.readable) {
     if (!device1.readable.locked){
       console.log("inside device1 readable")
       reader1 = device1.readable.getReader()};

     try {
       while (true) {
         const { value, done } = await reader1.read();
         if (done) {
           // Allow the serial port to be closed later.
           reader1.releaseLock();
           reader1 = undefined
           break;
         }
         if (value) {
           term1.write(value);
         }
  }
    } catch (error) {}
  }
  }

  if(isFlash && !isConsoleWork)
  {
    $("#resetConfirmation").click();

    if (transport1) {
      if (reader1 !== undefined) {
        reader1.releaseLock();
        if (writer1 != undefined) writer1.releaseLock();
      }
      if (device1) {
        await device1.close();
      }
    }

    await transport1.connect(consoleworkerbaudrate );

    while (device1.readable) {
        if (!device1.readable.locked) reader1 = device1.readable.getReader();

      try {
          while (true) {
          const { value, done } = await reader1.read();
          if (done) {
            // Allow the serial port to be closed later.
            reader1.releaseLock();
            break;
          }
          if (value) {
            term1.write(value);
          }
    }
        } catch (error) {}
  }
}
}
confirmResetButton.onclick = async () => {
  $("#closeResetModal").click();
  await transport1.setRTS(false);
  await transport1.setDTR(false);
  await new Promise((resolve) => setTimeout(resolve, 100));
  await transport1.setRTS(true);
  await transport1.setDTR(true)
};
// reset and confirm reset functionallity end

eraseButton.onclick = async () => {
    postFlashClick()
    postProgramFlashClick()
    eraseButton.disabled = true;
    $('#console').click();
    await esploader.erase_flash();
  postFlashDone()
  postProgramFlashDone()
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
    element3.type = "image";
    element3.src = "assets/icons/remove.png";
    var btnName = "rem-" + rowCount;
    element3.name = btnName;
    element3.onclick = function() {
            removeRow(btnName);
            return false;
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
function cleanUpDevice1() {
  device1 = null;
  transport1 = undefined;
  chip = "default";
}
function cleanUpDevice2() {
  device2 = null;
  transport2 = undefined;
  chip = "default";
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
function validate_program_inputs_for_multiparts() {
    let offsetArr = []
    var rowCount = table.rows.length;
    var row;
    let offset = 0;
 
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
  }
    return "success"
}

programButton.onclick = async () => {
  if(config["multipart"] === true){
    //  let file_server_url = config.firmware_images_url;
     let err =  validate_program_inputs_for_multiparts()
     console.log(err)
     console.log("inside program multipart button")
      if (err !== "success") {
        const alertMsg = document.getElementById("alertmsg");
        alertMsg.innerHTML = "<strong>" + err + "</strong>";
        alertDiv.style.display = "block";
        return;
    }
    if(err === "success")
    {
      console.log(err)
      postProgramFlashClickFormultiparts();    
        // IntervalForFlashThroughProgramButton();
    }
    progressMsgDIY.style.display = "inline";
    console.log(partsArray,addressesArray)
    try {
        await downloadAndFlashForMultiparts()
    } catch (error) {
      console.log(error)
    }
    // partsArray
    // let fileArr = [];
    // let offset = 0x1000;
    // var rowCount = table.rows.length;
    // var row;
    // for (let index = 1; index < rowCount; index ++) {
      //     row = table.rows[index];
      //     var offSetObj = row.cells[0].childNodes[0];
      //     offset = parseInt(offSetObj.value);
      
      //     var fileObj = row.cells[1].childNodes[0].innerText;
      
      //     fileArr.push({data:fileObj.data, address:offset});
      // }
      
      // $("#console").click();
      postProgramFlashDoneForMultiparts()
  }else{
      esploader.status = "started"
      var err = validate_program_inputs();
      if (err != "success") {
          const alertMsg = document.getElementById("alertmsg");
          alertMsg.innerHTML = "<strong>" + err + "</strong>";
          alertDiv.style.display = "block";
          return;
      }
      if(err === "success")
      {
          postProgramFlashClick();
          IntervalForFlashThroughProgramButton();
      }
      progressMsgDIY.style.display = "inline";
      let fileArr = [];
      let offset = 0x1000;
      var rowCount = table.rows.length;
      var row;
      for (let index = 1; index < rowCount; index ++) {
        console.log(row)
          row = table.rows[index];
          var offSetObj = row.cells[0].childNodes[0];
          console.log(offSetObj.value)
          offset = parseInt(offSetObj.value);
          console.log(offset)
          var fileObj = row.cells[1].childNodes[0];
         console.log(fileObj.data)
          fileArr.push({data:fileObj.data, address:offset});
      }
      $("#console").click();
      console.log(fileArr)
      await esploader.write_flash(fileArr, 'keep');
       esploader.status = "complete"
  }
};

let IntervalForFlashThroughProgramButton = () => {
  let interval = setInterval(() => {
    if (esploader !== undefined)
      if (esploader.status === "complete") {
        postProgramFlashDone();
        clearInterval(interval);
      } else {
        postProgramFlashClick();
      }
  }, 3000);
};

async function downloadAndFlashForMultiparts() {
  var file_server_url = config.firmware_images_url;
  let fileArr = []
  var rowCount = table.rows.length;
  var row;
  for (let index = 1; index < rowCount; index ++) {
    console.log(row)
      row = table.rows[index];
      var offSetObj = row.cells[0].childNodes[0];
      console.log(offSetObj.value)
      var offset = parseInt(offSetObj.value);
      console.log(offset)
      var fileObj = row.cells[1].childNodes[0];
      console.log(file_server_url + fileObj.innerText)
      let data = await new Promise(resolve => {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', file_server_url + fileObj.innerText, true);
          xhr.responseType = "blob";
          xhr.send();
          xhr.onload = function () {
              if (xhr.readyState === 4 && xhr.status === 200) {
                  var blob = new Blob([xhr.response], {type: "application/octet-stream"});
                  var reader = new FileReader();
                  reader.onload = (function(theFile) {
                      return function(e) {
                          resolve(e.target.result);
                      };
                  })(blob);
                  reader.readAsBinaryString(blob);
              } else {
                  resolve(undefined);
              }
          };
          xhr.onerror = function() {
              resolve(undefined);
          }
      });
      fileArr.push({data:data, address:offset});
  }
    // if(data !== undefined){
  //   // console.log(data)
  //   let obj = {data:data, address:parseInt(addressesArray[index])}
  //   fileArr.push(obj);
  // }
  // if (fileArr !== undefined) {
    // console.log(fileArr)
      $('#console').click();
      try {
         console.log(fileArr)
         await esploader.write_flash(fileArr,'keep');
      } catch (error) {
        console.log(error)
  // }
}
}
async function downloadAndFlash(fileURL,address=0x0) {
  console.log(fileURL)
    let data = await new Promise(resolve => {
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
                        resolve(e.target.result);
                    };
                })(blob);
                reader.readAsBinaryString(blob);
            } else {
                resolve(undefined);
            }
        };
        xhr.onerror = function() {
            resolve(undefined);
        }
    });
    if (data !== undefined) {
      console.log(data)
        $('#console').click();
        try {
            
           await esploader.write_flash([{data:data, address:address}], 'keep');
        } catch (error) {
    }
}

}
// Based on the configured App store links, show the respective download links.
function buildAppLinks(){
    let hrElement = document.getElementById("preview_body").querySelector('hr')
    console.log(hrElement)
    hrElement.style.display = "block"
    let defaultAppURLsHTML = "Note: You can download phone app from the app store and interact with your device. Scan the QRCode to access the respective apps.<br>";
    let appURLsHTML = "";
    if(android_app_url !== "" && android_app_url !== undefined){
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
    if(appURLsHTML === defaultAppURLsHTML){
      console.log("bye 1")
      $("#progressMsgQS").html("Firmware Image flashing is complete. " + appURLsHTML);
      $("#appDownloadLink").html(appURLsHTML);
      hrElement.style.display = "block"
    }else{
      console.log("bye 2")
      $("#progressMsgQS").html("Firmware Image flashing is complete.");
      hrElement.style.display = "none"
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
}

// Helper function for flashButton click event,helps to disable some functinallity during flashing to avoid erros
let postFlashClick = () => {
  flashButton.disabled = true;
  resetDeviceButton.disabled = true;
  disconnectButton1.disabled = true;
  programButton.disabled = true;
  eraseButton.disabled = true;
};

// Helper function for flashButton click event,helps to enables some functinallity after flashing is completed
let postFlashDone = () => {
  flashButton.disabled = false;
  resetDeviceButton.disabled = false;
  disconnectButton1.disabled = false;
  programButton.disabled = false;
  eraseButton.disabled = false;
};
// Helper function for programButton click event,helps to disable some functinallity during flashing to avoid erros
let postProgramFlashClick = () => {
  flashButton.disabled = true;
  programButton.disabled = true;
  resetDeviceButton.disabled = true;
  disconnectButton1.disabled = true;
  eraseButton.disabled = true;
};

// Helper function for programButton click event,helps to enables some functinallity after flashing is completed
let postProgramFlashDone = () => {
  programButton.disabled = false;
  flashButton.disabled = false;
  resetDeviceButton.disabled = false;
  disconnectButton1.disabled = false;
  eraseButton.disabled = false;
};
// Helper function for programButton click event,helps to disable some functinallity during flashing to avoid erros
let postProgramFlashClickFormultiparts = () => {
  flashButton.disabled = true;
  programButton.disabled = true;
  resetDeviceButton.disabled = true;
  disconnectButton1.disabled = true;
  eraseButton.disabled = true;
  deviceTypeSelect.disabled = true
};

// Helper function for programButton click event,helps to enables some functinallity after flashing is completed
let postProgramFlashDoneForMultiparts = () => {
  programButton.disabled = false;
  flashButton.disabled = false;
  resetDeviceButton.disabled = false;
  disconnectButton1.disabled = false;
  eraseButton.disabled = false;
  deviceTypeSelect.disabled = false
};

flashButton.onclick = async () => {
    let flashFile = $("input[type='radio'][name='chipType']:checked").val();

    let tem = chipSetsRadioGroup.querySelector("input[type='radio'][name='chipType']:checked").parentNode.innerText
    console.log(tem)
    var file_server_url = config.firmware_images_url;

    progressMsgQS.style.display = "inline";

    cleanUpOldFlashHistory();
    postFlashClick();
    await downloadAndFlash(file_server_url + flashFile);

    buildAppLinks();
    $("#statusModal").click();
    esploader.status = "started";
    postFlashDone();
};

function getTerminalColumns() {
    const mainContainerWidth = mainContainer?.offsetWidth || 1320;
    return Math.round(mainContainerWidth / 8.25); 
}

function resizeTerminal() {
  fitAddon1 && fitAddon1.fit();
}

$( window ).resize(function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeTerminal, 300);
});

//Code to avoid #id appending at end of URL

//Get all the hyperlink elements
let links = document.getElementsByTagName("a");

//Browse the previously created array
Array.prototype.forEach.call(links, function (elem, index) {
  //Get the hyperlink target and if it refers to an id go inside condition
  let elemAttr = elem.getAttribute("href");
  if (elemAttr && elemAttr.includes("#")) {
    //Replace the regular action with a scrolling to target on click
    elem.addEventListener("click", function (ev) {
      ev.preventDefault();
      //Scroll to the target element using replace() and regex to find the href's target id
      document.getElementById(elemAttr.replace(/#/g, "")).scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    });
  }
});
