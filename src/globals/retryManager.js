import fs from 'fs';
import path from 'path';

export class RetryManager {
  constructor() {
    this.maxRetries = 3;
    this.baseDelay = 1000;
    this.maxDelay = 30000;
    this.failedUrls = new Set();
    this.blockedIndicators = [
      'blocked',
      'captcha',
      'verification',
      'suspicious activity',
      'rate limit',
      'too many requests',
      '403',
      '429',
      'cloudflare',
      'access denied'
    ];
  }

  async executeWithRetry(operation, context = {}) {
    let lastError;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.min(
            this.baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
            this.maxDelay
          );
          console.log(`Retry attempt ${attempt}/${this.maxRetries} after ${Math.round(delay / 1000)}s delay...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const result = await operation();
        
        // If we succeeded after retries, remove from failed URLs
        if (context.url && this.failedUrls.has(context.url)) {
          this.failedUrls.delete(context.url);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt + 1} failed: ${error.message}`);
        
        // Check if this looks like a blocking error
        if (this.isBlockingError(error)) {
          console.warn('Detected potential blocking. Increasing delay...');
          await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 5000));
        }
        
        // Mark URL as failed if this is the last attempt
        if (attempt === this.maxRetries && context.url) {
          this.failedUrls.add(context.url);
        }
      }
    }
    
    throw new Error(`Operation failed after ${this.maxRetries + 1} attempts. Last error: ${lastError.message}`);
  }

  isBlockingError(error) {
    const errorMessage = error.message.toLowerCase();
    return this.blockedIndicators.some(indicator => 
      errorMessage.includes(indicator)
    );
  }

  isUrlFailed(url) {
    return this.failedUrls.has(url);
  }

  async handlePageError(page, error) {
    try {
      // Take screenshot for debugging
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = `./debug/error-${timestamp}.png`;
      
      // Create debug directory if it doesn't exist
      const debugDir = path.dirname(screenshotPath);
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
      }
      
      await page.screenshot({ path: screenshotPath });
      console.log(`Error screenshot saved: ${screenshotPath}`);
      
      // Get page title and URL for context
      const title = await page.title().catch(() => 'Unknown');
      const url = page.url();
      
      console.log(`Page context - Title: ${title}, URL: ${url}`);
      
    } catch (debugError) {
      console.warn('Failed to capture debug info:', debugError.message);
    }
  }

  async checkForCaptcha(page) {
    try {
      const captchaSelectors = [
        '[data-testid="captcha"]',
        '.captcha',
        '#captcha',
        '[class*="captcha"]',
        '[id*="captcha"]',
        'iframe[src*="recaptcha"]',
        '.g-recaptcha',
        '[data-sitekey]'
      ];
      
      for (const selector of captchaSelectors) {
        const element = await page.$(selector);
        if (element) {
          console.warn('CAPTCHA detected on page');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  async handleCaptcha(page) {
    console.log('Attempting to handle CAPTCHA...');
    
    // Wait longer when CAPTCHA is detected
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Try to solve with puppeteer-extra-plugin-recaptcha
    try {
      await page.solveRecaptchas();
      console.log('CAPTCHA potentially solved');
      return true;
    } catch (error) {
      console.warn('Failed to solve CAPTCHA automatically:', error.message);
      return false;
    }
  }

  getStats() {
    return {
      failedUrls: Array.from(this.failedUrls),
      failedCount: this.failedUrls.size
    };
  }
}

export const retryManager = new RetryManager();
