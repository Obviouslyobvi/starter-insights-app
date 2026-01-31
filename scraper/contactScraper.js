/**
 * Contact Scraper for PFAC Pro Directory
 *
 * This script scrapes contact information from the PFAC Pro member directory
 * and exports it to a CSV file for Google Sheets import.
 *
 * Usage:
 *   1. Run: npm install playwright
 *   2. Run: npx playwright install chromium
 *   3. Run: node scraper/contactScraper.js
 *
 * The browser will open and navigate to the search page.
 * If login is required, log in manually - the script will wait.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: 'https://pfac-pro.site-ym.com/search/newsearch.asp',
  outputFile: 'contacts_export.csv',
  headless: false, // Set to true to run without visible browser
  slowMo: 100, // Milliseconds between actions (helps with page load)
  timeout: 30000, // Page load timeout
  maxPages: 30, // Maximum pages to scrape (set higher if needed)
  delayBetweenContacts: 500, // Delay between processing each contact
  delayBetweenPages: 1000, // Delay between page navigation
};

// CSV headers
const CSV_HEADERS = [
  'First Name',
  'Middle Initial',
  'Last Name',
  'Address1',
  'Address2',
  'City',
  'State',
  'Zip',
  'Phone',
  'Email'
];

// Store all scraped contacts
let allContacts = [];

/**
 * Parse a full name into first, middle initial, and last name
 */
function parseName(fullName) {
  if (!fullName) return { firstName: '', middleInitial: '', lastName: '' };

  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 1) {
    return { firstName: parts[0], middleInitial: '', lastName: '' };
  } else if (parts.length === 2) {
    return { firstName: parts[0], middleInitial: '', lastName: parts[1] };
  } else {
    // Check if second part is a middle initial (single letter or letter with period)
    const middlePart = parts[1];
    if (middlePart.length === 1 || (middlePart.length === 2 && middlePart.endsWith('.'))) {
      return {
        firstName: parts[0],
        middleInitial: middlePart.replace('.', ''),
        lastName: parts.slice(2).join(' ')
      };
    } else {
      // Assume first part is first name, last part is last name, middle parts are middle name
      return {
        firstName: parts[0],
        middleInitial: parts[1].charAt(0),
        lastName: parts.slice(2).join(' ')
      };
    }
  }
}

/**
 * Parse address components from address text
 */
function parseAddress(addressText) {
  if (!addressText) {
    return { address1: '', address2: '', city: '', state: '', zip: '' };
  }

  const lines = addressText.split('\n').map(l => l.trim()).filter(l => l);

  let address1 = '';
  let address2 = '';
  let city = '';
  let state = '';
  let zip = '';

  if (lines.length >= 1) {
    address1 = lines[0];
  }

  if (lines.length >= 2) {
    // Check if second line is city, state zip or another address line
    const cityStateZipMatch = lines[lines.length - 1].match(/^(.+?),?\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);

    if (cityStateZipMatch) {
      city = cityStateZipMatch[1].trim();
      state = cityStateZipMatch[2].toUpperCase();
      zip = cityStateZipMatch[3];

      // If there's more than 2 lines, the middle ones are address2
      if (lines.length > 2) {
        address2 = lines.slice(1, -1).join(', ');
      }
    } else {
      // Try to parse last line differently
      address2 = lines.slice(1).join(', ');
    }
  }

  return { address1, address2, city, state, zip };
}

/**
 * Clean and format phone number
 */
function cleanPhone(phone) {
  if (!phone) return '';
  return phone.replace(/[^\d-().\s+]/g, '').trim();
}

/**
 * Clean and format email
 */
function cleanEmail(email) {
  if (!email) return '';
  const emailMatch = email.match(/[\w.-]+@[\w.-]+\.\w+/);
  return emailMatch ? emailMatch[0].toLowerCase() : '';
}

/**
 * Escape CSV field
 */
