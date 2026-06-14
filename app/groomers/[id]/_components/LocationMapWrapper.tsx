"use client";

import dynamic from "next/dynamic";

const LocationMap = dynamic(() => import("./LocationMap"), { ssr: false });

export default function LocationMapWrapper({ lat, lng }: { lat: number; lng: number }) {
  return <LocationMap lat={lat} lng={lng} />;
}
