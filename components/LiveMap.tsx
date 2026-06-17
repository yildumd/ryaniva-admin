'use client';
import { useEffect, useRef } from 'react';

interface RiderPin {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  isOnline: boolean;
  status: string;
  rating: number;
}

interface LiveMapProps {
  riders: RiderPin[];
}

export default function LiveMap({ riders }: LiveMapProps) {
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const init = async () => {
      const L = (await import('leaflet')).default;

      if (!mapRef.current) return;

      // Check if already initialized
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Check leaflet internal flag
      if ((mapRef.current as any)._leaflet_id) {
        (mapRef.current as any)._leaflet_id = null;
      }

      const map = L.map(mapRef.current, {
        center: [9.8965, 8.8583],
        zoom: 13,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Jos landmarks
      const landmarks = [
        { name: 'Terminus Market', lat: 9.8965, lng: 8.8583 },
        { name: 'University of Jos', lat: 9.9285, lng: 8.8921 },
        { name: 'JUTH', lat: 9.9012, lng: 8.8734 },
        { name: 'Rayfield', lat: 9.8734, lng: 8.9012 },
        { name: 'Rukuba Road', lat: 9.9123, lng: 8.8456 },
      ];

      landmarks.forEach(lm => {
        const icon = L.divIcon({
          html: `<div style="background:#E85C1A;color:white;padding:2px 7px;border-radius:10px;font-size:9px;font-weight:700;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.25)">${lm.name}</div>`,
          className: '',
          iconAnchor: [0, 0],
        });
        L.marker([lm.lat, lm.lng], { icon }).addTo(map);
      });

      const josCenter = { lat: 9.8965, lng: 8.8583 };
      const approvedRiders = riders.filter(r => r.status === 'APPROVED');

      approvedRiders.forEach((rider) => {
        const lat = josCenter.lat + (Math.random() - 0.5) * 0.06;
        const lng = josCenter.lng + (Math.random() - 0.5) * 0.06;
        const color = rider.isOnline ? '#1A3A8F' : '#9CA3AF';

        const icon = L.divIcon({
          html: `
            <div style="
              background:${color};
              width:38px;height:38px;
              border-radius:50%;
              border:3px solid white;
              box-shadow:0 2px 8px rgba(0,0,0,0.3);
              display:flex;align-items:center;justify-content:center;
              font-size:18px;cursor:pointer;
            ">🏍️</div>
          `,
          className: '',
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        L.marker([lat, lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:160px;padding:4px">
              <div style="font-weight:700;font-size:13px;color:#1A3A8F">${rider.name}</div>
              <div style="font-size:11px;color:#6B7280;margin-top:4px">📱 ${rider.phone}</div>
              <div style="font-size:11px;color:#6B7280">🏍️ ${rider.vehicle}</div>
              <div style="font-size:11px;color:#6B7280">⭐ ${rider.rating}</div>
              <span style="
                display:inline-block;margin-top:6px;
                background:${rider.isOnline ? '#D1FAE5' : '#F3F4F6'};
                color:${rider.isOnline ? '#065F46' : '#6B7280'};
                padding:2px 10px;border-radius:20px;
                font-size:10px;font-weight:700;
              ">${rider.isOnline ? '● ONLINE' : '● OFFLINE'}</span>
            </div>
          `);
      });

      if (approvedRiders.length === 0) {
        L.popup()
          .setLatLng([9.8965, 8.8583])
          .setContent(`
            <div style="font-family:sans-serif;text-align:center;padding:8px">
              <b style="color:#1A3A8F">Jos, Plateau State</b><br>
              <small style="color:#6B7280">No riders on map yet</small>
            </div>
          `)
          .openOn(map);
      }
    };

    init();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
  );
}