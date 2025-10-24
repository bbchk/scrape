# Web Scraping Project - Enhanced Anti-Detection

This project has been updated with advanced anti-detection measures to handle modern website security systems.

## 🔧 Recent Updates

### Enhanced Anti-Detection Features

1. **Advanced Stealth Configuration**
   - Updated Puppeteer stealth plugin
   - Added adblocker plugin to reduce tracking
   - Implemented CAPTCHA solving capabilities

2. **Sophisticated Browser Fingerprinting**
   - Randomized user agents from modern browsers only
   - Dynamic viewport sizing
   - Randomized screen properties, timezone, and platform
   - Memory and hardware fingerprint spoofing

3. **Human-Like Behavior Simulation**
   - Random mouse movements and scrolling
   - Variable delays between requests (2-8 seconds)
   - Exponential backoff retry mechanism
   - Session rotation after 50 requests

4. **Enhanced Error Handling**
   - Automatic retry with exponential backoff
   - CAPTCHA detection and solving
   - Debug screenshot capture on errors
   - Comprehensive logging system

5. **Request Management**
   - Session manager for tracking request patterns
   - Rate limiting to avoid detection
   - Failed URL tracking and recovery
   - Browser data clearing between sessions

## 📦 Dependencies Added

- `puppeteer-extra-plugin-adblocker` - Blocks ads and trackers
- `puppeteer-extra-plugin-recaptcha` - Automatic CAPTCHA solving
- `user-agents` - Modern user agent generation
- `rotating-file-stream` - Enhanced logging capabilities

## 🚀 Usage

```bash
# Install dependencies
npm install

# Run the scraper
npm start
```

## ⚙️ Configuration

The scraping behavior can be customized through `config.json`:

- **Delays**: Control timing between requests
- **Browser**: Configure browser behavior
- **Session**: Manage session rotation
- **Detection**: Toggle anti-detection features
- **Logging**: Control debug output

## 🔍 Debug Features

- **Error Screenshots**: Automatically captured in `./debug/` folder
- **Failed URL Tracking**: Maintains list of problematic URLs
- **Comprehensive Logging**: Progress tracking and error reporting
- **Session Statistics**: Monitor request patterns

## 🛡️ Anti-Detection Strategies

1. **Traffic Pattern Randomization**
   - Variable delays between requests
   - Random scrolling and mouse movements
   - Session rotation to avoid pattern detection

2. **Browser Fingerprint Randomization**
   - Rotating user agents from real browsers
   - Dynamic viewport and screen properties
   - Randomized hardware specifications

3. **Network Behavior**
   - Request header randomization
   - Cookie and cache management
   - Connection timing variation

4. **Content Loading Simulation**
   - Image loading monitoring
   - JavaScript execution delays
   - Network idle state waiting

## 🔧 Troubleshooting

### Common Issues

1. **CAPTCHA Challenges**
   - The system now automatically detects and attempts to solve CAPTCHAs
   - If persistent, increase delays in config.json

2. **Rate Limiting**
   - Adjust `minRequestDelay` and `maxRequestDelay` in config
   - Reduce `maxRequestsPerSession` for more aggressive rotation

3. **Browser Detection**
   - Enable all anti-detection features in config
   - Consider using proxy rotation (can be added to sessionManager)

### Debug Information

Check the `./debug/` folder for:
- Error screenshots with timestamps
- Failed request logs
- Session statistics

## 📊 Performance Monitoring

The scraper now provides detailed progress reporting:
- Brand-by-brand progress tracking
- Success/failure statistics
- Retry attempt logging
- Session rotation notifications

## 🔒 Educational Purpose

This project is designed for educational purposes to understand web scraping challenges and anti-detection techniques. Always respect website terms of service and robots.txt files.

## 📝 License

This project is for educational use only. Please ensure compliance with applicable laws and website terms of service.
