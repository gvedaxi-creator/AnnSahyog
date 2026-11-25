import { useEffect, useState } from "react";
import StatusBadge from "../../components/StatusBadge";
import { getPickupStatus } from "../../utils/status";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import { Link } from "react-router-dom";
import DonorSidebar from "../../components/DonorSidebar";
import { getDonorDonationHistory } from "../../services/api";
import {
  History,
  Building2,
  Bike,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

function DonationHistory() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.donor_id) {
        setError("Donor information is missing. Please login again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const data = await getDonorDonationHistory(user.donor_id);
        setDonations(data?.donations || []);
      } catch (err) {
        console.error("Donation history error:", err);
        setError(err.message || "Failed to load donation history.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user?.donor_id]);

  const getCurrentStatus = (donation) => {
    return (
      (donation.pickup_status && getPickupStatus(donation.pickup_status, donation.volunteer_name)) ||
      donation.donation_status ||
      donation.status ||
      "COMPLETED"
    );
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

            {/* Header */}
            <div className="dashboard-header">
              <div>
                <span className="dashboard-eyebrow">LIFECYCLE RECORDS</span>
                <h1>Donation History</h1>
                <p>
                  Comprehensive log of all completed and past food rescue missions.
                </p>
              </div>

              <div className="admin-stat-pills">
                <span className="pill-badge pill-total">
                  Total Completed Rescues: {donations.length}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="auth-alert alert-error" style={{ marginBottom: "1.5rem" }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="dashboard-empty-card">
                <div className="food-spinner"></div>
                <h3>Loading donation history...</h3>
                <p>Retrieving your lifetime community food rescue logs.</p>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && donations.length === 0 && (
              <div className="dashboard-empty-card">
                <div className="empty-icon-wrap">
                  <History size={36} />
                </div>
                <h3>No historical donations recorded</h3>
                <p>Completed food donations will be cataloged here with receiving NGO details.</p>
                <Link to="/donor/add-donation" className="btn btn-primary btn-sm">
                  Add a New Donation →
                </Link>
              </div>
            )}

            {/* History Table & Cards */}
            {!loading && !error && donations.length > 0 && (
              <section className="dashboard-section">
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Donation ID</th>
                        <th>Food Item</th>
                        <th>Quantity</th>
                        <th>Prepared On</th>
                        <th>Receiving NGO</th>
                        <th>Volunteer Courier</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donations.map((d) => {
                        const currentStatus = getCurrentStatus(d);
                        return (
                          <tr key={d.donation_id || d.pickup_id}>
                            <td className="table-mono">#{d.donation_id}</td>
                            <td>
                              <strong>{d.food_type || "Food Batch"}</strong>
                              <span className="table-sub">{d.city || "Ahmedabad"}</span>
                            </td>
                            <td>
                              <strong>
                                {d.quantity} {d.unit}
                              </strong>
                            </td>
                            <td>
                              <span className="table-sub">
                                {d.prepared_date
                                  ? new Date(d.prepared_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                                  : "-"}
                              </span>
                            </td>
                            <td>
                              <span className="table-ngo-cell">
                                <Building2 size={14} />
                                <span>{d.ngo_name || d.organization_name || "Community Center"}</span>
                              </span>
                            </td>
                            <td>
                              <span className="table-vol-cell">
                                <Bike size={14} />
                                <span>{d.volunteer_name || "Finding a driver"}</span>
                              </span>
                            </td>
                            <td>
                              <StatusBadge status={currentStatus} />
                            </td>
                            <td>
                              <Link
                                to={`/donor/donations/${d.donation_id}`}
                                className="table-action-link"
                              >
                                View <ArrowRight size={14} />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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

export default DonationHistory;
