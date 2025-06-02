// frontend/src/components/MapPicker.jsx

import React, { useEffect, useRef } from "react";

export default function MapPicker({ onLocationSelected }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    // If Google Maps already loaded, just initialize
    function initMap() {
      if (!mapRef.current || !window.google?.maps) return;
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 20, lng: 0 },
        zoom: 2,
        styles: [
          // A dark, ocean‐like map style (optional)
          {
            featureType: "all",
            elementType: "all",
            stylers: [{ hue: "#0e1e35" }, { saturation: -50 }],
          },
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });
      map.addListener("click", (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        if (markerRef.current) {
          markerRef.current.setPosition(e.latLng);
          markerRef.current.setAnimation(window.google.maps.Animation.DROP);
        } else {
          markerRef.current = new window.google.maps.Marker({
            position: e.latLng,
            map,
            animation: window.google.maps.Animation.DROP,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#00AEEF",
              fillOpacity: 0.8,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
            },
          });
        }
        onLocationSelected({ latitude: lat, longitude: lng });
      });
    }

    // If already loaded, just call initMap()
    if (window.google && window.google.maps) {
      initMap();
      return;
    }

    // Otherwise, inject script
    const existingScript = document.getElementById("google-maps-js");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-maps-js";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = () => {
        console.error("Google Maps JS failed to load—check your API key & billing.");
      };
      document.head.appendChild(script);
    } else {
      // Script is in DOM but maybe not loaded yet—wait a moment
      existingScript.addEventListener("load", initMap);
    }
  }, [onLocationSelected]);

  return (
    <div
      ref={mapRef}
      className="w-full h-96 border border-gray-700 rounded-md bg-gray-800"
    />
  );
}
