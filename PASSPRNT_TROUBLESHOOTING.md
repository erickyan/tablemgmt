# PassPRNT Troubleshooting Guide

## Issue: Safari Still Shows AirPrint Dialog

If Safari is still showing the AirPrint dialog instead of opening PassPRNT, follow these steps:

### Step 1: Verify iOS Detection

Open Safari's developer console (Settings > Safari > Advanced > Web Inspector) and run:

```javascript
window.isIOSDevice()
```

This should return `true` on iPad/iPhone. If it returns `false`, iOS detection is failing.

### Step 2: Test PassPRNT Directly

In the Safari console, run:

```javascript
window.testPassPRNT()
```

This will send a test print to PassPRNT. You should see:
- PassPRNT app opens
- Test message appears in PassPRNT
- You can then print it

If PassPRNT doesn't open, the URL scheme might not be working.

### Step 3: Check Console Logs

When you click "Print" in the app, check the Safari console for these messages:
- "iOS detected, attempting thermal printer via PassPRNT"
- "Converting HTML to plain text for thermal printer"
- "Attempting to open PassPRNT with URL: passprnt://print?text=..."
- "PassPRNT URL opened via window.location" (or link click, or iframe)

If you see these messages but PassPRNT doesn't open, Safari might be blocking the URL scheme.

### Step 4: Manual URL Test

Try opening this URL directly in Safari's address bar (correct format):

```
starpassprnt://v1/print/nopreview?back=https://example.com&html=%3Chtml%3E%3Cbody%3ETest%20Print%3C/body%3E%3C/html%3E
```

**Note**: The correct URL scheme is `starpassprnt://` (not `passprnt://`)

If PassPRNT opens, the URL scheme works. If not, there might be an issue with PassPRNT installation.

### Step 5: Check PassPRNT Settings

1. Open PassPRNT app
2. Go to Settings
3. Verify your TSP143III printer is listed and connected
4. Check if there are any error messages

### Step 6: Safari-Specific Issues

Safari on iOS has some limitations with URL schemes:

1. **User Interaction Required**: URL schemes must be triggered from a direct user action (like a button click). Our code does this, but Safari might still be showing the print dialog.

2. **Try Chrome Instead**: Some users report better PassPRNT compatibility with Chrome on iOS:
   - Install Chrome from App Store
   - Open your app in Chrome
   - Try printing again

3. **Safari Settings**: 
   - Go to Settings > Safari
   - Make sure "Block Pop-ups" is OFF (though this shouldn't affect URL schemes)
   - Try disabling content blockers temporarily

### Step 7: Alternative - Use Star WebPRNT Browser

If PassPRNT continues to have issues with Safari:

1. Download "Star WebPRNT Browser" from App Store
2. Open your web app in Star WebPRNT Browser instead of Safari
3. Star WebPRNT Browser has built-in support for Star printers

### Step 8: Check URL Scheme Format

The current implementation uses:
```
passprnt://print?text=<encoded_text>
```

If this doesn't work, try these alternatives:

1. **With port name** (if you know your printer's name):
```
passprnt://print?text=<encoded_text>&portName=TSP143III
```

2. **Check PassPRNT documentation** for the exact URL format required

### Step 9: Debug Mode

To see what's happening, check the browser console when printing. You should see logs like:

```
iOS detected, attempting thermal printer via PassPRNT
Converting HTML to plain text for thermal printer
Plain text length: 500 characters
Attempting to open PassPRNT with URL: passprnt://print?text=...
PassPRNT URL opened via window.location
Print sent to PassPRNT - check if PassPRNT app opened
```

If you see "Thermal printing failed, falling back to standard print", then PassPRNT isn't opening and it's falling back to AirPrint.

### Step 10: Force PassPRNT Mode

If you want to force PassPRNT mode (disable standard printing), you can modify the code temporarily to always throw an error if PassPRNT doesn't work, preventing the fallback to AirPrint.

## Common Issues and Solutions

### Issue: "PassPRNT doesn't open"
- **Solution**: Verify PassPRNT is installed and try the manual URL test (Step 4)

### Issue: "Safari shows AirPrint dialog"
- **Solution**: This means PassPRNT URL scheme isn't working. Try Chrome (Step 6) or Star WebPRNT Browser (Step 7)

### Issue: "Printer not found in PassPRNT"
- **Solution**: Re-add printer in PassPRNT settings, check Bluetooth/Network connection

### Issue: "Print works but formatting is wrong"
- **Solution**: Thermal printers use 80mm paper (48 characters wide). The app formats automatically, but you can adjust in PassPRNT settings

## Still Not Working?

1. Check PassPRNT app version - make sure it's up to date
2. Check iOS version - older iOS versions might have URL scheme limitations
3. Try restarting the iPad/iPhone
4. Contact Star Micronics support with:
   - Printer model: TSP143III
   - iOS version
   - PassPRNT app version
   - Browser (Safari/Chrome)
   - Console error messages (if any)

