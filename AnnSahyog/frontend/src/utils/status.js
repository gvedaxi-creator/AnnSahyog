// ======================================================
// SHARED STATUS SYSTEM
// One mapping for every status label and badge colour so the
// donation lifecycle reads the same on every dashboard.
// (Presentation only — status values from the API are unchanged.)
// ======================================================

const STATUS_META = {
  AVAILABLE: { label: "Available", tone: "status-available" },
  PENDING: { label: "Pending", tone: "status-pending" },
  PENDING_VERIFICATION: { label: "Pending Verification", tone: "status-pending" },
  VERIFIED: { label: "Verified", tone: "status-verified" },
  REQUESTED: { label: "Requested", tone: "status-requested" },
  APPROVED: { label: "Approved", tone: "status-approved" },
  ACCEPTED: { label: "Accepted", tone: "status-accepted" },
  ASSIGNED: { label: "Volunteer Assigned", tone: "status-assigned" },
  NEEDS_DRIVER: { label: "Needs a Driver", tone: "status-pending" },
  URGENT: { label: "Urgent", tone: "status-inactive" },
  OVERDUE: { label: "Overdue", tone: "status-inactive" },
  PICKED_UP: { label: "Picked Up", tone: "status-picked" },
  IN_TRANSIT: { label: "In Transit", tone: "status-in_transit" },
  IN_PROGRESS: { label: "Pickup in Progress", tone: "status-in_progress" },
  DELIVERED: { label: "Delivered", tone: "status-delivered" },
  COMPLETED: { label: "Completed", tone: "status-completed" },
  ACTIVE: { label: "Active", tone: "status-active" },
  INACTIVE: { label: "Inactive", tone: "status-inactive" },
  DEACTIVE: { label: "Deactive", tone: "status-inactive" },
  UNAVAILABLE: { label: "Unavailable", tone: "status-unavailable" },
  REJECTED: { label: "Rejected", tone: "status-rejected" },
  CANCELLED: { label: "Cancelled", tone: "status-cancelled" },
};

const normalise = (status) =>
  String(status || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

export function getStatusClass(status) {
  return STATUS_META[normalise(status)]?.tone || "status-default";
}

export function getStatusLabel(status) {
  const key = normalise(status);
  if (!key) return "Unknown";
  if (STATUS_META[key]) return STATUS_META[key].label;
  return key
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// A pickup is created as ASSIGNED with no volunteer while it waits for
// one to accept (or the admin to assign), so show it as open.
export function getPickupStatus(status, hasVolunteer) {
  return normalise(status) === "ASSIGNED" && !hasVolunteer ? "NEEDS_DRIVER" : status;
}

// Donation lifecycle used by the visual tracker
export const DONATION_STEPS = [
  { key: "AVAILABLE", label: "Listed" },
  { key: "REQUESTED", label: "NGO Requested" },
  { key: "ACCEPTED", label: "Volunteer Assigned" },
  { key: "PICKED_UP", label: "Picked Up" },
  { key: "DELIVERED", label: "Delivered" },
];

const STEP_INDEX = {
  AVAILABLE: 0,
  PENDING: 1,
  REQUESTED: 1,
  APPROVED: 2,
  ACCEPTED: 2,
  ASSIGNED: 2,
  PICKED_UP: 3,
  IN_TRANSIT: 3,
  IN_PROGRESS: 3,
  DELIVERED: 4,
  COMPLETED: 4,
};

export function getDonationStepIndex(status) {
  const idx = STEP_INDEX[normalise(status)];
  return idx === undefined ? -1 : idx;
}

export function isTerminalNegative(status) {
  return ["CANCELLED", "REJECTED"].includes(normalise(status));
}
