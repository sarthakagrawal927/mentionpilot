export const lightTheme = {
  bg: '#ffffff',
  text: '#111111',
  textMuted: '#6b7280',
  border: '#e5e5e5',
  mentionedBg: '#ecfdf5',
  mentionedText: '#059669',
  missedBg: '#fef2f2',
  missedText: '#dc2626',
  ctaBg: '#111111',
  ctaText: '#ffffff',
  ctaSecondaryBg: 'transparent',
  ctaSecondaryText: '#111111',
  ctaSecondaryBorder: '#e5e5e5',
};

export const darkTheme = {
  bg: '#1a1a2e',
  text: '#f5f5f5',
  textMuted: '#9ca3af',
  border: '#333333',
  mentionedBg: '#064e3b',
  mentionedText: '#6ee7b7',
  missedBg: '#7f1d1d',
  missedText: '#fca5a5',
  ctaBg: '#f5f5f5',
  ctaText: '#1a1a2e',
  ctaSecondaryBg: 'transparent',
  ctaSecondaryText: '#f5f5f5',
  ctaSecondaryBorder: '#333333',
};

export type Theme = typeof lightTheme;

export function getCSS(t: Theme): string {
  return `
    :host { all: initial; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .mp-badge { position: relative; width: fit-content; }
    .mp-badge.fixed-br { position: fixed; bottom: 20px; right: 20px; z-index: 99999; }
    .mp-badge.fixed-bl { position: fixed; bottom: 20px; left: 20px; z-index: 99999; }

    .mp-pill {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 14px; cursor: pointer;
      background: ${t.bg}; color: ${t.text};
      border: 1px solid ${t.border}; border-radius: 9999px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: transform 0.15s ease;
      font-size: 13px; line-height: 1;
    }
    .mp-pill:hover { transform: scale(1.02); }
    .mp-pill svg { flex-shrink: 0; }
    .mp-pill-text { white-space: nowrap; }
    .mp-powered { display: block; text-align: center; margin-top: 2px; }
    .mp-powered a {
      font-size: 9px; color: ${t.textMuted}; text-decoration: none;
    }
    .mp-powered a:hover { text-decoration: underline; }

    .mp-pill.md { padding: 10px 18px; font-size: 14px; }

    .mp-card {
      position: absolute; bottom: calc(100% + 8px); right: 0;
      width: 300px; background: ${t.bg}; color: ${t.text};
      border: 1px solid ${t.border}; border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      overflow: hidden; opacity: 0; transform: translateY(8px);
      transition: opacity 0.2s ease, transform 0.2s ease;
      pointer-events: none; font-size: 13px;
    }
    .mp-card.open { opacity: 1; transform: translateY(0); pointer-events: auto; }

    .mp-card-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px 10px; border-bottom: 1px solid ${t.border};
    }
    .mp-card-title { font-weight: 600; font-size: 14px; }
    .mp-score-pill {
      display: flex; align-items: center; gap: 6px;
      font-weight: 700; font-size: 14px;
    }
    .mp-grade {
      padding: 2px 8px; border-radius: 6px;
      font-size: 12px; font-weight: 700;
      background: ${t.mentionedBg}; color: ${t.mentionedText};
    }
    .mp-close {
      position: absolute; top: 10px; right: 10px;
      background: none; border: none; cursor: pointer;
      color: ${t.textMuted}; font-size: 18px; line-height: 1;
      padding: 4px;
    }
    .mp-close:hover { color: ${t.text}; }

    .mp-platforms { padding: 12px 16px; }
    .mp-platform {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 0; font-size: 13px;
    }
    .mp-platform-icon { width: 18px; text-align: center; flex-shrink: 0; }
    .mp-platform-name { flex: 1; }
    .mp-platform-status { font-size: 12px; }
    .mp-mentioned { color: ${t.mentionedText}; }
    .mp-missed { color: ${t.missedText}; }

    .mp-meta {
      padding: 0 16px 12px; font-size: 11px; color: ${t.textMuted};
    }

    .mp-ctas {
      display: flex; gap: 8px; padding: 0 16px 14px;
    }
    .mp-cta {
      flex: 1; padding: 8px; border-radius: 8px; font-size: 12px;
      font-weight: 600; text-align: center; text-decoration: none;
      cursor: pointer; transition: opacity 0.15s;
    }
    .mp-cta:hover { opacity: 0.85; }
    .mp-cta-primary { background: ${t.ctaBg}; color: ${t.ctaText}; border: none; }
    .mp-cta-secondary {
      background: ${t.ctaSecondaryBg}; color: ${t.ctaSecondaryText};
      border: 1px solid ${t.ctaSecondaryBorder};
    }

    .mp-card-powered {
      padding: 0 16px 10px; text-align: center;
    }
    .mp-card-powered a {
      font-size: 10px; color: ${t.textMuted}; text-decoration: none;
    }
    .mp-card-powered a:hover { text-decoration: underline; }
  `;
}
