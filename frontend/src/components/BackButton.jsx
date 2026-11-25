import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PANEL_DASHBOARDS = {
  donor: "/donor/dashboard",
  ngo: "/ngo/dashboard",
  volunteer: "/volunteer/dashboard",
  admin: "/admin/dashboard",
};

/**
 * Hierarchical "Back" control for the role panels.
 *  - Any section page (My Donations, Requests, Profile, …) → that panel's Dashboard
 *  - The Dashboard itself → Home page
 * Detail pages (e.g. a single donation) use their own "Back to <parent list>" link.
 * Pass `to` / `label` to override.
 */
function BackButton({ to, label, className = "" }) {
  const { pathname } = useLocation();
  const panel = pathname.split("/")[1];
  const dashboard = PANEL_DASHBOARDS[panel];
  const onDashboard = dashboard && pathname === dashboard;

  const target = to || (dashboard && !onDashboard ? dashboard : "/");
  const text = label || (target === "/" ? "Back to Home" : "Back to Dashboard");

  return (
    <Link to={target} className={`page-back-btn ${className}`.trim()}>
      <ArrowLeft size={16} aria-hidden="true" />
      <span>{text}</span>
    </Link>
  );
}

export default BackButton;
