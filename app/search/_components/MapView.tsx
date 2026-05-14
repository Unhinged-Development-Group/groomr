"use client";

import { useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import type { GroomerResult, MapCentre } from "@/types/search";

interface MapViewProps {
  groomers: GroomerResult[];
  mapCentre: MapCentre;
  onViewGroomer: (groomer: GroomerResult) => void;
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export default function MapView({ groomers, mapCentre, onViewGroomer }: MapViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedGroomer = groomers.find((g) => g.id === selectedId) ?? null;

  const mappableGroomers = groomers.filter(
    (g) => g.lat !== undefined && g.lng !== undefined
  );
  const hasNoCoords = mappableGroomers.length === 0 && groomers.length > 0;

  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        defaultCenter={mapCentre}
        defaultZoom={groomers.length > 0 ? 12 : 6}
        mapId="groomr-search-map"
        style={{ width: "100%", height: "100%" }}
        gestureHandling="greedy"
        disableDefaultUI={false}
      >
        {mappableGroomers.map((groomer) => (
          <AdvancedMarker
            key={groomer.id}
            position={{ lat: groomer.lat!, lng: groomer.lng! }}
            onClick={() => setSelectedId(groomer.id)}
          >
            <GoldPin />
          </AdvancedMarker>
        ))}

        {selectedGroomer && selectedGroomer.lat !== undefined && selectedGroomer.lng !== undefined && (
          <InfoWindow
            position={{ lat: selectedGroomer.lat, lng: selectedGroomer.lng }}
            onCloseClick={() => setSelectedId(null)}
          >
            <div className="p-2 min-w-[200px]">
              <p className="font-fredoka text-lg text-deep-slate leading-tight">
                {selectedGroomer.name}
              </p>
              <p className="text-xs text-pebble-grey font-bold mt-0.5">
                {selectedGroomer.location}
              </p>
              {selectedGroomer.rating > 0 && (
                <p className="text-xs font-bold text-deep-slate mt-1">
                  ★ {selectedGroomer.rating}
                  {selectedGroomer.reviewCount > 0 &&
                    ` (${selectedGroomer.reviewCount})`}
                </p>
              )}
              {selectedGroomer.priceFrom != null && (
                <p className="text-xs text-pebble-grey mt-0.5">
                  From £{selectedGroomer.priceFrom}
                </p>
              )}
              <button
                onClick={() => {
                  setSelectedId(null);
                  onViewGroomer(selectedGroomer);
                }}
                className="mt-3 w-full bg-deep-slate text-white text-xs font-bold rounded-full py-1.5 px-3 hover:bg-sage-leaf transition-colors"
              >
                View Profile
              </button>
            </div>
          </InfoWindow>
        )}
      </Map>

      {hasNoCoords && (
        <div className="absolute inset-0 flex items-end justify-center pb-6 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-subtle border border-pebble-grey/20 text-sm font-bold text-deep-slate">
            Use &ldquo;Near Me&rdquo; to see pins on the map
          </div>
        </div>
      )}
    </APIProvider>
  );
}

function GoldPin() {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        background: "#eae45c",
        borderRadius: "50%",
        border: "3px solid white",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#2c3e50",
        cursor: "pointer",
      }}
    >
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    </div>
  );
}
