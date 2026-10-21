// ======================================================
// REPORT DEFINITIONS
// Each report declares its own KPIs, charts, filters and
// table columns. Only fields the API actually returns are used.
// ======================================================

import { Link } from "react-router-dom";
import {
  Utensils,
  Truck,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  Shield,
  UserCheck,
  HeartHandshake,
} from "lucide-react";
import StatusBadge from "../../../components/StatusBadge";
import { colorFor } from "../../../components/AdminCharts";
import { getPickupStatus, getStatusLabel } from "../../../utils/status";
import {
  countBy,
  countWhere,
  formatDateTime,
  text,
  timeOf,
  toSlices,
  topGroups,
  waitingBucket,
  WAIT_BUCKETS,
} from "./reportUtils";

const ROLE_LABELS = {
  ADMIN: "Administrator",
  DONOR: "Food Donor",
  NGO: "NGO",
  VOLUNTEER: "Volunteer",
};

const withLabels = (values) => values.map((value) => ({ value, label: getStatusLabel(value) }));

const kpi = (label, value, note, icon) => ({ label, value, note, icon });

// ---------- column helpers ----------

const textColumn = (label, get, { mono = false, sort, csv } = {}) => ({
  label,
  sort: sort || ((row) => text(get(row)).toLowerCase()),
  csv: csv || ((row) => text(get(row))),
  render: (row) => (
    <span className={mono ? "table-mono" : undefined}>{text(get(row)) || "—"}</span>
  ),
});

const statusColumn = (label, get, labels = {}) => ({
  label,
  sort: (row) => text(get(row)),
  csv: (row) => labels[get(row)] || getStatusLabel(get(row)),
  render: (row) => <StatusBadge status={get(row)} label={labels[get(row)]} />,
});

const dateColumn = (label, get) => ({
  label,
  sort: (row) => timeOf(get(row)),
  csv: (row) => formatDateTime(get(row)),
  render: (row) => <span className="table-date">{formatDateTime(get(row)) || "—"}</span>,
});

// ---------- donations ----------

const DONATION_STATUSES = withLabels([
  "AVAILABLE",
  "REQUESTED",
  "ACCEPTED",
  "PICKED_UP",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
]);

const donationReport = {
  id: "donations",
  title: "Donation Report",
  description: "Food listings by status, food type and city.",
  icon: Utensils,
  accent: "#1F6F4A",
  dataKey: "donations",
  dateHint: "Date filters use the day each donation was listed.",
  emptyText: "Try a different search, status or date range.",
  getDate: (r) => r.created_at,
  getStatus: (r) => r.status,
  statusOptions: DONATION_STATUSES,
  searchFields: (r) => [r.food_type, r.donor_name, r.city],
  defaultSort: { key: "Listed Date", dir: "desc" },
  columns: [
    textColumn("Donation ID", (r) => `#${r.donation_id}`, {
      mono: true,
      sort: (r) => Number(r.donation_id),
    }),
    textColumn("Food Items", (r) => r.food_type),
    textColumn("Quantity", (r) => `${text(r.quantity)} ${text(r.unit)}`.trim(), {
      sort: (r) => Number(r.quantity),
    }),
    textColumn("Donor", (r) => r.donor_name),
    textColumn("City", (r) => r.city),
    statusColumn("Status", (r) => r.status),
    dateColumn("Listed Date", (r) => r.created_at),
  ],
  kpis: (rows) => [
    kpi("Total Donations", rows.length, "Listings in this view", Utensils),
    kpi("Available", countWhere(rows, (r) => r.status, "AVAILABLE"), "Open for NGO requests", Package),
    kpi("Requested", countWhere(rows, (r) => r.status, "REQUESTED"), "Waiting for a response", Clock),
    kpi("Accepted", countWhere(rows, (r) => r.status, "ACCEPTED"), "Accepted for distribution", CheckCircle2),
  ],
  charts: [
    {
      id: "status",
      title: "Status distribution",
      subtitle: "Share of listings at each stage",
      build: (rows) => ({
        kind: "donut",
        centerLabel: "donations",
        slices: toSlices(
          countBy(rows, (r) => r.status),
          DONATION_STATUSES,
          colorFor
        ),
      }),
    },
    {
      id: "food",
      title: "By food type",
      subtitle: "Food type is free text, so there is no separate category field",
      build: (rows) => ({
        kind: "bars",
        emptyText: "No donations in this view",
        items: topGroups(rows, (r) => r.food_type, 8, "Not specified").map((group, i) => ({
          ...group,
          color: colorFor(i),
        })),
      }),
    },
    {
      id: "city",
      title: "By city",
      subtitle: "Where the food was listed",
      build: (rows) => ({
        kind: "bars",
        emptyText: "No donations in this view",
        items: topGroups(rows, (r) => r.city, 8, "City not recorded").map((group, i) => ({
          ...group,
          color: colorFor(i),
        })),
      }),
    },
  ],
};

