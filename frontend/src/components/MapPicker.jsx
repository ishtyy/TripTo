// frontend/src/components/MapPicker.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import api from '../services/api'; // To call our backend for location search

export default function MapPicker({ originLocation, destinationLocation, onMapLocationSelect }) {
  // Refs to hold the Google Maps objects to prevent re-creation on re-renders
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const originMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const flightPathRef = useRef(null);
  
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [mapError, setMapError] = useState("");

  // Load Google Maps Script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_Maps_API_KEY;
    if (!apiKey) {
      setMapError("Map API Key is missing.");
      return;
    }
    if (window.google?.maps) {
      setIsScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "google-maps-js";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => setMapError("Map script failed to load.");
    document.head.appendChild(script);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!isScriptLoaded || !mapContainerRef.current || mapInstanceRef.current) {
      return; // Exit if script not loaded, container not ready, or map already initialized
    }
    
    const map = new window.google.maps.Map(mapContainerRef.current, {
      center: { lat: 20, lng: 0 },
      zoom: 3,
      gestureHandling: "cooperative",
      styles: [ /* ... map styles ... */ ],
    });
    
    map.addListener("click", async (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        console.log(`[MapPicker] Map clicked at: ${lat}, ${lng}`);

        // For simplicity, we'll use Google's Geocoder here to get a city name
        const geocoder = new window.google.maps.Geocoder();
        try {
            const { results } = await geocoder.geocode({ location: e.latLng });
            if (results && results[0]) {
                // Find a city or airport name from the results
                const bestResult = results.find(r => r.types.includes("locality") || r.types.includes("airport")) || results[0];
                const locationName = bestResult.address_components[0].long_name;
                
                // Now, use this name to search Amadeus via our backend for a proper location object
                const amadeusResponse = await api.get(`/flights/search-locations?keyword=${locationName}`);
                if (amadeusResponse.data.locations && amadeusResponse.data.locations.length > 0) {
                    onMapLocationSelect(amadeusResponse.data.locations[0]);
                } else {
                    console.warn("Could not find Amadeus location for clicked spot.");
                }
            }
        } catch (error) {
            console.error("Reverse geocoding or Amadeus search failed:", error);
        }
    });

    mapInstanceRef.current = map;
  }, [isScriptLoaded, onMapLocationSelect]);

  // Effect to handle drawing markers and paths
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // --- Handle Origin Marker ---
    if (originLocation) {
        const position = { lat: originLocation.geoCode.latitude, lng: originLocation.geoCode.longitude };
        if (originMarkerRef.current) {
            originMarkerRef.current.setPosition(position);
        } else {
            originMarkerRef.current = new window.google.maps.Marker({
                position,
                map,
                icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                title: originLocation.name,
            });
        }
    } else if (originMarkerRef.current) {
        originMarkerRef.current.setMap(null);
        originMarkerRef.current = null;
    }

    // --- Handle Destination Marker ---
    if (destinationLocation) {
        const position = { lat: destinationLocation.geoCode.latitude, lng: destinationLocation.geoCode.longitude };
        if (destinationMarkerRef.current) {
            destinationMarkerRef.current.setPosition(position);
        } else {
            destinationMarkerRef.current = new window.google.maps.Marker({
                position,
                map,
                icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                title: destinationLocation.name,
            });
        }
    } else if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setMap(null);
        destinationMarkerRef.current = null;
    }

    // --- Handle Flight Path (Polyline) ---
    if (originLocation && destinationLocation) {
        const pathCoordinates = [
            { lat: originLocation.geoCode.latitude, lng: originLocation.geoCode.longitude },
            { lat: destinationLocation.geoCode.latitude, lng: destinationLocation.geoCode.longitude },
        ];
        if (flightPathRef.current) {
            flightPathRef.current.setPath(pathCoordinates);
        } else {
            flightPathRef.current = new window.google.maps.Polyline({
                path: pathCoordinates,
                geodesic: true,
                strokeColor: '#FF5722', // An orange color
                strokeOpacity: 1.0,
                strokeWeight: 2,
            });
        }
        flightPathRef.current.setMap(map);
        
        // --- Adjust map view to show both points ---
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(pathCoordinates[0]);
        bounds.extend(pathCoordinates[1]);
        map.fitBounds(bounds, 100); // The 100 is padding in pixels
    } else if (flightPathRef.current) {
        flightPathRef.current.setMap(null);
    }
  }, [originLocation, destinationLocation]);


  return (
    <div className="w-full h-full relative">
      {mapError && (
        <div className="absolute top-2 left-2 z-10 bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded-md text-xs shadow-lg">
          Error: {mapError}
        </div>
      )}
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-md bg-gray-700"
        aria-label="Interactive map for flight booking"
      />
    </div>
  );
}
