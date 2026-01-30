// Normalization utilities for consistent data aggregation

// Map similar terms to canonical forms
const TERM_MAPPINGS: Record<string, string> = {
  // Monetization terms
  'subscription': 'Subscription',
  'subscription service': 'Subscription',
  'subscription model': 'Subscription',
  'subscriptions': 'Subscription',
  'saas': 'SaaS',
  'saas subscription': 'SaaS',
  'freemium': 'Freemium',
  'freemium model': 'Freemium',
  'advertising': 'Advertising',
  'ads': 'Advertising',
  'ad revenue': 'Advertising',
  'affiliate': 'Affiliate',
  'affiliate marketing': 'Affiliate',
  'affiliates': 'Affiliate',
  'e-commerce': 'E-commerce',
  'ecommerce': 'E-commerce',
  'online sales': 'E-commerce',
  'marketplace': 'Marketplace',
  'marketplace fees': 'Marketplace',
  'consulting': 'Consulting',
  'consulting services': 'Consulting',
  'licensing': 'Licensing',
  'license fees': 'Licensing',
  'one-time purchase': 'One-time Purchase',
  'one time purchase': 'One-time Purchase',
  'pay per use': 'Pay Per Use',
  'usage-based': 'Pay Per Use',

  // Distribution terms
  'seo': 'SEO',
  'search engine optimization': 'SEO',
  'organic search': 'SEO',
  'content marketing': 'Content Marketing',
  'content': 'Content Marketing',
  'blogging': 'Content Marketing',
  'blog': 'Content Marketing',
  'social media': 'Social Media',
  'social media marketing': 'Social Media',
  'social': 'Social Media',
  'word of mouth': 'Word of Mouth',
  'word-of-mouth': 'Word of Mouth',
  'referral': 'Referrals',
  'referrals': 'Referrals',
  'referral program': 'Referrals',
  'email': 'Email Marketing',
  'email marketing': 'Email Marketing',
  'newsletter': 'Email Marketing',
  'paid ads': 'Paid Advertising',
  'paid advertising': 'Paid Advertising',
  'ppc': 'Paid Advertising',
  'facebook ads': 'Paid Advertising',
  'google ads': 'Paid Advertising',
  'partnerships': 'Partnerships',
  'partner': 'Partnerships',
  'strategic partnerships': 'Partnerships',
  'influencer': 'Influencer Marketing',
  'influencer marketing': 'Influencer Marketing',
  'influencers': 'Influencer Marketing',
  'community': 'Community',
  'community building': 'Community',
  'communities': 'Community',
  'pr': 'PR',
  'public relations': 'PR',
  'press': 'PR',
  'media coverage': 'PR',
  'product hunt': 'Product Hunt',
  'producthunt': 'Product Hunt',
  'app store': 'App Store',
  'app stores': 'App Store',
  'viral': 'Viral Growth',
  'viral marketing': 'Viral Growth',
  'virality': 'Viral Growth',
};

/**
 * Normalize a term to its canonical form
 * Used for aggregating similar terms in charts and counts
 */
export function normalizeTerm(term: string): string {
  const lower = term.trim().toLowerCase();
  return TERM_MAPPINGS[lower] || capitalizeWords(term.trim());
}

/**
 * Capitalize first letter of each word
 */
function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Check if two terms match (case-insensitive, handles normalized forms)
 */
export function termsMatch(term1: string, term2: string): boolean {
  const norm1 = normalizeTerm(term1);
  const norm2 = normalizeTerm(term2);
  return norm1.toLowerCase() === norm2.toLowerCase() ||
         norm1.toLowerCase().includes(norm2.toLowerCase()) ||
         norm2.toLowerCase().includes(norm1.toLowerCase());
}