function escapeCSV(field) {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert contacts array to CSV string
 */
function toCSV(contacts) {
  const header = CSV_HEADERS.map(escapeCSV).join(',');
  const rows = contacts.map(contact => {
    return [
      contact.firstName,
      contact.middleInitial,
      contact.lastName,
      contact.address1,
      contact.address2,
      contact.city,
      contact.state,
      contact.zip,
      contact.phone,
      contact.email
    ].map(escapeCSV).join(',');
  });
  return [header, ...rows].join('\n');
}

/**
 * Save contacts to CSV file
 */
function saveToCSV(contacts, filename) {
  const csv = toCSV(contacts);
  const outputPath = path.join(__dirname, '..', filename);
  fs.writeFileSync(outputPath, csv, 'utf8');
  console.log(`\n✓ Saved ${contacts.length} contacts to ${outputPath}`);
  return outputPath;
}

/**
 * Wait for user to be logged in (check for search results)
 */
async function waitForLogin(page) {
  console.log('\n⏳ Waiting for search results to load...');
  console.log('   If you need to log in, please do so in the browser window.');
  console.log('   The script will continue automatically once results appear.\n');

  // Wait for either search results or a results table to appear
  // Adjust these selectors based on the actual page structure
  try {
    await page.waitForSelector(
      'table.searchResults, .search-results, .member-list, [class*="result"], [id*="result"], table tbody tr',
      { timeout: 300000 } // 5 minute timeout for login
    );
    console.log('✓ Search results detected. Starting to scrape...\n');
  } catch (e) {
    console.log('⚠ Could not detect search results. Proceeding anyway...\n');
  }
}

/**
 * Extract contacts from the current page
 */
async function extractContactsFromPage(page) {
  const contacts = [];

  // This function runs in the browser context
  // We'll get all contact entries and their basic info first
  const contactElements = await page.$$eval(
    // Try multiple selectors for contact rows
    'table.searchResults tr, .search-results .result-item, .member-list .member, table tbody tr:has(a)',
    (rows) => {
      return rows.map((row, index) => {
        // Skip header rows
        if (row.querySelector('th')) return null;

        // Try to find the name link
        const nameLink = row.querySelector('a[href*="profile"], a[href*="member"], a[href*="contact"], a[href*="detail"], td:first-child a, td a');
        if (!nameLink) return null;

        // Get all text content from the row
        const cells = Array.from(row.querySelectorAll('td'));
        const cellTexts = cells.map(cell => cell.innerText.trim());

        return {
          index,
          name: nameLink.innerText.trim(),
          href: nameLink.href,
          rowText: row.innerText,
          cellTexts
        };
      }).filter(item => item !== null);
    }
  );

  return contactElements;
}

/**
 * Get email from detail page
 */
async function getEmailFromDetailPage(page, contactUrl) {
  try {
    await page.goto(contactUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });
    await page.waitForTimeout(500);

    // Try multiple selectors to find email
    const email = await page.evaluate(() => {
      // Method 1: Look for mailto links
      const mailtoLink = document.querySelector('a[href^="mailto:"]');
      if (mailtoLink) {
        return mailtoLink.href.replace('mailto:', '').split('?')[0];
      }

      // Method 2: Look for email in text content with email pattern
      const emailRegex = /[\w.-]+@[\w.-]+\.\w{2,}/g;
      const bodyText = document.body.innerText;
      const matches = bodyText.match(emailRegex);
      if (matches && matches.length > 0) {
        // Filter out common non-person emails
        const personEmails = matches.filter(email =>
          !email.includes('noreply') &&
          !email.includes('support@') &&
          !email.includes('info@') &&
          !email.includes('admin@')
        );
        return personEmails[0] || matches[0];
      }

      // Method 3: Look for labeled email fields
      const emailLabel = Array.from(document.querySelectorAll('*')).find(el =>
        el.innerText && el.innerText.toLowerCase().includes('email:')
      );
      if (emailLabel) {
        const text = emailLabel.innerText;
        const match = text.match(/email:\s*([\w.-]+@[\w.-]+\.\w+)/i);
        if (match) return match[1];
      }

      return '';
    });

    return cleanEmail(email);
  } catch (e) {
    console.log(`   ⚠ Could not get email: ${e.message}`);
    return '';
  }
}

/**
 * Parse contact details from row data
 */
