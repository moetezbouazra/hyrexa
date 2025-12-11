# Leaflet Map Features - Quick Reference

## 🎯 Current Implementation

### ✅ Core Features
1. **OpenStreetMap Integration**
   - Free tile service, no API keys needed
   - High-quality map rendering
   - Zoom levels 1-19 supported

2. **Custom Waste Markers**
   - Color-coded by waste type
   - Size scales with severity (1-5)
   - Shows severity number inside marker
   - Selected marker gets green border + larger size
   - Smooth animations

3. **Marker Clustering** (Default: ON)
   - Groups nearby markers automatically
   - Three cluster styles:
     - Small: 0-10 markers (purple gradient)
     - Medium: 11-50 markers (pink gradient)
     - Large: 50+ markers (orange gradient)
   - Click to expand/zoom
   - Improves performance with many markers

4. **Heatmap Visualization** (Default: OFF)
   - Shows waste concentration areas
   - Color gradient: blue → cyan → yellow → orange → red
   - Intensity based on severity levels
   - Great for identifying problem areas
   - Toggle with `showHeatmap={true}` prop

5. **User Location Tracking**
   - Blue pulsing marker
   - Shows current GPS position
   - Accuracy circle (100m radius)
   - Auto-centers map if no reports
   - "Your Location" popup

6. **Interactive Popups**
   - Click any marker to view details
   - Shows:
     - Waste type (formatted nicely)
     - Description
     - Severity level (1-5 scale)
     - Status badge (color-coded)
   - Styled with Tailwind CSS
   - Auto-closes when clicking elsewhere

7. **Legend Component**
   - Fixed at bottom-left
   - Shows all 6 waste types with colors
   - Clean, compact design
   - High z-index (always on top)

## 🎨 Marker Colors

```
🔴 Plastic Bottles  → Red (#ef4444)
🟠 Plastic Bags     → Orange (#f59e0b)
🟡 Mixed Plastic    → Yellow (#eab308)
🟣 Styrofoam        → Purple (#8b5cf6)
🔵 Fishing Gear     → Cyan (#06b6d4)
⚫ Other            → Gray (#6b7280)
```

## 📦 Component Props

```tsx
<Map
  wasteReports={reports}           // Required: array of reports
  center={[36.8065, 10.1815]}      // Optional: [lat, lng]
  zoom={8}                         // Optional: 1-19
  selectedReportId="report-123"    // Optional: highlights marker
  showClustering={true}            // Optional: default true
  showHeatmap={false}              // Optional: default false
  onMarkerClick={(report) => {}}   // Optional: callback
  onMapClick={(lng, lat) => {}}    // Optional: callback
/>
```

## 🔧 How to Enable/Disable Features

### Enable Heatmap Only
```tsx
<Map
  wasteReports={reports}
  showClustering={false}
  showHeatmap={true}
/>
```

### Enable Both Clustering and Heatmap
```tsx
<Map
  wasteReports={reports}
  showClustering={true}
  showHeatmap={true}
/>
```

### Disable All (Just Markers)
```tsx
<Map
  wasteReports={reports}
  showClustering={false}
  showHeatmap={false}
/>
```

## 🎭 Clustering Customization

Edit `Map.tsx` to customize clustering:

```typescript
markersRef.current = (L as any).markerClusterGroup({
  maxClusterRadius: 80,        // Distance to group markers
  spiderfyOnMaxZoom: true,     // Spread at max zoom
  showCoverageOnHover: false,  // Hover polygon
  zoomToBoundsOnClick: true,   // Click behavior
  chunkedLoading: true,        // Performance optimization
});
```

## 🌡️ Heatmap Customization

Edit `Map.tsx` to customize heatmap:

```typescript
heatLayerRef.current = (L as any).heatLayer(heatPoints, {
  radius: 25,          // Heat radius (px)
  blur: 35,            // Blur amount
  maxZoom: 17,         // Max zoom to show
  max: 1.0,            // Max intensity
  gradient: {
    0.0: '#313695',    // Low (blue)
    0.5: '#fee090',    // Medium (yellow)
    1.0: '#d73027'     // High (red)
  }
});
```

## 🗺️ Alternative Map Tiles

Replace the TileLayer in `Map.tsx`:

### Dark Mode
```tsx
<TileLayer
  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  attribution='&copy; OpenStreetMap &copy; CARTO'
/>
```

### Satellite View
```tsx
<TileLayer
  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  attribution='Tiles &copy; Esri'
/>
```

### Terrain View
```tsx
<TileLayer
  url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
  attribution='Map data: OpenStreetMap, SRTM'
  maxZoom={17}
/>
```

### Watercolor (Artistic)
```tsx
<TileLayer
  url="https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg"
  attribution='Map tiles by Stamen Design'
/>
```

## 🚀 Performance Tips

1. **Use Clustering for 100+ Markers**
   - Automatically enabled by default
   - Dramatically improves rendering

2. **Limit Heatmap Points**
   - Only use for < 1000 reports
   - Can be slow with massive datasets

3. **Optimize Marker Size**
   - Current formula: `30 + (severity * 2)`
   - Keeps markers reasonable size

4. **Debounce Map Events**
   - Consider debouncing `onMapClick` if needed

## 🐛 Common Issues

### Markers not showing?
- ✅ Check Leaflet CSS is imported
- ✅ Verify cluster CSS imports
- ✅ Ensure container has height

### Map blank/gray?
- ✅ Check internet connection (OSM tiles)
- ✅ Verify container height is set
- ✅ Check browser console for tile errors

### TypeScript errors?
- ✅ Install all `@types/*` packages
- ✅ Restart TS server (Cmd+Shift+P → Restart TS)

### Clustering not working?
- ✅ Ensure `showClustering={true}`
- ✅ Check `leaflet.markercluster` is installed
- ✅ Verify CSS imports are correct

## 📊 Feature Comparison: Leaflet vs Google Maps

| Feature | Leaflet | Google Maps |
|---------|---------|-------------|
| Cost | **FREE** | Paid (requires billing) |
| API Key | **None needed** | Required |
| Bundle Size | **40KB** | ~900KB |
| Clustering | **Built-in plugin** | Extra library |
| Heatmap | **Built-in plugin** | Requires visualization lib |
| Custom Tiles | **Yes** | Limited |
| Offline Support | **Yes** | No |
| Load Time | **~150ms** | ~800ms |
| Open Source | **Yes (MIT)** | No |

## 🎓 Learning Resources

- [Leaflet Quick Start](https://leafletjs.com/examples/quick-start/)
- [React Leaflet Tutorial](https://react-leaflet.js.org/docs/start-introduction/)
- [Marker Clustering Examples](https://leaflet.github.io/Leaflet.markercluster/)
- [Heatmap Layer Guide](https://github.com/Leaflet/Leaflet.heat)
- [Custom Icons Tutorial](https://leafletjs.com/examples/custom-icons/)

## 💡 Next Steps

Want to add more features? Try:

1. **Search/Geocoding** with Nominatim
2. **Directions/Routing** with OSRM
3. **Drawing Tools** for custom areas
4. **Measure Tool** for distances
5. **Layer Controls** to toggle features
6. **Fullscreen Button** for better UX
7. **Location Search** for addresses
8. **Print Map** functionality
