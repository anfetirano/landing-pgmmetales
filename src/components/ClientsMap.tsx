"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L, { type Map as LeafletMap } from "leaflet";
import { Maximize2, Minimize2 } from "lucide-react";
import "leaflet/dist/leaflet.css";

type Client = {
  _id: string;
  name: string;
  contactName?: string;
  buyerName?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  address?: string;
  cedula?: string;
};

const DEFAULT_CENTER: [number, number] = [6.2442, -75.5812]; // Medellín

const createBuyerIcon = (buyerName?: string) => {
  const key = (buyerName ?? "").trim().toLowerCase();
  const className = key.includes("marlen")
    ? "cata-marker cata-marker-marlen"
    : key.includes("kenny")
      ? "cata-marker cata-marker-kenny"
      : "cata-marker cata-marker-default";

  return L.icon({
    iconUrl: "/icons/cata.png",
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -36],
    className,
  });
};

const markerGlowStyle = `
  .cata-marker {
    filter: drop-shadow(0 0 4px rgba(15, 23, 42, 0.2))
      drop-shadow(0 2px 6px rgba(15, 23, 42, 0.22));
  }
  .cata-marker-default {
    filter: drop-shadow(0 0 6px rgba(35, 76, 75, 0.65))
      drop-shadow(0 4px 8px rgba(35, 76, 75, 0.35));
  }
  .cata-marker-marlen {
    filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.75))
      drop-shadow(0 4px 10px rgba(16, 185, 129, 0.42));
  }
  .cata-marker-kenny {
    filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.75))
      drop-shadow(0 4px 10px rgba(239, 68, 68, 0.42));
  }
`;

export default function ClientsMap({ clients }: { clients: Client[] }) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  useEffect(() => {
    // Leaflet needs this after container size changes (fullscreen on/off)
    const id = window.setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 120);
    return () => window.clearTimeout(id);
  }, [isFullscreen]);

  const markers = useMemo(
    () => clients.filter((c) => typeof c.lat === "number" && typeof c.lng === "number"),
    [clients]
  );

  const containerClass = isFullscreen
    ? "fixed inset-0 z-50 bg-black/50 p-3"
    : "h-[360px] w-full";

  const mapShellClass = isFullscreen
    ? "relative h-full w-full overflow-hidden rounded-xl border bg-white"
    : "relative h-full w-full overflow-hidden rounded-xl border";

  return (
    <div className={containerClass}>
      <style>{markerGlowStyle}</style>
      <div className={mapShellClass}>
        <button
          type="button"
          onClick={() => setIsFullscreen((v) => !v)}
          className="absolute right-2 top-2 z-[2000] inline-flex h-9 w-9 items-center justify-center rounded-md border bg-white/95 shadow hover:bg-white"
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
        <div ref={containerRef} className="h-full w-full">
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
                <Marker key={c._id} position={[c.lat as number, c.lng as number]} icon={createBuyerIcon(c.buyerName)}>
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold">{c.name}</div>
                      {c.contactName ? <div>Contacto: {c.contactName}</div> : null}
                      {c.address ? <div>{c.address}</div> : null}
                      {c.cedula ? <div>Cédula: {c.cedula}</div> : null}
                      {c.phone ? (
                        <a
                          className="text-blue-600 underline"
                          href={`https://wa.me/${c.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          WhatsApp
                        </a>
                      ) : null}
                      {c.phone ? <br /> : null}
                      <a
                        className="text-blue-600 underline"
                        href={`https://waze.com/ul?ll=${c.lat},${c.lng}&navigate=yes`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Abrir en Waze
                      </a>
                      <br />
                      <a
                        className="text-blue-600 underline"
                        href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${c.lat},${c.lng}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver calle 360
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
}
