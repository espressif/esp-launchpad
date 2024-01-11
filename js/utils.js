export const usbPortFilters = [
    { usbVendorId: 0x10c4, usbProductId: 0xea60 }, /* CP2102/CP2102N */
    { usbVendorId: 0x0403, usbProductId: 0x6010 }, /* FT2232H */
    { usbVendorId: 0x303a, usbProductId: 0x1001 }, /* Espressif USB_SERIAL_JTAG */
    { usbVendorId: 0x303a, usbProductId: 0x1002 }, /* Espressif esp-usb-bridge firmware */
    { usbVendorId: 0x303a, usbProductId: 0x0002 }, /* ESP32-S2 USB_CDC */
    { usbVendorId: 0x303a, usbProductId: 0x0009 }, /* ESP32-S3 USB_CDC */
    { usbVendorId: 0x1a86, usbProductId: 0x55d4 }, /* CH9102F */
    { usbVendorId: 0x1a86, usbProductId: 0x7523 }, /* CH340T */
    { usbVendorId: 0x0403, usbProductId: 0x6001 }, /* FT232R */
];

export function getTerminalColumns(mainContainer = null) {
    const mainContainerWidth = mainContainer?.offsetWidth || 1320;
    return Math.round(mainContainerWidth / 8.25);
}

export function resizeTerminal(fitAddon) {
    fitAddon && fitAddon.fit();
}

export function getImageData(fileURL) {
    return new Promise(resolve => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', fileURL, true);
        xhr.responseType = "blob";
        xhr.send();
        xhr.onload = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var blob = new Blob([xhr.response], { type: "application/octet-stream" });
                var reader = new FileReader();
                reader.onload = (function (theFile) {
                    return function (e) {
                        resolve(e.target.result);
                    };
                })(blob);
                reader.readAsBinaryString(blob);
            } else {
                resolve(undefined);
            }
        };
        xhr.onerror = function () {
            resolve(undefined);
        }
    });
}

export const initializeTooltips = function () {
    $('[data-toggle="tooltip"]').tooltip();
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
}

export function removeRow(table, btnName) {
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

export function handleFileSelect(evt) {
    var file = evt.target.files[0];
    var reader = new FileReader();
    let file1 = null;

    reader.onload = (function (theFile) {
        return function (e) {
            file1 = e.target.result;
            evt.target.data = file1;
        };
    })(file);

    reader.readAsBinaryString(file);
}

export function isWebUSBSerialSupported() {
    let isSafari =
        /constructor/i.test(window.HTMLElement) ||
        (function (p) {
            return p.toString() === "[object SafariRemoteNotification]";
        })(
            !window["safari"] ||
            (typeof safari !== "undefined" && window["safari"].pushNotification)
        );

    let isFirefox = typeof InstallTrigger !== "undefined";

    return (isSafari || isFirefox);
}

export function mdToHtmlConverter(markdownContent) {
    let converter = new showdown.Converter({ tables: true });
    converter.setFlavor('github');
    return converter.makeHtml(markdownContent);
}

// unused functions
function convertUint8ArrayToBinaryString(u8Array) {
    var i, len = u8Array.length, b_str = "";
    for (i = 0; i < len; i++) {
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

function _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}