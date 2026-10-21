import { Link } from "react-router-dom";
import { Heart, MapPin, Mail, Phone, ArrowUpRight, Sparkles } from "lucide-react";

function Footer({ variant = "site" }) {
  // Compact footer for authenticated dashboards: keeps the brand presence
  // without repeating the full marketing footer inside the app workspace.
  if (variant === "app") {
    return (
      <footer className="app-footer">
        <div className="app-footer-inner">
          <span>© {new Date().getFullYear()} AnnSahyog · Food Today • A Better Tomorrow</span>
          <nav className="app-footer-links" aria-label="Footer">
            <a href="/#how-it-works">How it works</a>
            <a href="/#contact">Support</a>
            <a href="mailto:contact@annsahyog.org">contact@annsahyog.org</a>
          </nav>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-main">
          {/* Brand & Purpose */}
          <div className="footer-brand">
            <Link to="/" className="footer-brand-link">
              <img src="/annsahyog-horizontal.png" alt="AnnSahyog" />
            </Link>
            <p>
              A transparent, community-powered food redistribution platform connecting surplus food donors, receiving NGOs, and dedicated volunteer couriers to eliminate hunger and food waste.
            </p>
            <div className="footer-impact-tag">
              <Sparkles size={14} />
              <span>Food Today • A Better Tomorrow</span>
            </div>
          </div>

          {/* Column 1: Explore */}
          <div className="footer-column">
            <h4>Explore Platform</h4>
            <a href="/#how-it-works">How it works</a>
            <a href="/#food">Food available today</a>
            <a href="/#impact">Our impact</a>
            <a href="/#contact">Contact & support</a>
          </div>

          {/* Column 2: Get Involved */}
          <div className="footer-column">
            <h4>Get Involved</h4>
            <Link to="/register?role=donor">
              Donate Surplus Food <ArrowUpRight size={14} />
            </Link>
            <Link to="/register?role=ngo">
              Register as NGO <ArrowUpRight size={14} />
            </Link>
            <Link to="/register?role=volunteer">
              Join as Volunteer <ArrowUpRight size={14} />
            </Link>
          </div>

          {/* Column 3: Direct Contacts & Access */}
          <div className="footer-column">
            <h4>Direct Channels</h4>
            <a href="mailto:contact@annsahyog.org">
              <Mail size={14} /> contact@annsahyog.org
            </a>
            <a href="tel:+919876543210">
              <Phone size={14} /> +91 98765 43210
            </a>
            <span className="footer-address">
              <MapPin size={14} /> Ahmedabad, Gujarat, India
            </span>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <span>© {new Date().getFullYear()} AnnSahyog. All rights reserved.</span>
          </div>
          <div className="footer-bottom-right">
            <span>Built with <Heart size={13} className="heart-icon" /> for communities across India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
