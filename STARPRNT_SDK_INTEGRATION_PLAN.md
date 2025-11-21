# StarPRNT SDK Integration Plan

## Overview

This plan outlines the steps to integrate StarPRNT SDK by wrapping your Vue.js web app in a native iOS app. This approach provides direct printer control and bypasses browser URL scheme limitations.

## Architecture

```
┌─────────────────────────────────────┐
│   Native iOS App (Swift/Obj-C)     │
│  ┌───────────────────────────────┐ │
│  │   WKWebView (Your Vue App)    │ │
│  │   - Loads your web app        │ │
│  │   - JavaScript Bridge          │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │   StarPRNT SDK                │ │
│  │   - Printer communication      │ │
│  │   - Print job handling         │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │   JavaScript Bridge Handler   │ │
│  │   - Receives print requests   │ │
│  │   - Calls StarPRNT SDK        │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
           │
           ▼
    ┌──────────────┐
    │ TSP143IIIW   │
    │  (WiFi)      │
    └──────────────┘
```

## Phase 1: Project Setup & Requirements

### 1.1 Prerequisites
- [ ] **Mac with Xcode** (latest version, 14.0+)
- [ ] **Apple Developer Account** ($99/year)
- [ ] **iOS Device** (iPad/iPhone) for testing
- [ ] **StarPRNT SDK** (download from Star Micronics)
- [ ] **Basic iOS/Swift knowledge** (or developer to help)

### 1.2 Download StarPRNT SDK
- [ ] Visit: https://www.starmicronics.com/support/developers/ios-sdks/
- [ ] Download **StarPRNT SDK for iOS**
- [ ] Extract SDK package
- [ ] Review documentation and sample code

### 1.3 Create iOS Project
- [ ] Open Xcode
- [ ] Create new project: **iOS App**
- [ ] Choose **Swift** as language
- [ ] Set minimum iOS version: **15.0** (for TSP143IIIW)
- [ ] Project name: e.g., "ChinaBuffetPOS"

## Phase 2: Web App Integration

### 2.1 Add WKWebView
- [ ] Create main ViewController with WKWebView
- [ ] Configure WKWebView to load your web app
- [ ] Set up proper constraints and layout
- [ ] Handle navigation and loading states

### 2.2 Bundle Web App
**Option A: Load from URL (Development)**
- [ ] Point WKWebView to your dev server URL
- [ ] Useful for development and testing

**Option B: Bundle Assets (Production)**
- [ ] Build your Vue app: `npm run build`
- [ ] Copy `dist/` folder to iOS project
- [ ] Add to Xcode project as resources
- [ ] Load from local bundle

### 2.3 JavaScript Bridge Setup
- [ ] Create WKUserContentController
- [ ] Add message handler for JavaScript communication
- [ ] Implement message handler in Swift
- [ ] Expose native functions to JavaScript

## Phase 3: StarPRNT SDK Integration

### 3.1 Add SDK to Project
- [ ] Add StarPRNT SDK framework to Xcode project
- [ ] Link required frameworks:
  - StarIO
  - StarIO_Extension
  - (Check SDK documentation for exact frameworks)
- [ ] Configure build settings
- [ ] Add necessary permissions (if required)

### 3.2 Printer Discovery
- [ ] Implement printer discovery for network printers
- [ ] Search for TSP143IIIW on WiFi network
- [ ] Store printer information (IP address, port)
- [ ] Allow user to select/manage printers

### 3.3 Printer Connection
- [ ] Implement connection to TSP143IIIW
- [ ] Handle connection states (connected/disconnected)
- [ ] Implement reconnection logic
- [ ] Add connection status monitoring

## Phase 4: Print Functionality

### 4.1 Print Service Implementation
- [ ] Create Swift print service class
- [ ] Implement print method that:
  - Receives HTML/text from JavaScript
  - Converts to StarPRNT commands
  - Sends to printer via SDK
- [ ] Handle print job queue
- [ ] Implement error handling

### 4.2 HTML to Print Commands
- [ ] Parse HTML receipt content
- [ ] Convert to StarPRNT ESC/POS commands
- [ ] Handle:
  - Text formatting (bold, size, alignment)
  - Tables and columns
  - Lines and separators
  - Barcodes (if needed)
- [ ] Use SDK's command builder utilities

### 4.3 JavaScript API
- [ ] Create JavaScript interface for web app
- [ ] Expose `window.printToStarPrinter(html)` function
- [ ] Handle callbacks (success/error)
- [ ] Update web app to use new API

## Phase 5: Web App Modifications

### 5.1 Update Print Service
- [ ] Modify `src/services/printService.js`
- [ ] Detect if running in native app (check for bridge)
- [ ] Use JavaScript bridge if available
- [ ] Fall back to PassPRNT/standard print if not

### 5.2 Bridge Detection
```javascript
// Check if running in native app
function isNativeApp() {
  return window.webkit?.messageHandlers?.starPrinter !== undefined;
}

// Print via native bridge
function printViaNative(html) {
  if (isNativeApp()) {
    window.webkit.messageHandlers.starPrinter.postMessage({
      action: 'print',
      html: html
    });
    return true;
  }
  return false;
}
```

### 5.3 Update Print Flow
- [ ] Update `usePrinting.js` composable
- [ ] Try native bridge first
- [ ] Fall back to PassPRNT if not in native app
- [ ] Fall back to standard print as last resort

