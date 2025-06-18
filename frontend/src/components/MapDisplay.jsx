// tempo/frontend/src/components/MapDisplay.jsx
import React, { useEffect, useRef, useState } from "react";

export default function MapDisplay({ origin, destination, onMapClick }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const originMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const flightPathRef = useRef(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    if (window.google?.maps) {
      setIsScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "google-maps-js";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_Maps_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isScriptLoaded || !mapContainerRef.current || mapInstanceRef.current) return;
    
    const map = new window.google.maps.Map(mapContainerRef.current, {
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
    
    map.addListener("click", onMapClick);
    mapInstanceRef.current = map;
  }, [isScriptLoaded, onMapClick]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const createOrUpdateMarker = (markerRef, location, iconUrl) => {
        if (location && location.geoCode) {
            const position = { lat: location.geoCode.latitude, lng: location.geoCode.longitude };
            if (markerRef.current) {
                markerRef.current.setPosition(position);
            } else {
                markerRef.current = new window.google.maps.Marker({ position, map, icon: iconUrl });
            }
        } else if (markerRef.current) {
            markerRef.current.setMap(null);
            markerRef.current = null;
        }
    };

    createOrUpdateMarker(originMarkerRef, origin, 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
    createOrUpdateMarker(destinationMarkerRef, destination, 'http://maps.google.com/mapfiles/ms/icons/red-dot.png');

    if (origin && destination && origin.geoCode && destination.geoCode) {
        const pathCoordinates = [
            { lat: origin.geoCode.latitude, lng: origin.geoCode.longitude },
            { lat: destination.geoCode.latitude, lng: destination.geoCode.longitude },
        ];
        if (flightPathRef.current) {
            flightPathRef.current.setPath(pathCoordinates);
        } else {
            flightPathRef.current = new window.google.maps.Polyline({ path: pathCoordinates, geodesic: true, strokeColor: '#FF5722', strokeWeight: 2 });
        }
        flightPathRef.current.setMap(map);
        
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(pathCoordinates[0]);
        bounds.extend(pathCoordinates[1]);
        map.fitBounds(bounds, 100);
    } else if (flightPathRef.current) {
        flightPathRef.current.setMap(null);
        flightPathRef.current = null;
    }
  }, [origin, destination]);

  return (
    <div ref={mapContainerRef} className="w-full h-full rounded-md bg-gray-700" />
  );
}