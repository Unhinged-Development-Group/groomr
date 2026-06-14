"use client";

import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export default function LocationMap({ lat, lng }: { lat: number; lng: number }) {
  const centre = { lat, lng };
  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        defaultCenter={centre}
        defaultZoom={14}
        mapId="groomr-profile-map"
        style={{ width: "100%", height: "100%" }}
        gestureHandling="none"
        disableDefaultUI
      >
        <AdvancedMarker position={centre}>
          <div className="w-4 h-4 rounded-full bg-groomr-gold border-2 border-deep-slate shadow-md" />
        </AdvancedMarker>
      </Map>
    </APIProvider>
  );
}
