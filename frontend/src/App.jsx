import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useSearchParams,
  useNavigate,
} from "react-router-dom";

import "./App.css";
import "./styles/ui-system.css";
import "./styles/ui-pages.css";
import "./styles/auth.css";
import "./styles/mobileNav.css";
import "./styles/mobileLanding.css";
import "./styles/mobileModules.css";

import { getDonations, loginUser, registerUser } from "./services/api";
import HomePage from "./pages/Home";
import DonationDetails from "./pages/DonationDetails";
import DonorDashboard from "./pages/DonorDashboard";
import AddDonation from "./pages/donor/AddDonation";
import MyDonations from "./pages/donor/MyDonations";
import DonorDonationDetails from "./pages/donor/DonationDetails";
import DonorRequests from "./pages/donor/DonorRequests";
import DonationHistory from "./pages/donor/DonationHistory";
import Notifications from "./pages/donor/Notifications";
import Profile from "./pages/donor/Profile";

import AdminRoute from "./components/AdminRoute";
import RoleRoute from "./components/RoleRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminNgos from "./pages/admin/AdminNgos";
import AdminDonations from "./pages/admin/AdminDonations";
import AdminDonationDetails from "./pages/admin/AdminDonationDetails";
import AdminPickups from "./pages/admin/AdminPickups";
import AdminVolunteers from "./pages/admin/AdminVolunteers";
import AdminFeedback from "./pages/admin/AdminFeedback";
import AdminReports from "./pages/admin/AdminReports";

import NgoRoute from "./components/NgoRoute";
import NgoDashboard from "./pages/ngo/NgoDashboard";
import BrowseDonations from "./pages/ngo/BrowseDonations";
import NgoDonationDetails from "./pages/ngo/NgoDonationDetails";
import NgoRequests from "./pages/ngo/NgoRequests";
import NgoDeliveries from "./pages/ngo/NgoDeliveries";
import NgoHistory from "./pages/ngo/NgoHistory";
import NgoProfile from "./pages/ngo/NgoProfile";

import VolunteerRoute from "./components/VolunteerRoute";
import VolunteerDashboard from "./pages/volunteer/VolunteerDashboard";
import VolunteerTasks from "./pages/volunteer/VolunteerTasks";
import TaskDetails from "./pages/volunteer/TaskDetails";
import ActiveDelivery from "./pages/volunteer/ActiveDelivery";
import VolunteerHistory from "./pages/volunteer/VolunteerHistory";
import VolunteerNotifications from "./pages/volunteer/VolunteerNotifications";
import VolunteerProfile from "./pages/volunteer/VolunteerProfile";

import {
  Utensils,
  Building2,
  Bike,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Users,
  Leaf,
  HandHeart,
  User,
  UserRound,
  ChevronDown,
  Home,
} from "lucide-react";

/* =========================
   ROLE INFORMATION
========================= */

const roles = {
  donor: {
    id: "donor",
    title: "Food Donor",
    icon: Utensils,
    description: "Share safe surplus food from restaurants, caterers, and events with people who need it.",
    heading: "Let's turn surplus into shared meals.",
    label: "Donor / Business Name",
  },

  ngo: {
    id: "ngo",
    title: "NGO / Receiving Shelter",
    icon: Building2,
    description: "Discover and request available surplus food for your community shelter or distribution kitchen.",
    heading: "Let's get food where it's needed.",
    label: "Organization Name",
  },

  volunteer: {
    id: "volunteer",
    title: "Rescue Volunteer",
    icon: Bike,
    description: "Help pick up food from donors and transport it safely to nearby community centers.",
    heading: "Let's move food where it matters.",
    label: "Full Name",
  },
};

/* =========================
   SHARED AUTH LAYOUT
   Full-bleed photo with brand message on the left and the
   form card floating on the right over a cream fade.
========================= */