// ---------- pickups & deliveries ----------

const PICKUP_STATUSES = withLabels(["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"]);

const pickupStage = (r) => getPickupStatus(r.status, Boolean(r.volunteer_id));

const pickupReport = {
  id: "pickups",
  title: "Pickup & Delivery Report",
  description: "Pickups from donor to receiving organisation, with volunteer progress.",
  icon: Truck,
  accent: "#2E5395",
  dataKey: "pickups",
  dateHint: "Date filters use the pickup time. Pickups not yet collected have no pickup time and are left out when a date range is set.",
  emptyText: "Try a different search, status or date range.",
  getDate: (r) => r.pickup_timestamp,
  getStatus: (r) => r.status,
  statusOptions: PICKUP_STATUSES,
  searchFields: (r) => [r.food_type, r.donor_name, r.ngo_name, r.volunteer_name, r.delivery_location],
  defaultSort: { key: "Pickup Date", dir: "desc" },
  columns: [
    textColumn("Donation", (r) => `${text(r.food_type) || "Donation"} (#${r.donation_id})`),
    textColumn("NGO / Receiving Organisation", (r) => r.ngo_name || "Not yet assigned"),
    textColumn("Volunteer", (r) => r.volunteer_name || "Not yet assigned"),
    dateColumn("Pickup Date", (r) => r.pickup_timestamp),
    dateColumn("Delivery Date", (r) => r.delivery_timestamp),
    statusColumn("Status", pickupStage),
  ],
  kpis: (rows) => [
    kpi("Total Pickups", rows.length, "Pickups in this view", Truck),
    kpi("Assigned", countWhere(rows, (r) => r.status, "ASSIGNED"), "Waiting for or with a volunteer", Clock),
    kpi("In Transit", countWhere(rows, (r) => r.status, "IN_TRANSIT"), "On the way to the NGO", Truck),
    kpi("Delivered", countWhere(rows, (r) => r.status, "DELIVERED"), "Handed over", CheckCircle2),
  ],
  charts: [
    {
      id: "status",
      title: "Status breakdown",
      subtitle: "Current stage of each pickup",
      build: (rows) => ({
        kind: "donut",
        centerLabel: "pickups",
        slices: toSlices(countBy(rows, (r) => r.status), PICKUP_STATUSES, colorFor),
      }),
    },
    {
      id: "rate",
      title: "Delivery completion rate",
      subtitle: "Delivered pickups as a share of all pickups",
      build: (rows) => {
        const delivered = countWhere(rows, (r) => r.status, "DELIVERED");
        return {
          kind: "rate",
          value: delivered,
          total: rows.length,
          label: "delivered",
          note: `${delivered} of ${rows.length} pickups delivered`,
        };
      },
    },
    {
      id: "stages",
      title: "Stage-wise progress",
      subtitle: "Pickups that have reached each stage",
      build: (rows) => {
        const reached = (statuses) => rows.filter((r) => statuses.includes(r.status)).length;
        return {
          kind: "columns",
          emptyText: "No pickups in this view",
          color: "#2E5395",
          columns: [
            { label: "Assigned", value: rows.length },
            { label: "Picked Up", value: reached(["PICKED_UP", "IN_TRANSIT", "DELIVERED"]) },
            { label: "In Transit", value: reached(["IN_TRANSIT", "DELIVERED"]) },
            { label: "Delivered", value: reached(["DELIVERED"]) },
          ],
        };
      },
    },
  ],
};

// ---------- NGO verification ----------

const NGO_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "ACTIVE", label: "Verified" },
  { value: "DEACTIVE", label: "Deactivated" },
  { value: "REJECTED", label: "Rejected" },
];

const NGO_STATUS_LABELS = { ACTIVE: "Active" };

