# Correct PassPRNT Setup for TSP143IIIW

## Printer Model: TSP143IIIW (WiFi/Wireless)

Your printer is the **TSP143IIIW** model, which supports **WiFi/Network printing**. This is actually better than Bluetooth because:
- ✅ More reliable connection
- ✅ Works over network (no pairing needed)
- ✅ Better range
- ✅ Can print from multiple devices

## Important: Correct URL Scheme

The correct PassPRNT URL scheme is **`starpassprnt://`** (not `passprnt://`).

## URL Format

The correct format is:
```
starpassprnt://v1/print/nopreview?back=<encoded_back_url>&html=<encoded_html_content>
```

Where:
- `back` = URL-encoded return address (where to go after printing)
- `html` = URL-encoded HTML content to print

## Why Chrome Does Google Search

If Chrome is doing a Google search instead of opening PassPRNT, it means:
1. Chrome doesn't recognize `starpassprnt://` as a valid URL scheme
2. Chrome treats it as a search query instead

**Solution**: The URL scheme must be triggered from a **user interaction** (button click), not from the address bar. The code now does this correctly.

## Testing

1. **Make sure PassPRNT is installed** from the App Store
2. **Open your app** in Safari or Chrome
3. **Click the Print button** (don't type the URL in the address bar)
4. **PassPRNT should open** with your receipt

## If It Still Doesn't Work

### Option 1: Check Browser Settings
- Safari: Settings > Safari > Make sure "Block Pop-ups" is OFF
- Chrome: Settings > Privacy > Make sure pop-ups aren't blocked

### Option 2: Verify PassPRNT Installation & Network Setup
1. **Open PassPRNT app**
2. **Add your TSP143IIIW printer:**
   - Select "Add Printer" or "Network Printer"
   - Choose "TSP143IIIW" or "TSP100III" series
   - Enter the printer's IP address (or let it auto-discover)
   - Make sure both iPad and printer are on the **same WiFi network**
3. **Test print from PassPRNT app** to verify connection works
4. **Verify printer is on 2.4 GHz WiFi** (TSP143IIIW may not support 5 GHz)

### Option 3: Network Connection Setup
**For TSP143IIIW WiFi model:**
1. **Get printer IP address:**
   - Print a self-test page from the printer
   - The IP address will be printed on the test page
2. **Ensure same network:**
   - iPad and printer must be on the same WiFi network
   - Use 2.4 GHz network (not 5 GHz)
3. **Configure in PassPRNT:**
   - Add printer using IP address
   - Port name format: `TCP:192.168.x.x` (your printer's IP)

### Option 4: Network Troubleshooting
**For TSP143IIIW WiFi issues:**
1. **Check WiFi connection:**
   - Ensure printer is connected to WiFi (check printer's WiFi indicator)
   - Verify iPad is on the same network
   - Try restarting both printer and router
2. **Check IP address:**
   - Print self-test page to get current IP
   - Verify IP is in same subnet as iPad
3. **Firewall issues:**
   - Some networks block printer communication
   - Try on a different network to test
4. **Printer firmware:**
   - Check for firmware updates via printer's web interface
   - Access web interface at: `http://<printer-ip-address>`

## Current Implementation

The code now:
- ✅ Uses correct URL scheme: `starpassprnt://`
- ✅ Uses correct format: `v1/print/nopreview?back=...&html=...`
- ✅ Passes HTML content (not plain text)
- ✅ Triggers from user button click (required for URL schemes)

## Next Steps

1. **Test the updated code** - it should now use the correct URL scheme
2. **Click Print button** (don't type URL manually)
3. **Check if PassPRNT opens**

If it still doesn't work, the issue might be:
- Browser blocking URL schemes (Safari security)
- PassPRNT not properly installed
- TSP143III compatibility issues

Let me know what happens when you test with the updated code!

