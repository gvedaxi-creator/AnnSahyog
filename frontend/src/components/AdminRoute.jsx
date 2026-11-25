import { Link } from "react-router-dom";
import { Lock } from "lucide-react";

function AdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="admin-access-denied-page">
        <div className="admin-access-denied-card">
          <div className="access-denied-icon"><Lock size={28} /></div>
          <h2>Admin Access Required</h2>
          <p>
            You must be logged in with an Administrator account to view and
            manage the AnnSahyog administrative dashboard.
          </p>
          <div className="access-denied-actions">
            <Link to="/login" className="btn btn-primary">
              Log in as Admin →
            </Link>
            <Link to="/" className="btn btn-secondary">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export default AdminRoute;