const ngoReport = {
  id: "ngos",
  title: "NGO Verification Report",
  description: "Receiving organisations waiting for review, verified and rejected.",
  icon: Building2,
  accent: "#E07A2E",
  dataKey: "ngos",
  dateHint: "Date filters use the day each organisation registered.",
  emptyText: "Try a different search, status or date range.",
  getDate: (r) => r.created_at,
  getStatus: (r) => r.verification_status,
  statusOptions: NGO_STATUS_OPTIONS,
  searchFields: (r) => [r.organization_name, r.registration_number, r.city, r.email],
  defaultSort: { key: "Submission Date", dir: "desc" },
  columns: [
    textColumn("NGO Name", (r) => r.organization_name),
    textColumn("City", (r) => r.city),
    dateColumn("Submission Date", (r) => r.created_at),
    statusColumn("Verification Status", (r) => r.verification_status, NGO_STATUS_LABELS),
    // The database does not record when an NGO was reviewed
    textColumn("Review Date", () => "Not recorded"),
    {
      label: "Action",
      sort: null,
      csv: null,
      render: () => (
        <Link to="/admin/ngos" className="table-action-link">
          Open verifications
        </Link>
      ),
    },
  ],
  kpis: (rows) => [
    kpi("Total NGOs", rows.length, "Registered organisations", Building2),
    kpi("Pending Verification", countWhere(rows, (r) => r.verification_status, "PENDING"), "Waiting for a decision", Clock),
    kpi("Verified", countWhere(rows, (r) => r.verification_status, "ACTIVE"), "Active partners", CheckCircle2),
    kpi("Rejected", countWhere(rows, (r) => r.verification_status, "REJECTED"), "Not verified", XCircle),
  ],
  charts: [
    {
      id: "outcome",
      title: "Verification outcome",
      subtitle: "Organisations by verification result",
      build: (rows) => ({
        kind: "donut",
        centerLabel: "NGOs",
        slices: toSlices(
          countBy(rows, (r) => r.verification_status),
          NGO_STATUS_OPTIONS,
          colorFor
        ),
      }),
    },
    {
      id: "waiting",
      title: "Pending applications by waiting time",
      subtitle: "Days since the organisation registered",
      build: (rows) => {
        const counts = countBy(
          rows.filter((r) => r.verification_status === "PENDING"),
          (r) => waitingBucket(r.created_at)
        );
        return {
          kind: "bars",
          emptyText: "No pending applications",
          items: WAIT_BUCKETS.map((bucket, i) => ({
            label: bucket,
            value: counts[bucket] || 0,
            color: colorFor(i),
          })),
        };
      },
    },
  ],
};

// ---------- user directory ----------

const USER_ROLE_OPTIONS = [
  { value: "ADMIN", label: ROLE_LABELS.ADMIN },
  { value: "DONOR", label: ROLE_LABELS.DONOR },
  { value: "NGO", label: ROLE_LABELS.NGO },
  { value: "VOLUNTEER", label: ROLE_LABELS.VOLUNTEER },
];

const userReport = {
  id: "users",
  title: "User Directory Report",
  description: "Everyone with an account, by role and account status.",
  icon: Users,
  accent: "#8E5BA8",
  dataKey: "users",
  dateHint: "Date filters use the day each account was created.",
  emptyText: "Try a different search, status or date range.",
  getDate: (r) => r.created_at,
  getStatus: (r) => r.status,
  statusOptions: withLabels(["ACTIVE", "INACTIVE"]),
  roleOptions: USER_ROLE_OPTIONS,
  getRole: (r) => r.role,
  searchFields: (r) => [r.name, r.email, r.role, r.city],
  defaultSort: { key: "Registration Date", dir: "desc" },
  columns: [
    textColumn("User Name", (r) => r.name),
    textColumn("Role", (r) => ROLE_LABELS[r.role] || r.role),
    // Only NGO and volunteer profiles store a city
    textColumn("City", (r) => r.city),
    dateColumn("Registration Date", (r) => r.created_at),
    statusColumn("Account Status", (r) => r.status),
  ],
  kpis: (rows) => [
    kpi("Total Users", rows.length, "All accounts in this view", Users),
    kpi("Food Donors", countWhere(rows, (r) => r.role, "DONOR"), "Donor accounts", UserCheck),
    kpi("NGOs", countWhere(rows, (r) => r.role, "NGO"), "Receiving organisations", HeartHandshake),
    kpi("Volunteers", countWhere(rows, (r) => r.role, "VOLUNTEER"), "Volunteer accounts", Truck),
    kpi("Administrators", countWhere(rows, (r) => r.role, "ADMIN"), "Platform admins", Shield),
  ],
  charts: [
    {
      id: "roles",
      title: "Users by role",
      subtitle: "Accounts for each role",
      build: (rows) => {
        const counts = countBy(rows, (r) => r.role);
        return {
          kind: "bars",
          emptyText: "No users in this view",
          items: USER_ROLE_OPTIONS.map((option, i) => ({
            label: option.label,
            value: counts[option.value] || 0,
            color: colorFor(i),
          })),
        };
      },
    },
    {
      id: "status",
      title: "Account status",
      subtitle: "Active and inactive accounts",
      build: (rows) => ({
        kind: "donut",
        centerLabel: "accounts",
        slices: toSlices(
          countBy(rows, (r) => r.status),
          withLabels(["ACTIVE", "INACTIVE"]),
          colorFor
        ),
      }),
    },
  ],
};

export const REPORT_CONFIGS = [donationReport, pickupReport, ngoReport, userReport];
