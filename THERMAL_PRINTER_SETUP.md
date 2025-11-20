# Thermal Printer Setup Guide

## Overview

This app now supports printing to Star Micronics thermal printers (including TSP143III) on iOS devices using **PassPRNT**. This solution does **NOT** require wrapping your app in a native iOS app.

## Is AirPrint Supported?

**No.** Most thermal printers, including the Star Micronics TSP143III, do **NOT** support Apple's AirPrint protocol. This is why we use alternative solutions like PassPRNT.

## Solution: PassPRNT (Recommended)

### What is PassPRNT?

PassPRNT is a free iOS app from Star Micronics that acts as a bridge between web apps and Star thermal printers. It uses URL schemes to receive print data from your web app and sends it to the printer.

### Advantages

- ✅ **No native app development required** - Works with your existing Vue.js web app
- ✅ **No App Store submission needed** - Just install PassPRNT on the iPad/iPhone
- ✅ **Easy integration** - Minimal code changes
- ✅ **Supports Bluetooth and Network printers**
- ✅ **Free to use**

### Setup Steps

1. **Install PassPRNT on your iPad/iPhone:**
   - Download "PassPRNT" from the App Store (free)
   - Open the app and configure your printer (Bluetooth or Network)

2. **Configure Printer in PassPRNT:**
   - Open PassPRNT app
   - Go to Settings
   - Add your Star Micronics TSP143III printer
   - Select connection type (Bluetooth or Network)
   - Test print to verify connection

3. **Use the App:**
   - The app automatically detects iOS devices
   - When printing on iOS, it will attempt to use PassPRNT
   - If PassPRNT is not available, it falls back to standard browser printing

### How It Works

1. User clicks "Print" in your web app
2. App detects iOS device
3. Converts HTML receipt to plain text
4. Opens PassPRNT via URL scheme with print data
5. PassPRNT handles the actual printing to the thermal printer

## Alternative Solutions

### Option 2: Star WebPRNT Browser

- **What:** Star's custom browser app that supports printing
- **Pros:** Works with web apps, no native development
- **Cons:** Users must use Star's browser instead of Safari
- **Difficulty:** Low-Medium

### Option 3: StarPRNT SDK (Full Native)

- **What:** Full native iOS app with StarPRNT SDK integration
- **Pros:** Best user experience, full control
- **Cons:** Requires iOS development, Xcode, App Store submission
- **Difficulty:** High
- **When to use:** If you need advanced features or want a fully native app

### Option 4: Direct USB (TSP143IIIU only)

- **What:** Connect printer directly via USB cable
- **Pros:** Direct connection, no network/Bluetooth setup
- **Cons:** Only works with USB model, less flexible
- **Difficulty:** Medium

## Technical Implementation

The thermal printer support is implemented in:

- `src/services/thermalPrinterService.js` - Handles thermal printer detection and printing
- `src/services/printService.js` - Updated to use thermal printing on iOS

### Automatic Detection

The app automatically:
- Detects if running on iOS
- Attempts thermal printing via PassPRNT
- Falls back to standard browser printing if thermal printing fails

### Manual Control

You can disable thermal printing by passing options:

```javascript
await printHTML(html, { useThermal: false })
```

## Testing

1. **Test on iOS device:**
   - Open your app in Safari on iPad/iPhone
   - Ensure PassPRNT is installed and configured
   - Try printing a receipt
   - PassPRNT should open and handle the print

2. **Test fallback:**
   - If PassPRNT is not installed, standard browser print dialog should appear
   - This ensures the app still works on other devices

## Troubleshooting

### PassPRNT doesn't open
- Ensure PassPRNT is installed on the device
- Check that the URL scheme is not blocked
- Try opening PassPRNT manually first

### Printer not found in PassPRNT
- Verify printer is powered on
- Check Bluetooth/Network connection
- Re-add printer in PassPRNT settings

### Receipt formatting issues
- Thermal printers typically use 80mm paper (48 characters wide)
- The app formats receipts automatically for thermal printers
- If formatting looks off, check printer settings in PassPRNT

### Printing doesn't work
- Check that PassPRNT has permission to access the printer
- Verify printer is compatible with PassPRNT
- Check PassPRNT app logs for errors

## Printer Compatibility

PassPRNT supports most Star Micronics printers including:
- TSP100 series (including TSP143III)
- TSP650 series
- mPOP
- mC-Print3
- And many others

Check Star Micronics website for full compatibility list.

## Resources

- [PassPRNT App Store](https://apps.apple.com/app/passprnt/id569792039)
- [Star Micronics PassPRNT Documentation](https://www.starmicronics.com/passprnt-receipt-printer-app-ios-ipad-android-tablet-bluetooth-printing/)
- [StarPRNT SDK Documentation](https://www.starmicronics.com/starprnt-sdk-pos-printing-java-swift/)

## Summary

**You do NOT need to wrap your app in a native iOS app.** PassPRNT provides the easiest solution for printing to thermal printers from your Vue.js web app on iOS devices. Simply install PassPRNT on the iPad/iPhone and the app will automatically use it when printing.

