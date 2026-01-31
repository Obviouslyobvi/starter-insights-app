# PFAC Pro Contact Scraper

Automated web scraper to extract contact information from the PFAC Pro member directory and export to CSV for Google Sheets.

## Features

- Extracts: First Name, Middle Initial, Last Name, Address1, Address2, City, State, Zip, Phone, Email
- Navigates through all pages automatically (28-29 pages)
- Clicks on each person to get their email from the detail page
- Saves progress every 10 contacts (in case of interruption)
- Exports to CSV format ready for Google Sheets import

## Prerequisites

- Node.js 18 or higher
- npm

## Installation

From the project root directory:

```bash
# Install Playwright
npm install playwright

# Install Chromium browser
npx playwright install chromium
```

## Usage

### Option 1: Interactive Setup (Recommended for First Run)

The selector helper guides you through identifying the correct CSS selectors for the page:

```bash
node scraper/selectorHelper.js
```

This will:
1. Open a browser window
2. Navigate to the search page
3. Help you identify the correct selectors for each field
4. Save configuration to `scraperConfig.json`

Then run the scraper:

```bash
node scraper/contactScraperConfigurable.js
```

### Option 2: Direct Scraping

If you want to try with default selectors:

```bash
node scraper/contactScraper.js
```

The browser will open. If login is required, log in manually - the script will wait and continue automatically once search results appear.

## Output

The scraper creates `contacts_export.csv` in the project root with these columns:

| Column | Description |
|--------|-------------|
| First Name | Person's first name |
| Middle Initial | Middle initial (if available) |
| Last Name | Person's last name |
| Address1 | Primary street address |
| Address2 | Secondary address (apt, suite, etc.) |
| City | City name |
| State | State abbreviation (e.g., CA, NY) |
| Zip | ZIP code (5 or 9 digit) |
| Phone | Phone number |
| Email | Email address (from detail page) |

## Importing to Google Sheets

1. Open [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet or open an existing one
3. Go to **File → Import**
4. Select **Upload** tab
5. Choose the `contacts_export.csv` file
6. Select import options:
   - Import location: "Replace current sheet" or "Insert new sheet"
   - Separator type: "Comma"
7. Click **Import data**

## Configuration

You can modify settings in the scraper files:

```javascript
const CONFIG = {
  baseUrl: 'https://pfac-pro.site-ym.com/search/newsearch.asp',
  outputFile: 'contacts_export.csv',
  headless: false,        // Set true to run without visible browser
  slowMo: 50,             // Delay between actions (ms)
  timeout: 30000,         // Page load timeout (ms)
  maxPages: 35,           // Maximum pages to scrape
  delayBetweenContacts: 300,  // Delay between contacts (ms)
  delayBetweenPages: 800,     // Delay between pages (ms)
};
```

## Troubleshooting

### "Timeout waiting for results"
- Make sure you're logged in to the website
- Check if the page structure has changed

### "No email found" for most contacts
- Run `selectorHelper.js` to update the email selector
- The email might be in a different location on the detail page

### Script stops unexpectedly
- Progress is saved every 10 contacts
- Check `contacts_export.csv` for partial results
- Re-run the script (you may need to start from the beginning)

### Page navigation issues
- Increase `delayBetweenPages` in the config
- Run `selectorHelper.js` to verify the "Next" button selector

## Files

```
scraper/
├── README.md                      # This file
├── contactScraper.js              # Basic scraper with default selectors
├── contactScraperConfigurable.js  # Scraper using scraperConfig.json
├── selectorHelper.js              # Interactive tool to identify selectors
└── scraperConfig.json             # Generated config (after running helper)
```
