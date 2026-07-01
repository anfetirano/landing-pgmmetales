"use client";

import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from "react-leaflet";

import type { PanamaMarker } from "@/data/presentacion";

type PresentationPanamaMapProps = {
  markers: PanamaMarker[];
  network?: boolean;
};

const CENTER: [number, number] = [8.8, -80.15];

export default function PresentationPanamaMap({
  markers,
  network = false,
}: PresentationPanamaMapProps) {
  const paths: [number, number][][] = network
    ? markers.slice(1).map((marker) => [
        [markers[0].lat, markers[0].lng],
        [marker.lat, marker.lng],
      ])
    : [];

  return (
    <div className="h-full min-h-[360px] overflow-hidden rounded-[24px] border border-[#d5dfda] bg-white shadow-[0_18px_50px_rgba(22,44,39,0.08)]">
      <MapContainer
        center={CENTER}
        zoom={8}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        touchZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
      >
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {paths.map((path, index) => (
          <Polyline
            key={`line-${index}`}
            positions={path}
            pathOptions={{
              color: "#234c4b",
              weight: 2,
              opacity: 0.35,
              dashArray: network ? "10 10" : undefined,
            }}
          />
        ))}

        {markers.map((marker) => (
          <CircleMarker
            key={marker.name}
            center={[marker.lat, marker.lng]}
            radius={marker.emphasis ? 10 : 7}
            pathOptions={{
              color: marker.emphasis ? "#234c4b" : "#d6b520",
              fillColor: marker.emphasis ? "#234c4b" : "#fed835",
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={1} permanent={marker.emphasis}>
              <span className="font-medium">{marker.name}</span>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
