import { Navigate } from "react-router-dom";

function VolunteerRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "VOLUNTEER") {
    switch (user.role) {
      case "ADMIN":
        return <Navigate to="/admin/dashboard" replace />;
      case "NGO":
        return <Navigate to="/ngo/dashboard" replace />;
      case "DONOR":
        return <Navigate to="/donor/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
}

export default VolunteerRoute;
