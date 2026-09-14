import { lightTheme, darkTheme, getCSS, type Theme } from './styles';

const API_BASE = 'https://mentionpilot-api.sarthakagrawal927.workers.dev';
const SITE_URL = 'https://mention.highsignal.app';

const PLATFORM_LABELS: Record<string, string> = {
  openai: 'ChatGPT',
  anthropic: 'Claude',
  google: 'Gemini',
  perplexity: 'Perplexity',
};

const CHECK_SVG = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="7" fill="currentColor" opacity="0.15"/><path d="M4 7l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const X_SVG = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="7" fill="currentColor" opacity="0.15"/><path d="M5 5l4 4M9 5l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const AI_ICON = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="14" rx="3" stroke="currentColor" stroke-width="1.2"/><circle cx="5.5" cy="6" r="1.2" fill="currentColor"/><circle cx="10.5" cy="6" r="1.2" fill="currentColor"/><path d="M5 10.5c0-1 1.5-1.8 3-1.8s3 .8 3 1.8" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>';

interface BadgeData {
  brand_name: string;
  score: number;
  grade: string;
  platforms_checked: number;
  platforms_mentioned: number;
  mention_rate: number;
  platform_details: { platform: string; mentioned: boolean }[];
  last_checked: string;
  dashboard_url: string;
}

interface BadgeConfig {
  projectId: string;
  theme: 'light' | 'dark' | 'auto';
  position: 'inline' | 'bottom-right' | 'bottom-left';
  size: 'sm' | 'md';
  expanded: boolean;
}

function resolveTheme(pref: 'light' | 'dark' | 'auto'): Theme {
  if (pref === 'dark') return darkTheme;
  if (pref === 'light') return lightTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? darkTheme : lightTheme;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export class MentionPilotBadge {
  private shadow: ShadowRoot;
  private data: BadgeData | null = null;
  private isExpanded: boolean;
  private config: BadgeConfig;

  constructor(container: HTMLElement, config: BadgeConfig) {
    this.config = config;
    this.isExpanded = config.expanded;
    this.shadow = container.attachShadow({ mode: 'closed' });
    this.fetchAndRender();
  }

  private async fetchAndRender() {
    try {
      const res = await fetch(`${API_BASE}/v1/badge/${this.config.projectId}`);
      if (!res.ok) return; // Hide on error
      this.data = await res.json();
      this.render();
    } catch {
      // Silently hide — no broken states on host page
    }
  }

  private render() {
    if (!this.data) return;
    const theme = resolveTheme(this.config.theme);
    const css = getCSS(theme);

    const posClass = this.config.position === 'bottom-right' ? 'fixed-br'
      : this.config.position === 'bottom-left' ? 'fixed-bl' : '';
    const sizeClass = this.config.size === 'md' ? 'md' : '';

    this.shadow.innerHTML = `
      <style>${css}</style>
      <div class="mp-badge ${posClass}">
        <div class="mp-pill ${sizeClass}" id="mp-toggle">
          ${AI_ICON}
          <span class="mp-pill-text">Mentioned by ${this.data.platforms_mentioned}/${this.data.platforms_checked} AI assistants</span>
        </div>
        <div class="mp-powered">
          <a href="${SITE_URL}" target="_blank" rel="noopener">Powered by MentionPilot</a>
        </div>
        <div class="mp-card ${this.isExpanded ? 'open' : ''}" id="mp-card">
          <div class="mp-card-header">
            <div>
              <div class="mp-card-title">AI Visibility Score</div>
            </div>
            <div class="mp-score-pill">
              ${this.data.score}/100
              <span class="mp-grade">${this.data.grade}</span>
            </div>
          </div>
          <button class="mp-close" id="mp-close">&times;</button>
          <div class="mp-platforms">
            ${this.data.platform_details.map(p => `
              <div class="mp-platform">
                <span class="mp-platform-icon ${p.mentioned ? 'mp-mentioned' : 'mp-missed'}">${p.mentioned ? CHECK_SVG : X_SVG}</span>
                <span class="mp-platform-name">${PLATFORM_LABELS[p.platform] || p.platform}</span>
                <span class="mp-platform-status ${p.mentioned ? 'mp-mentioned' : 'mp-missed'}">${p.mentioned ? 'Mentioned' : 'Not mentioned'}</span>
              </div>
            `).join('')}
          </div>
          <div class="mp-meta">Last checked: ${timeAgo(this.data.last_checked)}</div>
          <div class="mp-ctas">
            <a class="mp-cta mp-cta-primary" href="${this.data.dashboard_url}" target="_blank" rel="noopener">View Full Report</a>
            <a class="mp-cta mp-cta-secondary" href="${SITE_URL}/check" target="_blank" rel="noopener">Get Your Badge</a>
          </div>
          <div class="mp-card-powered">
            <a href="${SITE_URL}" target="_blank" rel="noopener">Powered by MentionPilot</a>
          </div>
        </div>
      </div>
    `;

    // Event listeners
    this.shadow.getElementById('mp-toggle')?.addEventListener('click', () => {
      this.isExpanded = !this.isExpanded;
      this.shadow.getElementById('mp-card')?.classList.toggle('open', this.isExpanded);
    });

    this.shadow.getElementById('mp-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isExpanded = false;
      this.shadow.getElementById('mp-card')?.classList.remove('open');
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!this.isExpanded) return;
      const path = e.composedPath();
      if (!path.includes(this.shadow.host)) {
        this.isExpanded = false;
        this.shadow.getElementById('mp-card')?.classList.remove('open');
      }
    });
  }
}
