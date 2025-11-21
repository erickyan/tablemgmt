# PassPRNT Implementation Comparison

## Issues Found and Fixed

### ✅ Issue 1: URL Parameter Format

**Sample Code Format:**
```javascript
changeHref = 'starpassprnt://v1/print/nopreview?';
changeHref = changeHref + "&back=" + encodeURIComponent(window.location.href);
changeHref = changeHref + "&html=" + encodeURIComponent(htmlText);
```

**Our Previous Implementation:**
```javascript
const passprntUrl = `starpassprnt://v1/print/nopreview?back=${backUrl}&html=${encodedHtml}`
```

**Problem:** 
- Sample uses `?&back=` (non-standard but what PassPRNT expects)
- We were using `?back=` (standard URL format)

**Fixed:** Now matches sample format exactly:
```javascript
let passprntUrl = 'starpassprnt://v1/print/nopreview?'
passprntUrl += `&back=${backUrl}`
passprntUrl += `&html=${encodedHtml}`
```

### ✅ Issue 2: Missing Optional Parameters

**Sample Code Supports:**
- `port` - Printer port name (e.g., "TCP:192.168.1.100")
- `settings` - Printer settings (e.g., "escpos", "portable")
- `timeout` - Timeout in milliseconds
- `size` - Paper size (384, 406, 576, 832)
- `cut` - Cut option (full, partial, nocut, tearbar)
- `drawer` - Cash drawer control
- `buzzer` - Buzzer control
- And many more...

**Our Previous Implementation:**
- Only had `back` and `html` parameters

**Fixed:** Added support for optional parameters:
```javascript
if (options.port) {
  passprntUrl += `&port=${encodeURIComponent(options.port)}`
}
if (options.settings) {
  passprntUrl += `&settings=${encodeURIComponent(options.settings)}`
}
// ... etc
```

## Current Implementation Status

### ✅ Correctly Implemented:
1. **Base URL format**: `starpassprnt://v1/print/nopreview?`
2. **Parameter format**: Using `&` prefix for all parameters (matching sample)
3. **Encoding**: Using `encodeURIComponent()` for all parameters
4. **Back parameter**: Current page URL encoded correctly
5. **HTML parameter**: Full HTML content encoded correctly

### ✅ Now Supports Optional Parameters:
- `port` - For specifying printer port
- `settings` - Printer settings
- `timeout` - Timeout value
- `size` - Paper size
- `cut` - Cut option

### 📝 Can Add More If Needed:
- `drawer` - Cash drawer control
- `buzzer` - Buzzer control
- `sound` - Sound control
- `blackmark` - Black mark detection
- `gap` - Gap detection
- `popup` - Popup control

## Usage Example

### Basic Usage (Current):
```javascript
await printWithPassPRNT(htmlContent)
```

### With Optional Parameters:
```javascript
await printWithPassPRNT(htmlContent, {
  port: 'TCP:192.168.1.100',
  settings: 'escpos',
  timeout: 10000,
  size: 576,
  cut: 'full'
})
```

## Testing

The implementation now matches the official sample format. Test by:

1. **Check URL format in console:**
   - Should see: `starpassprnt://v1/print/nopreview?&back=...&html=...`
   - Note the `?&back=` format (non-standard but correct for PassPRNT)

2. **Test with PassPRNT app:**
   - Click Print button
   - PassPRNT should open
   - Receipt should print

3. **If still not working:**
   - Check browser console for URL
   - Compare with sample format
   - Verify PassPRNT is installed
   - Try Chrome instead of Safari

## Key Differences from Standard URLs

**Standard URL format:**
```
scheme://path?param1=value1&param2=value2
```

**PassPRNT format (from sample):**
```
starpassprnt://v1/print/nopreview?&back=value&html=value
```

**Note:** PassPRNT uses `?&` which is non-standard but appears to be what they expect. Our implementation now matches this exactly.

## Next Steps

1. ✅ **Fixed URL format** - Now matches sample
2. ✅ **Added optional parameters** - Can specify port, settings, etc.
3. 🔄 **Test the updated implementation** - Should work better now
4. 📝 **Add more parameters if needed** - Based on your printer requirements

## Important Notes

- The `?&back=` format is unusual but matches the official sample
- All parameters must be URL encoded using `encodeURIComponent()`
- HTML content should be full HTML document (not just body)
- URL length can be an issue - check console for warnings

