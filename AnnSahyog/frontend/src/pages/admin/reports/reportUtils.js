// Shared helpers for the admin Reports pages.

export const PAGE_SIZE = 10;
export const DAY_MS = 86400000;

export const DATE_PRESETS = [
  { value: "ALL", label: "All time" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "CUSTOM", label: "Custom range" },
];

export const text = (value) => (value === null || value === undefined ? "" : String(value));

// Milliseconds for a date value, or null when it is missing or invalid
export const timeOf = (value) => {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
};

export const formatDateTime = (value) => {
  const t = timeOf(value);
  return t === null ? "" : new Date(t).toLocaleString();
};

// YYYY-MM-DD in local time
export const toIsoDay = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

// Rows without a usable date are excluded whenever a range is set
export const isWithinRange = (value, from, to) => {
  if (!from && !to) return true;
  const t = timeOf(value);
  if (t === null) return false;
  if (from && t < new Date(`${from}T00:00:00`).getTime()) return false;
  if (to && t > new Date(`${to}T23:59:59.999`).getTime()) return false;
  return true;
};

// { ACTIVE: 3, PENDING: 1 } from rows, skipping empty keys
export const countBy = (rows, getKey) =>
  rows.reduce((acc, row) => {
    const key = getKey(row);
    if (key === null || key === undefined || key === "") return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

export const countWhere = (rows, get, value) =>
  rows.reduce((count, row) => (get(row) === value ? count + 1 : count), 0);

// Chart slices in a fixed order: options = [{ value, label }]
export const toSlices = (counts, options, colorFor) =>
  options.map((option, index) => ({
    label: option.label,
    value: counts[option.value] || 0,
    color: colorFor(index),
  }));

// Largest groups first; the rest are merged into "Other"
export const topGroups = (rows, getLabel, limit = 8, fallback = "Not recorded") => {
  const groups = new Map();
  rows.forEach((row) => {
    const label = text(getLabel(row)).trim() || fallback;
    const key = label.toLowerCase();
    const group = groups.get(key) || { label, value: 0 };
    group.value += 1;
    groups.set(key, group);
  });

  const sorted = [...groups.values()].sort((a, b) => b.value - a.value);
  if (sorted.length <= limit) return sorted;

  const other = sorted.slice(limit).reduce((sum, group) => sum + group.value, 0);
  return [...sorted.slice(0, limit), { label: "Other", value: other }];
};

export const WAIT_BUCKETS = ["Under 3 days", "3–6 days", "1–2 weeks", "Over 2 weeks"];

export const waitingBucket = (value) => {
  const t = timeOf(value);
  if (t === null) return null;
  const days = Math.floor((Date.now() - t) / DAY_MS);
  if (days < 3) return WAIT_BUCKETS[0];
  if (days < 7) return WAIT_BUCKETS[1];
  if (days < 14) return WAIT_BUCKETS[2];
  return WAIT_BUCKETS[3];
};

const isEmpty = (value) =>
  value === null || value === undefined || value === "" || (typeof value === "number" && Number.isNaN(value));

// dir: 1 for ascending, -1 for descending. Empty values always sort last.
export const compareForSort = (a, b, dir) => {
  const aEmpty = isEmpty(a);
  const bEmpty = isEmpty(b);
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;
  if (typeof a === "number" && typeof b === "number") return (a - b) * dir;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" }) * dir;
};

export const csvCell = (value) => {
  const s = text(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const buildCsv = (header, rows) =>
  [header, ...rows].map((line) => line.map(csvCell).join(",")).join("\r\n");

export const downloadCsv = (filename, csv) => {
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
