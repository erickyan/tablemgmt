# Deployment Guide - Fixing 404 Errors on Refresh

This application uses Vue Router in **history mode**, which means all routes (like `/cashier`, `/about`) are handled by the client-side router. When you refresh a page or navigate directly to a route, the server needs to be configured to serve `index.html` for all routes instead of returning a 404.

## Quick Fix

Choose the configuration file below that matches your hosting platform:

### 1. **Netlify** (or similar platforms using `_redirects`)
- ✅ **File created**: `public/_redirects`
- This file is automatically copied to `dist/` during build
- No additional configuration needed

### 2. **Vercel**
- ✅ **File created**: `vercel.json`
- Deploy and Vercel will automatically use this configuration

### 3. **Apache Server** (shared hosting, cPanel, etc.)
- ✅ **File created**: `public/.htaccess`
- This file is automatically copied to `dist/` during build
- Ensure your Apache server has `mod_rewrite` enabled

### 4. **Firebase Hosting**
- ✅ **File created**: `firebase.json`
- Deploy using: `firebase deploy --only hosting`
- Make sure your build output is in the `dist` folder

### 5. **Nginx**
- ✅ **File created**: `nginx.conf.example`
- Copy this configuration to your Nginx server config
- Update `server_name` and `root` paths as needed

### 6. **Other Platforms**

#### **GitHub Pages**
Add a `404.html` file that redirects to `index.html`:
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Redirecting...</title>
    <script>
      sessionStorage.redirect = location.href;
      location.replace('/vue-vuetify/index.html');
    </script>
  </head>
  <body></body>
</html>
```

#### **AWS S3 + CloudFront**
1. Configure S3 bucket for static website hosting
2. Set error document to `index.html`
3. In CloudFront, create a custom error response:
   - HTTP Error Code: `404`
   - Response Page Path: `/index.html`
   - HTTP Response Code: `200`

#### **Azure Static Web Apps**
The platform automatically handles SPA routing - no configuration needed.

## Testing

After deploying, test by:
1. Navigate to your app's root URL
2. Click on the "Cashier" link (or navigate to `/cashier`)
3. **Refresh the page** - it should load correctly instead of showing 404
4. Try navigating directly to `/cashier` in a new tab

## Troubleshooting

- **Still getting 404?** Make sure the configuration file is in the correct location:
  - For `_redirects` and `.htaccess`: Should be in `public/` folder (copied to `dist/` during build)
  - For `vercel.json` and `firebase.json`: Should be in the project root
- **Build output**: Ensure you're deploying the `dist` folder, not the `src` folder
- **Server logs**: Check your hosting platform's logs for routing errors

