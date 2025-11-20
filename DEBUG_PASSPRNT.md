# Debugging PassPRNT from Web App

## Current Situation

✅ **StarQuickSetup works** - Printer is configured correctly  
❌ **Web app doesn't work** - URL scheme not triggering PassPRNT

## What This Means

Since StarQuickSetup can print successfully, we know:
- ✅ Printer (TSP143IIIW) is working
- ✅ Network connection is working
- ✅ Printer is properly configured
- ❌ The issue is with the web app triggering PassPRNT

## Debugging Steps

### 1. Check Browser Console

When you click Print in your web app, open the browser console and look for:

```
=== PassPRNT Print Attempt ===
iOS device detected
HTML content length: XXXX characters
Attempting to open PassPRNT
URL length: XXXX characters
PassPRNT URL triggered via link click method
```

**What to look for:**
- Do you see these messages?
- Any error messages?
- Does it say "Still on same page - PassPRNT may not have opened"?

### 2. Check if URL Scheme is Being Triggered

The code now tries multiple methods:
1. **Link click method** (preferred)
2. **window.location method** (fallback)

**In console, you should see:**
- "PassPRNT URL triggered via link click method" OR
- "PassPRNT URL triggered via window.location"

### 3. Test URL Scheme Manually

Try this in the browser console (while on your app page):

```javascript
// Test if URL scheme works
const testUrl = 'starpassprnt://v1/print/nopreview?back=' + encodeURIComponent(window.location.href) + '&html=' + encodeURIComponent('<html><body><h1>Test</h1></body></html>');
window.location.href = testUrl;
```

**What should happen:**
- PassPRNT app should open
- If it doesn't, Safari/Chrome is blocking the URL scheme

### 4. Check Browser

**Safari:**
- Known to block many URL schemes
- Try Chrome instead

**Chrome:**
- Better URL scheme support
- If Chrome also doesn't work, check if URL is too long

### 5. Check URL Length

Very long URLs can cause issues. Check console for:
```
URL length: XXXX characters
```

**If URL is > 2000 characters:**
- This might be too long
- Some browsers have URL length limits
- We might need to use a different approach

### 6. Verify PassPRNT Installation

Even though StarQuickSetup works, verify PassPRNT:
1. Open PassPRNT app
2. Check if TSP143IIIW is listed
3. Try printing from PassPRNT app directly

## Common Issues & Solutions

### Issue: Console shows "Still on same page"
**Meaning:** URL scheme was triggered but PassPRNT didn't open

**Solutions:**
1. **Browser blocking:** Safari blocks many URL schemes
   - ✅ Try Chrome instead
   - ✅ Try Star WebPRNT Browser

2. **PassPRNT not installed:** Even though StarQuickSetup works
   - ✅ Verify PassPRNT is installed
   - ✅ Reinstall PassPRNT from App Store

3. **URL too long:** Very long HTML can create very long URLs
   - ✅ Check console for URL length
   - ✅ If > 2000 chars, we need different approach

### Issue: No console messages at all
**Meaning:** Code isn't running

**Solutions:**
1. Check if iOS detection is working
2. Check if print button click is reaching the code
3. Check for JavaScript errors

### Issue: "Thermal printing failed, falling back to standard print"
**Meaning:** Error was thrown

**Solutions:**
1. Check console for the actual error message
2. Look for specific error details

## Testing Checklist

- [ ] Open browser console
- [ ] Click Print button
- [ ] Check for console messages
- [ ] Note if PassPRNT opens
- [ ] Note any error messages
- [ ] Try in Chrome (if using Safari)
- [ ] Try manual URL test in console
- [ ] Check URL length in console

## What to Report

If it still doesn't work, please provide:

1. **Browser:** Safari or Chrome?
2. **Console messages:** Copy all messages when clicking Print
3. **URL length:** What does console show for "URL length"?
4. **Manual test:** Did the manual URL test in console work?
5. **PassPRNT:** Does PassPRNT open when you manually test the URL?

## Alternative Solutions

If URL scheme continues to fail:

### Option 1: Use Star WebPRNT Browser
- Specifically designed for this
- Uses JavaScript API instead of URL schemes
- More reliable

### Option 2: Use Chrome
- Better URL scheme support than Safari
- Usually works better with PassPRNT

### Option 3: Native App Wrapper
- Wrap web app in native iOS app
- Use StarPRNT SDK directly
- Most reliable but requires development

## Next Steps

1. **Test with console open** - See what's happening
2. **Try Chrome** - Better URL scheme support
3. **Check console messages** - Look for errors or warnings
4. **Report findings** - What do you see in console?

