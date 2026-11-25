/* =========================
   NAVBAR COMPONENT
========================= */

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  ArrowRight,
  LogOut,
  User,
  HeartHandshake,
  Building2,
  Bike,
  Shield,
  Sparkles,
} from "lucide-react";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const getDashboardPath = (role) => {
    switch (role) {
      case "DONOR":
        return "/donor/dashboard";
      case "NGO":
        return "/ngo/dashboard";
      case "VOLUNTEER":
        return "/volunteer/dashboard";
      case "ADMIN":
        return "/admin/dashboard";
      default:
        return "/login";
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "DONOR":
        return { label: "Donor", icon: HeartHandshake };
      case "NGO":
        return { label: "NGO", icon: Building2 };
      case "VOLUNTEER":
        return { label: "Volunteer", icon: Bike };
      case "ADMIN":
        return { label: "Admin", icon: Shield };
      default:
        return { label: "Member", icon: User };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setMenuOpen(false);
    navigate("/login");
  };

  const roleInfo = user ? getRoleBadge(user.role) : null;
  const RoleIcon = roleInfo?.icon;

  return (
    <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
      <div className="container navbar">
        <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <img
            src="/annsahyog-icon.png"
            alt="AnnSahyog"
            className="brand-logo"
          />
          <div className="brand-name">
            Ann<span>Sahyog</span>
          </div>
        </Link>

        <nav className="desktop-nav">
          <a href="/#how-it-works">How it works</a>
          <a href="/#food">Food near you</a>
          <a href="/#impact">Our impact</a>
          <a href="/#join">Get involved</a>
          <a href="/#contact">Contact</a>
        </nav>

        <div className="nav-buttons">
          {user ? (
            <div className="nav-user-group">
              <Link
                to={getDashboardPath(user.role)}
                className="btn btn-primary btn-nav-dashboard"
                title={`Logged in as ${user.name || user.email}`}
              >
                {RoleIcon && <RoleIcon size={16} />}
                <span>{roleInfo.label} Portal</span>
                <ArrowRight size={14} className="nav-arrow-icon" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-light btn-nav-logout"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut size={16} />
                <span className="hide-mobile">Log out</span>
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-light">
                Log in
              </Link>

              <Link to="/register" className="btn btn-primary btn-join-nav">
                <Sparkles size={15} />
                <span>Join AnnSahyog</span>
              </Link>
            </>
          )}

          <button
            className={`menu-button ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-nav">
          <a href="/#how-it-works" onClick={() => setMenuOpen(false)}>
            How it works
          </a>
          <a href="/#food" onClick={() => setMenuOpen(false)}>
            Food near you
          </a>
          <a href="/#impact" onClick={() => setMenuOpen(false)}>
            Our impact
          </a>
          <a href="/#join" onClick={() => setMenuOpen(false)}>
            Get involved
          </a>
          <a href="/#contact" onClick={() => setMenuOpen(false)}>
            Contact
          </a>

          <div className="mobile-nav-divider"></div>

          {user ? (
            <div className="mobile-auth-stack">
              <Link
                to={getDashboardPath(user.role)}
                className="btn btn-primary"
                onClick={() => setMenuOpen(false)}
              >
                {RoleIcon && <RoleIcon size={16} />}
                <span>{roleInfo.label} Dashboard</span>
                <ArrowRight size={14} />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-light"
              >
                <LogOut size={16} />
                <span>Log out</span>
              </button>
            </div>
          ) : (
            <div className="mobile-auth-stack">
              <Link
                to="/login"
                className="btn btn-light"
                onClick={() => setMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="btn btn-primary"
                onClick={() => setMenuOpen(false)}
              >
                <Sparkles size={16} />
                <span>Join AnnSahyog</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;
