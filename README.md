# Europa Oportunităților

Platformă local-first pentru Săptămâna Europeană la FSGC.

## Rulare

Deschide `index.html` direct în browser. Aplicația nu are nevoie de server pentru colectare locală.

## Hărți

- Landing: SVG generat din date GeoJSON reale.
- Participare și dashboard: Leaflet cu layer GeoJSON local.
- Date geografice: Natural Earth Admin 0 Countries, filtrate pentru țări europene și țări relevante pentru mobilitate europeană.
- Nu se folosesc tile-uri OpenStreetMap la runtime, pentru a evita dependențe de rețea și limite de utilizare pe `file://`.

## Date colectate

Răspunsurile se salvează în `localStorage`, în browserul curent. Dashboard-ul recalculează live pe baza acestor date.

Export disponibil:

- CSV pentru Excel / Google Sheets / analiză statistică.
- JSON pentru procesare ulterioară.

## Fișiere principale

- `index.html` - structura aplicației.
- `styles.css` - interfață, responsive, dashboard, hărți.
- `app.js` - flow, persistare locală, analitice, export.
- `data/europe-countries.js` - GeoJSON local cu granițe reale.
- `vendor/leaflet/` - Leaflet vendorizat local.
- `assets/saptamana-europeana-campaign.png` - logo-ul campaniei, decupat pentru antet.
