import { useEffect, useState } from "react";
import {
  Search,
  X,
  Bike,
  MapPin,
  ArrowDown,
  Building2,
  AlertTriangle,
} from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import { getPickupStatus } from "../../utils/status";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import { Link } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import {
  getAdminPickups,
  getAdminPendingPickups,
  getAdminVolunteers,
  assignVolunteerToDonation,
} from "../../services/api";

// "45 min", "1 h 20 min", "2 days"
function formatDuration(totalMinutes) {
  const minutes = Math.max(0, Math.round(totalMinutes));
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 24 * 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }
  const days = Math.round(minutes / (24 * 60));
  return `${days} day${days === 1 ? "" : "s"}`;
}

// Time since the donor approved the NGO's request
function formatWaiting(since) {
  if (!since) return "—";
  return formatDuration((Date.now() - new Date(since).getTime()) / 60000);
}

// Pickup deadline (the donation's best-before time) and how close it is
function PickupDeadline({ pickup }) {
  if (!pickup.pickup_deadline) return <span className="table-sub">No time set</span>;

  const minutesLeft = pickup.minutes_to_deadline;
  const overdue = minutesLeft < 0;

  return (
    <>
      <div>
        {new Date(pickup.pickup_deadline).toLocaleString([], {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </div>
      <span className={`table-sub ${pickup.needs_admin ? "text-danger" : ""}`}>
        {overdue ? `Overdue by ${formatDuration(-minutesLeft)}` : `in ${formatDuration(minutesLeft)}`}
      </span>
      {pickup.needs_admin && (
        <div>
          <StatusBadge status={overdue ? "OVERDUE" : "URGENT"} />
        </div>
      )}
    </>
  );
}

// Volunteer dropdown + Assign button. Used for new assignments and for
// reassigning a pickup that hasn't been collected yet.
function AssignVolunteerControl({ donationId, currentVolunteerId, volunteers, busy, onAssign }) {
  const [selected, setSelected] = useState(currentVolunteerId ? String(currentVolunteerId) : "");

  const unchanged = !selected || selected === String(currentVolunteerId || "");

  return (
    <div className="table-actions-group">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="admin-select"
        aria-label="Choose volunteer"
        disabled={busy}
      >
        <option value="">Choose volunteer…</option>
        {volunteers.map((v) => (
          <option key={v.volunteer_id} value={v.volunteer_id}>
            {v.name}{v.city ? ` (${v.city})` : ""}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn btn-primary btn-sm"
        disabled={busy || unchanged}
        onClick={() => onAssign(donationId, selected)}
      >
        {busy ? "Saving…" : currentVolunteerId ? "Reassign" : "Assign"}
      </button>
    </div>
  );
}

function AdminPickups() {
  const [pickups, setPickups] = useState([]);
  const [pending, setPending] = useState([]);
  const [alertHours, setAlertHours] = useState(2);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [assigningId, setAssigningId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchPickups = async () => {
    try {
      setLoading(true);
      const [pickupData, pendingData, volunteerData] = await Promise.all([
        getAdminPickups(),
        getAdminPendingPickups(),
        getAdminVolunteers(),
      ]);
      setPickups(pickupData.pickups || []);
      setPending(pendingData.pending || []);
      setAlertHours(pendingData.alert_hours || 2);
      setVolunteers(
        (volunteerData.volunteers || []).filter((v) => v.availability === "AVAILABLE")
      );
    } catch (err) {
      console.error("Fetch pickups error:", err);
      setError(err.message || "Failed to load pickups.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups();
  }, []);

  const handleAssign = async (donationId, volunteerId) => {
    try {
      setError("");
      setSuccess("");
      setAssigningId(donationId);
      const data = await assignVolunteerToDonation(donationId, volunteerId);
      setSuccess(data.message);
      await fetchPickups();
    } catch (err) {
      setError(err.message || "Failed to assign volunteer.");
    } finally {
      setAssigningId(null);
    }
  };


  const filteredPickups = pickups.filter((p) => {
    const matchesStatus =
      statusFilter === "ALL" || p.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      p.food_type?.toLowerCase().includes(q) ||
      p.donor_name?.toLowerCase().includes(q) ||
      p.volunteer_name?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q) ||
      String(p.pickup_id).includes(q);

    return matchesStatus && matchesSearch;
  });

  const urgentCount = pending.filter((d) => d.needs_admin).length;

  const assignedCount = pickups.filter((p) => p.status === "ASSIGNED").length;
  const inTransitCount = pickups.filter((p) =>
    ["PICKED_UP", "IN_TRANSIT"].includes(p.status)
  ).length;
  const deliveredCount = pickups.filter((p) => p.status === "DELIVERED").length;

  return (
    <div className="donor-layout admin-layout">
      <AdminSidebar />

      <main className="donor-main admin-main">
        <div className="dashboard-page admin-dashboard-page admin-pickups-page">
          <div className="container">
            <div className="page-back-bar">
              <BackButton />
            </div>

            {/* Header */}
            <div className="dashboard-header admin-header">
              <div>
                <span className="dashboard-eyebrow admin-eyebrow">
                  LOGISTICS & OPERATIONS
                </span>
                <h1>Pickups & Delivery Tracking</h1>
                <p>
                  Assign volunteer couriers to approved donations and track
                  every run through to drop-off.
                </p>
              </div>

              <div className="admin-stat-pills">
                <span className="pill-badge pill-total">Total: {pickups.length}</span>
                <span className="pill-badge pill-active">
                  Assigned: {assignedCount}
                </span>
                <span className="pill-badge pill-pending">
                  In Transit: {inTransitCount}
                </span>
                <span className="pill-badge pill-completed">
                  Delivered: {deliveredCount}
                </span>
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}

            {/* Alert: nobody accepted, and pickup time is close */}
            {!loading && urgentCount > 0 && (
              <div className="form-error" role="alert">
                <AlertTriangle size={18} aria-hidden="true" />
                <span>
                  <strong>
                    {urgentCount} pickup{urgentCount === 1 ? "" : "s"} need{urgentCount === 1 ? "s" : ""} a volunteer now.
                  </strong>{" "}
                  No volunteer accepted {urgentCount === 1 ? "it" : "them"} and the pickup time is
                  within {alertHours} hours (or has passed). Assign a volunteer below.
                </span>
              </div>
            )}

            {/* Awaiting a volunteer */}
            {!loading && (
              <div className="admin-card-section">
                <div className="section-heading-row">
                  <div>
                    <span className="dashboard-eyebrow">NEEDS ACTION</span>
                    <h2>Awaiting a Volunteer ({pending.length})</h2>
                    <p className="table-sub">
                      Volunteers nearby can accept these themselves. If nobody has accepted within {alertHours} hours of the pickup time, assign one here.
                    </p>
                  </div>
                </div>

                {pending.length === 0 ? (
                  <div className="dashboard-empty-card">
                    <p>Every approved donation has a volunteer.</p>
                  </div>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Food / Donation</th>
                          <th>Donor</th>
                          <th>Locations</th>
                          <th>Pickup By</th>
                          <th>Unclaimed For</th>
                          <th>Assign Volunteer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pending.map((d) => (
                          <tr key={d.donation_id} className={d.needs_admin ? "row-urgent" : ""}>
                            <td>
                              <strong>{d.food_type}</strong>
                              <span className="table-sub">
                                {d.quantity} {d.unit} • Donation #{d.donation_id}
                              </span>
                            </td>
                            <td>
                              <div>{d.donor_name}</div>
                              <span className="table-sub">{d.donor_phone || "No phone"}</span>
                            </td>
                            <td>
                              <div className="location-flow">
                                <span className="loc-point">
                                  <MapPin size={13} aria-hidden="true" /> <span>{[d.pickup_address, d.city].filter(Boolean).join(", ")}</span>
                                </span>
                                <span className="loc-arrow" aria-hidden="true"><ArrowDown size={12} /></span>
                                <span className="loc-point">
                                  <Building2 size={13} aria-hidden="true" /> <span>{d.ngo_name}</span>
                                </span>
                              </div>
                            </td>
                            <td className="table-date">
                              <PickupDeadline pickup={d} />
                            </td>
                            <td className="table-date">
                              {formatWaiting(d.waiting_since)}
                            </td>
                            <td>
                              {volunteers.length === 0 ? (
                                <span className="table-sub">No volunteers available</span>
                              ) : (
                                <AssignVolunteerControl
                                  donationId={d.donation_id}
                                  volunteers={volunteers}
                                  busy={assigningId === d.donation_id}
                                  onAssign={handleAssign}
                                />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Toolbar */}
            <div className="admin-toolbar">
              <div className="admin-search-wrap">
                <Search size={16} className="search-icon" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search by food, donor, volunteer, city, or ID..."
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
                  <label>Delivery Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="admin-select"
                  >
                    <option value="ALL">All Status</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="PICKED_UP">Picked Up</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="DELIVERED">Delivered</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Content Table */}
            <div className="admin-card-section">
              {loading ? (
                <div className="admin-loading-state">
                  <p>Loading logistics data...</p>
                </div>
              ) : filteredPickups.length === 0 ? (
                <div className="admin-empty-state">
                  <div className="empty-icon"><Bike size={26} /></div>
                  <h3>No delivery runs found</h3>
                  <p>
                    {searchQuery || statusFilter !== "ALL"
                      ? "Try altering your search or status filter."
                      : "No active or past pickups exist yet."}
                  </p>
                </div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Pickup ID</th>
                        <th>Food / Donation</th>
                        <th>Donor</th>
                        <th>Volunteer Courier</th>
                        <th>Locations</th>
                        <th>Timestamps</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPickups.map((p) => (
                        <tr key={p.pickup_id}>
                          <td className="table-mono">#{p.pickup_id}</td>
                          <td>
                            <strong>{p.food_type}</strong>
                            <span className="table-sub">
                              {p.quantity} {p.unit} • Donation #{p.donation_id}
                            </span>
                          </td>
                          <td>
                            <div>{p.donor_name}</div>
                            <span className="table-sub">
                              {p.donor_phone || "No phone"}
                            </span>
                          </td>
                          <td>
                            <div>{p.volunteer_name || "Unassigned"}</div>
                            <span className="table-sub">
                              {p.volunteer_phone || "—"}
                            </span>
                          </td>
                          <td>
                            <div className="location-flow">
                              <span className="loc-point">
                                <MapPin size={13} aria-hidden="true" /> <span>{p.pickup_location || p.pickup_address}</span>
                              </span>
                              <span className="loc-arrow" aria-hidden="true"><ArrowDown size={12} /></span>
                              <span className="loc-point">
                                <Building2 size={13} aria-hidden="true" /> <span>{p.delivery_location || "NGO Center"}</span>
                              </span>
                            </div>
                          </td>
                          <td className="table-date">
                            {p.pickup_timestamp && (
                              <div>
                                Picked:{" "}
                                {new Date(p.pickup_timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            )}
                            {p.delivery_timestamp && (
                              <div className="text-success">
                                Drop:{" "}
                                {new Date(
                                  p.delivery_timestamp
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            )}
                            {!p.pickup_timestamp && !p.delivery_timestamp && "Pending"}
                          </td>
                          <td>
                            <StatusBadge status={getPickupStatus(p.status, p.volunteer_id)} />
                          </td>
                          <td>
                            {p.status === "ASSIGNED" && volunteers.length > 0 && (
                              <AssignVolunteerControl
                                key={`${p.pickup_id}-${p.volunteer_id}`}
                                donationId={p.donation_id}
                                currentVolunteerId={p.volunteer_id}
                                volunteers={volunteers}
                                busy={assigningId === p.donation_id}
                                onAssign={handleAssign}
                              />
                            )}
                            <Link
                              to={`/admin/donations/${p.donation_id}`}
                              className="table-action-link"
                            >
                              Inspect →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
        <Footer variant="app" />
      </main>
    </div>
  );
}

export default AdminPickups;
