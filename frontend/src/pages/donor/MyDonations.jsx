import { useEffect, useState } from "react";
import StatusBadge from "../../components/StatusBadge";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import { Link } from "react-router-dom";
import DonorSidebar from "../../components/DonorSidebar";
import { getDonorDonations } from "../../services/api";
import {
  Utensils,
  Package,
  MapPin,
  ArrowRight,
  Plus,
  AlertCircle,
  Scale,
  Calendar,
} from "lucide-react";

function MyDonations() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const fetchDonations = async () => {
      if (!user?.donor_id) {
        setError("Donor profile information is missing. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const data = await getDonorDonations(user.donor_id);
        setDonations(data.donations || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load donations list.");
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, [user?.donor_id]);


  const filteredDonations = donations.filter((d) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "ACTIVE") {
      return ["AVAILABLE", "REQUESTED", "ACCEPTED", "PICKED_UP", "IN_TRANSIT"].includes(d.status);
    }
    if (statusFilter === "COMPLETED") {
      return ["DELIVERED", "COMPLETED"].includes(d.status);
    }
    if (statusFilter === "CANCELLED") {
      return ["CANCELLED", "REJECTED"].includes(d.status);
    }
    return d.status === statusFilter;
  });

  return (
    <div className="donor-layout">
      <DonorSidebar />

      <main className="donor-main">
        <div className="dashboard-page">
          <div className="container">
            <div className="page-back-bar">
              <BackButton />
            </div>

            {/* Header */}
            <div className="dashboard-header donations-page-header">
              <div>
                <span className="dashboard-eyebrow">FOOD RESCUE DIRECTORY</span>
                <h1>My Donations</h1>
                <p>Track every food donation you've shared through AnnSahyog in real-time.</p>
              </div>

              <Link
                to="/donor/add-donation"
                className="btn btn-primary donations-add-button"
              >
                <Plus size={18} />
                <span>Add Donation</span>
              </Link>
            </div>

            {/* Filter Pills */}
            <div className="status-filter-bar">
              <button
                type="button"
                className={`filter-pill ${statusFilter === "ALL" ? "active" : ""}`}
                onClick={() => setStatusFilter("ALL")}
              >
                All ({donations.length})
              </button>
              <button
                type="button"
                className={`filter-pill ${statusFilter === "ACTIVE" ? "active" : ""}`}
                onClick={() => setStatusFilter("ACTIVE")}
              >
                Active Pipeline ({
                  donations.filter((d) =>
                    ["AVAILABLE", "REQUESTED", "ACCEPTED", "PICKED_UP", "IN_TRANSIT"].includes(d.status)
                  ).length
                })
              </button>
              <button
                type="button"
                className={`filter-pill ${statusFilter === "COMPLETED" ? "active" : ""}`}
                onClick={() => setStatusFilter("COMPLETED")}
              >
                Delivered / Completed ({
                  donations.filter((d) => ["DELIVERED", "COMPLETED"].includes(d.status)).length
                })
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <div className="dashboard-empty-card">
                <div className="food-spinner"></div>
                <h3>Loading your donations...</h3>
                <p>Fetching your donation history and active pickups.</p>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="dashboard-empty-card">
                <div className="empty-icon-wrap icon-danger">
                  <AlertCircle size={32} />
                </div>
                <h3>Unable to load donations</h3>
                <p>{error}</p>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && filteredDonations.length === 0 && (
              <div className="dashboard-empty-card">
                <div className="empty-icon-wrap">
                  <Package size={36} />
                </div>
                <h3>No donations found</h3>
                <p>
                  {statusFilter === "ALL"
                    ? "You haven't listed any surplus food yet."
                    : `No donations matching "${statusFilter.toLowerCase()}" filter.`}
                </p>
                <Link to="/donor/add-donation" className="btn btn-primary btn-sm">
                  <Plus size={16} />
                  <span>List New Donation</span>
                </Link>
              </div>
            )}

            {/* Donation List */}
            {!loading && !error && filteredDonations.length > 0 && (
              <section className="dashboard-section">
                <div className="donation-card-list">
                  {filteredDonations.map((donation) => (
                    <article
                      className="donation-listing-card"
                      key={donation.donation_id}
                    >
                      <div className="listing-card-header">
                        <div className="listing-card-title-group">
                          <div className="listing-card-icon">
                            <Utensils size={20} />
                          </div>
                          <div>
                            <div className="listing-card-eyebrow">
                              DONATION #{donation.donation_id}
                            </div>
                            <h3>{donation.food_type || "Surplus Food Donation"}</h3>
                            <p className="listing-card-desc">
                              {donation.description || "Fresh surplus prepared with care."}
                            </p>
                          </div>
                        </div>

                        <StatusBadge status={donation.status} />
                      </div>

                      {/* Items breakdown if present */}
                      {donation.items && donation.items.length > 0 && (
                        <div className="donation-items-badge-row">
                          <span className="items-row-label">
                            <Package size={13} /> {donation.items.length} item{donation.items.length > 1 ? "s" : ""}:
                          </span>
                          <div className="items-chip-list">
                            {donation.items.map((item, idx) => (
                              <span key={item.item_id || idx} className="item-portion-chip">
                                <strong>{item.food_item}</strong> · {item.quantity} {item.unit}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="listing-card-meta-grid">
                        <div className="meta-block">
                          <small>
                            <Scale size={13} /> Total Quantity
                          </small>
                          <strong>
                            {donation.quantity} {donation.unit}
                          </strong>
                        </div>

                        <div className="meta-block">
                          <small>
                            <MapPin size={13} /> Pickup Location
                          </small>
                          <strong>{donation.city || "Ahmedabad"}</strong>
                        </div>

                        <div className="meta-block">
                          <small>
                            <Calendar size={13} /> Best Before
                          </small>
                          <strong>
                            {donation.expiry_date
                              ? new Date(donation.expiry_date).toLocaleString([], {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })
                              : "Freshly prepared"}
                          </strong>
                        </div>
                      </div>

                      <div className="listing-card-footer">
                        <div className="footer-left-info">
                          <span className="status-indicator-dot"></span>
                          <span>
                            {donation.status === "AVAILABLE"
                              ? "Visible for NGO requests"
                              : donation.status === "COMPLETED"
                              ? "Delivered & verified by receiving shelter"
                              : "Rescue operation in progress"}
                          </span>
                        </div>

                        <Link
                          to={`/donor/donations/${donation.donation_id}`}
                          className="btn-view-listing"
                        >
                          <span>View Details & Timeline</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
        <Footer variant="app" />
      </main>
    </div>
  );
}

export default MyDonations;
