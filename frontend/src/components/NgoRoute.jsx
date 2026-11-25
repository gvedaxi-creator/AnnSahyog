import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";

function NgoRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!user || user.role !== "NGO") {
    return (
      <div className="admin-access-denied-page">
        <div className="admin-access-denied-card">
          <div className="access-denied-icon"><Building2 size={28} /></div>
          <h2>NGO Access Required</h2>
          <p>
            You must be logged in with a registered NGO or Receiving Organization
            account to access this section.
          </p>
          <div className="access-denied-actions">
            <Link to="/login" className="btn btn-primary">
              Log in as NGO →
            </Link>
            <Link to="/register?role=ngo" className="btn btn-secondary">
              Register Organization
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export default NgoRoute;
