/**
 * utils.js — Shared utility functions
 * GizaGIS — Interactive Services Map
 */

'use strict';

const Utils = (() => {

  /* ------------------------------------------------------------------ */
  /* DOM HELPERS                                                          */
  /* ------------------------------------------------------------------ */

  /** @param {string} sel @param {Element} [ctx] */
  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /** Create element with optional attrs & children */
  function el(tag, attrs = {}, ...children) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') e.className = v;
      else if (k === 'html')  e.innerHTML = v;
      else if (k === 'text')  e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    });
    children.flat().forEach(c => {
      if (c == null) return;
      e.append(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }

  /* ------------------------------------------------------------------ */
  /* TOAST NOTIFICATIONS                                                 */
  /* ------------------------------------------------------------------ */

  const TOAST_ICONS = {
    success: 'fa-circle-check',
    error:   'fa-circle-xmark',
    warn:    'fa-triangle-exclamation',
    info:    'fa-circle-info',
  };

  /**
   * @param {string} msg
   * @param {'success'|'error'|'warn'|'info'} [type='info']
   * @param {number} [duration=3000]
   */
  function toast(msg, type = 'info', duration = 3500) {
    const container = qs('#toast-container');
    const t = el('div', { class: `toast ${type}` },
      el('i', { class: `toast-icon fa-solid ${TOAST_ICONS[type]}` }),
      el('span', { class: 'toast-msg', text: msg }),
      el('button', {
        class: 'toast-close', 'aria-label': 'Dismiss',
        onclick: () => dismiss(t),
      }, el('i', { class: 'fa-solid fa-xmark' }))
    );
    container.prepend(t);
    if (duration > 0) setTimeout(() => dismiss(t), duration);
  }

  function dismiss(t) {
    if (!t.parentElement) return;
    t.classList.add('fade-out');
    setTimeout(() => t.remove(), 300);
  }

  /* ------------------------------------------------------------------ */
  /* LOADING SCREEN                                                       */
  /* ------------------------------------------------------------------ */

  let _progress = 0;

  function setLoadingStatus(text, progress) {
    const statusEl = qs('#loading-status');
    const barEl    = qs('#loading-bar');
    if (statusEl) statusEl.textContent = text;
    if (barEl && progress != null) {
      _progress = Math.max(_progress, progress);
      barEl.style.width = `${_progress}%`;
    }
  }

  function hideLoadingScreen() {
    const screen = qs('#loading-screen');
    const app    = qs('#app');
    if (screen) {
      screen.classList.add('fade-out');
      setTimeout(() => { screen.remove(); }, 700);
    }
    if (app) app.classList.remove('hidden');
  }

  /* ------------------------------------------------------------------ */
  /* NUMBER / STRING FORMATTERS                                           */
  /* ------------------------------------------------------------------ */

  /** Format large numbers: 1234567 → "1,234,567" */
  const fmtNum = n => (n == null || isNaN(n)) ? '—' : Number(n).toLocaleString('en-EG');

  /** Format metres to km string */
  const fmtLength = m => m >= 1000
    ? `${(m / 1000).toFixed(2)} km`
    : `${Math.round(m)} m`;

  /** Format area in m² to km² */
  const fmtArea = m2 => m2 >= 1_000_000
    ? `${(m2 / 1_000_000).toFixed(3)} km²`
    : `${Math.round(m2)} m²`;

  /** Capitalize first letter */
  const capitalize = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

  /** Truncate string */
  const truncate = (s, n = 40) => s && s.length > n ? s.slice(0, n) + '…' : s;

  /** Escape HTML entities */
  function escHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Highlight query inside text (returns HTML string) */
  function highlight(text, query) {
    if (!query || !text) return escHtml(text);
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escHtml(String(text)).replace(
      new RegExp(`(${escaped})`, 'gi'),
      '<mark>$1</mark>'
    );
  }

  /* ------------------------------------------------------------------ */
  /* COORDINATES                                                          */
  /* ------------------------------------------------------------------ */

  /** Format lat/lng to display string */
  const fmtCoord = (lat, lng) =>
    `${Number(lat).toFixed(6)}°N, ${Number(lng).toFixed(6)}°E`;

  /** Copy string to clipboard */
  function copyToClipboard(text) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => toast('Copied to clipboard', 'success', 2000),
        () => toast('Failed to copy', 'error')
      );
    } else {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      try { document.execCommand('copy'); toast('Copied to clipboard', 'success', 2000); }
      catch { toast('Failed to copy', 'error'); }
      document.body.removeChild(ta);
    }
  }

  /** Open Google Maps at coordinates */
  const openGoogleMaps = (lat, lng) =>
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank', 'noopener');

  /* ------------------------------------------------------------------ */
  /* DEBOUNCE / THROTTLE                                                  */
  /* ------------------------------------------------------------------ */

  function debounce(fn, delay) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
  }

  function throttle(fn, limit) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= limit) { last = now; fn(...args); }
    };
  }

  /* ------------------------------------------------------------------ */
  /* DATA EXPORT                                                          */
  /* ------------------------------------------------------------------ */

  /** Trigger a file download */
  function downloadBlob(content, filename, mime = 'text/plain') {
    const blob = new Blob([content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = el('a', { href: url, download: filename });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  /** Convert array of feature props to CSV */
  function toCSV(features) {
    if (!features.length) return '';
    const cols = new Set();
    features.forEach(f => Object.keys(f.properties || {}).forEach(k => cols.add(k)));
    const headers = [...cols];
    const rows = features.map(f => {
      const p = f.properties || {};
      return headers.map(h => {
        const v = p[h] ?? '';
        const s = String(v);
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      }).join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  }

  /* ------------------------------------------------------------------ */
  /* UNIQUE COLOR HELPERS                                                 */
  /* ------------------------------------------------------------------ */

  /** Convert hex to rgba */
  function hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  /* ------------------------------------------------------------------ */
  /* ATTRIBUTE LABEL MAP                                                  */
  /* ------------------------------------------------------------------ */

  /** Human-readable keys for common GeoJSON fields */
  const ATTR_LABELS = {
    name:          'Name',
    type:          'Type',
    address:       'Address',
    district:      'District',
    phone:         'Phone',
    manager:       'Manager',
    working_hours: 'Working Hours',
    area:          'Area',
    length:        'Length',
    capacity:      'Capacity',
    beds:          'Beds',
    staff:         'Staff',
    email:         'Email',
    website:       'Website',
    description:   'Description',
    road_type:     'Road Type',
    road_name:     'Road Name',
    lanes:         'Lanes',
    surface:       'Surface',
    status:        'Status',
  };

  function labelFor(key) {
    return ATTR_LABELS[key] || capitalize(key.replace(/_/g, ' '));
  }

  /* ------------------------------------------------------------------ */
  /* SPATIAL / MATH                                                       */
  /* ------------------------------------------------------------------ */

  /** Compute GeoJSON line feature length in metres using Haversine */
  function lineLength(coords) {
    let total = 0;
    for (let i = 1; i < coords.length; i++) {
      total += haversine(coords[i - 1], coords[i]);
    }
    return total;
  }

  function haversine([lng1, lat1], [lng2, lat2]) {
    const R  = 6_371_000;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const dφ = ((lat2 - lat1) * Math.PI) / 180;
    const dλ = ((lng2 - lng1) * Math.PI) / 180;
    const a  = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /* ------------------------------------------------------------------ */
  /* FEATURE CENTROID                                                     */
  /* ------------------------------------------------------------------ */

  function featureCentroid(feature) {
    const g = feature.geometry;
    if (!g) return null;
    if (g.type === 'Point') return L.latLng(g.coordinates[1], g.coordinates[0]);
    if (g.type === 'MultiPoint') return L.latLng(g.coordinates[0][1], g.coordinates[0][0]);
    if (g.type === 'LineString') {
      const mid = Math.floor(g.coordinates.length / 2);
      return L.latLng(g.coordinates[mid][1], g.coordinates[mid][0]);
    }
    if (g.type === 'MultiLineString') {
      const line = g.coordinates[0];
      const mid  = Math.floor(line.length / 2);
      return L.latLng(line[mid][1], line[mid][0]);
    }
    if (g.type === 'Polygon') {
      const ring = g.coordinates[0];
      let latSum = 0, lngSum = 0;
      ring.forEach(([lng, lat]) => { latSum += lat; lngSum += lng; });
      return L.latLng(latSum / ring.length, lngSum / ring.length);
    }
    if (g.type === 'MultiPolygon') {
      const ring = g.coordinates[0][0];
      let latSum = 0, lngSum = 0;
      ring.forEach(([lng, lat]) => { latSum += lat; lngSum += lng; });
      return L.latLng(latSum / ring.length, lngSum / ring.length);
    }
    return null;
  }

  /* ------------------------------------------------------------------ */
  /* PUBLIC API                                                           */
  /* ------------------------------------------------------------------ */

  return Object.freeze({
    qs, qsa, el,
    toast, setLoadingStatus, hideLoadingScreen,
    fmtNum, fmtLength, fmtArea, capitalize, truncate, escHtml, highlight,
    fmtCoord, copyToClipboard, openGoogleMaps,
    debounce, throttle,
    downloadBlob, toCSV,
    hexToRgba,
    labelFor,
    lineLength, haversine,
    featureCentroid,
  });

})();
