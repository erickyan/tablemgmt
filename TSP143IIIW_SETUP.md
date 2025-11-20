# TSP143IIIW Setup Guide

## Printer Model: TSP143IIIW (WiFi/Wireless)

Your Star Micronics **TSP143IIIW** is a WiFi-enabled thermal printer, which is great for network printing from iOS devices.

## Initial Printer Setup

### 1. Connect Printer to WiFi

1. **Power on the printer**
2. **Print network configuration page:**
   - Hold the Feed button while powering on
   - Or use the printer's menu to print network settings
3. **Note the IP address** from the printed page
4. **Verify WiFi connection:**
   - Check that printer's WiFi indicator is on
   - Ensure printer is on **2.4 GHz network** (may not support 5 GHz)

### 2. Install PassPRNT App

1. **Download PassPRNT** from the App Store
2. **Open PassPRNT app**
3. **Add your printer:**
   - Tap "Add Printer" or "+"
   - Select "Network Printer" or "TCP/IP"
   - Choose "TSP143IIIW" or "TSP100III" series
   - Enter the printer's **IP address** (from step 1)
   - Port name will be: `TCP:192.168.x.x` (your IP)
4. **Test print:**
   - Use PassPRNT's test print function
   - Verify printer responds

## Network Requirements

### ✅ Both devices on same network
- iPad/iPhone and printer must be on the **same WiFi network**
- Use **2.4 GHz WiFi** (TSP143IIIW may not support 5 GHz)

### ✅ Network stability
- Ensure strong WiFi signal
- Printer should be within range of router
- Avoid network congestion

### ✅ IP address
- Printer should have a static or reserved IP (recommended)
- Note the IP address for PassPRNT configuration

## PassPRNT Configuration

### Port Name Format
For network printers, use:
```
TCP:192.168.1.100
```
(Replace with your printer's actual IP address)

### Connection Type
- **Type**: Network/TCP
- **Port**: Usually 9100 (default for Star printers)
- **IP Address**: Your printer's IP (e.g., 192.168.1.100)

## Testing the Setup

### Test 1: PassPRNT App
1. Open PassPRNT app
2. Select your TSP143IIIW printer
3. Print a test page
4. ✅ If this works, printer is configured correctly

### Test 2: Web App Printing
1. Open your web app in Safari/Chrome
2. Click Print button
3. PassPRNT should open automatically
4. Receipt should print to TSP143IIIW

## Troubleshooting

### Printer Not Found in PassPRNT
- **Check WiFi connection**: Ensure printer is on WiFi
- **Verify IP address**: Print network config page
- **Same network**: iPad and printer must be on same WiFi
- **Restart printer**: Power cycle the printer

### PassPRNT Opens But Doesn't Print
- **Check printer selection**: Verify TSP143IIIW is selected in PassPRNT
- **Test from PassPRNT app**: If test print works, issue is with URL scheme
- **Check printer status**: Ensure printer is online and has paper

### Network Connection Issues
- **Ping test**: From iPad, try to access printer's web interface
- **Firewall**: Some networks block printer communication
- **Router settings**: Check if router blocks device-to-device communication
- **Try different network**: Test on a different WiFi to isolate issue

### Getting Printer IP Address
1. **Print self-test page:**
   - Hold Feed button while powering on
   - Or use printer menu: Settings > Network > Print Config
2. **Access web interface:**
   - Open Safari on iPad
   - Go to: `http://<printer-ip>` (e.g., http://192.168.1.100)
   - View network settings and status

## Advantages of WiFi Model

✅ **No pairing needed** - Just connect to same network  
✅ **Better range** - Works anywhere on WiFi network  
✅ **Multiple devices** - Can print from multiple iPads  
✅ **More reliable** - Network connection is more stable than Bluetooth  
✅ **Easy setup** - Just need IP address  

## Current Implementation

The code now:
- ✅ Uses correct URL scheme: `starpassprnt://`
- ✅ Works with network printers (TSP143IIIW)
- ✅ Passes HTML content to PassPRNT
- ✅ PassPRNT handles network communication to printer

## Next Steps

1. **Configure printer in PassPRNT** with network IP
2. **Test print from PassPRNT app** to verify connection
3. **Test print from web app** - should open PassPRNT automatically
4. **If issues persist**, check network connectivity and printer IP

## Support Resources

- **Star Micronics Support**: https://www.starmicronics.com/support
- **PassPRNT Manual**: Check App Store app description for link
- **TSP143IIIW Documentation**: Star Micronics website

