// frontend/src/components/MapPicker.jsx
import React, { useEffect, useRef, useState } from "react";

// This is the original version you provided that uses Nominatim for reverse geocoding
// and Google Maps only for displaying the map.
const getNominatimAddressComponent = (address, componentName) => {
  return address ? address[componentName] : null;
};

export default function MapPicker({ onLocationSelected }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    function initMap() {
      if (!mapRef.current || !window.google?.maps) {
        console.warn("Map DOM ref or Google Maps API not ready for initMap.");
        return;
      }

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 20, lng: 0 },
        zoom: 2,
        gestureHandling: "cooperative",
        styles: [
          { featureType: "all", elementType: "all", stylers: [{ hue: "#0e1e35" }, { saturation: -50 }] },
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
          { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
          { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#8a99ab" }] },
        ],
      });

      map.addListener("click", async (e) => {
        const latLng = e.latLng;
        const latitude = latLng.lat();
        const longitude = latLng.lng();
        setMapError(""); 

        if (markerRef.current) {
          markerRef.current.setPosition(latLng);
        } else {
          markerRef.current = new window.google.maps.Marker({
            position: latLng,
            map,
            animation: window.google.maps.Animation.DROP,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#FF5722",
              fillOpacity: 0.9,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
            },
          });
        }
        markerRef.current.setAnimation(window.google.maps.Animation.BOUNCE);
        setTimeout(() => {
            if(markerRef.current) markerRef.current.setAnimation(null);
        }, 750);

        // Perform reverse geocoding with Nominatim
        try {
          const userAgent = 'TripToApp/1.0 (yourcontact@example.com)'; 
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=en`,
            { headers: { 'User-Agent': userAgent } }
          );

          if (!response.ok) {
            let errorData;
            try { errorData = await response.json(); } catch (parseError) { /* ignore */ }
            const errorMessage = errorData?.error?.message || errorData?.error || `Request failed with status ${response.status}`;
            throw new Error(`Nominatim API Error: ${errorMessage}`);
          }

          const data = await response.json();

          if (data && data.address) {
            const address = data.address;
            const name = getNominatimAddressComponent(address, 'city') || getNominatimAddressComponent(address, 'town') || getNominatimAddressComponent(address, 'village') || (data.display_name ? data.display_name.split(',')[0] : "Selected Location");
            const country = getNominatimAddressComponent(address, 'country');
            onLocationSelected({
              latitude,
              longitude,
              name: name || "Selected Location",
              country: country || "Unknown Country",
            });
          } else {
            console.warn("Nominatim found no results for:", {latitude, longitude});
            onLocationSelected({ latitude, longitude, name: "Unknown Location", country: "Unknown Country" });
          }
        } catch (error) {
          console.error("Nominatim reverse geocoding failed:", error);
          setMapError(`Failed to fetch location details: ${error.message}`);
          onLocationSelected({ latitude, longitude, name: "Error fetching location", country: "Error" });
        }
      });
    }

    if (window.google && window.google.maps) {
      initMap();
    } else if (!document.getElementById("google-maps-js")) {
      const script = document.createElement("script");
      script.id = "google-maps-js";
      const apiKey = import.meta.env.VITE_Maps_API_KEY;
      if (!apiKey) {
          setMapError("Map API Key is missing. Map cannot be loaded.");
          return;
      }
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`; 
      script.async = true;
      script.defer = true;
      script.onload = () => initMap();
      script.onerror = () => setMapError("Map script failed to load.");
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, [onLocationSelected]);

  return (
    <div className="w-full h-full relative">
      {mapError && (
        <div className="absolute top-2 left-2 z-10 bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded-md text-xs shadow-lg">
          Error: {mapError}
        </div>
      )}
      <div
        ref={mapRef}
        className="w-full h-full rounded-md bg-gray-700"
        aria-label="Location picker map"
      />
    </div>
  );
}
