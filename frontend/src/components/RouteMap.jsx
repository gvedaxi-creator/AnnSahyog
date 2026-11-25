import { useEffect, useMemo, useState } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsService,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";

// Live route map for a volunteer: shows the pickup and delivery points,
// the volunteer's own position (browser location), and the driving route.
// Falls back to address text when coordinates are missing.

const MAP_STYLE = { width: "100%", height: "320px", borderRadius: "16px" };
const DEFAULT_CENTER = { lat: 23.0225, lng: 72.5714 }; // Ahmedabad
const LIBRARIES = [];

const toLatLng = (lat, lng) =>
  lat != null && lng != null ? { lat: Number(lat), lng: Number(lng) } : null;

// Google Maps directions link (opens the Maps app on mobile)
const coordsOrText = (pos, text) => (pos ? `${pos.lat},${pos.lng}` : text || "");
const mapsDirectionsUrl = (destination, origin) => {
  const params = new URLSearchParams({ api: "1", destination, travelmode: "driving" });
  if (origin) params.set("origin", origin);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
};
const openDirections = (destination, origin) =>
  window.open(mapsDirectionsUrl(destination, origin), "_blank", "noopener,noreferrer");

// Round to ~100 m so the route is not re-requested on every GPS tick
const roundPos = (p) => (p ? `${p.lat.toFixed(3)},${p.lng.toFixed(3)}` : "none");

function RouteMap({ pickup, delivery, status, pickupAddress, deliveryAddress }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const [me, setMe] = useState(null);
  const [directions, setDirections] = useState(null);
  const [routeError, setRouteError] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) return undefined;
    const id = navigator.geolocation.watchPosition(
      (pos) => setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setMe(null),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const pickupPos = toLatLng(pickup?.lat, pickup?.lng);
  const deliveryPos = toLatLng(delivery?.lat, delivery?.lng);

  // Before pickup: route from volunteer to pickup. After pickup: route to delivery.
  const beforePickup = !status || status === "ASSIGNED";
  const origin = me || pickupPos || pickupAddress || null;
  const destination = beforePickup
    ? pickupPos || pickupAddress || null
    : deliveryPos || deliveryAddress || null;

  const requestKey = `${roundPos(me)}|${roundPos(pickupPos)}|${roundPos(deliveryPos)}|${String(
    destination && typeof destination === "object" ? roundPos(destination) : destination
  )}|${beforePickup}`;

  const directionsOptions = useMemo(
    () => (origin && destination ? { origin, destination, travelMode: "DRIVING" } : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requestKey]
  );

  const actionButtons = (
    <div className="route-map-actions">
        <a
          href={mapsDirectionsUrl(coordsOrText(pickupPos, pickupAddress), "")}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
        >
          Pickup directions (Google Maps)
        </a>
        <a
          href={mapsDirectionsUrl(
            coordsOrText(deliveryPos, deliveryAddress),
            coordsOrText(pickupPos, pickupAddress)
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
        >
          Delivery directions (Google Maps)
        </a>
    </div>
  );

  if (loadError) {
    return (
      <div className="route-map-card">
        <div className="auth-alert alert-error">Map could not load. Use the directions buttons below.</div>
        {actionButtons}
      </div>
    );
  }
  if (!isLoaded) {
    return (
      <div className="route-map-card">
        <p className="route-map-note">Loading map...</p>
        {actionButtons}
      </div>
    );
  }

  const center = me || pickupPos || deliveryPos || DEFAULT_CENTER;

  return (
    <div className="route-map-card">
      <GoogleMap mapContainerStyle={MAP_STYLE} center={center} zoom={13}>
        {pickupPos && (
          <Marker
            position={pickupPos}
            label="P"
            title="Pickup point - click for directions"
            onClick={() => openDirections(coordsOrText(pickupPos, pickupAddress), "")}
          />
        )}
        {deliveryPos && (
          <Marker
            position={deliveryPos}
            label="D"
            title="Delivery point - click for directions"
            onClick={() =>
              openDirections(
                coordsOrText(deliveryPos, deliveryAddress),
                coordsOrText(pickupPos, pickupAddress)
              )
            }
          />
        )}
        {me && <Marker position={me} label="Y" title="You" />}

        {directionsOptions && (
          <DirectionsService
            options={directionsOptions}
            callback={(result, st) => {
              if (st === "OK") {
                setDirections(result);
                setRouteError("");
              } else {
                setRouteError("Route not available right now.");
              }
            }}
          />
        )}
        {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }} />}
      </GoogleMap>
      {actionButtons}
      {routeError && <p className="route-map-note">{routeError}</p>}
      {!me && <p className="route-map-note">Allow location access to see your position on the map.</p>}
    </div>
  );
}

export default RouteMap;
