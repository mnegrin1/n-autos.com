"use client";

import { useServerInsertedHTML } from "next/navigation";

export default function ThemeScript() {
  useServerInsertedHTML(() => {
    return (
      <script
        key="theme-init-script"
        dangerouslySetInnerHTML={{
          __html: `(function() {
            try {
              var path = window.location.pathname;
              var isAdmin = path.startsWith('/admin') || path.startsWith('/superadmin');
              if (isAdmin) {
                var theme = localStorage.getItem('crm-theme') || 'light';
                if (theme === 'dark') theme = 'dark-dim';
                var pattern = localStorage.getItem('crm-bg-pattern') || 'topography';
                var current = document.documentElement.className;
                var classes = current.split(' ').filter(function(c) {
                  return c && !c.startsWith('theme-') && !c.startsWith('bg-pattern-');
                });
                if (theme && theme !== 'system') {
                  classes.push('theme-' + theme);
                } else {
                  classes.push('theme-light');
                }
                if (path.startsWith('/superadmin') || pattern === 'topography' || !pattern) {
                  classes.push('bg-pattern-topography');
                } else if (pattern === 'gradient' || pattern === 'emerald') {
                  classes.push('bg-pattern-gradient');
                }
                document.documentElement.className = classes.join(' ');
              }
            } catch (e) {}
          })()`,
        }}
      />
    );
  });

  return null;
}
