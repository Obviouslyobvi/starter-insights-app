
import { StoryAnalysis } from "./types";

const SHEET_TITLE = "StarterInsights - Research Database";

export class GoogleSheetsService {
  private accessToken: string;

  constructor(token: string) {
    this.accessToken = token;
  }

  private async fetchGoogle(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Google API Error");
    }
    return response.json();
  }

  async findOrCreateSheet(): Promise<string> {
    // 1. Check if sheet exists in Drive
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${SHEET_TITLE}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;
    const searchResult = await this.fetchGoogle(searchUrl);

    if (searchResult.files && searchResult.files.length > 0) {
      return searchResult.files[0].id;
    }

    // 2. Create if not exists
    const createUrl = "https://sheets.googleapis.com/v4/spreadsheets";
    const sheet = await this.fetchGoogle(createUrl, {
      method: "POST",
      body: JSON.stringify({
        properties: { title: SHEET_TITLE },
        sheets: [
          {
            properties: { title: "Case Studies" },
            data: [
              {
                startRow: 0,
                startColumn: 0,
                rowData: [
                  {
                    values: [
                      { userEnteredValue: { stringValue: "Company Name" } },
                      { userEnteredValue: { stringValue: "Founder" } },
                      { userEnteredValue: { stringValue: "Revenue" } },
                      { userEnteredValue: { stringValue: "Distribution Channels" } },
                      { userEnteredValue: { stringValue: "Monetization Methods" } },
                      { userEnteredValue: { stringValue: "Aha! Moment" } },
                      { userEnteredValue: { stringValue: "Summary" } },
                      { userEnteredValue: { stringValue: "Category" } },
                      { userEnteredValue: { stringValue: "Analyzed At" } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    });
    return sheet.spreadsheetId;
  }

  async appendStory(spreadsheetId: string, story: StoryAnalysis) {
    // Fix: Updated append range to A:I to include Aha! Moment
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Case Studies!A:I:append?valueInputOption=USER_ENTERED`;
    await this.fetchGoogle(url, {
      method: "POST",
      body: JSON.stringify({
        values: [
          [
            story.companyName,
            story.founder,
            story.revenue,
            story.mainDistributionChannels.join(", "),
            story.mainMonetizationMethods.join(", "),
            story.ahaMoment,
            story.summary,
            story.category,
            story.analyzedAt,
          ],
        ],
      }),
    });
  }

  async getAllStories(spreadsheetId: string): Promise<Partial<StoryAnalysis>[]> {
    // Fix: Updated fetch range to A2:I and mapped ahaMoment correctly
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Case Studies!A2:I`;
    const data = await this.fetchGoogle(url);
    if (!data.values) return [];

    return data.values.map((row: any[]) => ({
      companyName: row[0] || "",
      founder: row[1] || "",
      revenue: row[2] || "",
      mainDistributionChannels: (row[3] || "").split(", "),
      mainMonetizationMethods: (row[4] || "").split(", "),
      ahaMoment: row[5] || "",
      summary: row[6] || "",
      category: row[7] || "",
      analyzedAt: row[8] || "",
    }));
  }
}
