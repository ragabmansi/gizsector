/**
 * layers.js — Layer definitions, lazy loading, clustering, symbology
 * GizaGIS — Interactive Services Map
 * Supports 100,000+ features via canvas rendering + MarkerCluster
 */

'use strict';

const LayersModule = (() => {

  /* ------------------------------------------------------------------ */
  /* LAYER DEFINITIONS                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Each layer object:
   *   id, name, file, group, category, geometryType,
   *   color, icon, minZoom?, visible
   */
  const LAYER_DEFS = [
    // ── HEALTH ──────────────────────────────────────────────────────────
    { id: 'hospitals',       name: 'المستشفيات',         file: 'data/hospitals.geojson',       group: 'Health',          category: 'health',         geometry: 'point',   color: '#ef4444', icon: 'fa-hospital',            visible: true  },
    { id: 'health-units',    name: 'العيادات',      file: 'data/health_units.geojson',    group: 'Health',          category: 'health',         geometry: 'point',   color: '#f97316', icon: 'fa-heart-pulse',         visible: true  },
    // { id: 'clinics',         name: 'محطات الغاز',           file: 'data/gas_stations.geojson',         group: 'Health',          category: 'health',         geometry: 'point',   color: '#fb923c', icon: 'fa-stethoscope',         visible: false },
    { id: 'pharmacies',      name: 'مواقف المواصلات',        file: 'data/busstation.geojson',      group: 'Health',          category: 'health',         geometry: 'point',   color: '#22c55e', icon: 'fa-pills',               visible: false },

    // ── EDUCATION ───────────────────────────────────────────────────────
    { id: 'universities',    name: 'ATM',      file: 'data/universities.geojson',    group: 'Education',       category: 'education',      geometry: 'point',   color: '#8b5cf6', icon: 'fa-graduation-cap',      visible: true  },
    { id: 'banks',         name: 'البنوك',           file: 'data/banks.geojson',         group: 'Education',       category: 'education',      geometry: 'point',   color: '#a78bfa', icon: 'fa-school',              visible: true  },
    { id: 'institutes',      name: 'الادارات المحلية',        file: 'data/institutes.geojson',      group: 'Education',       category: 'education',      geometry: 'point',   color: '#c4b5fd', icon: 'fa-building-columns',    visible: false },

    // ── EMERGENCY SERVICES ───────────────────────────────────────────────
    { id: 'fire-stations',   name: 'المدارس',     file: 'data/schools.geojson',   group: 'Emergency',       category: 'emergency',      geometry: 'point',   color: '#dc2626', icon: 'fa-fire-extinguisher',   visible: true  },
    { id: 'ambulance',       name: 'المخابز',file: 'data/ambulance.geojson',       group: 'Emergency',       category: 'emergency',      geometry: 'point',   color: '#f43f5e', icon: 'fa-truck-medical',       visible: true  },
    { id: 'police',          name: 'محطات الغاز',   file: 'data/police.geojson',          group: 'Emergency',       category: 'emergency',      geometry: 'point',   color: '#1d4ed8', icon: 'fa-shield-halved',       visible: true  },

    // ── RELIGIOUS ───────────────────────────────────────────────────────
    { id: 'mosques',         name: 'المساجدوالكنائس',           file: 'data/mosques.geojson',         group: 'Religious',       category: 'religious',      geometry: 'point',   color: '#16a34a', icon: 'fa-mosque',              visible: false },
    { id: 'churches',        name: 'شركات الكهرباء',          file: 'data/kahrabcom.geojson',        group: 'Religious',       category: 'religious',      geometry: 'point',   color: '#9333ea', icon: 'fa-church',              visible: false },

    // ── GOVERNMENT ──────────────────────────────────────────────────────
    { id: 'government',      name: 'Government Buildings', file: 'data/government.geojson',   group: 'Government',      category: 'government',     geometry: 'point',   color: '#0891b2', icon: 'fa-landmark',            visible: false },

    // ── RECREATION ──────────────────────────────────────────────────────
    { id: 'parks',           name: 'شياخات قسم الجيزة', file: 'data/parks.geojson',        group: 'Recreation',      category: 'recreation',     geometry: 'polygon', color: '#4ade80', icon: 'fa-tree',                visible: false },

    // ── INFRASTRUCTURE ──────────────────────────────────────────────────
    { id: 'roads',           name: 'الطرق',             file: 'data/roads.geojson',           group: 'Infrastructure',  category: 'infrastructure', geometry: 'line',    color: '#94a3b8', icon: 'fa-road',                visible: true  },
    { id: 'boundaries',      name: 'Administrative Boundaries', file: 'data/boundaries.geojson', group: 'Infrastructure', category: 'infrastructure', geometry: 'polygon', color: '#f59e0b', icon: 'fa-map', visible: true  },
  ];

  /* Group metadata */
  const GROUP_META = {
    'Health':         { icon: 'fa-heart', order: 1 },
    'Education':      { icon: 'fa-graduation-cap', order: 2 },
    'Emergency':      { icon: 'fa-bell', order: 3 },
    'Religious':      { icon: 'fa-place-of-worship', order: 4 },
    'Government':     { icon: 'fa-landmark', order: 5 },
    'Recreation':     { icon: 'fa-leaf', order: 6 },
    'Infrastructure': { icon: 'fa-road', order: 7 },
  };

  /* ------------------------------------------------------------------ */
  /* STATE                                                                */
  /* ------------------------------------------------------------------ */

  /** @type {Map<string, LayerState>} */
  const _layers = new Map();
  // LayerState = { def, leafletLayer, cluster, featureCount, loaded, visible, opacity, features }

  let _map = null;
  let _onLayerLoaded = null;  // callback

  /* ------------------------------------------------------------------ */
  /* SYMBOLOGY HELPERS                                                    */
  /* ------------------------------------------------------------------ */

  /** Create a custom DivIcon for point layers */
  function _createDivIcon(color, iconClass) {
    return L.divIcon({
      className: '',
      html: `
        <div style="
          width:28px; height:28px;
          background:${color};
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid rgba(255,255,255,0.9);
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
          display:flex; align-items:center; justify-content:center;
          position:relative;
        ">
          <i class="fa-solid ${iconClass}" style="
            transform:rotate(45deg);
            font-size:11px; color:#fff;
            position:absolute;
          "></i>
        </div>`,
      iconSize:   [28, 28],
      iconAnchor: [14, 28],
      popupAnchor:[0, -30],
    });
  }

  /** Road style by road type */
  function _roadStyle(feature) {
    const t = (feature.properties?.type || feature.properties?.road_type || '').toLowerCase();
    const styles = {
      motorway:   { color: '#e11d48', weight: 5, opacity: 0.9 },
      trunk:      { color: '#f97316', weight: 4, opacity: 0.9 },
      primary:    { color: '#f59e0b', weight: 3, opacity: 0.85 },
      secondary:  { color: '#84cc16', weight: 2.5, opacity: 0.8 },
      tertiary:   { color: '#94a3b8', weight: 2, opacity: 0.75 },
      residential:{ color: '#cbd5e1', weight: 1.5, opacity: 0.7 },
      service:    { color: '#e2e8f0', weight: 1, opacity: 0.6 },
    };
    return styles[t] || { color: '#94a3b8', weight: 2, opacity: 0.75 };
  }

  function _roadHoverStyle(feature) {
    const base = _roadStyle(feature);
    return { ...base, weight: base.weight + 2, opacity: 1, color: '#3b82f6' };
  }

  /** Polygon style */
  function _polygonStyle(def, feature) {
    if (def.id === 'boundaries') {
      return {
        color:       '#f59e0b',
        weight:      2,
        opacity:     0.8,
        fillColor:   '#f59e0b',
        fillOpacity: 0.05,
        dashArray:   '6,4',
        pane:        'boundaries',
      };
    }
    if (def.id === 'parks') {
      return {
        color:       '#16a34a',
        weight:      1.5,
        opacity:     0.8,
        fillColor:   '#4ade80',
        fillOpacity: 0.3,
        pane:        'polygons',
      };
    }
    return {
      color:       def.color,
      weight:      2,
      opacity:     0.8,
      fillColor:   def.color,
      fillOpacity: 0.2,
      pane:        'polygons',
    };
  }

  /* ------------------------------------------------------------------ */
  /* CLUSTER FACTORY                                                      */
  /* ------------------------------------------------------------------ */

  function _createCluster(color) {
    return L.markerClusterGroup({
      chunkedLoading:      true,
      chunkInterval:       80,
      chunkDelay:          50,
      maxClusterRadius:    60,
      spiderfyOnMaxZoom:   true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      animate:             true,
      disableClusteringAtZoom: 17,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size  = count < 10 ? 30 : count < 100 ? 36 : 42;
        return L.divIcon({
          className: '',
          html: `<div style="
            width:${size}px; height:${size}px;
            background:${color}dd;
            border:3px solid ${color};
            border-radius:50%;
            display:flex; align-items:center; justify-content:center;
            color:#fff; font-weight:700; font-size:${size < 36 ? 11 : 13}px;
            font-family:'JetBrains Mono',monospace;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
          ">${count}</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
    });
  }

  /* ------------------------------------------------------------------ */
  /* LAYER LOADING                                                        */
  /* ------------------------------------------------------------------ */

  /**
   * Lazily load a GeoJSON file and add it to the map.
   * @param {string} id  Layer ID
   */
  async function loadLayer(id) {
    const state = _layers.get(id);
    if (!state || state.loaded) return;

    const def = state.def;
    state.loading = true;

    try {
      const resp = await fetch(def.file);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${def.file}`);
      const data = await resp.json();

      const features = data.type === 'FeatureCollection'
        ? data.features
        : [data];

      state.features     = features;
      state.featureCount = features.length;
      state.loaded       = true;

      _buildLeafletLayer(state);
      _updateLayerCountUI(id, features.length);
      _onLayerLoaded && _onLayerLoaded(id, state);

    } catch (err) {
      // Graceful: show 0-feature placeholder
      console.warn(`[LayersModule] Could not load ${def.file}:`, err.message);
      state.loaded       = true;
      state.features     = [];
      state.featureCount = 0;
      _updateLayerCountUI(id, 0);
      _onLayerLoaded && _onLayerLoaded(id, state);
    } finally {
      state.loading = false;
    }
  }

  /** Build Leaflet layer from loaded GeoJSON features */
  function _buildLeafletLayer(state) {
    const def = state.def;

    if (def.geometry === 'point') {
      // Use cluster group for point layers
      state.cluster = _createCluster(def.color);
      const icon    = _createDivIcon(def.color, def.icon);

      const geoLayer = L.geoJSON({ type: 'FeatureCollection', features: state.features }, {
        pane: 'points',
        pointToLayer: (feature, latlng) => L.marker(latlng, { icon }),
        onEachFeature: (feature, layer) => {
          _attachPointEvents(layer, feature, def);
        },
      });

      state.cluster.addLayer(geoLayer);
      state.leafletLayer = state.cluster;

    } else if (def.geometry === 'line') {
      state.leafletLayer = L.geoJSON({ type: 'FeatureCollection', features: state.features }, {
        pane:  'roads',
        style: (feature) => _roadStyle(feature),
        onEachFeature: (feature, layer) => {
          _attachLineEvents(layer, feature, def);
        },
      });

    } else {
      // polygon
      state.leafletLayer = L.geoJSON({ type: 'FeatureCollection', features: state.features }, {
        pane:  def.id === 'boundaries' ? 'boundaries' : 'polygons',
        style: (feature) => _polygonStyle(def, feature),
        onEachFeature: (feature, layer) => {
          _attachPolygonEvents(layer, feature, def);
        },
      });
    }

    if (state.visible) {
      state.leafletLayer.addTo(_map);
    }
  }

  /* ------------------------------------------------------------------ */
  /* EVENT ATTACHMENTS                                                    */
  /* ------------------------------------------------------------------ */

  function _attachPointEvents(layer, feature, def) {
    const name = feature.properties?.name || feature.properties?.Name || def.name;

    layer.bindTooltip(Utils.escHtml(name), {
      direction: 'top',
      offset:    [0, -28],
      opacity:   0.9,
      className: 'gis-tooltip',
    });

    layer.on('click', () => {
      const popup = PopupModule.buildFeaturePopup(feature, def);
      layer.bindPopup(popup, { maxWidth: 310, minWidth: 280 }).openPopup();
      MapModule.highlightFeature(feature, def.color);
      DetailPanelModule.show(feature, def);
    });
  }

  function _attachLineEvents(layer, feature, def) {
    const name = feature.properties?.name || feature.properties?.road_name || 'Road';

    layer.bindTooltip(`<b>${Utils.escHtml(name)}</b>`, {
      sticky:    true,
      opacity:   0.9,
      className: 'gis-tooltip',
    });

    layer.on('mouseover', function () {
      this.setStyle(_roadHoverStyle(feature));
      this.bringToFront();
    });
    layer.on('mouseout', function () {
      this.setStyle(_roadStyle(feature));
    });
    layer.on('click', () => {
      const popup = PopupModule.buildLinePopup(feature, def);
      layer.bindPopup(popup, { maxWidth: 310 }).openPopup();
      DetailPanelModule.show(feature, def);
    });
  }

  function _attachPolygonEvents(layer, feature, def) {
    const name = feature.properties?.name || feature.properties?.Name || def.name;

    layer.bindTooltip(Utils.escHtml(name), {
      sticky:    true,
      opacity:   0.9,
      className: 'gis-tooltip',
    });

    layer.on('mouseover', function () {
      this.setStyle({ weight: 3, fillOpacity: 0.35 });
    });
    layer.on('mouseout', function () {
      this.setStyle(_polygonStyle(def, feature));
    });
    layer.on('click', () => {
      const popup = PopupModule.buildFeaturePopup(feature, def);
      layer.bindPopup(popup, { maxWidth: 310 }).openPopup();
      MapModule.highlightFeature(feature, def.color);
      DetailPanelModule.show(feature, def);
    });
  }

  /* ------------------------------------------------------------------ */
  /* VISIBILITY & OPACITY                                                 */
  /* ------------------------------------------------------------------ */

  function setLayerVisible(id, visible) {
    const state = _layers.get(id);
    if (!state) return;
    state.visible = visible;

    if (!state.loaded) {
      if (visible) loadLayer(id);
      return;
    }

    if (state.leafletLayer) {
      if (visible) state.leafletLayer.addTo(_map);
      else         _map.removeLayer(state.leafletLayer);
    }

    _updateLayerVisibilityUI(id, visible);
    LegendModule.render();
    StatisticsModule.update();
  }

  function setLayerOpacity(id, opacity) {
    const state = _layers.get(id);
    if (!state || !state.leafletLayer) return;
    state.opacity = opacity;

    if (typeof state.leafletLayer.setOpacity === 'function') {
      state.leafletLayer.setOpacity(opacity);
    } else if (typeof state.leafletLayer.setStyle === 'function') {
      state.leafletLayer.setStyle({ opacity, fillOpacity: opacity * 0.4 });
    }
  }

  function showAllLayers() {
    _layers.forEach((_, id) => setLayerVisible(id, true));
  }
  function hideAllLayers() {
    _layers.forEach((_, id) => setLayerVisible(id, false));
  }

  /* ------------------------------------------------------------------ */
  /* FILTER SUPPORT                                                       */
  /* ------------------------------------------------------------------ */

  /**
   * Apply a filter function to all layers.
   * Features that don't match are hidden via leaflet's layer filtering.
   */
  function applyFilter(filterFn) {
    _layers.forEach((state, id) => {
      if (!state.loaded || !state.leafletLayer) return;

      if (state.def.geometry === 'point') {
        // For cluster groups: rebuild from filtered features
        state.cluster.clearLayers();
        const def  = state.def;
        const icon = _createDivIcon(def.color, def.icon);
        const filtered = state.features.filter(filterFn);

        const geoLayer = L.geoJSON({ type: 'FeatureCollection', features: filtered }, {
          pane: 'points',
          pointToLayer: (feature, latlng) => L.marker(latlng, { icon }),
          onEachFeature: (feature, layer) => _attachPointEvents(layer, feature, def),
        });
        state.cluster.addLayer(geoLayer);
        state.filteredCount = filtered.length;

      } else {
        state.leafletLayer.clearLayers();
        const filtered = state.features.filter(filterFn);
        const def = state.def;

        filtered.forEach(feature => {
          if (state.def.geometry === 'line') {
            const layer = L.geoJSON(feature, {
              pane: 'roads',
              style: _roadStyle(feature),
            });
            _attachLineEvents(layer, feature, def);
            state.leafletLayer.addLayer(layer);
          } else {
            const layer = L.geoJSON(feature, {
              pane: state.def.id === 'boundaries' ? 'boundaries' : 'polygons',
              style: _polygonStyle(def, feature),
            });
            _attachPolygonEvents(layer, feature, def);
            state.leafletLayer.addLayer(layer);
          }
        });
        state.filteredCount = filtered.length;
      }
    });

    StatisticsModule.update();
    _updateFeatureCountDisplay();
  }

  function clearFilter() {
    _layers.forEach((state) => {
      if (!state.loaded) return;
      state.filteredCount = undefined;
    });
    applyFilter(() => true);
  }

  /* ------------------------------------------------------------------ */
  /* FIT TO LAYER                                                         */
  /* ------------------------------------------------------------------ */

  function fitToLayer(id) {
    const state = _layers.get(id);
    if (!state?.leafletLayer) return;
    try {
      const bounds = state.leafletLayer.getBounds
        ? state.leafletLayer.getBounds()
        : null;
      if (bounds?.isValid()) {
        _map.flyToBounds(bounds, { padding: [40, 40], duration: 1.2 });
      }
    } catch {}
  }

  /* ------------------------------------------------------------------ */
  /* FEATURE COUNT DISPLAY                                                */
  /* ------------------------------------------------------------------ */

  function _updateFeatureCountDisplay() {
    let total = 0;
    _layers.forEach(state => {
      if (state.visible && state.loaded) {
        total += state.filteredCount ?? state.featureCount ?? 0;
      }
    });
    const el = Utils.qs('#feature-count-display');
    if (el) el.textContent = `Features: ${Utils.fmtNum(total)}`;
  }

  function _updateLayerCountUI(id, count) {
    const el = Utils.qs(`[data-layer-count="${id}"]`);
    if (el) el.textContent = Utils.fmtNum(count);
  }

  function _updateLayerVisibilityUI(id, visible) {
    const btn = Utils.qs(`[data-vis-toggle="${id}"]`);
    if (!btn) return;
    btn.innerHTML = visible
      ? '<i class="fa-solid fa-eye"></i>'
      : '<i class="fa-solid fa-eye-slash"></i>';
    btn.classList.toggle('hidden-layer', !visible);
    btn.title = visible ? 'Hide layer' : 'Show layer';
  }

  /* ------------------------------------------------------------------ */
  /* LAYER TREE UI                                                        */
  /* ------------------------------------------------------------------ */

  function renderLayerTree() {
    const tree = Utils.qs('#layer-tree');
    if (!tree) return;
    tree.innerHTML = '';

    // Group layers
    const groups = new Map();
    LAYER_DEFS.forEach(def => {
      if (!groups.has(def.group)) groups.set(def.group, []);
      groups.get(def.group).push(def);
    });

    // Sort groups by meta order
    const sortedGroups = [...groups.entries()].sort(([a], [b]) => {
      const oa = GROUP_META[a]?.order ?? 99;
      const ob = GROUP_META[b]?.order ?? 99;
      return oa - ob;
    });

    sortedGroups.forEach(([groupName, defs]) => {
      const meta = GROUP_META[groupName] || { icon: 'fa-layer-group' };
      const groupEl = _buildGroupEl(groupName, meta, defs);
      tree.appendChild(groupEl);
    });
  }

  function _buildGroupEl(groupName, meta, defs) {
    const group = Utils.el('div', { class: 'layer-group', 'data-group': groupName });

    const header = Utils.el('button', {
      class: 'layer-group-header',
      'aria-expanded': 'true',
      onclick: () => {
        group.classList.toggle('collapsed');
        header.setAttribute('aria-expanded', group.classList.contains('collapsed') ? 'false' : 'true');
      },
    },
      Utils.el('i', { class: `layer-group-icon fa-solid ${meta.icon}` }),
      Utils.el('span', { class: 'layer-group-name', text: groupName }),
      Utils.el('span', { class: 'layer-group-count', text: String(defs.length) }),
      Utils.el('i', { class: 'layer-group-arrow fa-solid fa-chevron-down' })
    );

    const body = Utils.el('div', { class: 'layer-group-body' });
    defs.forEach(def => {
      const itemEl = _buildLayerItem(def);
      body.appendChild(itemEl);
    });

    group.appendChild(header);
    group.appendChild(body);
    return group;
  }

  function _buildLayerItem(def) {
    const state = _layers.get(def.id);
    const visible = state?.visible ?? def.visible;

    const item = Utils.el('div', {
      class: 'layer-item',
      'data-layer-id': def.id,
      'aria-label': def.name,
    });

    // Visibility toggle
    const visBtn = Utils.el('button', {
      class: `layer-visibility-toggle${visible ? '' : ' hidden-layer'}`,
      'data-vis-toggle': def.id,
      title: visible ? 'Hide layer' : 'Show layer',
      onclick: () => {
        const newVisible = !(_layers.get(def.id)?.visible ?? false);
        setLayerVisible(def.id, newVisible);
      },
    }, Utils.el('i', { class: `fa-solid ${visible ? 'fa-eye' : 'fa-eye-slash'}` }));

    // Symbol
    const symbol = _buildSymbolEl(def);

    // Name + count
    const nameWrap = Utils.el('div', { class: 'layer-name-wrap', onclick: () => fitToLayer(def.id) });
    nameWrap.appendChild(Utils.el('div', { class: 'layer-name', text: def.name }));
    const countEl = Utils.el('div', {
      class: 'layer-feature-count',
      'data-layer-count': def.id,
      text: state?.loaded ? Utils.fmtNum(state.featureCount) : '…',
    });
    nameWrap.appendChild(countEl);

    // Action buttons
    const actions = Utils.el('div', { class: 'layer-item-actions' });

    const opacityBtn = Utils.el('button', {
      class: 'layer-mini-btn',
      title: 'Adjust opacity',
      onclick: (e) => { e.stopPropagation(); item.classList.toggle('show-opacity'); },
    }, Utils.el('i', { class: 'fa-solid fa-sliders' }));

    const fitBtn = Utils.el('button', {
      class: 'layer-mini-btn',
      title: 'Fit to layer extent',
      onclick: (e) => { e.stopPropagation(); fitToLayer(def.id); },
    }, Utils.el('i', { class: 'fa-solid fa-expand' }));

    const infoBtn = Utils.el('button', {
      class: 'layer-mini-btn',
      title: 'Layer information',
      onclick: (e) => { e.stopPropagation(); _showLayerInfo(def); },
    }, Utils.el('i', { class: 'fa-solid fa-circle-info' }));

    actions.append(opacityBtn, fitBtn, infoBtn);

    // Opacity row (hidden by default)
    const opacityRow = Utils.el('div', { class: 'layer-opacity-row' });
    const opacitySlider = Utils.el('input', {
      type:  'range', class: 'opacity-slider',
      min: '0', max: '1', step: '0.05',
      value: String(state?.opacity ?? 1),
    });
    const opacityLabel = Utils.el('span', { class: 'opacity-label', text: '100%' });
    opacitySlider.addEventListener('input', () => {
      const v = parseFloat(opacitySlider.value);
      setLayerOpacity(def.id, v);
      opacityLabel.textContent = `${Math.round(v * 100)}%`;
    });
    opacityRow.append(opacitySlider, opacityLabel);

    item.append(visBtn, symbol, nameWrap, actions, opacityRow);
    return item;
  }

  function _buildSymbolEl(def) {
    if (def.geometry === 'point') {
      return Utils.el('div', {
        class: 'layer-symbol',
        style: `background:${def.color}; border-color:rgba(255,255,255,0.3)`,
      });
    }
    if (def.geometry === 'line') {
      return Utils.el('div', {
        class: 'layer-symbol line',
        style: `background:${def.color}`,
      });
    }
    return Utils.el('div', {
      class: 'layer-symbol polygon',
      style: `background:${def.color}; border:2px solid ${def.color}; opacity:0.7`,
    });
  }

  /* ------------------------------------------------------------------ */
  /* LAYER INFO MODAL                                                     */
  /* ------------------------------------------------------------------ */

  function _showLayerInfo(def) {
    const state = _layers.get(def.id);
    const modal = Utils.qs('#layer-info-modal');
    const title = Utils.qs('#modal-title');
    const body  = Utils.qs('#modal-body');
    if (!modal || !title || !body) return;

    title.textContent = def.name;
    body.innerHTML = `
      <table style="width:100%;border-collapse:collapse;font-size:0.82rem">
        <tr><td style="padding:6px 0;color:var(--text-muted);width:40%">Category</td><td>${Utils.capitalize(def.category)}</td></tr>
        <tr><td style="padding:6px 0;color:var(--text-muted)">Geometry</td><td>${Utils.capitalize(def.geometry)}</td></tr>
        <tr><td style="padding:6px 0;color:var(--text-muted)">Source File</td><td><code style="font-size:0.75rem">${def.file}</code></td></tr>
        <tr><td style="padding:6px 0;color:var(--text-muted)">Features</td><td>${state?.loaded ? Utils.fmtNum(state.featureCount) : 'Not loaded'}</td></tr>
        <tr><td style="padding:6px 0;color:var(--text-muted)">Status</td><td>${state?.loaded ? '<span style="color:var(--clr-success)">✓ Loaded</span>' : '<span style="color:var(--text-muted)">Not loaded</span>'}</td></tr>
      </table>`;

    modal.classList.remove('hidden');
  }

  /* ------------------------------------------------------------------ */
  /* INIT                                                                 */
  /* ------------------------------------------------------------------ */

  function init(map, onLoaded) {
    _map = map;
    _onLayerLoaded = onLoaded;

    // Populate state map
    LAYER_DEFS.forEach(def => {
      _layers.set(def.id, {
        def,
        leafletLayer: null,
        cluster:      null,
        features:     [],
        featureCount: 0,
        loaded:       false,
        loading:      false,
        visible:      def.visible,
        opacity:      1,
        filteredCount: undefined,
      });
    });

    // Render sidebar UI
    renderLayerTree();

    // Load visible layers immediately; lazy-load rest on demand
    const visible = LAYER_DEFS.filter(d => d.visible);
    const deferred = LAYER_DEFS.filter(d => !d.visible);

    return Promise.all(visible.map(d => loadLayer(d.id))).then(() => {
      // Lazy-load deferred after small delay
      setTimeout(() => deferred.forEach(d => loadLayer(d.id)), 1200);
    });
  }

  /* ------------------------------------------------------------------ */
  /* GETTERS                                                              */
  /* ------------------------------------------------------------------ */

  const getLayerDefs  = () => LAYER_DEFS;
  const getLayerState = (id) => _layers.get(id);
  const getAllStates   = () => _layers;

  function getVisibleFeatures() {
    const all = [];
    _layers.forEach((state, id) => {
      if (state.visible && state.loaded) {
        state.features.forEach(f => all.push({ feature: f, layerId: id, def: state.def }));
      }
    });
    return all;
  }

  function getAllFeatures() {
    const all = [];
    _layers.forEach((state, id) => {
      if (state.loaded) {
        state.features.forEach(f => all.push({ feature: f, layerId: id, def: state.def }));
      }
    });
    return all;
  }

  /* ------------------------------------------------------------------ */
  /* COLLAPSE / EXPAND ALL GROUPS                                         */
  /* ------------------------------------------------------------------ */

  function expandAllGroups() {
    Utils.qsa('.layer-group').forEach(g => g.classList.remove('collapsed'));
  }
  function collapseAllGroups() {
    Utils.qsa('.layer-group').forEach(g => g.classList.add('collapsed'));
  }

  /* ------------------------------------------------------------------ */
  /* PUBLIC API                                                           */
  /* ------------------------------------------------------------------ */

  return Object.freeze({
    init,
    loadLayer,
    getLayerDefs,
    getLayerState,
    getAllStates,
    getVisibleFeatures,
    getAllFeatures,
    setLayerVisible,
    setLayerOpacity,
    showAllLayers,
    hideAllLayers,
    fitToLayer,
    renderLayerTree,
    applyFilter,
    clearFilter,
    expandAllGroups,
    collapseAllGroups,
  });

})();

/* ------------------------------------------------------------------ */
/* DETAIL PANEL MODULE (inline — small enough)                         */
/* ------------------------------------------------------------------ */
const DetailPanelModule = (() => {
  const panel = () => Utils.qs('#detail-panel');
  const body  = () => Utils.qs('#detail-panel-body');
  const title = () => Utils.qs('#detail-panel-title');

  function show(feature, def) {
    const p  = panel();
    const b  = body();
    const t  = title();
    if (!p || !b) return;

    p.classList.remove('hidden');
    t.textContent = 'Feature Details';
    b.innerHTML   = PopupModule.buildDetailHTML(feature, def);
    _attachDetailActions(b, feature, def);
  }

  function hide() {
    panel()?.classList.add('hidden');
  }

  function _attachDetailActions(container, feature, def) {
    const center = Utils.featureCentroid(feature);

    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        switch (btn.dataset.action) {
          case 'zoom':
            MapModule.flyToFeature(feature);
            break;
          case 'copy-coords':
            if (center) Utils.copyToClipboard(Utils.fmtCoord(center.lat, center.lng));
            break;
          case 'google-maps':
            if (center) Utils.openGoogleMaps(center.lat, center.lng);
            break;
        }
      });
    });
  }

  Utils.qs('#close-detail-panel')?.addEventListener('click', hide);

  return Object.freeze({ show, hide });
})();
