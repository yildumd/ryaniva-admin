'use client';
import { useEffect, useRef, useCallback } from 'react';

interface RiderPin {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  isOnline: boolean;
  status: string;
  rating: number;
  lastLat?: number;
  lastLng?: number;
  lastLocationAt?: string;
}

interface LiveMapProps {
  riders: RiderPin[];
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyCI8Y_XNplWLmrhYcmyZTj3hQy0dKIYgSM';
const JOS_CENTER = { lat: 9.8965, lng: 8.8583 };

const JOS_LANDMARKS = [
  { name: 'Terminus Market', lat: 9.8965, lng: 8.8583 },
  { name: 'University of Jos', lat: 9.9285, lng: 8.8921 },
  { name: 'JUTH', lat: 9.9012, lng: 8.8734 },
  { name: 'Rayfield', lat: 9.8734, lng: 8.9012 },
  { name: 'Bukuru', lat: 9.7934, lng: 8.8521 },
];

export default function LiveMap({ riders }: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  const loadGoogleMaps = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (typeof window === 'undefined') return;
      if ((window as any).google?.maps) { resolve(); return; }
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }, []);

  const initMap = useCallback(async () => {
    if (typeof window === 'undefined' || !mapRef.current) return;
    await loadGoogleMaps();

    const google = (window as any).google;
    if (!google?.maps) return;

    // Init map
    const map = new google.maps.Map(mapRef.current, {
      center: JOS_CENTER,
      zoom: 13,
      mapTypeId: 'roadmap',
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: true,
    });

    mapInstanceRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();

    // Add Jos landmarks
    JOS_LANDMARKS.forEach(lm => {
      new google.maps.Marker({
        position: { lat: lm.lat, lng: lm.lng },
        map,
        title: lm.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#E85C1A',
          fillOpacity: 0.8,
          strokeColor: 'white',
          strokeWeight: 2,
        },
        label: {
          text: lm.name,
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#E85C1A',
        },
      });
    });

    updateMarkers(map, google);
  }, [riders]);

  const updateMarkers = useCallback((map: any, google: any) => {
    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const approvedRiders = riders.filter(r => r.status === 'APPROVED');

    approvedRiders.forEach(rider => {
      // Use real GPS if available, otherwise skip
      const hasRealLocation = rider.lastLat && rider.lastLng;
      if (!hasRealLocation && !rider.isOnline) return;

      const lat = rider.lastLat || JOS_CENTER.lat + (Math.random() - 0.5) * 0.04;
      const lng = rider.lastLng || JOS_CENTER.lng + (Math.random() - 0.5) * 0.04;

      const isRecent = rider.lastLocationAt
        ? (Date.now() - new Date(rider.lastLocationAt).getTime()) < 5 * 60 * 1000
        : false;

      const markerColor = rider.isOnline && isRecent ? '#10B981' :
                          rider.isOnline ? '#1A3A8F' : '#9CA3AF';

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title: rider.name,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="20" fill="${markerColor}" stroke="white" stroke-width="3"/>
              <text x="22" y="28" text-anchor="middle" font-size="20">🏍️</text>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(44, 44),
          anchor: new google.maps.Point(22, 22),
        },
        animation: rider.isOnline && isRecent ? google.maps.Animation.BOUNCE : null,
      });

      const lastSeen = rider.lastLocationAt
        ? new Date(rider.lastLocationAt).toLocaleTimeString()
        : 'Unknown';

      marker.addListener('click', () => {
        infoWindowRef.current.setContent(`
          <div style="font-family:sans-serif;min-width:180px;padding:8px">
            <div style="font-weight:800;font-size:14px;color:#1A3A8F;margin-bottom:6px">${rider.name}</div>
            <div style="font-size:12px;color:#6B7280;margin-bottom:4px">📱 ${rider.phone}</div>
            <div style="font-size:12px;color:#6B7280;margin-bottom:4px">🏍️ ${rider.vehicle}</div>
            <div style="font-size:12px;color:#6B7280;margin-bottom:4px">⭐ ${rider.rating}</div>
            <div style="font-size:12px;color:#6B7280;margin-bottom:8px">🕐 Last seen: ${lastSeen}</div>
            <div style="font-size:11px;padding:4px 10px;border-radius:20px;display:inline-block;
              background:${rider.isOnline ? '#D1FAE5' : '#F3F4F6'};
              color:${rider.isOnline ? '#065F46' : '#6B7280'};
              font-weight:700">
              ${rider.isOnline ? '● ONLINE' : '● OFFLINE'}
            </div>
            ${hasRealLocation ? '<div style="font-size:10px;color:#10B981;margin-top:6px">📍 Real GPS location</div>' : '<div style="font-size:10px;color:#F59E0B;margin-top:6px">📍 Approximate location</div>'}
          </div>
        `);
        infoWindowRef.current.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    // Show message if no riders
    if (approvedRiders.length === 0) {
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family:sans-serif;text-align:center;padding:10px">
            <b style="color:#1A3A8F">Jos, Plateau State</b><br>
            <small style="color:#6B7280">No approved riders yet</small>
          </div>
        `,
        position: JOS_CENTER,
      });
      infoWindow.open(map);
    }
  }, [riders]);

  useEffect(() => {
    initMap();
  }, []);

  // Update markers when riders change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const google = (window as any).google;
    if (!google?.maps) return;
    updateMarkers(mapInstanceRef.current, google);
  }, [riders]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute', bottom: 16, left: 16,
        background: 'white', borderRadius: 10, padding: '10px 14px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)', fontSize: 12,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 6, color: '#1A3A8F' }}>Legend</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981' }} />
          <span style={{ color: '#374151' }}>Online (live GPS)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#1A3A8F' }} />
          <span style={{ color: '#374151' }}>Online (last known)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#9CA3AF' }} />
          <span style={{ color: '#374151' }}>Offline</span>
        </div>
      </div>
    </div>
  );
}