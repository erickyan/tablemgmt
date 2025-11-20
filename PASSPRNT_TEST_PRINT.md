# How to Print Test Page from PassPRNT App

## Step-by-Step Instructions

### 1. Open PassPRNT App
- Find the **PassPRNT** app on your iPad/iPhone home screen
- Tap to open it

### 2. Select Your Printer
- If you have multiple printers configured, **select your TSP143IIIW** from the list
- If you haven't added the printer yet, see "Adding Printer First" section below

### 3. Find Test Print Option
The test print option is usually located in one of these places:

**Option A: Main Screen**
- Look for a **"Test Print"** or **"Print Test"** button on the main screen
- May be in the top toolbar or as a menu option

**Option B: Printer Settings**
- Tap on your printer name/settings
- Look for **"Test Print"** or **"Print Test Page"** option
- May be under "Printer Settings" or "Options"

**Option C: Menu/More Options**
- Look for a **menu icon** (three dots or hamburger menu)
- Tap it to see options
- Select **"Test Print"** or **"Print Test"**

### 4. Execute Test Print
- Tap the **"Test Print"** or **"Print Test Page"** button
- The app will send a test print to your TSP143IIIW
- You should see the printer start printing

### 5. Verify Print
- Check that the test page printed successfully
- The test page usually contains:
  - Printer model information
  - Network settings (IP address, etc.)
  - Connection status
  - Some sample text/graphics

## If You Don't See Test Print Option

### Check App Version
- Make sure you have the **latest version** of PassPRNT
- Update from App Store if needed

### Alternative: Print from Web
Some versions of PassPRNT allow printing HTML content:
1. Open PassPRNT app
2. Look for **"Print from URL"** or **"Print HTML"** option
3. Enter a simple HTML test:
   ```html
   <html><body><h1>Test Print</h1><p>If you see this, it works!</p></body></html>
   ```

## Adding Printer First (If Not Already Added)

If you haven't added your TSP143IIIW yet:

### 1. Add Network Printer
1. Open PassPRNT app
2. Tap **"+"** or **"Add Printer"** button
3. Select **"Network Printer"** or **"TCP/IP"**

### 2. Enter Printer Details
- **Printer Model**: Select **"TSP143IIIW"** or **"TSP100III"** series
- **IP Address**: Enter your printer's IP address (e.g., 192.168.1.100)
  - Get IP by printing network config page from printer
- **Port Name**: Usually auto-filled as `TCP:192.168.x.x`
- **Port Settings**: Leave default (usually blank or "9100")

### 3. Save and Test
- Tap **"Save"** or **"Add"**
- The printer should appear in your printer list
- Now you can do a test print

## Getting Printer IP Address

If you don't know your printer's IP address:

### Method 1: Print Network Config Page
1. **Turn off the printer**
2. **Hold the Feed button** (usually the only button on the printer)
3. **While holding Feed button, turn printer on**
4. **Keep holding until it starts printing**
5. **Release the button**
6. The printed page will show:
   - IP Address
   - Network settings
   - Connection status

### Method 2: Printer Menu (if available)
1. Use printer's menu/display (if it has one)
2. Navigate to: **Settings > Network > Print Config**
3. Print the network configuration page

### Method 3: Router Admin
1. Log into your router's admin page
2. Check "Connected Devices" or "DHCP Clients"
3. Look for "TSP143IIIW" or Star Micronics device
4. Note the IP address

## Troubleshooting Test Print

### Printer Not Responding
- ✅ Check printer is powered on
- ✅ Verify printer is on WiFi (check WiFi indicator)
- ✅ Ensure iPad and printer are on same network
- ✅ Check IP address is correct in PassPRNT
- ✅ Try restarting printer

### "Printer Not Found" Error
- ✅ Verify IP address is correct
- ✅ Check both devices on same WiFi network
- ✅ Try pinging printer IP from iPad (if possible)
- ✅ Restart PassPRNT app

### Test Print Works But Web App Doesn't
- ✅ This means printer is configured correctly
- ✅ Issue is likely with URL scheme in browser
- ✅ Try using Chrome instead of Safari
- ✅ Check browser console for errors

## What Success Looks Like

When test print works:
- ✅ Printer receives the print job
- ✅ Paper feeds and prints test content
- ✅ Test page shows printer information
- ✅ No error messages in PassPRNT app

This confirms:
- ✅ Printer is properly configured
- ✅ Network connection is working
- ✅ PassPRNT can communicate with printer
- ✅ Ready to print from web app

## Next Steps After Successful Test Print

Once test print works:
1. ✅ Printer is configured correctly
2. ✅ Try printing from your web app
3. ✅ If web app doesn't work, issue is with URL scheme (browser limitation)
4. ✅ Consider using Chrome or Star WebPRNT Browser

## Quick Reference

**Test Print Location in PassPRNT:**
- Main screen → Test Print button
- Printer settings → Test Print option
- Menu → Test Print

**If you can't find it:**
- Check app version (update if needed)
- Look for "Print Test" or "Print Test Page"
- Check printer settings/options menu

