import fs from 'fs';
import path from 'path';

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.requestCounts = new Map();
    this.lastRequestTime = new Map();
    this.maxRequestsPerSession = 50;
    this.minDelayBetweenRequests = 2000; // 2 seconds
    this.maxDelayBetweenRequests = 8000; // 8 seconds
  }

  getSessionKey(userAgent, viewport) {
    return `${userAgent}_${viewport.width}x${viewport.height}`;
  }

  shouldRotateSession(sessionKey) {
    const requestCount = this.requestCounts.get(sessionKey) || 0;
    return requestCount >= this.maxRequestsPerSession;
  }

  async waitForNextRequest(sessionKey) {
    const lastTime = this.lastRequestTime.get(sessionKey) || 0;
    const now = Date.now();
    const timeSinceLastRequest = now - lastTime;
    
    const minDelay = this.minDelayBetweenRequests;
    const maxDelay = this.maxDelayBetweenRequests;
    const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
    
    if (timeSinceLastRequest < randomDelay) {
      const waitTime = randomDelay - timeSinceLastRequest;
      console.log(`Waiting ${Math.round(waitTime / 1000)}s before next request...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime.set(sessionKey, Date.now());
    this.requestCounts.set(sessionKey, (this.requestCounts.get(sessionKey) || 0) + 1);
  }

  resetSession(sessionKey) {
    this.requestCounts.delete(sessionKey);
    this.lastRequestTime.delete(sessionKey);
  }

  getRandomProxyRotation() {
    // This would integrate with proxy services if needed
    // For now, return null to use direct connection
    return null;
  }

  generateSessionFingerprint() {
    const languages = ['uk-UA', 'uk', 'en-US', 'en', 'ru'];
    const timezones = ['Europe/Kiev', 'Europe/Warsaw', 'Europe/Berlin'];
    const platforms = ['Win32', 'MacIntel', 'Linux x86_64'];
    
    return {
      language: languages[Math.floor(Math.random() * languages.length)],
      timezone: timezones[Math.floor(Math.random() * timezones.length)],
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      cookiesEnabled: true,
      doNotTrack: Math.random() > 0.5 ? '1' : null,
      webgl: this.generateWebGLFingerprint()
    };
  }

  generateWebGLFingerprint() {
    const renderers = [
      'ANGLE (Intel(R) HD Graphics 620 Direct3D11 vs_5_0 ps_5_0)',
      'ANGLE (NVIDIA GeForce GTX 1060 Direct3D11 vs_5_0 ps_5_0)',
      'ANGLE (AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0)'
    ];
    return renderers[Math.floor(Math.random() * renderers.length)];
  }

  async clearBrowserData(page) {
    try {
      // Clear cookies, local storage, session storage
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      const client = await page.target().createCDPSession();
      await client.send('Network.clearBrowserCookies');
      await client.send('Network.clearBrowserCache');
    } catch (error) {
      console.warn('Failed to clear browser data:', error.message);
    }
  }
}

export const sessionManager = new SessionManager();
