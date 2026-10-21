import { useEffect, useState } from "react";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import NgoSidebar from "../../components/NgoSidebar";
import { getNgoProfile, updateNgoProfile } from "../../services/api";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
} from "lucide-react";

function NgoProfile() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    organization_name: "",
    registration_number: "",
    address: "",
    city: "",
  });

  const [verificationStatus, setVerificationStatus] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.ngo_id) return;
      try {
        setLoading(true);
        const data = await getNgoProfile(user.ngo_id);
        const p = data.profile || {};
        setFormData({
          name: p.name || "",
          email: p.email || "",
          phone: p.phone || "",
          organization_name: p.organization_name || "",
          registration_number: p.registration_number || "",
          address: p.address || "",
          city: p.city || "",
        });
        setVerificationStatus(p.verification_status || "PENDING");
      } catch (err) {
        console.error("Fetch profile error:", err);
        setError(err.message || "Failed to load NGO profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.ngo_id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.ngo_id) return;

    try {
      setSaving(true);
      setError("");
      setSuccessMsg("");

      await updateNgoProfile(user.ngo_id, {
        name: formData.name,
        phone: formData.phone,
        organization_name: formData.organization_name,
        registration_number: formData.registration_number,
        address: formData.address,
        city: formData.city,
      });

      // Update local storage user if org name changed
      const updatedUser = {
        ...user,
        name: formData.name,
        organization_name: formData.organization_name,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setSuccessMsg("Organization profile updated successfully!");
    } catch (err) {
      console.error("Save profile error:", err);
      setError(err.message || "Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

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
                  ORGANIZATION SETTINGS
                </span>
                <h1>NGO & Shelter Profile</h1>
                <p>
                  Manage verified organization credentials, authorized contact person, and delivery drop-off location.
                </p>
              </div>

              <div className="admin-stat-pills">
                <span
                  className={`pill-badge ${
                    verificationStatus === "ACTIVE"
                      ? "pill-active"
                      : verificationStatus === "PENDING"
                      ? "pill-pending"
                      : "pill-inactive"
                  }`}
                >
                  {verificationStatus === "ACTIVE" ? (
                    <>
                      <CheckCircle2 size={13} /> Active Partner
                    </>
                  ) : verificationStatus === "PENDING" ? (
                    <>
                      <Clock size={13} /> Verification Under Review
                    </>
                  ) : (
                    <>
                      <AlertCircle size={13} /> {verificationStatus === "DEACTIVE" ? "Account Deactivated" : "Verification Rejected"}
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div className="auth-alert alert-error" style={{ marginBottom: "1.5rem" }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="auth-alert alert-success" style={{ marginBottom: "1.5rem" }}>
                <CheckCircle2 size={18} />
                <span>{successMsg}</span>
              </div>
            )}

            {loading ? (
              <div className="dashboard-empty-card">
                <div className="food-spinner"></div>
                <h3>Loading NGO profile...</h3>
                <p>Retrieving organization records.</p>
              </div>
            ) : (
              <div className="profile-container-grid">
                {/* Left NGO Summary */}
                <div className="profile-summary-card">
                  <div className="profile-avatar-large ngo-avatar">
                    {formData.organization_name?.charAt(0)?.toUpperCase() || "N"}
                  </div>
                  <h3>{formData.organization_name || "Partner NGO"}</h3>
                  <span className="profile-role-tag">
                    <Building2 size={14} /> Receiving Organization
                  </span>
                  <p className="profile-email-sub">{formData.email}</p>

                  <div className="profile-stats-mini">
                    <div className="mini-stat">
                      <small>City Zone</small>
                      <strong>{formData.city || "Ahmedabad"}</strong>
                    </div>
                    <div className="mini-stat">
                      <small>Darpan / Reg ID</small>
                      <strong className="text-mono">{formData.registration_number || "—"}</strong>
                    </div>
                  </div>
                </div>

                {/* Right Form Card */}
                <div className="profile-form-card">
                  <div className="form-card-header">
                    <h3>Organization & Delivery Address</h3>
                    <p>Accurate address details ensure volunteer drivers navigate directly to your kitchen.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-grid">
                      <div className="form-field">
                        <label>
                          Organization / Shelter Name <span className="req-star">*</span>
                        </label>
                        <div className="input-with-icon">
                          <Building2 size={16} className="input-icon" />
                          <input
                            type="text"
                            name="organization_name"
                            value={formData.organization_name}
                            onChange={handleChange}
                            placeholder="e.g. Aashray Food Shelter"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-field">
                        <label>
                          Primary Contact Person <span className="req-star">*</span>
                        </label>
                        <div className="input-with-icon">
                          <User size={16} className="input-icon" />
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Full name of representative"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-field">
                        <label>Email Address</label>
                        <div className="input-with-icon">
                          <Mail size={16} className="input-icon" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            disabled
                            className="input-disabled"
                            title="Email cannot be modified"
                          />
                        </div>
                      </div>

                      <div className="form-field">
                        <label>
                          Contact Helpline / Phone <span className="req-star">*</span>
                        </label>
                        <div className="input-with-icon">
                          <Phone size={16} className="input-icon" />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-field">
                        <label>NGO Registration / Darpan ID</label>
                        <div className="input-with-icon">
                          <FileCheck size={16} className="input-icon" />
                          <input
                            type="text"
                            name="registration_number"
                            value={formData.registration_number}
                            onChange={handleChange}
                            placeholder="e.g. GJ/2024/0019283"
                          />
                        </div>
                      </div>

                      <div className="form-field">
                        <label>
                          City <span className="req-star">*</span>
                        </label>
                        <div className="input-with-icon">
                          <MapPin size={16} className="input-icon" />
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="e.g. Ahmedabad"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-field full-width">
                        <label>
                          Full Delivery / Drop-off Address <span className="req-star">*</span>
                        </label>
                        <textarea
                          name="address"
                          rows="3"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Shelter gate, building name, road, landmark for delivery drivers"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-actions profile-actions">
                      <button
                        type="submit"
                        className="btn btn-primary btn-save-profile"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <div className="btn-spinner"></div>
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            <span>Save Profile Changes</span>
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

export default NgoProfile;
