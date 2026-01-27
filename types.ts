
export interface StoryAnalysis {
  id: string;
  companyName: string;
  founder: string;
  revenue: string;
  mainDistributionChannels: string[];
  mainMonetizationMethods: string[];
  ahaMoment: string; // The answer to "b. ?"
  summary: string;
  rawContent: string;
  analyzedAt: string;
  category: string;
  sourceUrl?: string;
}

export interface AnalysisResult {
  companyName: string;
  founder: string;
  revenue: string;
  distributionChannels: string[];
  monetizationMethods: string[];
  ahaMoment: string;
  summary: string;
  category: string;
}

export enum AppRoute {
  DASHBOARD = 'dashboard',
  ANALYZE = 'analyze',
  TRENDS = 'trends',
  SETTINGS = 'settings'
}
