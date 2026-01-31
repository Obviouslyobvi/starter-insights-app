/**
 * Interactive Selector Helper
 *
 * This script helps you identify the correct CSS selectors for scraping
 * the PFAC Pro directory. Run this first to configure the scraper.
 *
 * Usage: node scraper/selectorHelper.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CONFIG_FILE = path.join(__dirname, 'scraperConfig.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

async function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  console.log(`\n✓ Configuration saved to ${CONFIG_FILE}`);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('           PFAC Pro Selector Helper');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('This tool will help you identify the correct CSS selectors');
  console.log('for scraping contact information from the directory.\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // Inject helper script into page
  await page.addInitScript(() => {
    window.highlightElement = (selector) => {
      // Remove previous highlights
      document.querySelectorAll('.scraper-highlight').forEach(el => {
        el.classList.remove('scraper-highlight');
        el.style.outline = '';
      });

      // Highlight matching elements
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.classList.add('scraper-highlight');
        el.style.outline = '3px solid red';
      });
      return elements.length;
    };

    window.getClickedElementInfo = () => {
      return new Promise(resolve => {
        const handler = (e) => {
          e.preventDefault();
          e.stopPropagation();

          const el = e.target;
          const info = {
            tagName: el.tagName.toLowerCase(),
            id: el.id,
            classes: Array.from(el.classList),
            text: el.innerText.substring(0, 100),
            href: el.href || '',
            parentClasses: el.parentElement ? Array.from(el.parentElement.classList) : []
          };

          document.removeEventListener('click', handler, true);
          resolve(info);
        };
        document.addEventListener('click', handler, true);
      });
    };
  });

  try {
    console.log('📍 Opening browser and navigating to search page...');
    await page.goto('https://pfac-pro.site-ym.com/search/newsearch.asp', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log('\n⏳ Please log in if required.');
    console.log('   Once you see the search results, press Enter to continue...\n');
    await question('Press Enter when search results are visible: ');

    const config = {
      baseUrl: 'https://pfac-pro.site-ym.com/search/newsearch.asp',
      selectors: {}
    };

    // Step 1: Identify contact rows
    console.log('\n────────────────────────────────────────────────────────────────');
    console.log('STEP 1: Identify Contact Rows');
    console.log('────────────────────────────────────────────────────────────────');
    console.log('\nLook at the page and identify what contains each contact entry.');
    console.log('This is usually a table row (tr) or a div with a class.\n');

    const suggestedRowSelectors = [
      'table tbody tr',
      'table.searchResults tr',
      '.search-results tr',
      '.member-list tr',
      '.directory-listing tr',
      'table tr[class*="row"]'
    ];

    // Test each selector
    for (const selector of suggestedRowSelectors) {
      const count = await page.evaluate((sel) => document.querySelectorAll(sel).length, selector);
      if (count > 0) {
        console.log(`   Found ${count} elements with: ${selector}`);
      }
    }

    const rowSelector = await question('\nEnter the selector for contact rows (or press Enter to use "table tbody tr"): ');
    config.selectors.contactRow = rowSelector || 'table tbody tr';

    // Highlight and verify
    const rowCount = await page.evaluate((sel) => window.highlightElement(sel), config.selectors.contactRow);
    console.log(`\n✓ Highlighted ${rowCount} contact rows. Check if this looks correct.`);
    await question('Press Enter to continue (or Ctrl+C to restart): ');

    // Step 2: Identify name link within each row
    console.log('\n────────────────────────────────────────────────────────────────');
    console.log('STEP 2: Identify Name Link');
    console.log('────────────────────────────────────────────────────────────────');
    console.log('\nWithin each contact row, identify the clickable name link.');
    console.log('This is usually an <a> tag that links to the detail page.\n');

    const suggestedNameSelectors = [
      'td:first-child a',
      'td a[href*="profile"]',
      'td a[href*="member"]',
      'a.member-name',
      'td:nth-child(1) a',
      'a[href*="contact"]'
    ];

    for (const selector of suggestedNameSelectors) {
      const count = await page.evaluate((sel) => document.querySelectorAll(sel).length, selector);
      if (count > 0) {
        console.log(`   Found ${count} elements with: ${selector}`);
      }
    }

    const nameSelector = await question('\nEnter the selector for name links (or press Enter to use "td a"): ');
    config.selectors.nameLink = nameSelector || 'td a';

    // Step 3: Identify address field
    console.log('\n────────────────────────────────────────────────────────────────');
    console.log('STEP 3: Identify Address Column');
    console.log('────────────────────────────────────────────────────────────────');
    console.log('\nWhich column or element contains the address?');
    console.log('Count the columns from left (starting at 1).\n');

    const addressColNum = await question('Enter the column number for address (e.g., 2), or a CSS selector: ');
    if (addressColNum.match(/^\d+$/)) {
      config.selectors.address = `td:nth-child(${addressColNum})`;
    } else {
      config.selectors.address = addressColNum || 'td:nth-child(2)';
    }

    // Step 4: Identify city/state/zip
    console.log('\n────────────────────────────────────────────────────────────────');
    console.log('STEP 4: Identify City/State/Zip Column');
    console.log('────────────────────────────────────────────────────────────────');

    const cityColNum = await question('Enter the column number for city/state/zip, or a CSS selector: ');
    if (cityColNum.match(/^\d+$/)) {
      config.selectors.cityStateZip = `td:nth-child(${cityColNum})`;
    } else {
      config.selectors.cityStateZip = cityColNum || 'td:nth-child(3)';
    }

    // Step 5: Identify phone
    console.log('\n────────────────────────────────────────────────────────────────');
    console.log('STEP 5: Identify Phone Column');
    console.log('────────────────────────────────────────────────────────────────');

    const phoneColNum = await question('Enter the column number for phone, or a CSS selector: ');
    if (phoneColNum.match(/^\d+$/)) {
      config.selectors.phone = `td:nth-child(${phoneColNum})`;
    } else {
      config.selectors.phone = phoneColNum || 'td:nth-child(4)';
    }

    // Step 6: Test clicking a name to see detail page
    console.log('\n────────────────────────────────────────────────────────────────');
    console.log('STEP 6: Test Detail Page for Email');
    console.log('────────────────────────────────────────────────────────────────');
    console.log('\nNow click on a name to go to their detail page.');
    console.log('The script will then ask you to identify where the email is.\n');

    const firstNameLink = await page.$(`${config.selectors.contactRow} ${config.selectors.nameLink}`);
    if (firstNameLink) {
      const href = await firstNameLink.getAttribute('href');
      console.log(`Clicking: ${href}`);
      await firstNameLink.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      console.log('\nNow on the detail page. Look for where the email is displayed.');

      const emailSuggestions = [
        'a[href^="mailto:"]',
        'span.email',
        '.member-email',
        '[class*="email"]',
        'td:contains("Email") + td'
      ];

      for (const selector of emailSuggestions) {
        try {
          const count = await page.evaluate((sel) => document.querySelectorAll(sel).length, selector);
          if (count > 0) {
            const text = await page.evaluate((sel) => {
              const el = document.querySelector(sel);
              return el ? el.innerText || el.href : '';
            }, selector);
            console.log(`   Found with "${selector}": ${text.substring(0, 50)}`);
          }
        } catch (e) {
          // Skip invalid selectors
        }
      }

      const emailSelector = await question('\nEnter the selector for email (or press Enter to use "a[href^=\\"mailto:\\"]"): ');
      config.selectors.email = emailSelector || 'a[href^="mailto:"]';
    }

    // Step 7: Navigate back and find next page button
    console.log('\n────────────────────────────────────────────────────────────────');
    console.log('STEP 7: Identify Next Page Button');
    console.log('────────────────────────────────────────────────────────────────');

    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    console.log('\nBack on results page. Look for the next page button/link.');
    console.log('This is usually a ">" or "Next" link at the bottom.\n');

    const paginationSuggestions = [
      'a:has-text("Next")',
      'a:has-text("›")',
      'a[title*="Next"]',
      '.pagination a.next',
      'input[value="Next"]',
      'a[rel="next"]'
    ];

    for (const selector of paginationSuggestions) {
      try {
        const found = await page.$(selector);
        if (found) {
          const text = await found.innerText().catch(() => 'button');
          console.log(`   Found: ${selector} -> "${text}"`);
        }
      } catch (e) {
        // Skip
      }
    }

    const nextSelector = await question('\nEnter the selector for next page button: ');
    config.selectors.nextPage = nextSelector || 'a:has-text("Next")';

    // Save configuration
    console.log('\n────────────────────────────────────────────────────────────────');
    console.log('CONFIGURATION COMPLETE');
    console.log('────────────────────────────────────────────────────────────────');
    console.log('\nYour configuration:');
    console.log(JSON.stringify(config, null, 2));

    await saveConfig(config);

    console.log('\n✓ You can now run the scraper with: node scraper/contactScraperConfigurable.js');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    rl.close();
    await browser.close();
  }
}

main().catch(console.error);
