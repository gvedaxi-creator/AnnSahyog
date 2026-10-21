import { Navigate } from "react-router-dom";

// Lets a page open only for the given role; everyone else goes to login.
function RoleRoute({ role, children }) {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch (e) {
    user = null;
  }

  if (!user || user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default RoleRoute;
