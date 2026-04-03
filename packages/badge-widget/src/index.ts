import { MentionPilotBadge } from './badge';

(function () {
  function init() {
    // Option 1: Read config from the <script> tag itself
    const scripts = document.querySelectorAll('script[data-project-id]');
    scripts.forEach((script) => {
      const projectId = script.getAttribute('data-project-id');
      if (!projectId) return;

      const container = document.createElement('div');
      // Insert badge right after the script tag
      script.parentNode?.insertBefore(container, script.nextSibling);

      new MentionPilotBadge(container, {
        projectId,
        theme: (script.getAttribute('data-theme') as 'light' | 'dark' | 'auto') || 'auto',
        position: (script.getAttribute('data-position') as 'inline' | 'bottom-right' | 'bottom-left') || 'inline',
        size: (script.getAttribute('data-size') as 'sm' | 'md') || 'sm',
        expanded: script.getAttribute('data-expanded') === 'true',
      });
    });

    // Option 2: Find [data-mentionpilot-badge] elements
    const elements = document.querySelectorAll('[data-mentionpilot-badge]');
    elements.forEach((el) => {
      const projectId = el.getAttribute('data-project-id');
      if (!projectId) return;

      new MentionPilotBadge(el as HTMLElement, {
        projectId,
        theme: (el.getAttribute('data-theme') as 'light' | 'dark' | 'auto') || 'auto',
        position: (el.getAttribute('data-position') as 'inline' | 'bottom-right' | 'bottom-left') || 'inline',
        size: (el.getAttribute('data-size') as 'sm' | 'md') || 'sm',
        expanded: el.getAttribute('data-expanded') === 'true',
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
