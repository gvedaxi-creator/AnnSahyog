import { useEffect, useState } from "react";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import { Link } from "react-router-dom";
import NgoSidebar from "../../components/NgoSidebar";
import { getDonations, createDonationRequest } from "../../services/api";
import {
  Search,
  Utensils,
  Scale,
  MapPin,
  User,
  Clock,
  ArrowRight,
  X,
  AlertCircle,
  CheckCircle2,
  Send,
} from "lucide-react";

function BrowseDonations() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [cities, setCities] = useState([]);
  const [foodTypeFilter, setFoodTypeFilter] = useState("ALL");
  const [foodTypes, setFoodTypes] = useState([]);

  // Request Modal state
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [requestedQty, setRequestedQty] = useState("");
  const [message, setMessage] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [modalError, setModalError] = useState("");

  const fetchDonationsList = async () => {
    try {
      setLoading(true);
      const data = await getDonations();
      const all = data.donations || [];
      // Only available food
      const available = all.filter((d) => d.status === "AVAILABLE");
      setDonations(available);

      // Extract unique cities
      const uniqueCities = Array.from(
        new Set(available.map((d) => d.city).filter(Boolean))
      );
      setCities(uniqueCities);
      setFoodTypes(Array.from(new Set(available.map((d) => d.food_type).filter(Boolean))).sort());
    } catch (err) {
      console.error("Browse donations error:", err);
      setError(err.message || "Failed to load food listings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonationsList();
  }, []);

  const openRequestModal = (donation) => {
    setSelectedDonation(donation);
    setRequestedQty(donation.quantity || "");
    setMessage(`We would like to request this food for distribution at our community center.`);
    setModalError("");
  };

  const closeRequestModal = () => {
    setSelectedDonation(null);
    setRequestedQty("");
    setMessage("");
    setModalError("");
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDonation || !user?.ngo_id) return;

    if (Number(requestedQty) <= 0) {
      setModalError("Please enter a valid requested quantity.");
      return;
    }

    if (Number(requestedQty) > Number(selectedDonation.quantity)) {
      setModalError(
        `Requested quantity cannot exceed available quantity (${selectedDonation.quantity} ${selectedDonation.unit}).`
      );
      return;
    }

    try {
      setSubmittingRequest(true);
      setModalError("");
      setError("");

      await createDonationRequest({
        donation_id: selectedDonation.donation_id,
        ngo_id: user.ngo_id,
        requested_quantity: requestedQty,
        message: message,
      });

      setSuccessMsg(
        `Successfully requested ${requestedQty} ${selectedDonation.unit} of "${selectedDonation.food_type}"! The donor has been notified.`
      );
      closeRequestModal();
    } catch (err) {
      console.error("Request food error:", err);
      setModalError(err.message || "Failed to submit food request.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Filtered donations
  const filteredDonations = donations.filter((d) => {
    const matchesCity = cityFilter === "ALL" || d.city === cityFilter;
    const matchesFood = foodTypeFilter === "ALL" || d.food_type === foodTypeFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      d.food_type?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q) ||
      d.donor_name?.toLowerCase().includes(q) ||
      d.pickup_address?.toLowerCase().includes(q) ||
      d.city?.toLowerCase().includes(q);

    return matchesCity && matchesFood && matchesSearch;
  });

  return (
    <div className="donor-layout ngo-layout">
      <NgoSidebar />

      <main className="donor-main ngo-main">
        <div className="dashboard-page ngo-dashboard-page">
          <div className="container">
            <div className="page-back-bar">
              <BackButton />
            </div>

            {/* Header */}
            <div className="dashboard-header ngo-header">
              <div>
                <span className="dashboard-eyebrow ngo-eyebrow">
                  FOOD RESCUE DIRECTORY
                </span>
                <h1>Browse Available Food</h1>
                <p>
                  Discover surplus food listings shared by local restaurants, caterers,
                  and food donors ready for community distribution.
                </p>
              </div>

              <div className="admin-stat-pills">
                <span className="pill-badge pill-active">
                  Available Batches: {donations.length}
                </span>
              </div>
            </div>

            {error && (
              <div className="auth-alert alert-error" style={{ marginBottom: "1.25rem" }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="auth-alert alert-success" style={{ marginBottom: "1.25rem" }}>
                <CheckCircle2 size={18} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* SEARCH & FILTERS TOOLBAR */}
            <div className="admin-toolbar">
              <div className="admin-search-wrap">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by food type, description or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="admin-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="admin-filter-group">
                <div className="filter-item">
                  <label>City Zone</label>
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="admin-select"
                  >
                    <option value="ALL">All Cities ({donations.length})</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-item">
                  <label>Food Type</label>
                  <select
                    value={foodTypeFilter}
                    onChange={(e) => setFoodTypeFilter(e.target.value)}
                    className="admin-select"
                  >
                    <option value="ALL">All Food Types</option>
                    {foodTypes.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* DONATIONS GRID */}
            {loading ? (
              <div className="dashboard-empty-card">
                <div className="food-spinner"></div>
                <h3>Loading available food listings...</h3>
                <p>Checking live surplus inventory in your area.</p>
              </div>
            ) : filteredDonations.length === 0 ? (
              <div className="dashboard-empty-card">
                <div className="empty-icon-wrap">
                  <Utensils size={36} />
                </div>
                <h3>No available donations found</h3>
                <p>
                  {searchQuery || cityFilter !== "ALL" || foodTypeFilter !== "ALL"
                    ? "Try adjusting your search query or city filter."
                    : "No food donations are currently listed. Please check back soon!"}
                </p>
              </div>
            ) : (
              <div className="ngo-donations-grid">
                {filteredDonations.map((d) => (
                  <article key={d.donation_id} className="ngo-food-card">
                    <div className="food-card-top">
                      <div className="food-badge-wrap">
                        <span className="donation-status status-available">
                          AVAILABLE NOW
                        </span>
                      </div>
                      <span className="food-qty-tag">
                        <Scale size={13} /> {d.quantity} {d.unit}
                      </span>
                    </div>

                    <h3 className="food-card-title">{d.food_type}</h3>

                    <p className="food-card-desc">
                      {d.description || "Fresh surplus food verified for consumption and available for pickup."}
                    </p>

                    <div className="food-card-meta">
                      <div className="meta-line">
                        <MapPin size={14} className="meta-icon" />
                        <span>
                          {d.pickup_address ? `${d.pickup_address}, ` : ""}
                          <strong>{d.city || "Ahmedabad"}</strong>
                        </span>
                      </div>
                      <div className="meta-line">
                        <User size={14} className="meta-icon" />
                        <span>
                          Donor: <strong>{d.donor_name || "Food Donor"}</strong>
                        </span>
                      </div>
                      {d.expiry_date && (
                        <div className="meta-line text-warning">
                          <Clock size={14} className="meta-icon" />
                          <span>
                            Best before:{" "}
                            <strong>
                              {new Date(d.expiry_date).toLocaleString([], {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="food-card-actions">
                      <Link
                        to={`/ngo/donations/${d.donation_id}`}
                        className="btn btn-sm btn-secondary"
                      >
                        Details
                      </Link>
                      <button
                        type="button"
                        onClick={() => openRequestModal(d)}
                        className="btn btn-sm btn-primary"
                      >
                        <span>Claim Food</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* REQUEST FOOD MODAL */}
            {selectedDonation && (
              <div className="ngo-modal-backdrop" onClick={closeRequestModal}>
                <div
                  className="ngo-modal-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="ngo-modal-header">
                    <div>
                      <span className="dashboard-eyebrow">FOOD REQUEST</span>
                      <h2>Claim Surplus Food</h2>
                    </div>
                    <button
                      type="button"
                      className="ngo-modal-close"
                      onClick={closeRequestModal}
                      aria-label="Close modal"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {modalError && (
                    <div className="auth-alert alert-error" style={{ marginBottom: "1rem" }}>
                      <AlertCircle size={16} />
                      <span>{modalError}</span>
                    </div>
                  )}

                  <div className="ngo-modal-summary">
                    <strong>{selectedDonation.food_type}</strong>
                    <p>
                      Offered by {selectedDonation.donor_name || "Donor"} • Total Available:{" "}
                      <span>
                        {selectedDonation.quantity} {selectedDonation.unit}
                      </span>
                    </p>
                  </div>

                  <form onSubmit={handleRequestSubmit} className="ngo-modal-form">
                    <div className="form-field">
                      <label>
                        Requested Quantity ({selectedDonation.unit}) <span className="req-star">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0.1"
                        max={selectedDonation.quantity}
                        value={requestedQty}
                        onChange={(e) => setRequestedQty(e.target.value)}
                        required
                        className="admin-search-input"
                      />
                      <small className="field-hint">
                        You can request part or all of the {selectedDonation.quantity}{" "}
                        {selectedDonation.unit} available.
                      </small>
                    </div>

                    <div className="form-field">
                      <label>Distribution Purpose / Message for Donor</label>
                      <textarea
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Explain how many people this will feed or your shelter distribution plan..."
                        className="admin-search-input"
                        required
                      />
                    </div>

                    <div className="ngo-modal-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={closeRequestModal}
                        disabled={submittingRequest}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submittingRequest}
                      >
                        {submittingRequest ? (
                          <>
                            <div className="btn-spinner"></div>
                            <span>Submitting Claim...</span>
                          </>
                        ) : (
                          <>
                            <Send size={15} />
                            <span>Send Food Request</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
        <Footer variant="app" />
      </main>
    </div>
  );
}

export default BrowseDonations;
