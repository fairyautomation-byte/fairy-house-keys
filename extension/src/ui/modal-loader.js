/**
 * Tải tailwind.min.js rồi modal.js — tránh parse ~400KB JS đồng bộ trong <head>
 * (gây treo cả tab Facebook / “Page Unresponsive”).
 */
(function () {
  'use strict';

  function scriptUrl(rel) {
    try {
      return chrome.runtime.getURL(rel);
    } catch (e) {
      return rel;
    }
  }

  function appendScript(src, onload, onerror) {
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    if (onload) s.onload = onload;
    if (onerror) s.onerror = onerror;
    (document.head || document.documentElement).appendChild(s);
  }

  function initWorkstationShell() {
    try {
      var tabLeads = document.getElementById('zt-nav-tab-leads');
      var tabAnalytics = document.getElementById('zt-nav-tab-analytics');
      var tabSetup = document.getElementById('zt-nav-tab-setup');

      var leadsView = document.getElementById('zt-view-leads');
      var analyticsView = document.getElementById('zt-sidebar');
      var setupView = document.getElementById('zt-section-config');
      var workspaceSection = document.getElementById('zt-section-workspace');
      var scanSection = document.getElementById('zt-section-scan');

      var scanningActive = false;

      function switchAppView(viewName) {
        [tabLeads, tabAnalytics, tabSetup].forEach(function(tab) {
          if (tab) tab.classList.remove('active');
        });

        if (viewName === 'analytics') {
          if (tabAnalytics) tabAnalytics.classList.add('active');
          if (workspaceSection) {
            workspaceSection.classList.remove('hidden');
            workspaceSection.classList.add('flex');
            workspaceSection.style.display = 'flex';
          }
          if (leadsView) {
            leadsView.classList.add('hidden');
            leadsView.style.display = 'none';
          }
          if (analyticsView) {
            analyticsView.classList.remove('hidden');
            analyticsView.classList.add('zt-analytics-active');
            analyticsView.style.display = 'grid';
          }
          if (setupView) {
            setupView.classList.add('hidden');
            setupView.style.display = 'none';
          }
          if (scanSection && scanningActive) {
            scanSection.classList.remove('hidden');
            scanSection.style.display = '';
          }
        } else if (viewName === 'setup') {
          if (tabSetup) tabSetup.classList.add('active');
          if (workspaceSection) {
            workspaceSection.classList.add('hidden');
            workspaceSection.classList.remove('flex');
            workspaceSection.style.display = 'none';
          }
          if (leadsView) {
            leadsView.classList.add('hidden');
            leadsView.style.display = 'none';
          }
          if (analyticsView) {
            analyticsView.classList.add('hidden');
            analyticsView.classList.remove('zt-analytics-active');
            analyticsView.style.display = 'none';
          }
          if (setupView) {
            setupView.classList.remove('hidden');
            setupView.classList.add('flex');
            setupView.style.display = 'flex';
          }
          if (scanSection) {
            scanSection.classList.add('hidden');
            scanSection.style.display = 'none';
          }
        } else {
          // 'leads' view (default)
          if (tabLeads) tabLeads.classList.add('active');
          if (workspaceSection) {
            workspaceSection.classList.remove('hidden');
            workspaceSection.classList.add('flex');
            workspaceSection.style.display = 'flex';
          }
          if (leadsView) {
            leadsView.classList.remove('hidden');
            leadsView.style.display = 'flex';
          }
          if (analyticsView) {
            analyticsView.classList.add('hidden');
            analyticsView.classList.remove('zt-analytics-active');
            analyticsView.style.display = 'none';
          }
          if (setupView) {
            setupView.classList.add('hidden');
            setupView.style.display = 'none';
          }
          if (scanSection && scanningActive) {
            scanSection.classList.remove('hidden');
            scanSection.style.display = '';
          }
        }
      }

      // Expose to window for maximum compatibility
      window.switchAppView = switchAppView;

      // Attach direct click listeners to Navigation Rail
      if (tabLeads) {
        tabLeads.addEventListener('click', function(e) {
          e.preventDefault();
          switchAppView('leads');
        });
      }
      if (tabAnalytics) {
        tabAnalytics.addEventListener('click', function(e) {
          e.preventDefault();
          switchAppView('analytics');
        });
      }
      if (tabSetup) {
        tabSetup.addEventListener('click', function(e) {
          e.preventDefault();
          switchAppView('setup');
        });
      }

      // Check initial view
      if (setupView && !setupView.classList.contains('hidden') && scanSection && scanSection.classList.contains('hidden')) {
        switchAppView('setup');
      }

      // Observe scanSection to detect scan start & mirror live status
      if (scanSection) {
        new MutationObserver(function() {
          var isScanVisible = !scanSection.classList.contains('hidden');
          if (isScanVisible) {
            scanningActive = true;
            if (tabSetup && tabSetup.classList.contains('active')) {
              switchAppView('leads');
            }
          }
        }).observe(scanSection, { attributes: true, attributeFilter: ['class'] });
      }

      // Mirror Phone counter to Left Rail Badge
      var statPhones = document.getElementById('zt-stat-phones');
      var navCountLeads = document.getElementById('zt-nav-count-leads');
      if (statPhones && navCountLeads) {
        new MutationObserver(function() {
          navCountLeads.textContent = statPhones.textContent;
        }).observe(statPhones, { childList: true, characterData: true, subtree: true });
      }

      // Mirror group name to top breadcrumb
      var groupLine = document.getElementById('zt-scan-group-line');
      var topTitle = document.getElementById('zt-top-context-title');
      if (groupLine && topTitle) {
        new MutationObserver(function() {
          var t = (groupLine.textContent || '').trim();
          if (t && t !== '—') topTitle.textContent = t;
        }).observe(groupLine, { childList: true, characterData: true, subtree: true });
      }

      // Manage Floating Multi-Select Action Dock
      var tableBody = document.getElementById('zt-tbody');
      var floatingDock = document.getElementById('zt-floating-dock');
      var dockCount = document.getElementById('zt-dock-count');
      var selectAll = document.getElementById('zt-select-all');

      function updateDock() {
        if (!tableBody || !floatingDock) return;
        var progressPanel = document.getElementById('zt-invite-progress-panel');
        var isInviteActive = progressPanel && !progressPanel.classList.contains('hidden');
        if (isInviteActive) {
          floatingDock.classList.remove('dock-visible');
          return;
        }
        var checked = tableBody.querySelectorAll('input[type="checkbox"]:checked').length;
        if (checked > 0) {
          if (dockCount) dockCount.textContent = String(checked);
          floatingDock.classList.add('dock-visible');
        } else {
          floatingDock.classList.remove('dock-visible');
        }
      }

      var progressPanel = document.getElementById('zt-invite-progress-panel');
      if (progressPanel) {
        new MutationObserver(function() {
          updateDock();
        }).observe(progressPanel, { attributes: true, attributeFilter: ['class', 'style'] });
      }

      if (tableBody) {
        tableBody.addEventListener('change', updateDock);
        tableBody.addEventListener('click', function(e) {
          if (e.target && e.target.type === 'checkbox') setTimeout(updateDock, 10);
        });
      }
      if (selectAll) {
        selectAll.addEventListener('change', function() { setTimeout(updateDock, 50); });
        selectAll.addEventListener('click', function() { setTimeout(updateDock, 50); });
      }

      // Bind floating dock actions
      var dockInvite = document.getElementById('zt-dock-btn-invite');
      var dockExport = document.getElementById('zt-dock-btn-export');
      var realInvite = document.getElementById('zt-btn-auto-invite');
      var realExport = document.getElementById('zt-btn-export-xlsx');
      if (dockInvite && realInvite) {
        dockInvite.addEventListener('click', function(e) {
          e.preventDefault();
          realInvite.click();
        });
      }
      if (dockExport && realExport) {
        dockExport.addEventListener('click', function(e) {
          e.preventDefault();
          realExport.click();
        });
      }

      // Mirror Live Status to Navigation Rail
      var statusPhase = document.getElementById('zt-status-phase');
      var liveText = document.getElementById('zt-live-status-text');
      var liveDot = document.getElementById('zt-live-dot');
      var liveBadge = document.getElementById('zt-badge-live-status');
      if (statusPhase && liveText) {
        new MutationObserver(function() {
          var txt = (statusPhase.textContent || '').trim();
          if (txt) {
            liveText.textContent = txt;
            if (txt.includes('Đã dừng') || txt.includes('kết thúc')) {
              if (liveDot) liveDot.className = 'h-1.5 w-1.5 rounded-full bg-rose-500';
              if (liveBadge) liveBadge.className = 'inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20';
            } else if (txt.includes('Tạm dừng')) {
              if (liveDot) liveDot.className = 'h-1.5 w-1.5 rounded-full bg-amber-500';
              if (liveBadge) liveBadge.className = 'inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20';
            } else {
              if (liveDot) liveDot.className = 'h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse';
              if (liveBadge) liveBadge.className = 'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20';
            }
          }
        }).observe(statusPhase, { childList: true, characterData: true, subtree: true });
      }
    } catch (err) {
      console.warn('[ZT Shell] init error', err);
    }
  }

  function revealApp() {
    try {
      const app = document.getElementById('zt-app');
      if (app) app.classList.add('zt-ready');
      const loader = document.getElementById('zt-app-preloader');
      if (loader) {
        loader.classList.add('zt-hidden');
        setTimeout(function () {
          if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 300);
      }
      initWorkstationShell();
    } catch (_) {}
  }

  function notifyReady() {
    try {
      window.parent.postMessage({ source: 'zt-modal', type: 'READY' }, '*');
    } catch (e) {
      /* ignore */
    }
  }

  function loadModalJs() {
    appendScript(
      scriptUrl('src/ui/modal.js'),
      function () {
        requestAnimationFrame(function () {
          revealApp();
          notifyReady();
        });
      },
      function () {
        revealApp();
        notifyReady();
      }
    );
  }

  // Khóa an toàn: tự hiện sau tối đa 650ms nếu có trục trặc mạng
  setTimeout(revealApp, 650);

  appendScript(
    scriptUrl('src/ui/tailwind.min.js'),
    function () {
      loadModalJs();
    },
    function () {
      loadModalJs();
    }
  );
})();
