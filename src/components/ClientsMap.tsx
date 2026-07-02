"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L, { type Map as LeafletMap } from "leaflet";
import { Maximize2, Minimize2 } from "lucide-react";
import "leaflet/dist/leaflet.css";

type Client = {
  _id: string;
  name: string;
  zone?: string;
  contactName?: string;
  buyerName?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  address?: string;
  cedula?: string;
};

const DEFAULT_CENTER_CO: [number, number] = [6.2442, -75.5812]; // Medellín
const DEFAULT_CENTER_PA: [number, number] = [8.9824, -79.5199]; // Ciudad de Panamá

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
  .cata-cluster {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 1px solid rgba(35, 76, 75, 0.24);
    background: rgba(35, 76, 75, 0.9);
    color: white;
    font-size: 12px;
    font-weight: 700;
    box-shadow: 0 0 0 6px rgba(35, 76, 75, 0.08);
  }
`;

type ClusterPoint = {
  kind: "cluster";
  _id: string;
  lat: number;
  lng: number;
  count: number;
  members: Client[];
};

function createClusterIcon(count: number) {
  const size = count > 24 ? 42 : count > 12 ? 38 : 34;

  return L.divIcon({
    html: `<div class="cata-cluster" style="width:${size}px;height:${size}px;">${count}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function clusterClients(clients: Client[], zoom: number): Array<Client | ClusterPoint> {
  if (zoom >= 14) return clients;

  const gridSize = zoom >= 13 ? 0.008 : zoom >= 12 ? 0.014 : zoom >= 11 ? 0.022 : 0.03;
  const buckets = new Map<string, Client[]>();

  for (const client of clients) {
    const key = `${Math.floor((client.lat as number) / gridSize)}:${Math.floor((client.lng as number) / gridSize)}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(client);
    } else {
      buckets.set(key, [client]);
    }
  }

  return Array.from(buckets.values()).map((members, index) => {
    if (members.length === 1) return members[0];

    const lat = members.reduce((sum, client) => sum + (client.lat as number), 0) / members.length;
    const lng = members.reduce((sum, client) => sum + (client.lng as number), 0) / members.length;

    return {
      kind: "cluster",
      _id: `cluster-${zoom}-${index}`,
      lat,
      lng,
      count: members.length,
      members,
    };
  });
}

function MapViewportEvents({
  onZoomChange,
}: {
  onZoomChange: (zoom: number) => void;
}) {
  const map = useMapEvents({
    load() {
      onZoomChange(map.getZoom());
    },
    zoomend() {
      onZoomChange(map.getZoom());
    },
  });

  return null;
}

export default function ClientsMap({
  clients,
  tenantKey,
  heightClassName = "h-[360px] w-full",
  showFullscreenToggle = true,
}: {
  clients: Client[];
  tenantKey?: "co" | "pa";
  heightClassName?: string;
  showFullscreenToggle?: boolean;
}) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(tenantKey === "pa" ? 11 : 12);

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

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      mapRef.current?.invalidateSize();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const markers = useMemo(
    () => clients.filter((c) => typeof c.lat === "number" && typeof c.lng === "number"),
    [clients]
  );
  const fallbackCenter = tenantKey === "pa" ? DEFAULT_CENTER_PA : DEFAULT_CENTER_CO;
  const mapCenter = markers.length
    ? ([markers[0].lat as number, markers[0].lng as number] as [number, number])
    : fallbackCenter;
  const renderedPoints = useMemo(() => clusterClients(markers, zoomLevel), [markers, zoomLevel]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!markers.length) {
      mapRef.current.setView(fallbackCenter, tenantKey === "pa" ? 11 : 12);
      return;
    }

    const bounds = L.latLngBounds(
      markers.map((c) => [c.lat as number, c.lng as number] as [number, number])
    );
    mapRef.current.fitBounds(bounds.pad(0.18));
  }, [markers, fallbackCenter, tenantKey]);

  const containerClass = isFullscreen
    ? "fixed inset-0 z-50 bg-black/50 p-3"
    : heightClassName;

  const mapShellClass = isFullscreen
    ? "relative h-full w-full overflow-hidden rounded-xl border bg-white"
    : "relative h-full w-full overflow-hidden rounded-xl border";

  return (
    <div className={containerClass}>
      <style>{markerGlowStyle}</style>
      <div className={mapShellClass}>
        {showFullscreenToggle ? (
          <button
            type="button"
            onClick={() => setIsFullscreen((v) => !v)}
            className="absolute right-2 top-2 z-[2000] inline-flex h-9 w-9 items-center justify-center rounded-md border bg-white/95 shadow hover:bg-white"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        ) : null}
        <div ref={containerRef} className="h-full w-full">
          {ready && (
            <MapContainer
              key={mapKey}
              center={mapCenter}
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
              <MapViewportEvents onZoomChange={setZoomLevel} />

              {renderedPoints.map((point) =>
                "kind" in point ? (
                  <Marker
                    key={point._id}
                    position={[point.lat, point.lng]}
                    icon={createClusterIcon(point.count)}
                  >
                    <Popup>
                      <div className="text-sm">
                        <div className="font-semibold">{point.count} proveedores agrupados</div>
                        <div className="mt-2 text-slate-600">
                          {point.members.slice(0, 6).map((member) => member.name).join(", ")}
                          {point.members.length > 6 ? "..." : ""}
                        </div>
                        <div className="mt-2 text-slate-500">
                          Haz zoom para separar los registros por zona.
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ) : (
                  <Marker
                    key={point._id}
                    position={[point.lat as number, point.lng as number]}
                    icon={createBuyerIcon(point.buyerName)}
                  >
                    <Popup>
                      <div className="text-sm">
                        <div className="font-semibold">{point.name}</div>
                        {point.contactName ? <div>Contacto: {point.contactName}</div> : null}
                        {point.address ? <div>{point.address}</div> : null}
                        {point.cedula ? <div>Cédula: {point.cedula}</div> : null}
                        {point.phone ? (
                          <a
                            className="text-blue-600 underline"
                            href={`https://wa.me/${point.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            WhatsApp
                          </a>
                        ) : null}
                        {point.phone ? <br /> : null}
                        <a
                          className="text-blue-600 underline"
                          href={`https://waze.com/ul?ll=${point.lat},${point.lng}&navigate=yes`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Abrir en Waze
                        </a>
                        <br />
                        <a
                          className="text-blue-600 underline"
                          href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${point.lat},${point.lng}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver calle 360
                        </a>
                      </div>
                    </Popup>
                  </Marker>
                )
              )}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
}
