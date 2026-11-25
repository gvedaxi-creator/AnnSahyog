// ======================================================
// Lightweight chart components for the admin Reports page.
// No chart library: donut uses SVG, bars use CSS.
// ======================================================

export const CHART_COLORS = [
  "#1F6F4A", // green
  "#E07A2E", // orange
  "#D9A21B", // mango
  "#2E5395", // blue
  "#8E5BA8", // purple
  "#C0392B", // red
];

export const colorFor = (index) => CHART_COLORS[index % CHART_COLORS.length];

// Donut chart: slices = [{ label, value, color }]
export function DonutChart({ slices, centerLabel }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;

  // Each slice starts where the previous one ends
  const segments = slices.reduce((acc, slice) => {
    const length = total ? (slice.value / total) * circumference : 0;
    const previous = acc[acc.length - 1];
    const offset = previous ? previous.offset + previous.length : 0;
    acc.push({ ...slice, length, offset });
    return acc;
  }, []);

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 120 120" className="donut-svg" role="img" aria-label={`${centerLabel}: ${total}`}>
        <circle cx="60" cy="60" r={radius} className="donut-track" />
        {segments
          .filter((segment) => segment.length > 0)
          .map((segment) => (
            <circle
              key={segment.label}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="16"
              strokeDasharray={`${segment.length} ${circumference - segment.length}`}
              strokeDashoffset={-segment.offset}
              transform="rotate(-90 60 60)"
            />
          ))}
        <text x="60" y="60" textAnchor="middle" className="donut-value">
          {total}
        </text>
        <text x="60" y="76" textAnchor="middle" className="donut-caption">
          {centerLabel}
        </text>
      </svg>

      <ul className="chart-legend">
        {slices.map((slice) => (
          <li key={slice.label}>
            <span className="legend-dot" style={{ background: slice.color }} />
            <span className="legend-label">{slice.label}</span>
            <strong>{slice.value}</strong>
            <span className="legend-pct">
              {total ? Math.round((slice.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Horizontal bars: items = [{ label, value, color }]
export function BarList({ items, emptyText = "No data yet" }) {
  if (items.length === 0) {
    return <p className="chart-empty">{emptyText}</p>;
  }
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <ul className="bar-list">
      {items.map((item) => (
        <li key={item.label} className="bar-list-row">
          <span className="bar-list-label">{item.label}</span>
          <span className="bar-list-track">
            <span
              className="bar-list-fill"
              style={{ width: `${(item.value / max) * 100}%`, background: item.color }}
            />
          </span>
          <strong className="bar-list-value">{item.value}</strong>
        </li>
      ))}
    </ul>
  );
}

// Vertical columns: columns = [{ label, value }]
export function ColumnChart({ columns, emptyText = "No data yet", color = "var(--emerald)" }) {
  if (columns.length === 0) {
    return <p className="chart-empty">{emptyText}</p>;
  }
  const max = Math.max(1, ...columns.map((column) => column.value));

  return (
    <div className="column-chart">
      {columns.map((column) => (
        <div className="column-item" key={column.label} title={`${column.label}: ${column.value}`}>
          <span className="column-value">{column.value}</span>
          <div className="column-track">
            <div
              className="column-fill"
              style={{ height: `${(column.value / max) * 100}%`, background: color }}
            />
          </div>
          <span className="column-label">{column.label}</span>
        </div>
      ))}
    </div>
  );
}

// Percentage meter: value out of total, e.g. delivered pickups
export function RateMeter({ value, total, label, note }) {
  const rate = total ? Math.round((value / total) * 100) : 0;

  return (
    <div className="rate-meter">
      <div className="rate-meter-value">
        <strong>{rate}%</strong>
        <span>{label}</span>
      </div>
      <div
        className="rate-meter-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rate}
      >
        <div className="rate-meter-fill" style={{ width: `${rate}%` }} />
      </div>
      <p className="chart-sub rate-meter-note">{note}</p>
    </div>
  );
}
