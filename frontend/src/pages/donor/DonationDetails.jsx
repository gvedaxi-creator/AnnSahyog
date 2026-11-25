import { useEffect, useState } from "react";
import StatusBadge from "../../components/StatusBadge";
import DonationTimeline from "../../components/DonationTimeline";
import Footer from "../../components/Footer";
import { Link, useParams } from "react-router-dom";
import DonorSidebar from "../../components/DonorSidebar";
import { getDonationById } from "../../services/api";
import {
  ArrowLeft,
  Utensils,
  Scale,
  Clock,
  MapPin,
  Package,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

function DonationDetails() {
  const { donationId } = useParams();

  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        setLoading(true);
        const data = await getDonationById(donationId);
        setDonation(data.donation);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load donation details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDonation();
  }, [donationId]);

  const formatDate = (date) => {
    if (!date) return "Not specified";
    return new Date(date).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };


  return (
    <div className="donor-layout">
      <DonorSidebar />

      <main className="donor-main">
        <div className="dashboard-page">
          <div className="container">
            {/* Back link */}
            <div className="admin-back-bar">
              <Link to="/donor/donations" className="admin-back-link">
                <ArrowLeft size={16} />
                <span>Back to My Donations</span>
              </Link>
            </div>

            {loading && (
              <div className="dashboard-empty-card">
                <div className="food-spinner"></div>
                <h3>Loading donation details...</h3>
                <p>Retrieving surplus batch records and delivery tracking.</p>
              </div>
            )}

            {!loading && error && (
              <div className="dashboard-empty-card">
                <div className="empty-icon-wrap icon-danger">
                  <AlertCircle size={32} />
                </div>
                <h3>Donation not found</h3>
                <p>{error}</p>
                <Link to="/donor/donations" className="btn btn-primary btn-sm">
                  Back to Donations
                </Link>
              </div>
            )}

            {!loading && !error && donation && (
              <div className="donation-detail-wrapper">
                {/* HERO HEADER */}
                <div className="detail-hero-card">
                  <div className="detail-hero-top">
                    <div>
                      <span className="hero-eyebrow">
                        DONATION #{donation.donation_id} · RESCUE TRACKER
                      </span>
                      <h1 className="hero-food-title">
                        {donation.food_type || "Surplus Food Donation"}
                      </h1>
                      <p className="hero-desc">
                        {donation.description || "Fresh food prepared with care and made available for community redistribution."}
                      </p>
                    </div>

                    <StatusBadge status={donation.status} />
                  </div>

                  <div className="hero-meta-badges">
                    <span className="meta-badge">
                      <Scale size={13} /> {donation.quantity} {donation.unit}
                    </span>
                    <span className="meta-badge">
                      <MapPin size={13} /> {donation.city || "Ahmedabad"}
                    </span>
                    <span className="meta-badge">
                      <Clock size={13} /> Best Before: {formatDate(donation.expiry_date)}
                    </span>
                  </div>
                </div>

                {/* 2-COLUMN DETAILS */}
                <DonationTimeline status={donation.status} />

                <div className="detail-two-col">
                  {/* FOOD SPECIFICATION CARD */}
                  <div className="detail-card">
                    <div className="detail-card-header">
                      <h3>
                        <Utensils size={18} /> Food & Preparation Details
                      </h3>
                    </div>
                    <div className="detail-card-body">
                      <div className="detail-row">
                        <span className="row-label">Category / Type:</span>
                        <strong className="row-val">{donation.food_type}</strong>
                      </div>
                      <div className="detail-row">
                        <span className="row-label">Total Portions / Weight:</span>
                        <strong className="row-val">{donation.quantity} {donation.unit}</strong>
                      </div>
                      <div className="detail-row">
                        <span className="row-label">Prepared Date & Time:</span>
                        <span className="row-val">{formatDate(donation.prepared_date)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="row-label">Expiry / Best Before:</span>
                        <span className="row-val text-warning">{formatDate(donation.expiry_date)}</span>
                      </div>

                      {/* Items List */}
                      {donation.items && donation.items.length > 0 && (
                        <div className="detail-sub-section">
                          <h4 className="sub-section-title">
                            <Package size={14} /> Itemized Portion Breakdown ({donation.items.length})
                          </h4>
                          <div className="detail-items-table-wrap">
                            <table className="mini-detail-table">
                              <thead>
                                <tr>
                                  <th>Item Name</th>
                                  <th>Portion</th>
                                </tr>
                              </thead>
                              <tbody>
                                {donation.items.map((item, idx) => (
                                  <tr key={item.item_id || idx}>
                                    <td>
                                      <strong>{item.food_item}</strong>
                                    </td>
                                    <td>
                                      {item.quantity} {item.unit}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PICKUP & LOGISTICS CARD */}
                  <div className="detail-card">
                    <div className="detail-card-header">
                      <h3>
                        <MapPin size={18} /> Pickup & Dispatch Location
                      </h3>
                    </div>
                    <div className="detail-card-body">
                      <div className="detail-row">
                        <span className="row-label">Pickup Address:</span>
                        <strong className="row-val text-address">
                          {donation.pickup_address || "Address provided at listing"}
                        </strong>
                      </div>
                      <div className="detail-row">
                        <span className="row-label">City Zone:</span>
                        <span className="row-val">{donation.city || "Ahmedabad"}</span>
                      </div>
                      {donation.latitude && donation.longitude && (
                        <div className="detail-row">
                          <span className="row-label">GPS Coordinates:</span>
                          <span className="row-val mono-val">
                            {Number(donation.latitude).toFixed(4)}, {Number(donation.longitude).toFixed(4)}
                          </span>
                        </div>
                      )}

                      <div className="action-hint-box hint-green">
                        <ShieldCheck size={16} />
                        <div>
                          <strong>Safety & Packaging Protocol:</strong>
                          <p>
                            Food must be sealed in clean food-grade containers before volunteer pickup to ensure hygiene and temperature stability.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
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

export default DonationDetails;
