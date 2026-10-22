import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DonorSidebar from "../../components/DonorSidebar";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import { createDonation } from "../../services/api";
import {
  Utensils,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";

const GOOGLE_MAPS_LIBRARIES = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "350px",
  borderRadius: "12px",
};

const defaultMapCenter = {
  lat: 23.0225,
  lng: 72.5714,
};

function AddDonation() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [formData, setFormData] = useState({
    description: "",
    preparedDate: "",
    expiryDate: "",
    pickupAddress: "",
    city: "",
  });

  const [foodItems, setFoodItems] = useState([
    {
      food_item: "",
      quantity: "",
      unit: "pieces",
    },
  ]);

  const foodSuggestions = [
    "Sandwiches",
    "Dal Makhani",
    "Roti",
    "Rice",
    "Dal Tadka",
    "Rajma",
    "Chole",
    "Paneer",
    "Pulao",
    "Biryani",
    "Paratha",
    "Thepla",
    "Idli",
    "Dosa",
    "Samosa",
    "Poha",
    "Upma",
    "Fruits",
    "Vegetables",
    "Bread",
    "Biscuits",
    "Cakes",
    "Packaged Meals",
    "Other",
  ];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Google Maps refs
  const mapRef = useRef(null);
  const placeAutocompleteContainerRef = useRef(null);
  const placeAutocompleteRef = useRef(null);

  const [location, setLocation] = useState({
    lat: null,
    lng: null,
  });

  const preparedDateRef = useRef(null);
  const expiryDateRef = useRef(null);

  // Load Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFoodItemChange = (index, field, value) => {
    setFoodItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  const addFoodItem = () => {
    setFoodItems((prev) => [
      ...prev,
      {
        food_item: "",
        quantity: "",
        unit: "pieces",
      },
    ]);
  };

  const removeFoodItem = (index) => {
    setFoodItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  // Convert datetime-local value to MySQL DATETIME format
  const toMysqlDateTime = (value) => {
    if (!value) return null;

    return value.length === 16
      ? value.replace("T", " ") + ":00"
      : value.replace("T", " ");
  };

  // When donor selects a location from Google's NEW Place Autocomplete widget
  const handlePlaceSelected = async ({ placePrediction }) => {
    if (!placePrediction) return;

    try {
      const place = placePrediction.toPlace();

      // Request only the fields required by this form.
      await place.fetchFields({
        fields: ["formattedAddress", "location", "addressComponents"],
      });

      if (!place.location) {
        setError("Please select a valid location from the Google suggestions.");
        return;
      }

      const lat = place.location.lat();
      const lng = place.location.lng();

      const address = place.formattedAddress || "";

      // Find the city from Google's structured address components.
      const cityComponent = place.addressComponents?.find((component) =>
        component.types.includes("locality"),
      );

      const postalTownComponent = place.addressComponents?.find((component) =>
        component.types.includes("postal_town"),
      );

      const administrativeAreaComponent = place.addressComponents?.find(
        (component) => component.types.includes("administrative_area_level_3"),
      );

      const detectedCity =
        cityComponent?.longText ||
        postalTownComponent?.longText ||
        administrativeAreaComponent?.longText ||
        "";

      setLocation({
        lat,
        lng,
      });

      setFormData((prev) => ({
        ...prev,
        pickupAddress: address,
        city: detectedCity || prev.city,
      }));

      setError("");

      // Move the Google map to the selected location.
      if (mapRef.current) {
        mapRef.current.panTo({ lat, lng });
        mapRef.current.setZoom(16);
      }
    } catch (err) {
      console.error("Error getting selected Google place:", err);

      setError(
        "Unable to get the selected location. Please select the suggestion again.",
      );
    }
  };

  // Initialize Google's NEW Place Autocomplete widget.
  useEffect(() => {
    if (!isLoaded || !placeAutocompleteContainerRef.current) {
      return;
    }

    let cancelled = false;

    const initializePlaceAutocomplete = async () => {
      try {
        const { PlaceAutocompleteElement } =
          await window.google.maps.importLibrary("places");

        if (cancelled || !placeAutocompleteContainerRef.current) {
          return;
        }

        // Prevent duplicate widgets during React re-renders.
        if (placeAutocompleteRef.current) {
          return;
        }

        const element = new PlaceAutocompleteElement();

        element.placeholder = "Search for pickup location";
        element.includedRegionCodes = ["in"];

        // Keep the widget consistent with the existing form width.
        element.style.width = "100%";
        element.style.display = "block";
        element.style.fontFamily = "inherit";
        element.style.fontSize = "15px";
        element.style.backgroundColor = "#ffffff";
        element.style.border = "1px solid var(--sand-3)";
        element.style.borderRadius = "10px";
        element.style.color = "var(--ink)";
        element.style.colorScheme = "light";

        element.addEventListener("gmp-select", handlePlaceSelected);

        element.addEventListener("gmp-error", (event) => {
          console.error("Google Places widget error:", event);
          setError(
            "Google location search is temporarily unavailable. Please try again.",
          );
        });

        placeAutocompleteContainerRef.current.innerHTML = "";
        placeAutocompleteContainerRef.current.appendChild(element);

        placeAutocompleteRef.current = element;
      } catch (err) {
        console.error("Failed to initialize Google Places:", err);

        setError(
          "Google location search could not be initialized. Please check your Google Maps configuration.",
        );
      }
    };

    initializePlaceAutocomplete();

    return () => {
      cancelled = true;

      if (placeAutocompleteRef.current) {
        placeAutocompleteRef.current.removeEventListener(
          "gmp-select",
          handlePlaceSelected,
        );

        placeAutocompleteRef.current.remove();
        placeAutocompleteRef.current = null;
      }
    };
  }, [isLoaded]);

  // When donor drags the marker
  const handleMarkerDragEnd = (event) => {
    if (!event.latLng) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    setLocation({
      lat,
      lng,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Make sure donor is logged in
    if (!user) {
      setError("Please login as a donor before adding a donation.");
      return;
    }

    // Make sure donor_id is available
    if (!user.donor_id) {
      setError("Donor information is missing. Please logout and login again.");
      return;
    }

    const invalidFoodItems = foodItems.some(
      (item) =>
        !item.food_item.trim() ||
        !item.quantity ||
        Number(item.quantity) <= 0 ||
        !item.unit,
    );

    if (invalidFoodItems) {
      setError(
        "Please enter a valid food item, quantity and unit for every item.",
      );
      return;
    }

    // Make sure a Google Maps location is selected
    if (location.lat === null || location.lng === null) {
      setError(
        "Please search and select your pickup location on the Google Map.",
      );
      return;
    }

    setLoading(true);

    try {
      const donation = {
        donor_id: user.donor_id,
        items: foodItems.map((item) => ({
          food_item: item.food_item.trim(),
          quantity: Number(item.quantity),
          unit: item.unit,
        })),
        description: formData.description,
        prepared_date: toMysqlDateTime(formData.preparedDate),
        expiry_date: toMysqlDateTime(formData.expiryDate),
        pickup_address: formData.pickupAddress,
        city: formData.city,

        // Google Maps coordinates
        latitude: location.lat,
        longitude: location.lng,
      };

      await createDonation(donation);

      navigate("/donor/donations");
    } catch (err) {
      console.error("Error creating donation:", err);

      setError(
        err.message || "Something went wrong while adding the donation.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="donor-layout">
      <DonorSidebar />

      <main className="donor-main">
        <div className="dashboard-page">
          <div className="container">
            <div className="page-back-bar">
              <BackButton />
            </div>

            <div className="dashboard-header" style={{ marginBottom: "2rem" }}>
              <div>
                <span className="dashboard-eyebrow">FOOD RESCUE INITIATIVE</span>
                <h1>List New Food Donation</h1>
                <p>
                  Share surplus nutritious meals with local verified NGOs and shelter homes. Every portion makes an impact.
                </p>
              </div>
            </div>

            <section className="dashboard-section add-donation-section">
              {error && (
                <div className="vol-alert vol-alert-error" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  <AlertCircle size={16} /> <span>{error}</span>
                </div>
              )}

              <form className="donation-form add-donation-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Step 1: Food Items */}
                <div className="donation-form-card" style={{ background: "#fff", borderRadius: "14px", padding: "1.75rem", border: "1px solid var(--sand-2)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                  <div className="donation-step-heading" style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--sand-2)", paddingBottom: "1rem" }}>
                    <span className="donation-step-number" style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--moss)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "0.9rem" }}>1</span>
                    <div>
                      <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--ink)", margin: 0 }}>Food Items & Portions *</h2>
                      <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "0.2rem 0 0" }}>Specify each dish or packaged item with its approximate quantity</p>
                    </div>
                  </div>

                  <div className="form-group food-items-group">
                    <div className="food-items-list" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {foodItems.map((item, index) => (
                        <div
                          className="food-item-row donation-food-row"
                          key={index}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr 1fr auto",
                            gap: "0.75rem",
                            alignItems: "flex-end",
                            background: "var(--sand-1)",
                            padding: "1rem",
                            borderRadius: "10px",
                            border: "1px solid var(--sand-2)"
                          }}
                        >
                          <div className="form-group" style={{ margin: 0 }}>
                            <label htmlFor={`foodItem-${index}`} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: "700", marginBottom: "0.35rem" }}>
                              <Utensils size={13} /> Food Name / Type
                            </label>

                            <input
                              id={`foodItem-${index}`}
                              list={`food-suggestions-${index}`}
                              type="text"
                              placeholder="e.g. Rice & Dal Combo"
                              value={item.food_item}
                              onChange={(e) =>
                                handleFoodItemChange(
                                  index,
                                  "food_item",
                                  e.target.value,
                                )
                              }
                              required
                              style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--sand-3)", fontSize: "0.9rem", background: "#fff" }}
                            />

                            <datalist id={`food-suggestions-${index}`}>
                              {foodSuggestions.map((food) => (
                                <option key={food} value={food} />
                              ))}
                            </datalist>
                          </div>

                          <div className="form-group" style={{ margin: 0 }}>
                            <label htmlFor={`foodQuantity-${index}`} style={{ fontSize: "0.8rem", fontWeight: "700", marginBottom: "0.35rem", display: "block" }}>
                              Quantity
                            </label>

                            <input
                              id={`foodQuantity-${index}`}
                              type="number"
                              min="0.1"
                              step="0.1"
                              placeholder="e.g. 25"
                              value={item.quantity}
                              onChange={(e) =>
                                handleFoodItemChange(
                                  index,
                                  "quantity",
                                  e.target.value,
                                )
                              }
                              required
                              style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--sand-3)", fontSize: "0.9rem", background: "#fff" }}
                            />
                          </div>

                          <div className="form-group" style={{ margin: 0 }}>
                            <label htmlFor={`foodUnit-${index}`} style={{ fontSize: "0.8rem", fontWeight: "700", marginBottom: "0.35rem", display: "block" }}>
                              Unit
                            </label>

                            <select
                              id={`foodUnit-${index}`}
                              value={item.unit}
                              onChange={(e) =>
                                handleFoodItemChange(
                                  index,
                                  "unit",
                                  e.target.value,
                                )
                              }
                              required
                              style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--sand-3)", fontSize: "0.9rem", background: "#fff" }}
                            >
                              <option value="pieces">Pieces</option>
                              <option value="kg">Kilograms (kg)</option>
                              <option value="litres">Litres</option>
                              <option value="packets">Packets</option>
                              <option value="boxes">Boxes</option>
                              <option value="plates">Plates / Meals</option>
                            </select>
                          </div>

                          {foodItems.length > 1 && (
                            <button
                              type="button"
                              className="remove-food-item"
                              onClick={() => removeFoodItem(index)}
                              aria-label={`Remove food item ${index + 1}`}
                              style={{
                                background: "#fee2e2",
                                color: "#b91c1c",
                                border: "none",
                                width: "36px",
                                height: "36px",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="add-food-item-button donation-add-item-button"
                      onClick={addFoodItem}
                      style={{
                        marginTop: "1rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.6rem 1rem",
                        borderRadius: "8px",
                        border: "1px dashed var(--moss)",
                        background: "rgba(46, 125, 50, 0.05)",
                        color: "var(--moss)",
                        fontWeight: "700",
                        fontSize: "0.85rem",
                        cursor: "pointer"
                      }}
                    >
                      <Plus size={15} /> Add Another Food Item
                    </button>
                  </div>
                </div>

                {/* Step 2: Additional details */}
                <div className="donation-form-card" style={{ background: "#fff", borderRadius: "14px", padding: "1.75rem", border: "1px solid var(--sand-2)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                  <div className="donation-step-heading" style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--sand-2)", paddingBottom: "1rem" }}>
                    <span className="donation-step-number" style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--moss)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "0.9rem" }}>2</span>
                    <div>
                      <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--ink)", margin: 0 }}>Preparation & Timing Details</h2>
                      <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "0.2rem 0 0" }}>Set food safety timelines to ensure safe consumption</p>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                    <label htmlFor="description" style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.4rem" }}>
                      Description / Dietary & Packaging Notes
                    </label>

                    <textarea
                      id="description"
                      name="description"
                      rows="3"
                      placeholder="e.g., Cooked freshly for an event. Packed in clean steel containers. Vegetarian."
                      value={formData.description}
                      onChange={handleChange}
                      style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--sand-3)", fontSize: "0.9rem" }}
                    />
                  </div>

                  {/* Prepared + Expiry */}
                  <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                    {/* Prepared Date */}
                    <div className="form-group">
                      <label htmlFor="preparedDate" style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.4rem" }}>
                        <Clock size={14} /> Prepared Date & Time *
                      </label>

                      <div className="date-input-wrapper" style={{ position: "relative" }}>
                        <input
                          ref={preparedDateRef}
                          id="preparedDate"
                          name="preparedDate"
                          type="datetime-local"
                          value={formData.preparedDate}
                          onChange={handleChange}
                          required
                          style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid var(--sand-3)", fontSize: "0.9rem" }}
                        />
                      </div>
                    </div>

                    {/* Expiry Date */}
                    <div className="form-group">
                      <label htmlFor="expiryDate" style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.4rem" }}>
                        <Calendar size={14} /> Best Before / Expiry *
                      </label>

                      <div className="date-input-wrapper" style={{ position: "relative" }}>
                        <input
                          ref={expiryDateRef}
                          id="expiryDate"
                          name="expiryDate"
                          type="datetime-local"
                          value={formData.expiryDate}
                          onChange={handleChange}
                          required
                          style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid var(--sand-3)", fontSize: "0.9rem" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Pickup location */}
                <div className="donation-form-card" style={{ background: "#fff", borderRadius: "14px", padding: "1.75rem", border: "1px solid var(--sand-2)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                  <div className="donation-step-heading" style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--sand-2)", paddingBottom: "1rem" }}>
                    <span className="donation-step-number" style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--moss)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "0.9rem" }}>3</span>
                    <div>
                      <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--ink)", margin: 0 }}>Pickup Location & Map Pin</h2>
                      <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "0.2rem 0 0" }}>Choose where the volunteer courier or NGO can collect the food</p>
                    </div>
                  </div>

                  <div className="pickup-fields-row" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div className="form-group">
                      <label htmlFor="pickupAddress" style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.4rem" }}>
                        <MapPin size={14} /> Search Pickup Location (Google Places) *
                      </label>

                      {loadError && (
                        <div className="form-error" style={{ color: "var(--error)", fontSize: "0.85rem", padding: "0.5rem 0" }}>
                          Google Maps could not be loaded. Please check your API key.
                        </div>
                      )}

                      {!isLoaded && !loadError && (
                        <div className="map-loading" style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Loading Google Maps...</div>
                      )}

                      {isLoaded && (
                        <>
                          <div
                            ref={placeAutocompleteContainerRef}
                            className="google-place-autocomplete light-place-autocomplete"
                            aria-label="Pickup location search"
                            style={{ marginBottom: "0.5rem" }}
                          />

                          <p className="map-helper-text" style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "0.75rem" }}>
                            Search your venue or street address, then drag the marker on the map if you need fine adjustments.
                          </p>

                          <div className="donation-map-wrapper add-donation-map" style={{ overflow: "hidden", borderRadius: "12px", border: "1px solid var(--sand-3)" }}>
                            <GoogleMap
                              mapContainerStyle={mapContainerStyle}
                              center={
                                location.lat !== null && location.lng !== null
                                  ? location
                                  : defaultMapCenter
                              }
                              zoom={
                                location.lat !== null && location.lng !== null
                                  ? 16
                                  : 12
                              }
                              onLoad={(mapInstance) => {
                                mapRef.current = mapInstance;
                              }}
                              onUnmount={() => {
                                mapRef.current = null;
                              }}
                              options={{
                                streetViewControl: false,
                                mapTypeControl: false,
                                fullscreenControl: true,
                              }}
                            >
                              {location.lat !== null && location.lng !== null && (
                                <MarkerF
                                  position={location}
                                  draggable
                                  onDragEnd={handleMarkerDragEnd}
                                />
                              )}
                            </GoogleMap>
                          </div>

                          {location.lat !== null && location.lng !== null && (
                            <div className="selected-location-text" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(46, 125, 50, 0.1)", color: "var(--moss)", padding: "0.4rem 0.75rem", borderRadius: "8px", fontSize: "0.82rem", fontWeight: "700", marginTop: "0.75rem" }}>
                              <CheckCircle2 size={14} /> Coordinates pinpointed: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* City */}
                    <div className="form-group pickup-city-group">
                      <label htmlFor="city" style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.4rem" }}>
                        Operational City *
                      </label>

                      <input
                        id="city"
                        name="city"
                        type="text"
                        placeholder="e.g. Ahmedabad"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "8px", border: "1px solid var(--sand-3)", fontSize: "0.9rem" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="form-actions add-donation-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate("/donor/dashboard")}
                    disabled={loading}
                    style={{ padding: "0.75rem 1.5rem", borderRadius: "8px", border: "1px solid var(--sand-3)", background: "#fff", fontWeight: "700", fontSize: "0.9rem", cursor: "pointer" }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.75rem", borderRadius: "8px", background: "var(--moss)", color: "#fff", border: "none", fontWeight: "700", fontSize: "0.9rem", cursor: loading ? "not-allowed" : "pointer" }}
                  >
                    <CheckCircle2 size={16} />
                    {loading ? "Publishing Donation..." : "Publish Food Donation"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
        <Footer variant="app" />
      </main>
    </div>
  );
}

export default AddDonation;
