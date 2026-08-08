/**
 * filters.js — Category / District / Type filtering
 * GizaGIS — Interactive Services Map
 */

'use strict';

const FiltersModule = (() => {

  let _active = { category: '', district: '', type: '' };

  function init() {
    _populateDistricts();
    _populateTypes();

    Utils.qs('#apply-filters-btn')?.addEventListener('click', applyFilters);
    Utils.qs('#clear-filters-btn')?.addEventListener('click', clearFilters);

    ['filter-category', 'filter-district', 'filter-type'].forEach(id => {
      Utils.qs(`#${id}`)?.addEventListener('change', _updateTags);
    });
  }

  function _populateDistricts() {
    const sel     = Utils.qs('#filter-district');
    if (!sel) return;
    const districts = new Set();
    LayersModule.getAllFeatures().forEach(({ feature }) => {
      const d = feature.properties?.district || feature.properties?.District;
      if (d) districts.add(d);
    });
    [...districts].sort().forEach(d => {
      sel.appendChild(Utils.el('option', { value: d, text: d }));
    });
  }

  function _populateTypes() {
    const sel = Utils.qs('#filter-type');
    if (!sel) return;
    const types = new Set();
    LayersModule.getAllFeatures().forEach(({ feature }) => {
      const t = feature.properties?.type || feature.properties?.Type;
      if (t) types.add(t);
    });
    [...types].sort().forEach(t => {
      sel.appendChild(Utils.el('option', { value: t, text: Utils.capitalize(t) }));
    });
  }

  function applyFilters() {
    _active = {
      category: Utils.qs('#filter-category')?.value || '',
      district: Utils.qs('#filter-district')?.value || '',
      type:     Utils.qs('#filter-type')?.value     || '',
    };

    LayersModule.applyFilter(feature => {
      const p = feature.properties || {};
      if (_active.district && (p.district || p.District || '') !== _active.district) return false;
      if (_active.type     && (p.type     || p.Type     || '').toLowerCase() !== _active.type.toLowerCase()) return false;
      return true;
    });

    // Category filter: hide entire layers not in category
    if (_active.category) {
      LayersModule.getLayerDefs().forEach(def => {
        LayersModule.setLayerVisible(def.id, def.category === _active.category);
      });
    }

    _updateTags();
    Utils.toast('Filters applied', 'success', 2000);
  }

  function clearFilters() {
    _active = { category: '', district: '', type: '' };
    ['filter-category', 'filter-district', 'filter-type'].forEach(id => {
      const el = Utils.qs(`#${id}`);
      if (el) el.value = '';
    });
    LayersModule.clearFilter();
    LayersModule.getLayerDefs().forEach(def => {
      LayersModule.setLayerVisible(def.id, def.visible);
    });
    _updateTags();
    Utils.toast('Filters cleared', 'info', 2000);
  }

  function _updateTags() {
    const container = Utils.qs('#active-filters-tags');
    if (!container) return;
    container.innerHTML = '';
    const vals = {
      Category: Utils.qs('#filter-category')?.value,
      District: Utils.qs('#filter-district')?.value,
      Type:     Utils.qs('#filter-type')?.value,
    };
    let any = false;
    Object.entries(vals).forEach(([label, val]) => {
      if (!val) return;
      any = true;
      const tag = Utils.el('div', { class: 'filter-tag' },
        Utils.el('span', { text: `${label}: ${val}` }),
        Utils.el('button', { class: 'filter-tag-close', 'aria-label': `Remove ${label} filter`,
          onclick: () => {
            const selId = `filter-${label.toLowerCase()}`;
            const sel = Utils.qs(`#${selId}`);
            if (sel) sel.value = '';
            applyFilters();
          }
        }, Utils.el('i', { class: 'fa-solid fa-xmark' }))
      );
      container.appendChild(tag);
    });
    if (!any) container.innerHTML = '<span style="font-size:0.72rem;color:var(--text-muted)">No active filters</span>';
  }

  return Object.freeze({ init, applyFilters, clearFilters });
})();
