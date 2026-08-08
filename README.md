# GizaGIS — Interactive Services Map

**A professional web GIS application mapping public services across Giza Governorate, Egypt.**

Built as a graduation project for GIS students. Designed to resemble ArcGIS Online / QGIS Web Client.

---

## 🗂 Project Structure

```
project/
├── index.html              # Main entry point
├── css/
│   └── style.css           # All styles (light + dark theme)
├── js/
│   ├── utils.js            # Shared utilities (DOM, toast, export, math)
│   ├── map.js              # Leaflet map init, basemaps, highlight
│   ├── layers.js           # Layer loading, clustering, symbology, tree UI
│   ├── popup.js            # Popup & detail panel HTML builders
│   ├── search.js           # Universal search across all layers
│   ├── filters.js          # Category / District / Type filters
│   ├── statistics.js       # Dashboard statistics cards
│   ├── legend.js           # Auto-generated map legend
│   └── app.js              # App orchestrator + keyboard shortcuts
├── data/
│   ├── hospitals.geojson
│   ├── schools.geojson
│   ├── universities.geojson
│   ├── police.geojson
│   ├── fire_stations.geojson
│   ├── ambulance.geojson
│   ├── pharmacies.geojson
│   ├── clinics.geojson
│   ├── health_units.geojson
│   ├── mosques.geojson
│   ├── churches.geojson
│   ├── government.geojson
│   ├── institutes.geojson
│   ├── parks.geojson
│   ├── roads.geojson
│   └── boundaries.geojson
├── icons/                  # Place custom icons here (optional)
└── assets/                 # Additional assets (optional)
```

---

## 🚀 Quick Start

### Option A — Direct Open (Simple)
> ⚠️ Some browsers block `fetch()` for local files.  
> Use Chrome with `--allow-file-access-from-files` flag, or use a local server.

### Option B — Local Server (Recommended)

**Using Python (built-in):**
```bash
cd project/
python3 -m http.server 8080
```
Then open: **http://localhost:8080**

**Using Node.js:**
```bash
npx serve .
```

**Using VS Code:**  
Install the **Live Server** extension → right-click `index.html` → "Open with Live Server"

---

## ✨ Features

| Feature | Description |
|---|---|
| **5 Basemaps** | Street, Satellite, Topo, Carto Light, Carto Dark |
| **16 Layer Types** | Hospitals, Schools, Roads, Police, Mosques, Parks, and more |
| **Universal Search** | Searches all layers by name, district, type, address |
| **Marker Clustering** | Handles large datasets with canvas rendering |
| **Lazy Loading** | Only visible layers load on startup |
| **Filter Panel** | Filter by Category, District, Service Type |
| **Statistics Dashboard** | Live feature counts with road length |
| **Auto Legend** | Updates based on visible layers |
| **Dark / Light Mode** | Toggle with button or `D` key |
| **Export** | GeoJSON & CSV export of visible features |
| **Measure Tool** | Distance & area measurement |
| **Locate Me** | GPS location with compass |
| **MiniMap** | Overview navigation |
| **Fullscreen** | Native browser fullscreen |
| **Detail Panel** | Slide-in panel with all feature attributes |
| **Keyboard Shortcuts** | `/` search, `S` sidebar, `D` dark, `F` full, `R` reset |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `/` | Focus search box |
| `S` | Toggle sidebar |
| `D` | Toggle dark/light mode |
| `F` | Toggle fullscreen |
| `R` | Reset map view |
| `Esc` | Close popups & panels |
| `+` / `-` | Zoom in / out |
| `1–5` | Switch sidebar tab |

---

## 🗺 Adding Your Own GeoJSON Data

1. Place your `.geojson` file inside the `data/` folder.
2. Open `js/layers.js` and add an entry to `LAYER_DEFS`:

```javascript
{
  id:       'my-layer',          // unique ID
  name:     'My Layer Name',     // display name
  file:     'data/my-layer.geojson',
  group:    'Health',            // group in sidebar
  category: 'health',           // for filtering
  geometry: 'point',            // 'point' | 'line' | 'polygon'
  color:    '#3b82f6',          // hex color
  icon:     'fa-circle',        // Font Awesome icon class
  visible:  true,               // shown on load?
}
```

3. That's it — the layer will appear in the tree, legend, statistics, search, and filters automatically.

---

## 🏗 Architecture

```
app.js          ← Entry point; wires all modules together
  ├── MapModule         ← Leaflet init, basemaps, controls, highlight
  ├── LayersModule      ← Definitions, lazy load, cluster, filter
  │     └── DetailPanelModule   ← Feature detail slide-in panel
  ├── PopupModule       ← HTML builders for popups & detail
  ├── SearchModule      ← Real-time universal search
  ├── FiltersModule     ← Category/district/type filters
  ├── StatisticsModule  ← Dashboard stat cards
  ├── LegendModule      ← Auto legend renderer
  └── Utils             ← DOM helpers, toast, export, math
```

All modules are **IIFEs** — no bundler required, no global variable leaks.

---

## 🛠 Technologies

- **Leaflet.js 1.9.4** — Core map engine
- **Leaflet.MarkerCluster 1.5.3** — Point clustering
- **Leaflet MiniMap 3.6.1** — Overview map
- **Leaflet Locate Control** — GPS location
- **Leaflet Measure** — Distance/area tools
- **Font Awesome 6.5** — Icons
- **Inter + JetBrains Mono** — Typography
- **HTML5 / CSS3 / ES6+** — No framework, no bundler

---

## 📋 GeoJSON Attribute Guide

Your GeoJSON features can include any of these fields — they'll be displayed automatically:

| Field | Type | Description |
|---|---|---|
| `name` | String | Feature name (required for search/popup) |
| `type` | String | Service type (used in filters) |
| `address` | String | Street address |
| `district` | String | District name (used in filters) |
| `phone` | String | Contact phone number |
| `manager` | String | Manager/director name |
| `working_hours` | String | Opening hours |
| `capacity` | Number | Capacity (beds, students, etc.) |
| `area` | Number | Area in m² (polygons) |
| `road_name` | String | Road name (line features) |
| `road_type` | String | Road classification |
| `lanes` | Number | Number of lanes |

---

## 👨‍🎓 Project Info

- **Faculty:** Faculty of Urban & Regional Planning
- **Institution:** Cairo University
- **Year:** 2025
- **Version:** 1.0.0

---

## 📄 License

This project is intended for academic and educational use.
