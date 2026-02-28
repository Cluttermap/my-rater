# URL Rater - API Setup Guide

## Overview

The URL Rater app now includes two main features:
1. **URL Safety Checking** - Blocks inappropriate/harmful websites
2. **Website Screenshot Preview** - Shows a visual preview of the rated URL

## 🛡️ URL Safety Check APIs

### Option 1: Google Safe Browsing API (Recommended)

**Pros:**
- Most comprehensive database
- Free tier: 10,000 requests/day
- High accuracy

**Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the "Safe Browsing API"
4. Create credentials (API Key)
5. Update `app.ts` line ~57 with your API key

```typescript
const apiKey = 'YOUR_GOOGLE_SAFE_BROWSING_API_KEY';
const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;
```

**Documentation:** https://developers.google.com/safe-browsing/v4/get-started

### Option 2: VirusTotal API

**Pros:**
- Checks against multiple engines
- Good for malware/phishing detection
- Free tier: 4 requests/minute

**Setup:**
1. Sign up at [VirusTotal](https://www.virustotal.com/)
2. Get your API key from your profile
3. Implement API call:

```typescript
const apiKey = 'YOUR_VIRUSTOTAL_API_KEY';
const response = await this.http.post(
  `https://www.virustotal.com/api/v3/urls`,
  { url: url },
  { headers: { 'x-apikey': apiKey } }
).toPromise();
```

### Option 3: URLScan.io

**Pros:**
- Free and open
- Detailed scan results
- No API key needed for basic use

**Setup:**
```typescript
const response = await this.http.post(
  'https://urlscan.io/api/v1/scan/',
  { url: url, visibility: 'public' }
).toPromise();
```

---

## 📸 Website Screenshot APIs

### Option 1: Thumbnail.ws (Currently Used - Free)

**Pros:**
- No API key needed
- Simple to use
- Free tier available

**Cons:**
- Rate limits apply
- Lower quality

**Current Implementation:**
```typescript
return `https://image.thum.io/get/width/600/crop/400/${encodeURIComponent(url)}`;
```

### Option 2: ScreenshotAPI.net (Recommended)

**Pros:**
- High quality screenshots
- Free tier: 100 screenshots/month
- Customizable viewport

**Setup:**
1. Sign up at [ScreenshotAPI.net](https://screenshotapi.net/)
2. Get your API token
3. Update `generateScreenshotUrl()`:

```typescript
const apiToken = 'YOUR_SCREENSHOTAPI_TOKEN';
return `https://shot.screenshotapi.net/screenshot?token=${apiToken}&url=${encodeURIComponent(url)}&width=600&height=400&output=image&file_type=png&wait_for_event=load`;
```

### Option 3: Microlink.io

**Pros:**
- Free tier: 50 requests/day
- Multiple features (metadata, screenshots, etc.)
- Good documentation

**Setup:**
1. Sign up at [Microlink.io](https://microlink.io/)
2. Get your API key (optional for basic use)
3. Update code:

```typescript
return `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
```

### Option 4: ApiFlash

**Pros:**
- Very high quality
- Free tier: 100 screenshots/month
- Many customization options

**Setup:**
1. Sign up at [ApiFlash](https://apiflash.com/)
2. Get your access key
3. Update code:

```typescript
const apiKey = 'YOUR_APIFLASH_ACCESS_KEY';
return `https://api.apiflash.com/v1/urltoimage?access_key=${apiKey}&url=${encodeURIComponent(url)}&width=600&height=400&fresh=true&response_type=image`;
```

### Option 5: ScreenshotOne

**Pros:**
- Modern API
- Free tier available
- Good performance

**Setup:**
1. Sign up at [ScreenshotOne](https://screenshotone.com/)
2. Get your access key
3. Update code:

```typescript
const apiKey = 'YOUR_SCREENSHOTONE_ACCESS_KEY';
return `https://api.screenshotone.com/take?access_key=${apiKey}&url=${encodeURIComponent(url)}&viewport_width=1280&viewport_height=720&image_width=600&format=png`;
```

---

## 🔧 Current Implementation Status

### Active Features:
- ✅ Basic URL validation
- ✅ Keyword-based blocklist for inappropriate content
- ✅ Screenshot preview using Thumbnail.ws (free, no API key)
- ✅ Error handling and user feedback
- ✅ Loading states and animations

### Recommended Next Steps:

1. **For Production Use:**
   - Sign up for Google Safe Browsing API (safety checks)
   - Sign up for ScreenshotAPI.net or ApiFlash (screenshots)
   - Add API keys to environment variables (not in code)

2. **For Better Security:**
   - Add backend proxy to hide API keys
   - Implement rate limiting
   - Add URL sanitization

3. **For Better UX:**
   - Add caching to reduce API calls
   - Implement retry logic
   - Add progressive image loading

---

## 🔐 Security Best Practices

### Never commit API keys to version control!

**Use environment variables:**

1. Create `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  googleSafeBrowsingApiKey: 'YOUR_KEY_HERE',
  screenshotApiToken: 'YOUR_TOKEN_HERE'
};
```

2. Add to `.gitignore`:
```
src/environments/environment.ts
src/environments/environment.prod.ts
```

3. Use in code:
```typescript
import { environment } from '../environments/environment';
const apiKey = environment.googleSafeBrowsingApiKey;
```

**For production apps, use a backend proxy:**
- Keep API keys server-side
- Route requests through your own API
- Implement rate limiting and authentication

---

## 📝 Testing the Current Implementation

1. **Test URL Validation:**
   - Try: `not-a-url` → Should show validation error
   - Try: `https://google.com` → Should work

2. **Test Blocked Content:**
   - URLs containing blocked keywords will show error message
   - Add more keywords to the `blockedKeywords` array as needed

3. **Test Screenshot:**
   - Enter any valid URL
   - Screenshot should appear after rating
   - If screenshot fails to load, it will be hidden automatically

---

## 🆘 Troubleshooting

### Screenshot not loading?
- Check browser console for CORS errors
- Try a different screenshot API
- Ensure URL is accessible (not behind auth)

### Safety check always passing?
- Current implementation uses basic keyword matching
- Integrate a real API for production use

### Rate limits hit?
- Consider implementing caching
- Add user rate limiting
- Upgrade to paid API tier

---

## 📚 Additional Resources

- [OWASP URL Validation Guide](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Angular HttpClient Guide](https://angular.dev/guide/http)
