import { useEffect, useState } from "react";
import VolunteerSidebar from "../../components/VolunteerSidebar";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import { getVolunteerProfile, updateVolunteerProfile, updateVolunteerAvailability } from "../../services/api";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  Power,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function VolunteerProfile() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    availability: "AVAILABLE",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.volunteer_id) return;
      try {
        setLoading(true);
        const res = await getVolunteerProfile(user.volunteer_id);
        const p = res.profile;
        setFormData({
          name: p.name || "",
          email: p.email || "",
          phone: p.phone || "",
          city: p.city || "Ahmedabad",
          address: p.address || "",
          availability: p.availability || "AVAILABLE",
        });
      } catch (err) {
        console.error("Profile load error:", err);
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.volunteer_id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await updateVolunteerProfile(user.volunteer_id, {
        name: formData.name,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
      });

      // Update local storage
      user.name = formData.name;
      user.city = formData.city;
      localStorage.setItem("user", JSON.stringify(user));

      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error("Update profile error:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDuty = async () => {
    const newStatus = formData.availability === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
    try {
      await updateVolunteerAvailability(user.volunteer_id, newStatus);
      setFormData({ ...formData, availability: newStatus });
      user.availability = newStatus;
      localStorage.setItem("user", JSON.stringify(user));
      setSuccess(`Rescue duty status changed to ${newStatus === "AVAILABLE" ? "On Duty" : "Off Duty"}`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      alert(err.message || "Failed to update duty status");
    }
  };

  return (
    <div className="donor-layout vol-layout">
      <VolunteerSidebar currentAvailability={formData.availability} onAvailabilityChange={(s) => setFormData({ ...formData, availability: s })} />

      <main className="donor-main vol-main">
        <div className="vol-content">
          <div className="page-back-bar">
            <BackButton />
          </div>

          <div className="vol-page-header">
            <div className="vol-header-top">
              <div>
                <span className="dashboard-eyebrow">COURIER HERO ACCOUNT</span>
                <h1>Volunteer Profile & Settings</h1>
                <p>Manage your contact details, operational area, and duty availability preferences.</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="vol-alert vol-alert-error" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={16} /> <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="vol-alert vol-alert-success" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 size={16} /> <span>{success}</span>
            </div>
          )}

          {loading ? (
            <div className="vol-loading" style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
              Loading profile...
            </div>
          ) : (
            <div className="vol-profile-grid" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.5rem", marginTop: "1rem" }}>
              {/* PROFILE SUMMARY HERO CARD */}
              <div className="vol-profile-summary-card" style={{ background: "#fff", borderRadius: "14px", padding: "1.75rem", border: "1px solid var(--sand-2)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <div className="summary-avatar-large" style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg, var(--moss), #1e5222)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", fontWeight: "800", marginBottom: "1rem", boxShadow: "0 6px 16px rgba(46, 125, 50, 0.25)" }}>
                  {formData.name
                    ? formData.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "V"}
                </div>
                <h2 className="summary-name" style={{ fontSize: "1.3rem", fontWeight: "800", color: "var(--ink)", marginBottom: "0.25rem" }}>{formData.name}</h2>
                <span className="summary-role-tag" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", color: "var(--moss)", fontWeight: "700", background: "var(--sand-1)", padding: "0.3rem 0.75rem", borderRadius: "20px", marginBottom: "0.5rem" }}>
                  <Award size={14} /> AnnSahyog Courier Hero
                </span>
                <p className="summary-city" style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", color: "var(--muted)", marginBottom: "1.5rem" }}>
                  <MapPin size={14} /> Operating in {formData.city || "Ahmedabad"}
                </p>

                <div className="summary-duty-box" style={{ width: "100%", background: "var(--sand-1)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
                  <div className="duty-box-title" style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", fontWeight: "700", marginBottom: "0.5rem" }}>
                    Duty Status
                  </div>
                  <div className={`duty-pill ${formData.availability === "AVAILABLE" ? "pill-on" : "pill-off"}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.85rem", borderRadius: "20px", fontSize: "0.82rem", fontWeight: "700", background: formData.availability === "AVAILABLE" ? "rgba(46, 125, 50, 0.15)" : "rgba(229, 57, 53, 0.15)", color: formData.availability === "AVAILABLE" ? "var(--moss)" : "var(--error)", marginBottom: "0.75rem" }}>
                    <span className="duty-dot" style={{ width: "8px", height: "8px", borderRadius: "50%", background: formData.availability === "AVAILABLE" ? "var(--moss)" : "var(--error)", display: "inline-block" }}></span>
                    {formData.availability === "AVAILABLE" ? "Active (On Duty)" : "Taking a Break (Off Duty)"}
                  </div>
                  <div>
                    <button onClick={handleToggleDuty} className="btn-duty-switch" style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.55rem 1rem", borderRadius: "8px", border: "1px solid var(--sand-3)", background: "#fff", color: "var(--ink)", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s" }}>
                      <Power size={14} />
                      {formData.availability === "AVAILABLE" ? "Switch Off Duty" : "Switch On Duty"}
                    </button>
                  </div>
                </div>

                <div className="summary-stats-mini" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", width: "100%" }}>
                  <div className="mini-stat" style={{ background: "#fff", border: "1px solid var(--sand-2)", borderRadius: "10px", padding: "0.75rem" }}>
                    <span className="mini-num" style={{ display: "block", fontSize: "0.95rem", fontWeight: "800", color: "var(--moss)" }}>Active</span>
                    <span className="mini-label" style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase" }}>Status</span>
                  </div>
                  <div className="mini-stat" style={{ background: "#fff", border: "1px solid var(--sand-2)", borderRadius: "10px", padding: "0.75rem" }}>
                    <span className="mini-num" style={{ display: "block", fontSize: "0.95rem", fontWeight: "800", color: "var(--orange)" }}>Verified</span>
                    <span className="mini-label" style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase" }}>Level</span>
                  </div>
                </div>
              </div>

              {/* EDIT PROFILE FORM */}
              <div className="vol-profile-form-card" style={{ background: "#fff", borderRadius: "14px", padding: "1.75rem", border: "1px solid var(--sand-2)" }}>
                <div className="form-card-header" style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--sand-2)", paddingBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--ink)" }}>Edit Personal Information</h3>
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>Keep your contact details up-to-date so donors and shelters can coordinate with you smoothly.</p>
                </div>

                <form onSubmit={handleSubmit} className="vol-form">
                  <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                    <div className="form-field">
                      <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.4rem" }}>
                        <User size={14} /> Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Your full name"
                        style={{ width: "100%", padding: "0.7rem 0.9rem", borderRadius: "8px", border: "1px solid var(--sand-3)", fontSize: "0.9rem" }}
                      />
                    </div>

                    <div className="form-field">
                      <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.4rem" }}>
                        <Mail size={14} /> Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        disabled
                        title="Email cannot be modified"
                        className="input-disabled"
                        style={{ width: "100%", padding: "0.7rem 0.9rem", borderRadius: "8px", border: "1px solid var(--sand-3)", fontSize: "0.9rem", background: "var(--sand-1)", color: "var(--muted)", cursor: "not-allowed" }}
                      />
                      <small className="field-hint" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem", display: "block" }}>Email is linked to your login credentials.</small>
                    </div>

                    <div className="form-field">
                      <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.4rem" }}>
                        <Phone size={14} /> Contact Phone *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="+91 98765 43210"
                        style={{ width: "100%", padding: "0.7rem 0.9rem", borderRadius: "8px", border: "1px solid var(--sand-3)", fontSize: "0.9rem" }}
                      />
                    </div>

                    <div className="form-field">
                      <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.4rem" }}>
                        <MapPin size={14} /> Primary City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Ahmedabad"
                        style={{ width: "100%", padding: "0.7rem 0.9rem", borderRadius: "8px", border: "1px solid var(--sand-3)", fontSize: "0.9rem" }}
                      />
                    </div>

                    <div className="form-field" style={{ gridColumn: "1 / -1" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.4rem" }}>
                        <MapPin size={14} /> Base Address / Hub Area *
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        placeholder="Neighborhood, Landmark, Street"
                        style={{ width: "100%", padding: "0.7rem 0.9rem", borderRadius: "8px", border: "1px solid var(--sand-3)", fontSize: "0.9rem" }}
                      />
                      <small className="field-hint" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem", display: "block" }}>Used to prioritize and calculate nearby rescue pickups.</small>
                    </div>
                  </div>

                  <div className="form-actions" style={{ marginTop: "1.75rem", display: "flex", justifyContent: "flex-end" }}>
                    <button type="submit" disabled={saving} className="btn-save-profile" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", background: "var(--moss)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "0.9rem", cursor: saving ? "not-allowed" : "pointer" }}>
                      <CheckCircle2 size={16} />
                      {saving ? "Saving Changes..." : "Save Profile Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
        <Footer variant="app" />
      </main>
    </div>
  );
}

export default VolunteerProfile;
