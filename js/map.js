/**
 * map.js — Leaflet map initialization, basemaps, and core controls
 * GizaGIS — Interactive Services Map
 */

'use strict';

const MapModule = (() => {

  /* ------------------------------------------------------------------ */
  /* CONSTANTS                                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Default center: Port Said, Egypt
   */
  const DEFAULT_CENTER = [31.2653, 32.3019];
  const DEFAULT_ZOOM   = 11;

  const MIN_ZOOM = 7;
  const MAX_ZOOM = 19;


  /* ------------------------------------------------------------------ */
  /* BASEMAP DEFINITIONS                                                 */
  /* ------------------------------------------------------------------ */

  const BASEMAPS = [
    {
      id: 'osm',
      name: 'Street',
      icon: 'fa-road',
      color: '#4a90d9',
      tile: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attr: '© OpenStreetMap contributors',
      maxZoom: 19,
    },

    {
      id: 'satellite',
      name: 'Satellite',
      icon: 'fa-satellite',
      color: '#2d6a4f',
      tile: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attr: '© Esri, Maxar, Earthstar Geographics',
      maxZoom: 19,
    },

    {
      id: 'topo',
      name: 'Topo',
      icon: 'fa-mountain',
      color: '#8b5e3c',
      tile: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attr: '© OpenTopoMap contributors',
      maxZoom: 17,
    },

    {
      id: 'carto-light',
      name: 'Carto Light',
      icon: 'fa-sun',
      color: '#a8dadc',
      tile: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attr: '© CARTO © OpenStreetMap contributors',
      maxZoom: 19,
    },

    {
      id: 'carto-dark',
      name: 'Carto Dark',
      icon: 'fa-moon',
      color: '#264653',
      tile: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attr: '© CARTO © OpenStreetMap contributors',
      maxZoom: 19,
    },
  ];


  /* ------------------------------------------------------------------ */
  /* STATE                                                              */
  /* ------------------------------------------------------------------ */

  let _map = null;
  let _activeTile = null;
  let _highlightLayer = null;
  let _activeBasemapId = 'osm';


  /* ------------------------------------------------------------------ */
  /* PANES                                                              */
  /* ------------------------------------------------------------------ */

  const PANES = {
    boundaries: { zIndex: 200 },
    roads:      { zIndex: 300 },
    polygons:   { zIndex: 350 },
    points:     { zIndex: 400 },
    highlight:  { zIndex: 450 },
    labels:     { zIndex: 500 },
  };


  /* ------------------------------------------------------------------ */
  /* INIT                                                               */
  /* ------------------------------------------------------------------ */

  function init() {

    _map = L.map('map', {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,

      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,

      zoomControl: false,
      attributionControl: true,

      // Performance for large datasets
      preferCanvas: true,
    });


    /* -------------------------------------------------------------- */
    /* Custom panes                                                     */
    /* -------------------------------------------------------------- */

    Object.entries(PANES).forEach(([name, opts]) => {

      const pane = _map.createPane(name);

      pane.style.zIndex = opts.zIndex;

      if (name === 'highlight') {
        pane.style.pointerEvents = 'none';
      }

    });


    /* -------------------------------------------------------------- */
    /* Initial basemap                                                  */
    /* -------------------------------------------------------------- */

    _setBasemap('osm');


    /* -------------------------------------------------------------- */
    /* Controls                                                         */
    /* -------------------------------------------------------------- */

    _addScaleControl();
    _addMiniMap();
    _addLocateControl();
    _addMeasureControl();
    _addAttributionControl();


    /* -------------------------------------------------------------- */
    /* Highlight layer                                                  */
    /* -------------------------------------------------------------- */

    _highlightLayer = L.layerGroup().addTo(_map);


    /* -------------------------------------------------------------- */
    /* Mouse coordinate tracking                                        */
    /* -------------------------------------------------------------- */

    _map.on(
      'mousemove',
      Utils.throttle(_onMouseMove, 80)
    );


    /* -------------------------------------------------------------- */
    /* Status bar zoom                                                  */
    /* -------------------------------------------------------------- */

    _map.on('zoomend', _onZoomEnd);

    _onZoomEnd();


    /* -------------------------------------------------------------- */
    /* Fix Leaflet map size                                             */
    /* -------------------------------------------------------------- */

    /*
     * Important:
     * Leaflet sometimes initializes before the map container
     * has its final dimensions, especially when a loading screen
     * or CSS layout is involved.
     *
     * invalidateSize() forces Leaflet to recalculate the map size.
     */

    setTimeout(() => {

      if (_map) {
        _map.invalidateSize({
          animate: false
        });
      }

    }, 100);


    /*
     * Second check after the browser has completed layout/painting.
     */

    requestAnimationFrame(() => {

      requestAnimationFrame(() => {

        if (_map) {
          _map.invalidateSize({
            animate: false
          });
        }

      });

    });


    return _map;
  }


  /* ------------------------------------------------------------------ */
  /* BASEMAP                                                            */
  /* ------------------------------------------------------------------ */

  function _setBasemap(id) {

    const def =
      BASEMAPS.find(b => b.id === id) ||
      BASEMAPS[0];


    if (_activeTile) {
      _map.removeLayer(_activeTile);
    }


    _activeTile = L.tileLayer(def.tile, {

      attribution: def.attr,

      maxZoom: def.maxZoom,

      pane: 'tilePane',

      crossOrigin: true,

    }).addTo(_map);


    _activeBasemapId = id;
  }


  function setBasemap(id) {

    _setBasemap(id);

    _renderBasemapGrid();

    // Make sure the map is rendered correctly
    invalidateSize();
  }


  /* ------------------------------------------------------------------ */
  /* BUILD BASEMAP SELECTOR IN SIDEBAR                                 */
  /* ------------------------------------------------------------------ */

  function renderBasemapGrid() {

    _renderBasemapGrid();

  }


  function _renderBasemapGrid() {

    const grid = Utils.qs('#basemap-grid');

    if (!grid) return;


    grid.innerHTML = '';


    BASEMAPS.forEach(b => {

      const opt = Utils.el(

        'button',

        {
          class:
            `basemap-option${b.id === _activeBasemapId ? ' active' : ''}`,

          role: 'radio',

          'aria-checked':
            b.id === _activeBasemapId
              ? 'true'
              : 'false',

          'aria-label':
            `${b.name} basemap`,

          onclick: () => setBasemap(b.id),
        },


        Utils.el(
          'div',
          {
            class: 'basemap-thumb',

            style: `background: ${b.color}`,
          },

          Utils.el(
            'div',
            {
              class: 'basemap-thumb-inner'
            }
          )
        ),


        Utils.el(
          'span',
          {
            class: 'basemap-name',

            text: b.name
          }
        )

      );


      grid.appendChild(opt);

    });

  }


  /* ------------------------------------------------------------------ */
  /* CONTROLS                                                           */
  /* ------------------------------------------------------------------ */

  function _addScaleControl() {

    L.control.scale({

      position: 'bottomleft',

      imperial: false,

      maxWidth: 150,

    }).addTo(_map);

  }


  function _addMiniMap() {

    try {

      const miniTile = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '',
          maxZoom: 19
        }
      );


      const mini = new L.Control.MiniMap(
        miniTile,
        {

          position: 'bottomright',

          toggleDisplay: true,

          minimized: false,

          width: 140,

          height: 100,

          zoomLevelOffset: -5,

          aimingRectOptions: {
            color: '#3b82f6',
            weight: 2
          },

          shadowRectOptions: {
            opacity: 0
          },

        }
      );


      mini.addTo(_map);

    } catch (e) {

      console.warn(
        'MiniMap not loaded:',
        e
      );

    }

  }


  function _addLocateControl() {

    try {

      L.control.locate({

        position: 'bottomright',

        flyTo: true,

        keepCurrentZoomLevel: false,

        showCompass: true,

        strings: {
          title: 'Show my location'
        },

        locateOptions: {
          maxZoom: 16
        },

        markerStyle: {
          color: '#3b82f6',
          fillColor: '#3b82f6'
        },

      }).addTo(_map);

    } catch (e) {

      console.warn(
        'LocateControl not loaded:',
        e
      );

    }

  }


  function _addMeasureControl() {

    try {

      L.control.measure({

        position: 'topleft',

        primaryLengthUnit: 'meters',

        secondaryLengthUnit: 'kilometers',

        primaryAreaUnit: 'sqmeters',

        secondaryAreaUnit: 'sqkilometers',

        activeColor: '#3b82f6',

        completedColor: '#10b981',

      }).addTo(_map);

    } catch (e) {

      console.warn(
        'MeasureControl not loaded:',
        e
      );

    }

  }


  function _addAttributionControl() {

    _map.attributionControl.setPrefix(
      'Leaflet'
    );

  }


  /* ------------------------------------------------------------------ */
  /* CUSTOM TOOLBAR HANDLERS                                            */
  /* ------------------------------------------------------------------ */

  function zoomIn() {

    if (!_map) return;

    _map.zoomIn();

  }


  function zoomOut() {

    if (!_map) return;

    _map.zoomOut();

  }


  /**
   * Reset map view to Port Said.
   */
  function resetView() {

    if (!_map) return;


    _map.flyTo(
      DEFAULT_CENTER,
      DEFAULT_ZOOM,
      {
        duration: 1.2
      }
    );

  }


  /**
   * Force Leaflet to recalculate the map container size.
   *
   * This is especially important after:
   * - Loading screen disappears
   * - Sidebar changes
   * - Responsive layout changes
   * - Fullscreen changes
   */
  function invalidateSize() {

    if (!_map) return;


    _map.invalidateSize({
      animate: false
    });

  }


  /* ------------------------------------------------------------------ */
  /* HIGHLIGHT SYSTEM                                                   */
  /* ------------------------------------------------------------------ */

  /**
   * Clear all highlights.
   */
  function clearHighlight() {

    if (!_highlightLayer) return;

    _highlightLayer.clearLayers();

  }


  /**
   * Highlight a GeoJSON feature on the map with optional flash.
   *
   * @param {object} feature GeoJSON feature
   * @param {string} color   Hex colour
   * @param {boolean} flash  Animate
   */
  function highlightFeature(
    feature,
    color = '#3b82f6',
    flash = true
  ) {

    clearHighlight();


    const g = feature.geometry;

    if (!g) return;


    let layer;


    const isPoint =
      g.type === 'Point' ||
      g.type === 'MultiPoint';


    if (isPoint) {

      const coords =
        g.type === 'Point'
          ? g.coordinates
          : g.coordinates[0];


      layer = L.circleMarker(
        [
          coords[1],
          coords[0]
        ],
        {

          pane: 'highlight',

          radius: 18,

          color: color,

          weight: 3,

          opacity: 0.9,

          fillColor: color,

          fillOpacity: 0.25,

        }
      );


    } else {

      layer = L.geoJSON(
        feature,
        {

          pane: 'highlight',

          style: {

            color: color,

            weight: 4,

            opacity: 0.9,

            fillColor: color,

            fillOpacity: 0.15,

            dashArray:
              g.type.includes('Line')
                ? '6,4'
                : null,

          },

        }
      );

    }


    _highlightLayer.addLayer(layer);


    if (flash) {

      const el =
        layer.getElement
          ? layer.getElement()
          : null;


      if (el) {

        el.classList.add(
          'highlight-flash'
        );

      }

    }


    // Auto-clear after 8 seconds
    setTimeout(
      clearHighlight,
      8000
    );

  }


  /**
   * Fly to feature bounds.
   */
  function flyToFeature(
    feature,
    zoom = null
  ) {

    const g = feature.geometry;

    if (!g) return;


    if (g.type === 'Point') {

      _map.flyTo(
        [
          g.coordinates[1],
          g.coordinates[0]
        ],

        zoom || 16,

        {
          duration: 1.2
        }
      );


    } else {

      const bounds =
        L.geoJSON(feature).getBounds();


      if (bounds.isValid()) {

        _map.flyToBounds(
          bounds,
          {

            padding: [
              50,
              50
            ],

            maxZoom:
              zoom || 16,

            duration: 1.2,

          }
        );

      }

    }

  }


  /* ------------------------------------------------------------------ */
  /* STATUS BAR UPDATES                                                 */
  /* ------------------------------------------------------------------ */

  function _onMouseMove(e) {

    const latEl =
      Utils.qs('#coord-lat');

    const lngEl =
      Utils.qs('#coord-lng');


    if (latEl) {

      latEl.textContent =
        e.latlng.lat.toFixed(6);

    }


    if (lngEl) {

      lngEl.textContent =
        e.latlng.lng.toFixed(6);

    }

  }


  function _onZoomEnd() {

    if (!_map) return;


    const z =
      _map.getZoom();


    const zEl =
      Utils.qs('#map-zoom-display');


    if (zEl) {

      zEl.textContent =
        `Zoom: ${z}`;

    }


    // Approximate scale denominator
    const metersPerPx =
      40_075_016.686 *
      Math.cos(
        _map.getCenter().lat *
        Math.PI /
        180
      ) /
      Math.pow(
        2,
        z + 8
      );


    const scale =
      Math.round(
        metersPerPx *
        96 /
        0.0254
      );


    const sEl =
      Utils.qs('#map-scale-display');


    if (sEl) {

      sEl.textContent =
        `Scale: 1:${Utils.fmtNum(scale)}`;

    }

  }


  /* ------------------------------------------------------------------ */
  /* GETTERS                                                             */
  /* ------------------------------------------------------------------ */

  const getMap =
    () => _map;


  const getActiveBasemap =
    () => _activeBasemapId;


  const getBasemaps =
    () => BASEMAPS;


  /* ------------------------------------------------------------------ */
  /* FULLSCREEN                                                          */
  /* ------------------------------------------------------------------ */

  function toggleFullscreen() {

    if (!document.fullscreenElement) {

      document.documentElement
        .requestFullscreen?.()
        .then(() => {

          // Fix map size after entering fullscreen
          setTimeout(() => {

            invalidateSize();

          }, 150);

        })
        .catch(err => {

          console.warn(
            'Fullscreen request failed:',
            err
          );

        });

    } else {

      document.exitFullscreen?.()
        .then(() => {

          // Fix map size after leaving fullscreen
          setTimeout(() => {

            invalidateSize();

          }, 150);

        })
        .catch(err => {

          console.warn(
            'Exit fullscreen failed:',
            err
          );

        });

    }

  }


  /* ------------------------------------------------------------------ */
  /* PUBLIC API                                                          */
  /* ------------------------------------------------------------------ */

  return Object.freeze({

    init,

    getMap,

    getBasemaps,

    getActiveBasemap,

    renderBasemapGrid,

    setBasemap,

    zoomIn,

    zoomOut,

    resetView,

    invalidateSize,

    clearHighlight,

    highlightFeature,

    flyToFeature,

    toggleFullscreen,

  });

})();