function AuthLayout({ children, headline, description, points, wide = false }) {
  // `wide` = register: two-column form sized to fit one screen without scrolling
  return (
    <div className="auth-stage">
      <div className="auth-stage-bg" aria-hidden="true" />

      <div className={`auth-stage-inner ${wide ? "auth-stage-wide" : ""}`}>
        {/* LEFT: brand message over the photo */}
        <aside className="auth-message">
          <Link to="/" className="auth-message-logo" aria-label="AnnSahyog home">
            <img src="/annsahyog-logo-trim.png" alt="AnnSahyog — Food Today, A Better Tomorrow" />
          </Link>

          <h2 className="auth-message-title">{headline}</h2>
          <p className="auth-message-text">{description}</p>

          <ul className="auth-message-points">
            {points.map((point) => {
              const PointIcon = point.icon;
              return (
                <li key={point.text}>
                  <span className="auth-point-icon">
                    <PointIcon size={24} strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <span>{point.text}</span>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* RIGHT: form card */}
        <main className="auth-card-wrap">
          <Link to="/" className="auth-home-link">
            <ArrowLeft size={15} />
            <span>Back to home</span>
          </Link>

          <div className="auth-card">
            <div className="auth-card-body">{children}</div>
          </div>

          <p className="auth-legal">
            © {new Date().getFullYear()} AnnSahyog · Food Today • A Better Tomorrow
          </p>
        </main>
      </div>
    </div>
  );
}

function PasswordInput({ id, name, value, onChange, placeholder, autoComplete, show, onToggle, ...inputProps }) {
  return (
    <div className="auth-input">
      <Lock size={18} className="auth-input-icon" />
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        {...inputProps}
        required
      />
      <button
        type="button"
        className="auth-eye-btn"
        onClick={onToggle}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

/* =========================
   REGISTER PAGE
========================= */

function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const roleFromUrl = searchParams.get("role");
  const directRole = roleFromUrl && roles[roleFromUrl] ? roleFromUrl : null;

  const [selectedRole, setSelectedRole] = useState(directRole || "");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    registration_number: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const passwordsMismatch =
    formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedRole) {
      setError("Please choose how you are registering (Food Donor, NGO or Volunteer).");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please re-enter them.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: (selectedRole || "donor").toUpperCase(),
        organization_name: formData.name,
        registration_number: formData.registration_number || null,
        address: formData.address,
        city: formData.city || "Ahmedabad",
      };

      await registerUser(payload);
      setSuccess(
        selectedRole === "ngo"
          ? "NGO account created successfully! It is pending admin verification. You can log in now."
          : "Registration successful! Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  const getNameLabel = () => {
    if (selectedRole === "ngo") return "Organization Name";
    if (selectedRole === "donor") return "Full Name / Business Name";
    return "Full Name";
  };

  const getNamePlaceholder = () => {
    if (selectedRole === "ngo") return "Organization name";
    if (selectedRole === "donor") return "Your name or business";
    return "Enter your full name";
  };

  return (
    <AuthLayout
      wide
      headline={
        <>
          Together
          <br />
          We Can Make
          <br />
          <em>A Difference</em>
        </>
      }
      description="Join AnnSahyog and be part of a community that connects surplus food to those who need it the most."
      points={[
        { icon: HandHeart, text: "Donate Surplus Food" },
        { icon: Users, text: "Support Communities" },
        { icon: Leaf, text: "Build a Hunger-Free Tomorrow" },
      ]}
    >
      <div className="auth-heading">
        <h1>Create Your Account</h1>
        <p>Join AnnSahyog and start making a positive impact today.</p>
      </div>

      {error && (
        <div className="auth-alert alert-error" role="alert">
          <AlertCircle size={17} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="auth-alert alert-success" role="status">
          <CheckCircle2 size={17} />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="auth-field-row">
          <div className="auth-field">
            <label htmlFor="reg-name" className="auth-label">
              {getNameLabel()}
            </label>
            <div className="auth-input">
              {selectedRole === "ngo" ? (
                <Building2 size={18} className="auth-input-icon" />
              ) : (
                <User size={18} className="auth-input-icon" />
              )}
              <input
                id="reg-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={getNamePlaceholder()}
                autoComplete={selectedRole === "ngo" ? "organization" : "name"}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="reg-role" className="auth-label">
              I am registering as
            </label>
            <div className="auth-input auth-select">
              <UserRound size={18} className="auth-input-icon" />
              <select
                id="reg-role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select your role
                </option>
                <option value="donor">Food Donor</option>
                <option value="ngo">NGO / Shelter</option>
                <option value="volunteer">Rescue Volunteer</option>
              </select>
              <ChevronDown size={18} className="auth-select-chevron" aria-hidden="true" />
            </div>
          </div>

        </div>

        <div className="auth-field-row">
          <div className="auth-field">
            <label htmlFor="reg-email" className="auth-label">
              Email Address
            </label>
            <div className="auth-input">
              <Mail size={18} className="auth-input-icon" />
              <input
                id="reg-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="reg-phone" className="auth-label">
              Phone Number
            </label>
            <div className="auth-input">
              <Phone size={18} className="auth-input-icon" />
              <input
                id="reg-phone"
                type="tel"
                name="phone"
                inputMode="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="98765 43210"
                autoComplete="tel"
                required
              />
            </div>
          </div>
        </div>

        <div className="auth-field-row">
          <div className="auth-field">
            <label htmlFor="reg-password" className="auth-label">
              Password
            </label>
            <PasswordInput
              id="reg-password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              autoComplete="new-password"
              show={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-confirm" className="auth-label">
              Confirm Password
            </label>
            <PasswordInput
              id="reg-confirm"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              autoComplete="new-password"
              show={showConfirm}
              onToggle={() => setShowConfirm(!showConfirm)}
            />
            {passwordsMismatch && (
              <span className="auth-field-error" role="alert">
                Passwords do not match
              </span>
            )}
          </div>
        </div>

        {selectedRole === "ngo" && (
          <div className="auth-field">
            <label htmlFor="reg-ngo-id" className="auth-label">
              NGO Darpan / Registration ID <span className="auth-optional">(optional)</span>
            </label>
            <div className="auth-input">
              <ShieldCheck size={18} className="auth-input-icon" />
              <input
                id="reg-ngo-id"
                type="text"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleChange}
                placeholder="e.g. GJ/2024/0019283"
              />
            </div>
          </div>
        )}

        <div className="auth-field-row auth-field-row-address">
          <div className="auth-field">
            <label htmlFor="reg-city" className="auth-label">
              City
            </label>
            <div className="auth-input">
              <MapPin size={18} className="auth-input-icon" />
              <input
                id="reg-city"
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Your city"
                autoComplete="address-level2"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="reg-address" className="auth-label">
              Street Address / Area
            </label>
            <div className="auth-input">
              <Home size={18} className="auth-input-icon" />
              <input
                id="reg-address"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Area, street, landmark"
                autoComplete="street-address"
                required
              />
            </div>
          </div>
        </div>

        <label className="auth-check">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            required
          />
          <span>
            I agree to the <strong>Terms &amp; Conditions</strong> and{" "}
            <strong>Privacy Policy</strong>.
          </span>
        </label>

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? (
            <>
              <div className="btn-spinner"></div>
              <span>Creating your account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight size={19} />
            </>
          )}
        </button>
      </form>

      <p className="auth-switch-text auth-switch-compact">
        Already have an account?{" "}
        <Link to="/login" className="auth-switch-link">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}

/* =========================
   LOGIN PAGE
========================= */

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Fields stay read-only until the user starts typing, so the browser
  // neither autofills saved credentials on load nor pops its saved-login
  // list on click; suggestions appear once typing begins.
  const [fieldsUnlocked, setFieldsUnlocked] = useState(false);

  const unlockFields = (input) => {
    // Clearing readOnly during keydown/paste lets this same keystroke
    // (or paste) land in the field natively
    input.readOnly = false;
    setFieldsUnlocked(true);
  };

  const lockedFieldProps = fieldsUnlocked
    ? {}
    : {
        readOnly: true,
        onKeyDown: (event) => {
          if (event.key.length === 1 || event.key === "Unidentified") {
            unlockFields(event.currentTarget);
          }
        },
        onPaste: (event) => unlockFields(event.currentTarget),
        // Touch keyboards won't open on a read-only field, so unlock on tap
        onPointerDown: (event) => {
          if (event.pointerType !== "mouse") unlockFields(event.currentTarget);
        },
      };

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser(email, password);

      const user = data.user;

      // Save logged-in user in localStorage
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect according to role
      switch (user.role) {
        case "DONOR":
          navigate("/donor/dashboard");
          break;

        case "NGO":
          navigate("/ngo/dashboard");
          break;

        case "VOLUNTEER":
          navigate("/volunteer/dashboard");
          break;

        case "ADMIN":
          navigate("/admin/dashboard");
          break;

        default:
          setError("Unknown user role assigned.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (email) {
      alert(`Password reset instructions have been dispatched to ${email}. If you need immediate assistance, please reach our team at support@annsahyog.org.`);
    } else {
      alert("Please enter your registered email address first, then click 'Forgot password?'.");
    }
  };

  return (
    <AuthLayout
      headline={
        <>
          Good Food
          <br />
          Builds Brighter
          <br />
          <em>Tomorrows</em>
        </>
      }
      description="Connecting people, surplus food and communities to reduce food waste and fight hunger."
      points={[
        { icon: HandHeart, text: "Reduce Food Waste" },
        { icon: Users, text: "Support Communities" },
        { icon: Leaf, text: "Build a Hunger-Free Tomorrow" },
      ]}
    >
      <div className="auth-heading">
        <h1>Welcome Back</h1>
        <p>Sign in to continue making a difference with AnnSahyog.</p>
      </div>

      {error && (
        <div className="auth-alert alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="auth-field">
          <label htmlFor="login-email" className="auth-label">
            Email Address
          </label>
          <div className="auth-input auth-input-lg">
            <Mail size={19} className="auth-input-icon" />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email address"
              autoComplete="email"
              {...lockedFieldProps}
              required
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="login-password" className="auth-label">
            Password
          </label>
          <div className="auth-input-lg">
            <PasswordInput
              id="login-password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              {...lockedFieldProps}
              show={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
          </div>
        </div>

        <div className="auth-row-end">
          <a href="#forgot-password" onClick={handleForgotPassword} className="auth-link">
            Forgot Password?
          </a>
        </div>

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? (
            <>
              <div className="btn-spinner"></div>
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight size={19} />
            </>
          )}
        </button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <p className="auth-switch-text">
        Don't have an account?{" "}
        <Link to="/register" className="auth-switch-link">
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  );
}

/* =========================
   APPLICATION ROUTING
========================= */

function App() {
  const [donations, setDonations] = useState([]);
  const [donationsLoading, setDonationsLoading] = useState(true);
  const [donationsError, setDonationsError] = useState("");

  useEffect(() => {
    const loadDonations = async () => {
      try {
        setDonationsLoading(true);
        const data = await getDonations();
        setDonations(data.donations || []);
      } catch (error) {
        console.error("Donation loading error:", error);
        setDonationsError("Unable to load donations.");
      } finally {
        setDonationsLoading(false);
      }
    };

    loadDonations();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              donations={donations}
              donationsLoading={donationsLoading}
              donationsError={donationsError}
            />
          }
        />

        <Route
          path="/donation/:id"
          element={<DonationDetails donations={donations} />}
        />

        <Route path="/donor/dashboard" element={<RoleRoute role="DONOR"><DonorDashboard /></RoleRoute>} />

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/donor/add-donation" element={<RoleRoute role="DONOR"><AddDonation /></RoleRoute>} />
        <Route path="/donor/donations" element={<RoleRoute role="DONOR"><MyDonations /></RoleRoute>} />
        <Route path="/donor/donations/:donationId" element={<RoleRoute role="DONOR"><DonorDonationDetails /></RoleRoute>} />
        <Route path="/donor/requests" element={<RoleRoute role="DONOR"><DonorRequests /></RoleRoute>} />
        <Route path="/donor/history" element={<RoleRoute role="DONOR"><DonationHistory /></RoleRoute>} />
        <Route path="/donor/notifications" element={<RoleRoute role="DONOR"><Notifications /></RoleRoute>} />
        <Route path="/donor/profile" element={<RoleRoute role="DONOR"><Profile /></RoleRoute>} />

        {/* =========================
            ADMIN ROUTES
        ========================= */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/ngos"
          element={
            <AdminRoute>
              <AdminNgos />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/donations"
          element={
            <AdminRoute>
              <AdminDonations />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/donations/:id"
          element={
            <AdminRoute>
              <AdminDonationDetails />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/pickups"
          element={
            <AdminRoute>
              <AdminPickups />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/volunteers"
          element={
            <AdminRoute>
              <AdminVolunteers />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/feedback"
          element={
            <AdminRoute>
              <AdminFeedback />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminRoute>
              <AdminReports />
            </AdminRoute>
          }
        />

        {/* =========================
            NGO / RECEIVING ORG ROUTES
        ========================= */}
        <Route
          path="/ngo/dashboard"
          element={
            <NgoRoute>
              <NgoDashboard />
            </NgoRoute>
          }
        />
        <Route
          path="/ngo/donations"
          element={
            <NgoRoute>
              <BrowseDonations />
            </NgoRoute>
          }
        />
        <Route
          path="/ngo/donations/:id"
          element={
            <NgoRoute>
              <NgoDonationDetails />
            </NgoRoute>
          }
        />
        <Route
          path="/ngo/requests"
          element={
            <NgoRoute>
              <NgoRequests />
            </NgoRoute>
          }
        />
        <Route
          path="/ngo/deliveries"
          element={
            <NgoRoute>
              <NgoDeliveries />
            </NgoRoute>
          }
        />
        <Route
          path="/ngo/history"
          element={
            <NgoRoute>
              <NgoHistory />
            </NgoRoute>
          }
        />
        <Route
          path="/ngo/notifications"
          element={
            <NgoRoute>
              <Notifications />
            </NgoRoute>
          }
        />
        <Route
          path="/ngo/profile"
          element={
            <NgoRoute>
              <NgoProfile />
            </NgoRoute>
          }
        />

        {/* =========================
            VOLUNTEER ROUTES
        ========================= */}
        <Route
          path="/volunteer/dashboard"
          element={
            <VolunteerRoute>
              <VolunteerDashboard />
            </VolunteerRoute>
          }
        />
        <Route
          path="/volunteer/tasks"
          element={
            <VolunteerRoute>
              <VolunteerTasks />
            </VolunteerRoute>
          }
        />
        <Route
          path="/volunteer/tasks/:id"
          element={
            <VolunteerRoute>
              <TaskDetails />
            </VolunteerRoute>
          }
        />
        <Route
          path="/volunteer/active/:id"
          element={
            <VolunteerRoute>
              <ActiveDelivery />
            </VolunteerRoute>
          }
        />
        <Route
          path="/volunteer/history"
          element={
            <VolunteerRoute>
              <VolunteerHistory />
            </VolunteerRoute>
          }
        />
        <Route
          path="/volunteer/notifications"
          element={
            <VolunteerRoute>
              <VolunteerNotifications />
            </VolunteerRoute>
          }
        />
        <Route
          path="/volunteer/profile"
          element={
            <VolunteerRoute>
              <VolunteerProfile />
            </VolunteerRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