## Phase 6: Testing & Debugging

### 6.1 Development Testing
- [ ] Test printer discovery
- [ ] Test printer connection
- [ ] Test print functionality
- [ ] Test error handling
- [ ] Test with different receipt types

### 6.2 Integration Testing
- [ ] Test full print flow from web app
- [ ] Test multiple print jobs
- [ ] Test printer disconnection/reconnection
- [ ] Test on different iOS devices
- [ ] Test with different network conditions

### 6.3 Debugging Tools
- [ ] Add logging in native code
- [ ] Add JavaScript console logging
- [ ] Use Xcode debugger
- [ ] Monitor network traffic
- [ ] Check printer status

## Phase 7: Build & Deployment

### 7.1 App Configuration
- [ ] Set app bundle identifier
- [ ] Configure app icons and splash screens
- [ ] Set up app permissions
- [ ] Configure Info.plist

### 7.2 Code Signing
- [ ] Set up Apple Developer certificates
- [ ] Configure provisioning profiles
- [ ] Set up code signing in Xcode
- [ ] Test with development certificate

### 7.3 Build for Distribution
- [ ] Archive the app
- [ ] Create App Store listing (if distributing)
- [ ] Or create Ad Hoc/Enterprise distribution
- [ ] Test installation on devices

### 7.4 App Store Submission (Optional)
- [ ] Prepare app metadata
- [ ] Create screenshots
- [ ] Write app description
- [ ] Submit for review
- [ ] Handle review process

## Phase 8: Maintenance & Updates

### 8.1 Update Strategy
- [ ] Plan for web app updates (can update without app store)
- [ ] Plan for native app updates (requires app store)
- [ ] Version management strategy

### 8.2 Monitoring
- [ ] Add analytics (optional)
- [ ] Monitor print success/failure rates
- [ ] Collect error logs
- [ ] User feedback mechanism

## Technical Implementation Details

### JavaScript Bridge Example

**Swift Side:**
```swift
import WebKit

class ViewController: UIViewController, WKNavigationDelegate {
    @IBOutlet weak var webView: WKWebView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        let contentController = WKUserContentController()
        contentController.add(self, name: "starPrinter")
        
        let config = WKWebViewConfiguration()
        config.userContentController = contentController
        
        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.navigationDelegate = self
        view.addSubview(webView)
        
        // Load your web app
        if let url = URL(string: "https://your-app-url.com") {
            webView.load(URLRequest(url: url))
        }
    }
}

extension ViewController: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, 
                              didReceive message: WKScriptMessage) {
        if message.name == "starPrinter" {
            if let dict = message.body as? [String: Any],
               let action = dict["action"] as? String,
               action == "print",
               let html = dict["html"] as? String {
                // Call StarPRNT SDK to print
                printReceipt(html: html)
            }
        }
    }
    
    func printReceipt(html: String) {
        // Convert HTML to StarPRNT commands
        // Send to printer via SDK
    }
}
```

**JavaScript Side:**
```javascript
// In your Vue app
window.webkit.messageHandlers.starPrinter.postMessage({
    action: 'print',
    html: receiptHtml
});
```

## Estimated Timeline

- **Phase 1-2 (Setup & Web Integration)**: 1-2 weeks
- **Phase 3-4 (SDK Integration)**: 2-3 weeks
- **Phase 5 (Web App Updates)**: 1 week
- **Phase 6 (Testing)**: 1-2 weeks
- **Phase 7 (Build & Deploy)**: 1 week
- **Total**: 6-9 weeks (depending on experience and complexity)

## Cost Considerations

- **Apple Developer Account**: $99/year
- **Development Time**: Significant (6-9 weeks)
- **Maintenance**: Ongoing updates and support
- **App Store Review**: If distributing via App Store

## Advantages

✅ **Direct printer control** - No URL scheme limitations  
✅ **Better reliability** - Direct SDK communication  
✅ **Better error handling** - Can detect printer status  
✅ **Offline capability** - Can work without internet  
✅ **Professional solution** - Native app experience  

## Disadvantages

❌ **Significant development effort** - 6-9 weeks  
❌ **Requires iOS development skills** - Swift/Objective-C  
❌ **App Store submission** - If distributing publicly  
❌ **Maintenance overhead** - Two codebases to maintain  
❌ **Update complexity** - Native updates require app store  

## Alternative: Hybrid Approach

Consider using **Capacitor** or **Cordova** to wrap your web app:
- Easier integration
- Cross-platform (iOS + Android)
- Plugin ecosystem
- May have StarPRNT plugins available

## Next Steps

1. **Evaluate if this approach is worth it** vs. using PassPRNT/Star WebPRNT Browser
2. **Assess development resources** - Do you have iOS development capability?
3. **Consider hybrid framework** - Capacitor/Cordova might be easier
4. **Start with Phase 1** - Download SDK and review documentation
5. **Create proof of concept** - Simple print test before full integration

## Resources

- **StarPRNT SDK**: https://www.starmicronics.com/support/developers/ios-sdks/
- **Star Micronics Documentation**: https://www.starmicronics.com/support/
- **WKWebView Guide**: Apple Developer Documentation
- **Capacitor**: https://capacitorjs.com/ (if considering hybrid approach)

