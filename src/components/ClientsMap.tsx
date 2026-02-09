"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L, { type Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

type Client = {
  _id: string;
  name: string;
  contactName?: string;
  lat?: number;
  lng?: number;
  address?: string;
  cedula?: string;
};

const DEFAULT_CENTER: [number, number] = [6.2442, -75.5812]; // Medellín

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function ClientsMap({ clients }: { clients: Client[] }) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    const el = containerRef.current as any;
    if (el) {
      if (el._leaflet_id) delete el._leaflet_id;
      el.innerHTML = "";
    }
    setMapKey((k) => k + 1);
    setReady(true);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const markers = useMemo(
    () => clients.filter((c) => typeof c.lat === "number" && typeof c.lng === "number"),
    [clients]
  );

  return (
    <div ref={containerRef} className="h-[360px] w-full overflow-hidden rounded-xl border">
      {ready && (
        <MapContainer
          key={mapKey}
          center={DEFAULT_CENTER}
          zoom={12}
          className="h-full w-full"
          scrollWheelZoom
          ref={(map) => {
            mapRef.current = map ?? null;
          }}
        >
          <TileLayer
            attribution='© OpenStreetMap contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {markers.map((c) => (
            <Marker key={c._id} position={[c.lat as number, c.lng as number]}>
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{c.name}</div>
                  {c.contactName ? <div>Contacto: {c.contactName}</div> : null}
                  {c.address ? <div>{c.address}</div> : null}
                  {c.cedula ? <div>Cédula: {c.cedula}</div> : null}
                  <a
                    className="text-blue-600 underline"
                    href={`https://waze.com/ul?ll=${c.lat},${c.lng}&navigate=yes`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir en Waze
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}
