/**
 * legend.js — Auto-generated legend based on visible layers
 * GizaGIS — Interactive Services Map
 */

'use strict';

const LegendModule = (() => {

  function render() {
    const container = Utils.qs('#legend-content');
    if (!container) return;
    container.innerHTML = '';

    const defs   = LayersModule.getLayerDefs();
    const groups = new Map();

    defs.forEach(def => {
      const state = LayersModule.getLayerState(def.id);
      if (!state?.visible) return;
      if (!groups.has(def.group)) groups.set(def.group, []);
      groups.get(def.group).push(def);
    });

    if (!groups.size) {
      container.appendChild(Utils.el('div', { class: 'legend-empty' },
        Utils.el('i', { class: 'fa-solid fa-eye-slash' }),
        Utils.el('span', { text: 'No visible layers' })
      ));
      return;
    }

    groups.forEach((layerDefs, groupName) => {
      const section = Utils.el('div', { class: 'legend-section' });
      section.appendChild(Utils.el('div', { class: 'legend-group-title', text: groupName }));

      layerDefs.forEach(def => {
        const item = Utils.el('div', { class: 'legend-item' },
          Utils.el('div', { class: 'legend-symbol-wrap' }, _buildSymbol(def)),
          Utils.el('span', { class: 'legend-label', text: def.name })
        );
        section.appendChild(item);
      });

      container.appendChild(section);
    });
  }

  function _buildSymbol(def) {
    if (def.geometry === 'point') {
      return Utils.el('div', { class: 'legend-dot', style: `background:${def.color}` });
    }
    if (def.geometry === 'line') {
      const color = def.id === 'roads' ? '#94a3b8' : def.color;
      return Utils.el('div', { class: 'legend-line', style: `background:${color}` });
    }
    return Utils.el('div', { class: 'legend-poly', style: `background:${def.color}44;border-color:${def.color}` });
  }

  return Object.freeze({ render });
})();
