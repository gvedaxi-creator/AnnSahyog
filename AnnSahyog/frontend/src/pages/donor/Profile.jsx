import { useEffect, useState } from "react";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import DonorSidebar from "../../components/DonorSidebar";
import { getDonorProfile, updateDonorProfile } from "../../services/api";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Save,
  CheckCircle2,
  AlertCircle,
  HeartHandshake,
} from "lucide-react";

function Profile() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const donorId = user?.donor_id;

  const [profile, setProfile] = useState({
    organization_name: "",
    address: "",
    city: "",
    latitude: "",
    longitude: "",
    name: "",
    email: "",
    phone: "",
    role: "",
    status: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!donorId) {
        setError("Donor information is missing. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const data = await getDonorProfile(donorId);
        if (cancelled) return;

        setProfile({
          organization_name: data.profile?.organization_name || "",
          address: data.profile?.address || "",
          city: data.profile?.city || "",
          latitude: data.profile?.latitude || "",
          longitude: data.profile?.longitude || "",
          name: data.profile?.name || user?.name || "",
          email: data.profile?.email || user?.email || "",
          phone: data.profile?.phone || "",
          role: data.profile?.role || user?.role || "",
          status: data.profile?.status || "",
        });

        setError("");
      } catch (err) {
        if (cancelled) return;
        console.error("Profile loading error:", err);
        setError(err.message || "Failed to load profile details.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [donorId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!donorId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateDonorProfile(donorId, {
        organization_name: profile.organization_name,
        address: profile.address,
        city: profile.city,
        name: profile.name,
        phone: profile.phone,
      });

      // Update local storage name if changed
      if (user) {
        user.name = profile.name;
        localStorage.setItem("user", JSON.stringify(user));
      }

      setSuccess("Profile updated successfully!");
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.message || "Failed to update profile settings.");
    } finally {
      setSaving(false);
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

            {/* Header */}
            <div className="dashboard-header">
              <div>
                <span className="dashboard-eyebrow">ACCOUNT & PICKUP SETTINGS</span>
                <h1>Food Donor Profile</h1>
                <p>
                  Manage your personal donor contact details, default pickup address, and business information.
                </p>
              </div>

              <div className="admin-stat-pills">
                <span className="pill-badge pill-active">
                  <HeartHandshake size={14} /> Certified Food Donor
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
            {success && (
              <div className="auth-alert alert-success" style={{ marginBottom: "1.5rem" }}>
                <CheckCircle2 size={18} />
                <span>{success}</span>
              </div>
            )}

            {loading ? (
              <div className="dashboard-empty-card">
                <div className="food-spinner"></div>
                <h3>Loading your profile...</h3>
                <p>Retrieving your account details.</p>
              </div>
            ) : (
              <div className="profile-container-grid">
                {/* Left Profile Summary Card */}
                <div className="profile-summary-card">
                  <div className="profile-avatar-large">
                    {profile.name?.charAt(0)?.toUpperCase() || "D"}
                  </div>
                  <h3>{profile.name || "Food Donor"}</h3>
                  <span className="profile-role-tag">
                    <HeartHandshake size={14} /> Food Donor Partner
                  </span>
                  <p className="profile-email-sub">{profile.email}</p>

                  <div className="profile-stats-mini">
                    <div className="mini-stat">
                      <small>City Zone</small>
                      <strong>{profile.city || "Ahmedabad"}</strong>
                    </div>
                    <div className="mini-stat">
                      <small>Account Status</small>
                      <strong className="text-success">Active</strong>
                    </div>
                  </div>
                </div>

                {/* Right Form Card */}
                <div className="profile-form-card">
                  <div className="form-card-header">
                    <h3>Contact & Address Details</h3>
                    <p>Information used when generating volunteer pickup waybills.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-grid">
                      <div className="form-field">
                        <label>
                          Full Name <span className="req-star">*</span>
                        </label>
                        <div className="input-with-icon">
                          <User size={16} className="input-icon" />
                          <input
                            type="text"
                            name="name"
                            value={profile.name}
                            onChange={handleChange}
                            placeholder="Your full name"
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
                            value={profile.email}
                            disabled
                            className="input-disabled"
                            title="Email cannot be changed"
                          />
                        </div>
                      </div>

                      <div className="form-field">
                        <label>
                          Contact Phone <span className="req-star">*</span>
                        </label>
                        <div className="input-with-icon">
                          <Phone size={16} className="input-icon" />
                          <input
                            type="tel"
                            name="phone"
                            value={profile.phone}
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-field">
                        <label>Organization / Restaurant Name</label>
                        <div className="input-with-icon">
                          <Building2 size={16} className="input-icon" />
                          <input
                            type="text"
                            name="organization_name"
                            value={profile.organization_name}
                            onChange={handleChange}
                            placeholder="e.g., Spice Garden Banquets"
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
                            value={profile.city}
                            onChange={handleChange}
                            placeholder="e.g. Ahmedabad"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-field full-width">
                        <label>
                          Default Pickup Street Address <span className="req-star">*</span>
                        </label>
                        <textarea
                          name="address"
                          rows="3"
                          value={profile.address}
                          onChange={handleChange}
                          placeholder="Complete building, street, and landmark details for volunteer couriers"
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

export default Profile;
