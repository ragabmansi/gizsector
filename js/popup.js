/**
 * popup.js — Professional popup & detail panel HTML builders
 * GizaGIS — Interactive Services Map
 */

'use strict';

const PopupModule = (() => {

  /* ------------------------------------------------------------------ */
  /* EXCLUDED KEYS (internal GeoJSON fields)                             */
  /* ------------------------------------------------------------------ */
  const EXCLUDE_KEYS = new Set([
    'id', 'fid', 'objectid', 'gid', 'uuid',
    'geom', 'geometry', 'shape', 'shape_leng', 'shape_area',
  ]);

  /* ------------------------------------------------------------------ */
  /* ATTRIBUTE FILTER                                                     */
  /* ------------------------------------------------------------------ */
  function _getDisplayProps(props) {
    if (!props) return [];
    return Object.entries(props)
      .filter(([k, v]) => !EXCLUDE_KEYS.has(k.toLowerCase()) && v != null && v !== '')
      .map(([k, v]) => ({ key: k, label: Utils.labelFor(k), value: v }));
  }

  /* ------------------------------------------------------------------ */
  /* POINT / POLYGON POPUP                                               */
  /* ------------------------------------------------------------------ */

  function buildFeaturePopup(feature, def) {
    const props    = feature.properties || {};
    const name     = props.name || props.Name || props.road_name || def.name;
    const type     = props.type || props.Type || '';
    const center   = Utils.featureCentroid(feature);
    const entries  = _getDisplayProps(props).slice(0, 8); // show max 8 attrs

    // Build attribute rows HTML
    const attrsHTML = entries.map(({ label, value }) => `
      <div class="popup-attr-row">
        <span class="popup-attr-key">${Utils.escHtml(label)}</span>
        <span class="popup-attr-val">${Utils.escHtml(String(value))}</span>
      </div>`).join('');

    const lat = center?.lat?.toFixed(6) ?? '—';
    const lng = center?.lng?.toFixed(6) ?? '—';

    const html = `
      <div class="custom-popup-header" style="background:linear-gradient(135deg,${def.color}22,${def.color}08)">
        <div class="popup-icon" style="background:${def.color}">
          <i class="fa-solid ${def.icon}"></i>
        </div>
        <div>
          <div class="popup-name">${Utils.escHtml(name)}</div>
          <div class="popup-layer">${Utils.escHtml(def.name)}${type ? ' · ' + Utils.escHtml(type) : ''}</div>
        </div>
      </div>
      <div class="popup-body">
        ${attrsHTML || '<div style="padding:8px 0;color:var(--text-muted);font-size:0.78rem">No attributes available.</div>'}
        <div class="popup-attr-row">
          <span class="popup-attr-key">Coordinates</span>
          <span class="popup-attr-val" style="font-family:var(--font-mono);font-size:0.72rem">${lat}°N, ${lng}°E</span>
        </div>
      </div>
      <div class="popup-actions">
        <button class="popup-action-btn" data-popup-action="zoom" data-lat="${lat}" data-lng="${lng}">
          <i class="fa-solid fa-magnifying-glass-location"></i>Zoom Here
        </button>
        <button class="popup-action-btn" data-popup-action="copy-coords" data-lat="${lat}" data-lng="${lng}">
          <i class="fa-solid fa-copy"></i>Copy Coords
        </button>
        <button class="popup-action-btn" data-popup-action="google-maps" data-lat="${lat}" data-lng="${lng}">
          <i class="fa-brands fa-google"></i>Google Maps
        </button>
      </div>`;

    // Return as DOM node so we can attach events
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    _attachPopupEvents(wrapper, feature, def, center);
    return wrapper;
  }

  /* ------------------------------------------------------------------ */
  /* ROAD / LINE POPUP                                                   */
  /* ------------------------------------------------------------------ */

  function buildLinePopup(feature, def) {
    const props    = feature.properties || {};
    const name     = props.road_name || props.name || props.Name || 'Road';
    const roadType = props.type || props.road_type || props.highway || '—';
    const center   = Utils.featureCentroid(feature);
    const entries  = _getDisplayProps(props).slice(0, 6);

    // Compute length if geometry available
    let lengthStr = '—';
    if (feature.geometry?.type === 'LineString') {
      lengthStr = Utils.fmtLength(Utils.lineLength(feature.geometry.coordinates));
    } else if (feature.geometry?.type === 'MultiLineString') {
      const total = feature.geometry.coordinates.reduce((sum, coords) => sum + Utils.lineLength(coords), 0);
      lengthStr = Utils.fmtLength(total);
    }

    const roadColors = {
      motorway: '#e11d48', trunk: '#f97316', primary: '#f59e0b',
      secondary: '#84cc16', tertiary: '#94a3b8',
    };
    const badgeColor = roadColors[roadType.toLowerCase()] || '#94a3b8';

    const attrsHTML = entries.map(({ label, value }) => `
      <div class="popup-attr-row">
        <span class="popup-attr-key">${Utils.escHtml(label)}</span>
        <span class="popup-attr-val">${Utils.escHtml(String(value))}</span>
      </div>`).join('');

    const lat = center?.lat?.toFixed(6) ?? '—';
    const lng = center?.lng?.toFixed(6) ?? '—';

    const html = `
      <div class="road-popup-header" style="background:linear-gradient(135deg,${badgeColor}22,${badgeColor}08)">
        <div class="popup-icon" style="background:${badgeColor}">
          <i class="fa-solid fa-road"></i>
        </div>
        <div>
          <div class="popup-name">${Utils.escHtml(name)}</div>
          <div class="popup-layer">
            <span class="road-type-badge" style="background:${badgeColor}22;color:${badgeColor}">${Utils.capitalize(Utils.escHtml(roadType))}</span>
          </div>
        </div>
      </div>
      <div class="popup-body">
        <div class="popup-attr-row">
          <span class="popup-attr-key">Length</span>
          <span class="popup-attr-val" style="font-weight:600">${lengthStr}</span>
        </div>
        ${attrsHTML}
      </div>
      <div class="popup-actions">
        <button class="popup-action-btn" data-popup-action="zoom" data-lat="${lat}" data-lng="${lng}">
          <i class="fa-solid fa-magnifying-glass-location"></i>Zoom Here
        </button>
        <button class="popup-action-btn" data-popup-action="copy-coords" data-lat="${lat}" data-lng="${lng}">
          <i class="fa-solid fa-copy"></i>Copy Coords
        </button>
        <button class="popup-action-btn" data-popup-action="google-maps" data-lat="${lat}" data-lng="${lng}">
          <i class="fa-brands fa-google"></i>Google Maps
        </button>
      </div>`;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    _attachPopupEvents(wrapper, feature, def, center);
    return wrapper;
  }

  /* ------------------------------------------------------------------ */
  /* POPUP EVENT HANDLERS                                                 */
  /* ------------------------------------------------------------------ */

  function _attachPopupEvents(wrapper, feature, def, center) {
    wrapper.querySelectorAll('[data-popup-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.popupAction;
        const lat    = parseFloat(btn.dataset.lat);
        const lng    = parseFloat(btn.dataset.lng);

        switch (action) {
          case 'zoom':
            MapModule.flyToFeature(feature);
            break;
          case 'copy-coords':
            if (!isNaN(lat) && !isNaN(lng)) Utils.copyToClipboard(Utils.fmtCoord(lat, lng));
            break;
          case 'google-maps':
            if (!isNaN(lat) && !isNaN(lng)) Utils.openGoogleMaps(lat, lng);
            break;
        }
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* DETAIL PANEL HTML                                                    */
  /* ------------------------------------------------------------------ */

  function buildDetailHTML(feature, def) {
    const props   = feature.properties || {};
    const name    = props.name || props.Name || props.road_name || def.name;
    const type    = props.type || props.Type || def.name;
    const entries = _getDisplayProps(props);
    const center  = Utils.featureCentroid(feature);

    const attrsHTML = entries.map(({ label, value }) => `
      <tr>
        <td>${Utils.escHtml(label)}</td>
        <td>${Utils.escHtml(String(value))}</td>
      </tr>`).join('');

    return `
      <div class="detail-feature-header" style="background:linear-gradient(135deg,${def.color}18,${def.color}06);border-radius:var(--radius-md)">
        <div class="detail-feature-icon" style="background:${def.color}">
          <i class="fa-solid ${def.icon}"></i>
        </div>
        <div>
          <div class="detail-feature-name">${Utils.escHtml(name)}</div>
          <div class="detail-feature-type">${Utils.escHtml(def.name)} · ${Utils.escHtml(type)}</div>
        </div>
      </div>

      <table class="detail-attr-table">
        <tbody>
          ${attrsHTML}
          ${center ? `<tr><td>Coordinates</td><td style="font-family:var(--font-mono);font-size:0.72rem">${center.lat.toFixed(6)}°N, ${center.lng.toFixed(6)}°E</td></tr>` : ''}
        </tbody>
      </table>

      <div class="detail-actions">
        <button class="detail-action-btn" data-action="zoom">
          <i class="fa-solid fa-magnifying-glass-location"></i>
          Zoom Here
        </button>
        <button class="detail-action-btn" data-action="copy-coords">
          <i class="fa-solid fa-copy"></i>
          Copy Coords
        </button>
        <button class="detail-action-btn" data-action="google-maps">
          <i class="fa-brands fa-google"></i>
          Google Maps
        </button>
      </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* PUBLIC API                                                           */
  /* ------------------------------------------------------------------ */

  return Object.freeze({
    buildFeaturePopup,
    buildLinePopup,
    buildDetailHTML,
  });

})();
