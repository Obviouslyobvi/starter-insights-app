
# 🚀 StarterInsights - Business Analysis Tool

StarterInsights is a high-performance dashboard that uses **Google Gemini 3 Pro** to automatically discover and analyze case studies from StarterStory.com. It identifies how founders got their first users (Distribution), how they make money (Monetization), and their specific "Aha!" moment.

## 🌟 Key Features
- **AI Discovery**: Scours the web for high-revenue case studies.
- **Deep Analysis**: Extracts distribution hacks and monetization strategies.
- **Google Sheets Sync**: Automatically backs up every analysis to a safe spreadsheet in your Google Drive.
- **Market Intelligence**: Visualizes trends across all analyzed businesses.

---

## 🛠️ Setup Guide (For Beginners)

### 1. Google Cloud Console Setup (CRITICAL)
Before the app can save data to your Google Sheets, you must link it to a Google Cloud Project:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project.
3. Enable the **Google Sheets API** and **Google Drive API**.
4. Set up the **OAuth Consent Screen** (Choose "External" and add your email to "Test Users").
5. Create **OAuth 2.0 Client ID** credentials (Web Application).
6. **Authorized JavaScript Origin**: Copy this from the App's configuration screen.
7. **Authorized Redirect URI**: Copy this from the App's configuration screen.

### 2. Getting the App Live
1. Open this project in your local development environment.
2. Ensure you have your `API_KEY` for the Gemini API set up in your environment.
3. Run the app and follow the on-screen **Configuration Guide** to paste your Client ID.

---

## 📤 How to upload this to GitHub
If you have these files on your computer and want them on GitHub:
1. Create a "New Repository" on GitHub.
2. In your terminal, run:
   ```bash
   git init
   git add .
   git commit -m "Initial launch"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

---

## 📝 Troubleshooting "URL Mismatch"
If Google gives you an error during login:
1. Look at the error message for the **Redirect URI** it expected.
2. Go back to the App, click **"Help! Mismatch Error"**, and paste that URL into the manual override.
3. Update your Google Cloud Console with that same URL.

---

## ⚖️ License
MIT
