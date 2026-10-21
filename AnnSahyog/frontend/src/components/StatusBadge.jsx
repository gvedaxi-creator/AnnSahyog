import { getStatusClass, getStatusLabel } from "../utils/status";

/**
 * Consistent lifecycle badge used across all dashboards.
 * `label` can override the default text (e.g. "Awaiting Decision").
 */
function StatusBadge({ status, label, className = "", showDot = true }) {
  return (
    <span className={`donation-status ${getStatusClass(status)} ${className}`.trim()}>
      {showDot && <span className="status-dot" aria-hidden="true" />}
      {label || getStatusLabel(status)}
    </span>
  );
}

export default StatusBadge;
