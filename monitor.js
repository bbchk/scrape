#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

class ScrapingMonitor {
  constructor() {
    this.dataDir = './src/data';
    this.infoDir = './src/info';
    this.notFoundDir = './src/notFound';
    this.debugDir = './debug';
  }

  getDirectoryStats(dir) {
    if (!fs.existsSync(dir)) {
      return { files: 0, totalSize: 0 };
    }

    const files = fs.readdirSync(dir);
    let totalSize = 0;

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        totalSize += stats.size;
      }
    });

    return { files: files.length, totalSize };
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getScrapingProgress() {
    const brands = ['crona', 'eurokraft', 'istar', 'kainar', 'maximus'];
    const progress = {};

    brands.forEach(brand => {
      const infoFile = path.join(this.infoDir, `${brand}.json`);
      const dataFile = path.join(this.dataDir, `${brand}.json`);
      const notFoundFile = path.join(this.notFoundDir, `${brand}.txt`);

      progress[brand] = {
        searchCompleted: fs.existsSync(infoFile),
        scrapingCompleted: fs.existsSync(dataFile),
        hasNotFound: fs.existsSync(notFoundFile),
        infoSize: fs.existsSync(infoFile) ? fs.statSync(infoFile).size : 0,
        dataSize: fs.existsSync(dataFile) ? fs.statSync(dataFile).size : 0,
        lastModified: {
          info: fs.existsSync(infoFile) ? fs.statSync(infoFile).mtime : null,
          data: fs.existsSync(dataFile) ? fs.statSync(dataFile).mtime : null
        }
      };

      // Get product counts
      if (fs.existsSync(infoFile)) {
        try {
          const infoData = JSON.parse(fs.readFileSync(infoFile, 'utf8'));
          progress[brand].productsFound = Array.isArray(infoData) ? infoData.length : 0;
        } catch (e) {
          progress[brand].productsFound = 0;
        }
      }

      if (fs.existsSync(dataFile)) {
        try {
          const dataData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
          progress[brand].productsScraped = Array.isArray(dataData) ? dataData.length : 0;
        } catch (e) {
          progress[brand].productsScraped = 0;
        }
      }
    });

    return progress;
  }

  displayReport() {
    console.log('🕷️  SCRAPING PROGRESS REPORT');
    console.log('============================\n');

    const progress = this.getScrapingProgress();
    const brands = Object.keys(progress);

    // Overall statistics
    let totalSearchCompleted = 0;
    let totalScrapingCompleted = 0;
    let totalProductsFound = 0;
    let totalProductsScraped = 0;

    brands.forEach(brand => {
      const p = progress[brand];
      if (p.searchCompleted) totalSearchCompleted++;
      if (p.scrapingCompleted) totalScrapingCompleted++;
      totalProductsFound += p.productsFound || 0;
      totalProductsScraped += p.productsScraped || 0;
    });

    console.log('📊 OVERALL PROGRESS:');
    console.log(`   Brands: ${brands.length}`);
    console.log(`   Search completed: ${totalSearchCompleted}/${brands.length} (${Math.round(totalSearchCompleted/brands.length*100)}%)`);
    console.log(`   Scraping completed: ${totalScrapingCompleted}/${brands.length} (${Math.round(totalScrapingCompleted/brands.length*100)}%)`);
    console.log(`   Products found: ${totalProductsFound}`);
    console.log(`   Products scraped: ${totalProductsScraped}\n`);

    // Brand-by-brand details
    console.log('📋 BRAND DETAILS:');
    brands.forEach(brand => {
      const p = progress[brand];
      const searchStatus = p.searchCompleted ? '✅' : '❌';
      const scrapeStatus = p.scrapingCompleted ? '✅' : '❌';
      const notFoundStatus = p.hasNotFound ? '⚠️' : '✅';

      console.log(`\n   ${brand.toUpperCase()}:`);
      console.log(`      Search: ${searchStatus} | Scraping: ${scrapeStatus} | Issues: ${notFoundStatus}`);
      console.log(`      Products found: ${p.productsFound || 0}`);
      console.log(`      Products scraped: ${p.productsScraped || 0}`);
      console.log(`      Data size: ${this.formatBytes(p.dataSize)}`);
      
      if (p.lastModified.data) {
        const lastModified = new Date(p.lastModified.data).toLocaleString();
        console.log(`      Last updated: ${lastModified}`);
      }
    });

    // Directory statistics
    console.log('\n📁 DIRECTORY STATISTICS:');
    const dataStats = this.getDirectoryStats(this.dataDir);
    const infoStats = this.getDirectoryStats(this.infoDir);
    const debugStats = this.getDirectoryStats(this.debugDir);

    console.log(`   Data files: ${dataStats.files} (${this.formatBytes(dataStats.totalSize)})`);
    console.log(`   Info files: ${infoStats.files} (${this.formatBytes(infoStats.totalSize)})`);
    console.log(`   Debug files: ${debugStats.files} (${this.formatBytes(debugStats.totalSize)})`);

    // Recent activity
    console.log('\n🕒 RECENT ACTIVITY:');
    const allFiles = [];
    
    [this.dataDir, this.infoDir, this.debugDir].forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            allFiles.push({
              path: filePath,
              modified: stats.mtime,
              size: stats.size
            });
          }
        });
      }
    });

    allFiles.sort((a, b) => b.modified - a.modified);
    allFiles.slice(0, 5).forEach(file => {
      const relPath = path.relative('.', file.path);
      const modifiedTime = file.modified.toLocaleString();
      console.log(`   ${relPath} (${this.formatBytes(file.size)}) - ${modifiedTime}`);
    });

    console.log('\n✨ Report completed!');
  }
}

const monitor = new ScrapingMonitor();
monitor.displayReport();
