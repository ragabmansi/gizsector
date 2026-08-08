/**
 * app.js — Application entry point and orchestrator
 * GizaGIS — Interactive Services Map
 */

'use strict';

(async () => {
  /* ------------------------------------------------------------------ */
  /* LOADING SEQUENCE                                                     */
  /* ------------------------------------------------------------------ */

  Utils.setLoadingStatus('Initializing map engine…', 10);
  await _tick();

  // 1. Initialize map
  const map = MapModule.init();
  Utils.setLoadingStatus('Loading base tiles…', 30);
  await _tick();

  // 2. Initialize layers (loads visible layers)
  Utils.setLoadingStatus('Loading spatial data…', 50);
  await LayersModule.init(map, _onLayerLoaded);
  Utils.setLoadingStatus('Building layer tree…', 75);
  await _tick();

  // 3. Render basemap grid
  MapModule.renderBasemapGrid();

  // 4. Initialize search
  Utils.setLoadingStatus('Initializing search index…', 85);
  SearchModule.init();

  // 5. Initialize filters
  FiltersModule.init();

  // 6. Render legend & stats
  LegendModule.render();
  StatisticsModule.update();

  Utils.setLoadingStatus('Ready!', 100);
  await _sleep(400);

  // 7. Show app
  Utils.hideLoadingScreen();

  // 8. Wire up UI
  _bindUI();
  _bindKeyboardShortcuts();

  Utils.toast('GizaGIS loaded successfully', 'success', 3000);

  /* ------------------------------------------------------------------ */
  /* LAYER LOADED CALLBACK                                                */
  /* ------------------------------------------------------------------ */

  function _onLayerLoaded(id, state) {
    LegendModule.render();
    StatisticsModule.update();
  }

  /* ------------------------------------------------------------------ */
  /* UI BINDINGS                                                          */
  /* ------------------------------------------------------------------ */

  function _bindUI() {
    // Sidebar toggle
    Utils.qs('#sidebar-toggle')?.addEventListener('click', _toggleSidebar);

    // Tab switching
    Utils.qsa('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => _switchTab(btn.dataset.panel));
    });

    // Theme toggle
    Utils.qs('#theme-toggle-btn')?.addEventListener('click', _toggleTheme);

    // Fullscreen
    Utils.qs('#fullscreen-btn')?.addEventListener('click', () => {
      MapModule.toggleFullscreen();
    });

    // Print
    Utils.qs('#print-btn')?.addEventListener('click', () => {
      Utils.toast('Preparing print view…', 'info', 2000);
      setTimeout(() => window.print(), 500);
    });

    // Map toolbar
    Utils.qs('#reset-view-btn')?.addEventListener('click',  () => MapModule.resetView());
    Utils.qs('#zoom-in-btn')?.addEventListener('click',    () => MapModule.zoomIn());
    Utils.qs('#zoom-out-btn')?.addEventListener('click',   () => MapModule.zoomOut());

    // Export buttons
    Utils.qs('#export-geojson-btn')?.addEventListener('click', _exportGeoJSON);
    Utils.qs('#export-csv-btn')?.addEventListener('click',     _exportCSV);

    // Expand/Collapse all layer groups
    Utils.qs('#expand-all-layers')?.addEventListener('click',   () => LayersModule.expandAllGroups());
    Utils.qs('#collapse-all-layers')?.addEventListener('click', () => LayersModule.collapseAllGroups());

    // Show / Hide all layers
    Utils.qs('#show-all-layers')?.addEventListener('click', () => {
      LayersModule.showAllLayers();
      Utils.toast('All layers shown', 'info', 2000);
    });
    Utils.qs('#hide-all-layers')?.addEventListener('click', () => {
      LayersModule.hideAllLayers();
      Utils.toast('All layers hidden', 'info', 2000);
    });

    // Close modal
    Utils.qs('#close-modal')?.addEventListener('click', () => {
      Utils.qs('#layer-info-modal')?.classList.add('hidden');
    });
    Utils.qs('#layer-info-modal')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
    });

    // Mobile: close sidebar when clicking map
    if (window.innerWidth <= 900) {
      Utils.qs('#map')?.addEventListener('click', () => {
        Utils.qs('#sidebar')?.classList.remove('mobile-open');
      });
    }

    // Responsive sidebar toggle
    window.addEventListener('resize', Utils.debounce(_handleResize, 200));
  }

  /* ------------------------------------------------------------------ */
  /* SIDEBAR                                                              */
  /* ------------------------------------------------------------------ */

  function _toggleSidebar() {
    const sidebar = Utils.qs('#sidebar');
    if (!sidebar) return;
    if (window.innerWidth <= 900) {
      sidebar.classList.toggle('mobile-open');
    } else {
      sidebar.classList.toggle('collapsed');
    }
  }

  function _handleResize() {
    const sidebar = Utils.qs('#sidebar');
    if (!sidebar) return;
    if (window.innerWidth > 900) {
      sidebar.classList.remove('mobile-open');
    }
  }

  /* ------------------------------------------------------------------ */
  /* TAB SWITCHING                                                        */
  /* ------------------------------------------------------------------ */

  function _switchTab(panelId) {
    Utils.qsa('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.panel === panelId);
      b.setAttribute('aria-selected', b.dataset.panel === panelId ? 'true' : 'false');
    });
    Utils.qsa('.sidebar-panel').forEach(p => {
      p.classList.toggle('active', p.id === `panel-${panelId}`);
    });

    // Update stats/legend when switching to those panels
    if (panelId === 'stats')  StatisticsModule.update();
    if (panelId === 'legend') LegendModule.render();
  }

  /* ------------------------------------------------------------------ */
  /* THEME                                                                */
  /* ------------------------------------------------------------------ */

  function _toggleTheme() {
    const html    = document.documentElement;
    const isDark  = html.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);

    const icon = Utils.qs('#theme-icon');
    if (icon) {
      icon.className = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }

    try { localStorage.setItem('gizagis-theme', newTheme); } catch {}
    Utils.toast(`${isDark ? 'Light' : 'Dark'} mode activated`, 'info', 2000);
  }

  // Restore saved theme
  try {
    const saved = localStorage.getItem('gizagis-theme');
    if (saved && saved !== 'light') {
      document.documentElement.setAttribute('data-theme', saved);
      const icon = Utils.qs('#theme-icon');
      if (icon) icon.className = 'fa-solid fa-sun';
    }
  } catch {}

  /* ------------------------------------------------------------------ */
  /* KEYBOARD SHORTCUTS                                                   */
  /* ------------------------------------------------------------------ */

  function _bindKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
      // Don't fire if typing in input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        if (e.key === 'Escape') e.target.blur();
        return;
      }

      switch (e.key) {
        case '/': e.preventDefault(); SearchModule.focusSearch(); break;
        case 's': case 'S': _toggleSidebar(); break;
        case 'd': case 'D': _toggleTheme(); break;
        case 'f': case 'F': MapModule.toggleFullscreen(); break;
        case 'r': case 'R': MapModule.resetView(); break;
        case 'Escape':
          MapModule.clearHighlight();
          Utils.qs('#layer-info-modal')?.classList.add('hidden');
          DetailPanelModule.hide();
          break;
        case '+': case '=': MapModule.zoomIn(); break;
        case '-': MapModule.zoomOut(); break;
        case '1': _switchTab('layers');  break;
        case '2': _switchTab('legend'); break;
        case '3': _switchTab('filters'); break;
        case '4': _switchTab('stats');  break;
        case '5': _switchTab('about');  break;
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* EXPORT                                                               */
  /* ------------------------------------------------------------------ */

  function _exportGeoJSON() {
    const visible = LayersModule.getVisibleFeatures();
    if (!visible.length) { Utils.toast('No visible features to export', 'warn'); return; }
    const fc = { type: 'FeatureCollection', features: visible.map(v => v.feature) };
    Utils.downloadBlob(JSON.stringify(fc, null, 2), 'gizagis_export.geojson', 'application/json');
    Utils.toast(`Exported ${visible.length} features as GeoJSON`, 'success');
  }

  function _exportCSV() {
    const visible = LayersModule.getVisibleFeatures();
    if (!visible.length) { Utils.toast('No visible features to export', 'warn'); return; }
    const csv = Utils.toCSV(visible.map(v => v.feature));
    Utils.downloadBlob(csv, 'gizagis_export.csv', 'text/csv');
    Utils.toast(`Exported ${visible.length} features as CSV`, 'success');
  }

  /* ------------------------------------------------------------------ */
  /* HELPERS                                                              */
  /* ------------------------------------------------------------------ */

  function _tick()       { return new Promise(r => requestAnimationFrame(r)); }
  function _sleep(ms)    { return new Promise(r => setTimeout(r, ms)); }

})();
