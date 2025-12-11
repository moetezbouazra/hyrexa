import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import 'leaflet.heat';
import type { WasteType, WasteReport } from '@/types';

// Fix Leaflet default icon issue with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapProps {
  wasteReports: WasteReport[];
  onMarkerClick?: (report: WasteReport) => void;
  onMapClick?: (lng: number, lat: number) => void;
  center?: [number, number];
  zoom?: number;
  selectedReportId?: string;
  showHeatmap?: boolean;
  showClustering?: boolean;
}

// Map event handler component
function MapEventHandler({ 
  onMapClick 
}: { 
  onMapClick?: (lng: number, lat: number) => void 
}) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lng, e.latlng.lat);
      }
    },
  });
  return null;
}

// Component to handle clustering and heatmap
function MarkerLayer({ 
  wasteReports, 
  onMarkerClick, 
  selectedReportId, 
  showHeatmap, 
  showClustering 
}: {
  wasteReports: WasteReport[];
  onMarkerClick?: (report: WasteReport) => void;
  selectedReportId?: string;
  showHeatmap?: boolean;
  showClustering?: boolean;
}) {
  const map = useMap();
  const markersRef = useRef<L.MarkerClusterGroup | null>(null);
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    // Clear existing layers
    if (markersRef.current) {
      map.removeLayer(markersRef.current);
      markersRef.current = null;
    }
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (wasteReports.length === 0) return;

    // Add heatmap layer if enabled
    if (showHeatmap && (L as any).heatLayer) {
      const heatPoints = wasteReports.map(report => [
        report.latitude,
        report.longitude,
        report.severity / 5, // Intensity based on severity
      ]);
      heatLayerRef.current = (L as any).heatLayer(heatPoints, {
        radius: 25,
        blur: 35,
        maxZoom: 17,
        max: 1.0,
        gradient: {
          0.0: '#313695',
          0.2: '#4575b4',
          0.4: '#74add1',
          0.6: '#fee090',
          0.8: '#f46d43',
          1.0: '#d73027'
        }
      });
      heatLayerRef.current.addTo(map);
    }

    // Add clustering if enabled
    if (showClustering) {
      markersRef.current = (L as any).markerClusterGroup({
        chunkedLoading: true,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 80,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount();
          let size = 'small';
          if (count > 10) size = 'medium';
          if (count > 50) size = 'large';
          
          return L.divIcon({
            html: `<div class="cluster-icon cluster-${size}">${count}</div>`,
            className: 'custom-cluster-icon',
            iconSize: L.point(40, 40),
          });
        },
      });

      wasteReports.forEach((report) => {
        const icon = createCustomIcon(report.wasteType, report.severity, selectedReportId === report.id);
        const marker = L.marker([report.latitude, report.longitude], { icon });
        
        const popupContent = `
          <div class="p-2">
            <h3 class="font-bold text-sm mb-1">${formatWasteType(report.wasteType)}</h3>
            <p class="text-xs text-gray-600 mb-2">${report.description || 'No description'}</p>
            <div class="flex flex-wrap gap-1 text-xs">
              <span class="px-2 py-1 rounded-full bg-gray-100">
                Severity: ${report.severity}/5
              </span>
              <span class="px-2 py-1 rounded-full ${getStatusColorClass(report.status)}">
                ${report.status}
              </span>
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        marker.on('click', () => {
          if (onMarkerClick) {
            onMarkerClick(report);
          }
        });
        
        markersRef.current!.addLayer(marker);
      });

      if (markersRef.current) {
        map.addLayer(markersRef.current);
      }
    }

    return () => {
      if (markersRef.current) {
        map.removeLayer(markersRef.current);
      }
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [wasteReports, map, onMarkerClick, selectedReportId, showHeatmap, showClustering]);

  // If not using clustering, render markers individually
  if (!showClustering && !showHeatmap) {
    return (
      <>
        {wasteReports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={createCustomIcon(report.wasteType, report.severity, selectedReportId === report.id)}
            eventHandlers={{
              click: () => {
                if (onMarkerClick) {
                  onMarkerClick(report);
                }
              },
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-sm mb-1">{formatWasteType(report.wasteType)}</h3>
                <p className="text-xs text-gray-600 mb-2">{report.description || 'No description'}</p>
                <div className="flex flex-wrap gap-1 text-xs">
                  <span className="px-2 py-1 rounded-full bg-gray-100">
                    Severity: {report.severity}/5
                  </span>
                  <span className={`px-2 py-1 rounded-full ${getStatusColorClass(report.status)}`}>
                    {report.status}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </>
    );
  }

  return null;
}

// User location component
function UserLocationMarker({ position }: { position: [number, number] | null }) {
  if (!position) return null;

  const userIcon = L.divIcon({
    html: '<div class="user-location-marker"></div>',
    className: 'user-location-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <>
      <Marker position={position} icon={userIcon}>
        <Popup>Your Location</Popup>
      </Marker>
      <Circle
        center={position}
        radius={100}
        pathOptions={{
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          weight: 2,
        }}
      />
    </>
  );
}

export default function Map({
  wasteReports,
  onMarkerClick,
  onMapClick,
  center = [36.8065, 10.1815], // Tunisia coordinates
  zoom = 6,
  selectedReportId,
  showHeatmap = false,
  showClustering = true,
}: MapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [mapZoom, setMapZoom] = useState(zoom);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserLocation(coords);
          if (wasteReports.length === 0) {
            setMapCenter(coords);
            setMapZoom(12);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, [wasteReports.length]);

  return (
    <>
      <style>{`
        .leaflet-container {
          width: 100%;
          height: 100%;
          border-radius: 0.5rem;
          z-index: 0;
        }
        
        .custom-cluster-icon {
          background: none;
          border: none;
        }
        
        .cluster-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-weight: bold;
          color: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        
        .cluster-small {
          width: 35px;
          height: 35px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-size: 12px;
        }
        
        .cluster-medium {
          width: 45px;
          height: 45px;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          font-size: 14px;
        }
        
        .cluster-large {
          width: 55px;
          height: 55px;
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
          font-size: 16px;
        }
        
        .user-location-marker {
          width: 20px;
          height: 20px;
          background: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          padding: 0;
        }
        
        .leaflet-popup-content {
          margin: 0;
          min-width: 200px;
        }
      `}</style>
      
      <div className="relative w-full h-full">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="w-full h-full"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          
          <MapEventHandler onMapClick={onMapClick} />
          
          <MarkerLayer
            wasteReports={wasteReports}
            onMarkerClick={onMarkerClick}
            selectedReportId={selectedReportId}
            showHeatmap={showHeatmap}
            showClustering={showClustering}
          />
          
          <UserLocationMarker position={userLocation} />
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs z-[1]">
          <h4 className="font-semibold text-sm mb-2">Waste Types</h4>
          <div className="space-y-1">
            {(['PLASTIC_BOTTLES', 'PLASTIC_BAGS', 'MIXED_PLASTIC', 'STYROFOAM', 'FISHING_GEAR', 'OTHER'] as WasteType[]).map((type) => (
              <div key={type} className="flex items-center gap-2 text-xs">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: getWasteTypeColor(type) }}
                />
                <span>{formatWasteType(type)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// Create custom marker icon based on waste type
function createCustomIcon(wasteType: WasteType, severity: number, isSelected: boolean): L.DivIcon {
  const color = getWasteTypeColor(wasteType);
  const size = 30 + (severity * 2);
  const borderColor = isSelected ? '#10b981' : '#ffffff';
  const scale = isSelected ? 1.2 : 1.0;
  
  return L.divIcon({
    html: `
      <div style="
        width: ${size * scale}px;
        height: ${size * scale}px;
        background: ${color};
        border: 3px solid ${borderColor};
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${10 + severity}px;
      ">
        ${severity}
      </div>
    `,
    className: 'custom-waste-icon',
    iconSize: [size * scale, size * scale],
    iconAnchor: [(size * scale) / 2, (size * scale) / 2],
  });
}

function getWasteTypeColor(type: WasteType): string {
  const colors: Record<WasteType, string> = {
    PLASTIC_BOTTLES: '#ef4444',
    PLASTIC_BAGS: '#f59e0b',
    MIXED_PLASTIC: '#eab308',
    STYROFOAM: '#8b5cf6',
    FISHING_GEAR: '#06b6d4',
    OTHER: '#6b7280',
  };
  return colors[type] || '#6b7280';
}

function formatWasteType(type: WasteType): string {
  return type
    .split('_')
    .map((word: string) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

function getStatusColorClass(status: string): string {
  const colors: Record<string, string> = {
    PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    CLEANED: 'bg-blue-100 text-blue-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