function parseContactFromRow(rowData) {
  const { name, cellTexts, rowText } = rowData;

  // Parse the name
  const { firstName, middleInitial, lastName } = parseName(name);

  // Try to extract address, phone from cell texts or row text
  let address1 = '', address2 = '', city = '', state = '', zip = '', phone = '';

  // Look for phone number pattern
  const phoneMatch = rowText.match(/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
  if (phoneMatch) {
    phone = cleanPhone(phoneMatch[1]);
  }

  // Look for address pattern (number followed by street name)
  const addressMatch = rowText.match(/(\d+\s+[A-Za-z0-9\s,.#-]+)/);
  if (addressMatch) {
    const addressParts = parseAddress(addressMatch[1]);
    address1 = addressParts.address1;
    address2 = addressParts.address2;
  }

  // Look for city, state zip pattern
  const cityStateZipMatch = rowText.match(/([A-Za-z\s]+),?\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
  if (cityStateZipMatch) {
    city = cityStateZipMatch[1].trim();
    state = cityStateZipMatch[2];
    zip = cityStateZipMatch[3];
  }

  // If we have cell texts, try to parse them more specifically
  if (cellTexts && cellTexts.length > 1) {
    // Common patterns:
    // [Name, Address, City State Zip, Phone]
    // [Name, Company, Address, City State Zip, Phone]
    cellTexts.forEach((cell, i) => {
      if (i === 0) return; // Skip name cell

      // Check if it's a phone
      const cellPhoneMatch = cell.match(/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
      if (cellPhoneMatch && !phone) {
        phone = cleanPhone(cellPhoneMatch[1]);
        return;
      }

      // Check if it's city, state, zip
      const cellCityMatch = cell.match(/^([A-Za-z\s]+),?\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
      if (cellCityMatch && !city) {
        city = cellCityMatch[1].trim();
        state = cellCityMatch[2];
        zip = cellCityMatch[3];
        return;
      }

      // Check if it looks like an address (starts with number)
      if (cell.match(/^\d+\s/) && !address1) {
        address1 = cell;
        return;
      }
    });
  }

  return {
    firstName,
    middleInitial,
    lastName,
    address1,
    address2,
    city,
    state,
    zip,
    phone,
    email: '' // Will be filled in later
  };
}

/**
 * Check if there's a next page and click it
 */
async function goToNextPage(page) {
  try {
    // Try multiple selectors for next page button
    const nextButton = await page.$(
      'a:has-text("Next"), a:has-text("›"), a:has-text(">>"), ' +
      'a[title*="Next"], a[aria-label*="Next"], ' +
      '.pagination a.next, .pager a.next, ' +
      'input[value="Next"], button:has-text("Next"), ' +
      'a[href*="page"]:has-text(">"), .next-page'
    );

    if (nextButton) {
      const isDisabled = await nextButton.evaluate(el =>
        el.classList.contains('disabled') ||
        el.hasAttribute('disabled') ||
        el.getAttribute('aria-disabled') === 'true'
      );

      if (!isDisabled) {
        await nextButton.click();
        await page.waitForTimeout(CONFIG.delayBetweenPages);
        await page.waitForLoadState('domcontentloaded');
        return true;
      }
    }

    return false;
  } catch (e) {
    console.log(`   ⚠ Error navigating to next page: ${e.message}`);
    return false;
  }
}

/**
 * Get current page number
 */
async function getCurrentPageNumber(page) {
  try {
    const pageNum = await page.evaluate(() => {
      // Look for active/current page indicator
      const activePage = document.querySelector(
        '.pagination .active, .pager .current, ' +
        '[aria-current="page"], .page-item.active'
      );
      if (activePage) {
        const num = parseInt(activePage.innerText.trim(), 10);
        if (!isNaN(num)) return num;
      }

      // Look for "Page X of Y" text
      const pageText = document.body.innerText.match(/page\s+(\d+)\s+of\s+(\d+)/i);
      if (pageText) return parseInt(pageText[1], 10);

      return 1;
    });
    return pageNum;
  } catch (e) {
    return 1;
  }
}

/**
 * Main scraping function
 */
async function scrapeContacts() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('           PFAC Pro Contact Scraper');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const browser = await chromium.launch({
    headless: CONFIG.headless,
    slowMo: CONFIG.slowMo
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  try {
    // Navigate to the search page
    console.log(`📍 Navigating to: ${CONFIG.baseUrl}`);
    await page.goto(CONFIG.baseUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });

    // Wait for login if needed
    await waitForLogin(page);

    let pageNum = 1;
    let hasNextPage = true;

    while (hasNextPage && pageNum <= CONFIG.maxPages) {
      console.log(`\n📄 Processing page ${pageNum}...`);

      // Get contact elements from current page
      const contactElements = await extractContactsFromPage(page);
      console.log(`   Found ${contactElements.length} contacts on this page`);

      // Process each contact
      for (let i = 0; i < contactElements.length; i++) {
        const contactData = contactElements[i];
        console.log(`   [${i + 1}/${contactElements.length}] Processing: ${contactData.name}`);

        // Parse basic contact info from the row
        const contact = parseContactFromRow(contactData);

        // Navigate to detail page to get email
        if (contactData.href) {
          const currentUrl = page.url();
          contact.email = await getEmailFromDetailPage(page, contactData.href);

          // Go back to the search results
          await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });
          await page.waitForTimeout(CONFIG.delayBetweenContacts);
        }

        allContacts.push(contact);

        // Save progress every 10 contacts
        if (allContacts.length % 10 === 0) {
          saveToCSV(allContacts, CONFIG.outputFile);
          console.log(`   💾 Progress saved (${allContacts.length} contacts)`);
        }
      }

      // Try to go to next page
      hasNextPage = await goToNextPage(page);
      if (hasNextPage) {
        pageNum++;
      } else {
        console.log('\n✓ No more pages to process.');
      }
    }

    // Final save
    const outputPath = saveToCSV(allContacts, CONFIG.outputFile);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                    SCRAPING COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`\n📊 Total contacts scraped: ${allContacts.length}`);
    console.log(`📁 Output file: ${outputPath}`);
    console.log('\n💡 To import into Google Sheets:');
    console.log('   1. Open Google Sheets');
    console.log('   2. File → Import');
    console.log('   3. Upload the CSV file');
    console.log('   4. Select "Replace current sheet" or "Insert new sheet"');
    console.log('   5. Click "Import data"\n');

  } catch (error) {
    console.error('\n❌ Error during scraping:', error.message);

    // Save whatever we have
    if (allContacts.length > 0) {
      saveToCSV(allContacts, CONFIG.outputFile);
      console.log(`   💾 Saved ${allContacts.length} contacts before error`);
    }
  } finally {
    await browser.close();
  }
}

// Run the scraper
scrapeContacts().catch(console.error);
