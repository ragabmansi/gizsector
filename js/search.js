/**
 * search.js — Universal search across all GeoJSON layers
 * GizaGIS — Interactive Services Map
 */

'use strict';

const SearchModule = (() => {

  const SEARCH_FIELDS = ['name', 'Name', 'type', 'Type', 'address', 'Address',
    'district', 'District', 'phone', 'manager', 'description'];
  const MAX_RESULTS = 40;
  let _debounced = null;

  function init() {
    const input  = Utils.qs('#global-search-input');
    const panel  = Utils.qs('#search-results-panel');
    if (!input || !panel) return;

    _debounced = Utils.debounce(_doSearch, 280);
    input.addEventListener('input', () => _debounced(input.value.trim()));
    input.addEventListener('focus', () => { if (input.value.trim().length > 1) panel.classList.remove('hidden'); });
    document.addEventListener('click', e => {
      if (!e.target.closest('#global-search-wrap')) panel.classList.add('hidden');
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') { panel.classList.add('hidden'); input.blur(); }
    });
  }

  function _doSearch(query) {
    const panel = Utils.qs('#search-results-panel');
    if (!panel) return;
    if (query.length < 2) { panel.classList.add('hidden'); return; }

    const q       = query.toLowerCase();
    const allFeats = LayersModule.getAllFeatures();
    const results  = [];

    for (const { feature, layerId, def } of allFeats) {
      if (results.length >= MAX_RESULTS) break;
      const props = feature.properties || {};
      const match = SEARCH_FIELDS.some(f => String(props[f] || '').toLowerCase().includes(q));
      if (match) results.push({ feature, layerId, def, props });
    }

    _renderResults(panel, results, query);
    panel.classList.remove('hidden');
  }

  function _renderResults(panel, results, query) {
    panel.innerHTML = '';

    const hdr = Utils.el('div', { class: 'search-results-header' },
      Utils.el('span', { class: 'search-results-count', text: `${results.length} result${results.length !== 1 ? 's' : ''}` }),
      Utils.el('button', { class: 'search-clear-btn', text: 'Clear', onclick: _clear })
    );
    panel.appendChild(hdr);

    if (!results.length) {
      panel.appendChild(Utils.el('div', { class: 'search-no-results' },
        Utils.el('i', { class: 'fa-solid fa-magnifying-glass' }),
        Utils.el('span', { text: `No results for "${query}"` })
      ));
      return;
    }

    // Group by layer
    const byLayer = new Map();
    results.forEach(r => {
      if (!byLayer.has(r.def.name)) byLayer.set(r.def.name, []);
      byLayer.get(r.def.name).push(r);
    });

    byLayer.forEach((items, layerName) => {
      panel.appendChild(Utils.el('div', { class: 'search-group-label', text: layerName }));
      items.forEach(item => panel.appendChild(_buildResultItem(item, query)));
    });
  }

  function _buildResultItem({ feature, def, props }, query) {
    const name    = props.name || props.Name || props.road_name || def.name;
    const meta    = [props.district || props.District, props.type || props.Type, props.address || props.Address]
      .filter(Boolean).join(' · ');

    const btn = Utils.el('button', { class: 'search-result-item', role: 'option' },
      Utils.el('div', { class: 'search-result-icon', style: `background:${def.color}22;color:${def.color}` },
        Utils.el('i', { class: `fa-solid ${def.icon}` })
      ),
      Utils.el('div', { class: 'search-result-body' },
        Utils.el('div', { class: 'search-result-name', html: Utils.highlight(name, query) }),
        Utils.el('div', { class: 'search-result-meta', html: Utils.highlight(meta, query) })
      ),
      Utils.el('span', { class: 'search-result-layer', text: def.name })
    );

    btn.addEventListener('click', () => {
      MapModule.flyToFeature(feature);
      MapModule.highlightFeature(feature, def.color, true);
      DetailPanelModule.show(feature, def);
      Utils.qs('#search-results-panel').classList.add('hidden');
      Utils.qs('#global-search-input').value = typeof name === 'string' ? name : '';
    });

    return btn;
  }

  function _clear() {
    const input = Utils.qs('#global-search-input');
    if (input) input.value = '';
    Utils.qs('#search-results-panel')?.classList.add('hidden');
  }

  function focusSearch() {
    Utils.qs('#global-search-input')?.focus();
  }

  return Object.freeze({ init, focusSearch });
})();
