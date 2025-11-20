# Correct PassPRNT Setup

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

### Option 2: Verify PassPRNT Installation
1. Open PassPRNT app
2. Verify your TSP143III printer is configured
3. Try printing a test page from within PassPRNT app

### Option 3: TSP143III Compatibility
**Important**: The TSP143III may not be fully supported by Star WebPRNT Browser. Check Star Micronics documentation for TSP143III compatibility.

### Option 4: Use Direct USB (TSP143IIIU model only)
If you have the **TSP143IIIU** (USB model):
1. Connect iPad to printer via USB cable
2. Use direct USB printing (requires different implementation)

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

