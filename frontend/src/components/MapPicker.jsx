// frontend/src/components/MapPicker.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";

const getNominatimAddressComponent = (address, componentName) => {
  return address ? address[componentName] : null;
};

// Blinking blue dot SVG as a string
const blinkingBlueDotSVG = `
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="30" fill="#2563EB">
    <animate attributeName="r" from="6" to="10" dur="1s" begin="0s" repeatCount="indefinite"/>
    <animate attributeName="opacity" from="1" to="0" dur="1s" begin="0s" repeatCount="indefinite"/>
  </circle>
  <circle cx="12" cy="12" r="4" fill="#60A5FA"/>
</svg>
`;


export default function MapPicker({ onLocationSelected }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  const markerElementRef = useRef(null); // For the DOM element of the AdvancedMarker
  
  const [mapError, setMapError] = useState("");
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const stableOnLocationSelected = useCallback((locationDetails) => {
    if (typeof onLocationSelected === 'function') {
      onLocationSelected(locationDetails);
    }
  }, [onLocationSelected]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_Maps_API_KEY;
    if (!apiKey) {
      setMapError("Map API Key is missing. Map cannot be loaded.");
      return;
    }

    if (window.google && window.google.maps && window.google.maps.marker) { // Check for marker library too
      setIsScriptLoaded(true);
      return;
    }

    const existingScript = document.getElementById("google-maps-js");
    if (existingScript) {
        if (window.google && window.google.maps && window.google.maps.marker) {
             setIsScriptLoaded(true);
        } else {
            const originalOnload = existingScript.onload;
            existingScript.onload = () => {
                if (originalOnload) originalOnload();
                setIsScriptLoaded(true);
            };
        }
        return;
    }
    
    const script = document.createElement("script");
    script.id = "google-maps-js";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&v=beta`; // v=beta for AdvancedMarkerElement
    script.async = true;
    script.defer = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => setMapError("Map script failed to load. Check connection/API key.");
    document.head.appendChild(script);

  }, []);

  useEffect(() => {
    if (!isScriptLoaded || !mapContainerRef.current || !window.google?.maps?.marker) {
      return; 
    }

    if (!mapInstanceRef.current) {
      try {
        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: { lat: 20, lng: 0 },
          zoom: 3, // Slightly more zoomed in default
          gestureHandling: "cooperative",
          mapId: "TRIPTO_MAP_ID", // Required for AdvancedMarkerElement styling with vector maps
          styles: [
            { featureType: "all", elementType: "all", stylers: [{ hue: "#0e1e35" }, { saturation: -50 }] },
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
            { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#8a99ab" }] },
          ],
        });
        mapInstanceRef.current = map;

        map.addListener("click", async (e) => {
          // Check if click was on the map itself vs. a POI
          if (e.placeId) {
            e.stop(); // Prevent info window from opening on POI click if not desired
            console.log("Clicked on a POI, Place ID:", e.placeId, "Location:", e.latLng.toJSON());
            // Optionally, you could use this placeId to get more details
          }
          
          const latLng = e.latLng;
          const latitude = latLng.lat();
          const longitude = latLng.lng();
          setMapError(""); 

          if (!markerInstanceRef.current) {
            // Create the DOM element for the marker
            const markerDiv = document.createElement('div');
            markerDiv.innerHTML = blinkingBlueDotSVG;
            markerElementRef.current = markerDiv;

            markerInstanceRef.current = new window.google.maps.marker.AdvancedMarkerElement({
                position: latLng,
                map: mapInstanceRef.current,
                content: markerElementRef.current, // Use the SVG element
                title: "Selected Location",
            });
          } else {
            markerInstanceRef.current.position = latLng;
          }
          
          mapInstanceRef.current.panTo(latLng); // Smoothly pan to the selected location

          try {
            const userAgent = 'TripToApp/1.0 (yourcontact@example.com)'; 
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=en`,
              { headers: { 'User-Agent': userAgent } }
            );

            if (!response.ok) {
                let errorData; try { errorData = await response.json(); } catch (parseError) {}
                const errorMessage = errorData?.error?.message || errorData?.error || `Request failed: ${response.status}`;
                throw new Error(`Nominatim API: ${errorMessage}`);
            }
            const data = await response.json();

            if (data && data.address) {
              const address = data.address;
              const name = getNominatimAddressComponent(address, 'city') || getNominatimAddressComponent(address, 'town') || getNominatimAddressComponent(address, 'village') || (data.display_name ? data.display_name.split(',')[0] : "Selected Location");
              const country = getNominatimAddressComponent(address, 'country');
              const fullAddress = data.display_name || "N/A";
              const locationDetails = { latitude, longitude, name, country, fullAddress, description: `Location near ${name || fullAddress}`, osm_place_id: data.place_id, osm_type: data.osm_type, osm_id: data.osm_id };
              stableOnLocationSelected(locationDetails);
            } else {
              setMapError("Could not get location details.");
              stableOnLocationSelected({ latitude, longitude, name: "Unknown Location", country: "Unknown", fullAddress: "N/A" });
            }
          } catch (error) {
            setMapError(`Geocoding error: ${error.message}`);
            stableOnLocationSelected({ latitude, longitude, name: "Error fetching location", country: "Error", fullAddress: "N/A" });
          }
        });
      } catch (mapInitError) {
          setMapError("Failed to initialize map. API key might be invalid or missing permissions.");
      }
    }
  }, [isScriptLoaded, stableOnLocationSelected]);

  return (
    <div className="w-full h-full relative">
      {mapError && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded-md text-xs shadow-lg max-w-sm text-center">
          {mapError}
        </div>
      )}
      <div
        ref={mapContainerRef}
        className={`w-full h-full rounded-md ${mapError ? 'bg-gray-300' : 'bg-gray-700'}`}
        aria-label="Location picker map"
        role="application"
      />
      {!mapError && !isScriptLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-700 bg-opacity-75 rounded-md">
          <p className="text-white text-lg">Loading Map...</p>
        </div>
      )}
    </div>
  );
}
