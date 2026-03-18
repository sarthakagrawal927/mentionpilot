import { crawlSite } from './site-crawler';

export interface SuggestedPrompt {
  text: string;
  category: string;
  reason: string;
}

export async function discoverPrompts(
  brandName: string,
  brandUrl: string | null,
  competitors: { name: string }[]
): Promise<SuggestedPrompt[]> {
  const prompts: SuggestedPrompt[] = [];

  // If we have a URL, crawl for context
  let category = '';
  let features: string[] = [];
  if (brandUrl) {
    try {
      const info = await crawlSite(brandUrl);
      category = info.category || '';
      features = info.features;
    } catch { /* skip */ }
  }

  // Category-based prompts
  if (category) {
    prompts.push(
      { text: `What are the best ${category} tools?`, category: 'discovery', reason: `Based on your product category: ${category}` },
      { text: `What ${category} tool would you recommend for a startup?`, category: 'discovery', reason: 'Startup-focused discovery query' },
      { text: `Compare the top ${category} platforms`, category: 'comparison', reason: 'Comparison queries drive consideration' },
      { text: `What's the most affordable ${category} solution?`, category: 'pricing', reason: 'Price-conscious buyers ask this' },
      { text: `Which ${category} tool is best for small teams?`, category: 'discovery', reason: 'Team size is a common filter' },
    );
  }

  // Brand-specific prompts
  prompts.push(
    { text: `What is ${brandName}?`, category: 'brand', reason: 'Direct brand awareness check' },
    { text: `Is ${brandName} any good?`, category: 'brand', reason: 'Reputation/review query' },
    { text: `${brandName} review`, category: 'brand', reason: 'Review-style query' },
    { text: `What are the pros and cons of ${brandName}?`, category: 'evaluation', reason: 'Evaluation queries show consideration' },
  );

  // Competitor comparison prompts
  for (const comp of competitors.slice(0, 3)) {
    prompts.push(
      { text: `${brandName} vs ${comp.name}`, category: 'comparison', reason: `Head-to-head with competitor ${comp.name}` },
      { text: `Is ${brandName} better than ${comp.name}?`, category: 'comparison', reason: `Direct comparison with ${comp.name}` },
    );
  }

  // Alternative-seeking prompts
  if (competitors.length > 0) {
    prompts.push(
      { text: `What are alternatives to ${competitors[0].name}?`, category: 'alternatives', reason: `Users looking for alternatives to your competitor` },
    );
  }
  prompts.push(
    { text: `What are alternatives to ${brandName}?`, category: 'alternatives', reason: 'Check how AI frames alternatives to you' },
  );

  // Feature-based prompts
  for (const feature of features.slice(0, 3)) {
    const cleanFeature = feature.toLowerCase().replace(/[^\w\s]/g, '').trim();
    if (cleanFeature.length > 3) {
      prompts.push(
        { text: `What's the best tool for ${cleanFeature}?`, category: 'feature', reason: `Based on your feature: ${feature}` },
      );
    }
  }

  // Use-case prompts
  prompts.push(
    { text: `What tools do startups need in 2026?`, category: 'ecosystem', reason: 'Broad ecosystem query where you might appear' },
    { text: `Best SaaS tools for indie hackers`, category: 'ecosystem', reason: 'Community-focused discovery' },
  );

  // Deduplicate and limit
  const seen = new Set<string>();
  return prompts.filter(p => {
    const key = p.text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 30);
}
