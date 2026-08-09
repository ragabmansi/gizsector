/**
 * statistics.js — Dashboard statistics cards
 * GizaGIS — Interactive Services Map
 */

'use strict';

const StatisticsModule = (() => {

  const STAT_DEFS = [
    { layerId: 'hospitals',     label: 'Hospitals',          icon: 'fa-hospital',          color: '#ef4444', bg: '#fef2f2' },
    { layerId: 'schools',       label: 'Schools',            icon: 'fa-school',            color: '#8b5cf6', bg: '#f5f3ff' },
    { layerId: 'universities',  label: 'Universities',       icon: 'fa-graduation-cap',    color: '#6366f1', bg: '#eef2ff' },
    { layerId: 'fire-stations', label: 'Fire Stations',      icon: 'fa-fire-extinguisher', color: '#dc2626', bg: '#fef2f2' },
    { layerId: 'ambulance',     label: 'Ambulance Stations', icon: 'fa-truck-medical',     color: '#f43f5e', bg: '#fff1f2' },
    { layerId: 'police',        label: 'Police Stations',    icon: 'fa-shield-halved',     color: '#1d4ed8', bg: '#eff6ff' },
    { layerId: 'pharmacies',    label: 'Pharmacies',         icon: 'fa-pills',             color: '#22c55e', bg: '#f0fdf4' },
    { layerId: 'mosques',       label: 'Mosques',            icon: 'fa-mosque',            color: '#16a34a', bg: '#f0fdf4' },
    { layerId: 'churches',      label: 'Churches',           icon: 'fa-church',            color: '#9333ea', bg: '#faf5ff' },
    { layerId: 'health-units',  label: 'Health Units',       icon: 'fa-heart-pulse',       color: '#f97316', bg: '#fff7ed' },
    // { layerId: 'clinics',       label: 'Clinics',            icon: 'fa-stethoscope',       color: '#fb923c', bg: '#fff7ed' },
    { layerId: 'government',    label: 'Govt. Buildings',    icon: 'fa-landmark',          color: '#0891b2', bg: '#ecfeff' },
  ];

  function update() {
    const container = Utils.qs('#stats-content');
    if (!container) return;
    container.innerHTML = '';

    // Total services card
    let totalServices = 0;
    STAT_DEFS.forEach(s => {
      const state = LayersModule.getLayerState(s.layerId);
      if (state?.visible) totalServices += state.filteredCount ?? state.featureCount ?? 0;
    });

    const totalCard = Utils.el('div', { class: 'stat-total-card' },
      Utils.el('div', {},
        Utils.el('div', { class: 'stat-total-label', text: 'Total Visible Services' }),
        Utils.el('div', { class: 'stat-total-value', text: Utils.fmtNum(totalServices) })
      ),
      Utils.el('i', { class: 'stat-total-icon fa-solid fa-map-location-dot' })
    );
    container.appendChild(totalCard);

    // Individual stat cards
    STAT_DEFS.forEach(s => {
      const state = LayersModule.getLayerState(s.layerId);
      const count = state?.loaded ? (state.filteredCount ?? state.featureCount ?? 0) : null;
      const card  = _buildStatCard(s, count, state?.visible ?? false);
      container.appendChild(card);
    });

    // Road stats
    _appendRoadStats(container);
  }

  function _buildStatCard(s, count, visible) {
    return Utils.el('div', { class: 'stat-card' },
      Utils.el('div', { class: 'stat-icon', style: `background:${s.bg};color:${s.color}` },
        Utils.el('i', { class: `fa-solid ${s.icon}` })
      ),
      Utils.el('div', { class: 'stat-body' },
        Utils.el('div', { class: 'stat-value', style: `color:${s.color}`,
          text: count === null ? '…' : Utils.fmtNum(count)
        }),
        Utils.el('div', { class: 'stat-label', text: s.label })
      ),
      !visible ? Utils.el('i', { class: 'fa-solid fa-eye-slash', style: 'color:var(--text-muted);font-size:0.75rem', title: 'Layer hidden' }) : Utils.el('span')
    );
  }

  function _appendRoadStats(container) {
    const state = LayersModule.getLayerState('roads');
    if (!state?.loaded) return;

    let totalLen = 0;
    state.features.forEach(f => {
      if (f.geometry?.type === 'LineString') totalLen += Utils.lineLength(f.geometry.coordinates);
      else if (f.geometry?.type === 'MultiLineString')
        f.geometry.coordinates.forEach(c => { totalLen += Utils.lineLength(c); });
    });

    const card = Utils.el('div', { class: 'road-stat' },
      Utils.el('div', { class: 'road-stat-label', text: 'Total Road Network Length' }),
      Utils.el('div', { class: 'road-stat-value', text: Utils.fmtLength(totalLen) }),
      Utils.el('div', { class: 'road-progress' },
        Utils.el('div', { class: 'road-progress-bar', style: 'width:100%' })
      )
    );
    container.appendChild(card);
  }

  Utils.qs('#export-stats-btn')?.addEventListener('click', () => {
    const rows = [['Layer', 'Feature Count', 'Visible']];
    LayersModule.getLayerDefs().forEach(def => {
      const s = LayersModule.getLayerState(def.id);
      rows.push([def.name, s?.featureCount ?? 0, s?.visible ? 'Yes' : 'No']);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    Utils.downloadBlob(csv, 'gizagis_statistics.csv', 'text/csv');
    Utils.toast('Statistics exported', 'success');
  });

  return Object.freeze({ update });
})();
