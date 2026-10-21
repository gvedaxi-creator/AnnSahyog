import { useEffect, useState } from "react";
import {
  Utensils,
  HeartHandshake,
  Truck,
  Settings2,
  Check,
  ArrowLeft,
} from "lucide-react";
import { getStatusLabel, getPickupStatus } from "../../utils/status";
import StatusBadge from "../../components/StatusBadge";
import DonationTimeline from "../../components/DonationTimeline";
import Footer from "../../components/Footer";
import { Link, useParams } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import {
  getAdminDonationById,
  updateAdminDonationStatus,
} from "../../services/api";

function AdminDonationDetails() {
  const { id } = useParams();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const data = await getAdminDonationById(id);
      setDonation(data.donation || null);
    } catch (err) {
      console.error("Donation fetch error:", err);
      setError(err.message || "Failed to load donation details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`Change donation #${id} status to ${newStatus}?`)) {
      return;
    }

    try {
      setUpdating(true);
      setError("");
      setSuccessMsg("");
      await updateAdminDonationStatus(id, newStatus);
      setSuccessMsg(`Status successfully changed to ${newStatus}.`);
      setDonation((prev) => (prev ? { ...prev, status: newStatus } : prev));
    } catch (err) {
      console.error("Status update error:", err);
      setError(err.message || "Failed to update donation status.");
    } finally {
      setUpdating(false);
    }
  };


  return (
    <div className="donor-layout admin-layout">
      <AdminSidebar />

      <main className="donor-main admin-main">
        <div className="dashboard-page admin-dashboard-page">
          <div className="container">
            {/* Navigation back */}
            <div className="admin-back-bar">
              <Link to="/admin/donations" className="admin-back-link">
                <ArrowLeft size={16} />
                <span>Back to All Donations</span>
              </Link>
            </div>

            {loading ? (
              <div className="admin-loading-state">
                <p>Loading donation details...</p>
              </div>
            ) : error ? (
              <div className="form-error">{error}</div>
            ) : !donation ? (
              <div className="admin-empty-state">
                <h3>Donation not found</h3>
                <p>The requested donation ID does not exist.</p>
                <Link to="/admin/donations" className="btn btn-primary">
                  Return to Donations
                </Link>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="dashboard-header admin-header">
                  <div>
                    <span className="dashboard-eyebrow admin-eyebrow">
                      DONATION #{donation.donation_id}
                    </span>
                    <h1>{donation.food_type}</h1>
                    <p>
                      Created on{" "}
                      {new Date(donation.created_at).toLocaleDateString()} • City:{" "}
                      {donation.city || "Not specified"}
                    </p>
                  </div>

                  <div className="admin-status-wrap">
                    <StatusBadge status={donation.status} />
                  </div>
                </div>

                {successMsg && <div className="form-success">{successMsg}</div>}

                <DonationTimeline status={donation.status} title="Donation lifecycle" />

                {/* Grid layout */}
                <div className="admin-details-grid">
                  {/* Left Column: Food Information */}
                  <div className="admin-detail-card">
                    <h3><Utensils size={18} /> Food Details</h3>
                    <div className="detail-row">
                      <label>Food Item</label>
                      <span>{donation.food_type}</span>
                    </div>
                    <div className="detail-row">
                      <label>Quantity</label>
                      <span>
                        <strong>
                          {donation.quantity} {donation.unit}
                        </strong>
                      </span>
                    </div>
                    <div className="detail-row">
                      <label>Prepared Date</label>
                      <span>
                        {donation.prepared_date
                          ? new Date(donation.prepared_date).toLocaleDateString()
                          : "Not recorded"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <label>Expiry Date</label>
                      <span className="text-warning">
                        {donation.expiry_date
                          ? new Date(donation.expiry_date).toLocaleDateString()
                          : "Not specified"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <label>Description</label>
                      <p className="detail-description">
                        {donation.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Donor & Location */}
                  <div className="admin-detail-card">
                    <h3><HeartHandshake size={18} /> Donor Information</h3>
                    <div className="detail-row">
                      <label>Donor Name</label>
                      <span>{donation.donor_name}</span>
                    </div>
                    <div className="detail-row">
                      <label>Email</label>
                      <span>{donation.donor_email}</span>
                    </div>
                    <div className="detail-row">
                      <label>Phone</label>
                      <span>{donation.donor_phone || "Not provided"}</span>
                    </div>
                    <div className="detail-row">
                      <label>Pickup Address</label>
                      <span>{donation.pickup_address}</span>
                    </div>
                    <div className="detail-row">
                      <label>City</label>
                      <span>{donation.city || "—"}</span>
                    </div>
                  </div>

                  {/* Logistics Section */}
                  <div className="admin-detail-card">
                    <h3><Truck size={18} /> Pickup & Delivery Tracking</h3>
                    {donation.pickup_id ? (
                      <>
                        <div className="detail-row">
                          <label>Pickup ID</label>
                          <span className="table-mono">
                            #{donation.pickup_id}
                          </span>
                        </div>
                        <div className="detail-row">
                          <label>Logistics Status</label>
                          <StatusBadge status={getPickupStatus(donation.pickup_status, donation.volunteer_name)} />
                        </div>
                        <div className="detail-row">
                          <label>Assigned Volunteer</label>
                          <span>
                            {donation.volunteer_name || "Unassigned"}
                          </span>
                        </div>
                        <div className="detail-row">
                          <label>Volunteer Phone</label>
                          <span>
                            {donation.volunteer_phone || "—"}
                          </span>
                        </div>
                        <div className="detail-row">
                          <label>Pickup Time</label>
                          <span>
                            {donation.pickup_timestamp
                              ? new Date(
                                  donation.pickup_timestamp
                                ).toLocaleString()
                              : "Pending pickup"}
                          </span>
                        </div>
                        <div className="detail-row">
                          <label>Delivery Time</label>
                          <span>
                            {donation.delivery_timestamp
                              ? new Date(
                                  donation.delivery_timestamp
                                ).toLocaleString()
                              : "Pending delivery"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="admin-empty-text">
                        No volunteer or delivery run has been assigned to this
                        donation yet.
                      </p>
                    )}
                  </div>

                  {/* Administrative Moderation */}
                  <div className="admin-detail-card admin-moderation-card">
                    <h3><Settings2 size={18} /> Administrative Controls</h3>
                    <p className="admin-control-hint">
                      Force-update the status of this donation to reflect field
                      conditions or emergency cancellations.
                    </p>

                    <div className="status-button-grid">
                      {[
                        "AVAILABLE",
                        "REQUESTED",
                        "ACCEPTED",
                        "PICKED_UP",
                        "DELIVERED",
                        "CANCELLED",
                      ].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleStatusChange(st)}
                          disabled={updating || donation.status === st}
                          className={`btn-status-option ${
                            donation.status === st ? "active-status" : ""
                          }`}
                        >
                          {st === donation.status && <Check size={13} />}
                          {getStatusLabel(st)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <Footer variant="app" />
      </main>
    </div>
  );
}

export default AdminDonationDetails;
