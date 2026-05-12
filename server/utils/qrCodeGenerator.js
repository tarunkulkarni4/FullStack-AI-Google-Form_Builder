const QRCode = require('qrcode');

/**
 * QR Code Generator Utility
 * Generates QR codes as data URLs or buffers.
 */

/**
 * Generates a QR code as a base64 data URL.
 * @param {string} url - The URL to encode
 * @param {Object} options - QR code options
 * @returns {string} Base64 data URL
 */
const generateQRDataURL = async (url, options = {}) => {
    const defaultOptions = {
        width: 300,
        margin: 2,
        color: {
            dark: '#1f2937',
            light: '#ffffff',
        },
        ...options,
    };

    return await QRCode.toDataURL(url, defaultOptions);
};

/**
 * Generates a QR code as a PNG buffer.
 * @param {string} url - The URL to encode
 * @returns {Buffer} PNG buffer
 */
const generateQRBuffer = async (url) => {
    return await QRCode.toBuffer(url, {
        width: 600,
        margin: 2,
        color: {
            dark: '#1f2937',
            light: '#ffffff',
        },
    });
};

module.exports = { generateQRDataURL, generateQRBuffer };
