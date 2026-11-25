import { useMemo, useState } from "react";
import { Search, X, Download, ArrowUpDown, ChevronLeft, ChevronRight, RotateCcw, BarChart3 } from "lucide-react";
import { DonutChart, BarList, ColumnChart, RateMeter } from "../../../components/AdminCharts";
import {
  DATE_PRESETS,
  PAGE_SIZE,
  buildCsv,
  compareForSort,
  downloadCsv,
  isWithinRange,
  text,
  toIsoDay,
} from "./reportUtils";

const NO_RANGE = { from: "", to: "" };

// Draws one chart; shows a message instead when there is nothing to plot
function ChartBody({ data }) {
  const total =
    data.kind === "donut"
      ? data.slices.reduce((sum, slice) => sum + slice.value, 0)
      : data.kind === "bars"
      ? data.items.reduce((sum, item) => sum + item.value, 0)
      : data.kind === "columns"
      ? data.columns.reduce((sum, column) => sum + column.value, 0)
      : 1;

  if (total === 0) {
    return <p className="chart-empty">{data.emptyText || "No data for these filters"}</p>;
  }

  if (data.kind === "donut") {
    return <DonutChart slices={data.slices} centerLabel={data.centerLabel} />;
  }
  if (data.kind === "bars") {
    return <BarList items={data.items} emptyText={data.emptyText} />;
  }
  if (data.kind === "columns") {
    return <ColumnChart columns={data.columns} color={data.color} emptyText={data.emptyText} />;
  }
  if (data.kind === "rate") {
    return <RateMeter value={data.value} total={data.total} label={data.label} note={data.note} />;
  }
  return null;
}

// One report: its own KPIs, charts, filters and table.
// Mounted with key={report.id} so switching reports resets all state.
export default function ReportView({ report, rows, loading, loadedAt }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [datePreset, setDatePreset] = useState("ALL");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [sort, setSort] = useState(report.defaultSort);
  const [page, setPage] = useState(1);

  const range = useMemo(() => {
    if (datePreset === "ALL") return NO_RANGE;
    if (datePreset === "CUSTOM") return { from: customFrom, to: customTo };
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - (Number(datePreset) - 1));
    return { from: toIsoDay(from), to: toIsoDay(to) };
  }, [datePreset, customFrom, customTo]);

  const rangeInvalid =
    datePreset === "CUSTOM" && Boolean(customFrom && customTo) && customFrom > customTo;

  const filteredRows = useMemo(() => {
    if (rangeInvalid) return [];
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "ALL" && report.getStatus(row) !== statusFilter) return false;
      if (roleFilter !== "ALL" && report.getRole && report.getRole(row) !== roleFilter) return false;
      if (q && !report.searchFields(row).some((value) => text(value).toLowerCase().includes(q))) {
        return false;
      }
      return isWithinRange(report.getDate(row), range.from, range.to);
    });
  }, [rows, report, search, statusFilter, roleFilter, range, rangeInvalid]);

  const sortedRows = useMemo(() => {
    const column = report.columns.find((c) => c.label === sort.key);
    if (!column || !column.sort) return filteredRows;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => compareForSort(column.sort(a), column.sort(b), dir));
  }, [filteredRows, report, sort]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = sortedRows.slice(pageStart, pageStart + PAGE_SIZE);

  const kpis = useMemo(() => report.kpis(filteredRows), [report, filteredRows]);
  const charts = useMemo(
    () => report.charts.map((chart) => ({ ...chart, data: chart.build(filteredRows) })),
    [report, filteredRows]
  );

  const filtersActive = Boolean(search) || statusFilter !== "ALL" || roleFilter !== "ALL" || datePreset !== "ALL";

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setRoleFilter("ALL");
    setDatePreset("ALL");
    setCustomFrom("");
    setCustomTo("");
    setPage(1);
  };

  const toggleSort = (label) => {
    setPage(1);
    setSort((current) =>
      current.key === label
        ? { key: label, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key: label, dir: "asc" }
    );
  };

  const exportCsv = () => {
    const columns = report.columns.filter((column) => column.csv);
    const header = columns.map((column) => column.label);
    const body = sortedRows.map((row) => columns.map((column) => column.csv(row)));
    const date = toIsoDay(new Date());
    downloadCsv(`annsahyog-${report.id}-report-${date}.csv`, buildCsv(header, body));
  };

  return (
    <div className="report-view" style={{ "--accent": report.accent }}>
      <header className="report-view-head">
        <div>
          <h2>{report.title}</h2>
          <p>{report.description}</p>
        </div>
        <div className="report-meta">
          <span>
            Showing {sortedRows.length} of {rows.length} records
          </span>
          <span>Updated {loadedAt ? loadedAt.toLocaleTimeString() : "—"}</span>
        </div>
      </header>

      <div className="report-kpis">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <div className="kpi-card" key={item.label}>
              <span className="kpi-icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <div className="kpi-body">
                <span className="kpi-label">{item.label}</span>
                <strong className="kpi-value">{loading ? "—" : item.value}</strong>
                <small className="kpi-note">{item.note}</small>
              </div>
            </div>
          );
        })}
      </div>

      <div className="report-charts">
        {charts.map((chart) => (
          <div className="chart-card" key={chart.id}>
            <h3>{chart.title}</h3>
            <p className="chart-sub">{chart.subtitle}</p>
            {loading ? <p className="chart-empty">Loading…</p> : <ChartBody data={chart.data} />}
          </div>
        ))}
      </div>

      <section className="report-table-card" aria-label={`${report.title} records`}>
        <div className="report-toolbar">
          <div className="report-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="text"
              placeholder={`Search ${report.title.toLowerCase()}...`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              aria-label="Search report"
            />
            {search && (
              <button type="button" className="clear-search-btn" onClick={() => setSearch("")} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>

          <select
            className="admin-select"
            aria-label="Status filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All statuses</option>
            {report.statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {report.roleOptions && (
            <select
              className="admin-select"
              aria-label="Role filter"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All roles</option>
              {report.roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          <select
            className="admin-select"
            aria-label="Date range"
            value={datePreset}
            onChange={(e) => {
              setDatePreset(e.target.value);
              setPage(1);
            }}
          >
            {DATE_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>

          {datePreset === "CUSTOM" && (
            <div className="report-custom-dates">
              <input
                type="date"
                aria-label="From date"
                value={customFrom}
                max={customTo || undefined}
                onChange={(e) => {
                  setCustomFrom(e.target.value);
                  setPage(1);
                }}
              />
              <span>to</span>
              <input
                type="date"
                aria-label="To date"
                value={customTo}
                min={customFrom || undefined}
                onChange={(e) => {
                  setCustomTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          )}

          {rangeInvalid && (
            <div className="auth-alert alert-error" role="alert" style={{ marginTop: "0.5rem" }}>
              From date cannot be after To date.
            </div>
          )}

          {filtersActive && (
            <button type="button" className="btn btn-light btn-sm" onClick={resetFilters}>
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary report-export"
            onClick={exportCsv}
            disabled={loading || sortedRows.length === 0}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>

        <p className="report-hint">{report.dateHint}</p>

        {loading ? (
          <div className="admin-loading-state">
            <p>Loading report data...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="admin-empty-state">
            <div className="empty-icon">
              <BarChart3 size={26} />
            </div>
            <h3>No records yet</h3>
            <p>Nothing has been added for this report.</p>
          </div>
        ) : sortedRows.length === 0 ? (
          <div className="admin-empty-state">
            <div className="empty-icon">
              <BarChart3 size={26} />
            </div>
            <h3>No records match these filters</h3>
            <p>{report.emptyText}</p>
            <button type="button" className="btn btn-secondary" onClick={resetFilters}>
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-table report-table">
                <thead>
                  <tr>
                    {report.columns.map((column) => {
                      const active = sort.key === column.label;
                      return (
                        <th
                          key={column.label}
                          aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                        >
                          {column.sort ? (
                            <button type="button" className="sort-btn" onClick={() => toggleSort(column.label)}>
                              <span>{column.label}</span>
                              <ArrowUpDown size={13} className={active ? "is-active" : undefined} aria-hidden="true" />
                            </button>
                          ) : (
                            column.label
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, index) => (
                    <tr key={`${report.id}-${pageStart + index}`}>
                      {report.columns.map((column) => (
                        <td key={column.label}>{column.render(row)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Print copy: every matching row, not just the current page */}
            <div className="report-print-only" aria-hidden="true">
              <h2 className="report-print-title">{report.title}</h2>
              <p className="report-print-meta">
                {sortedRows.length} records{filtersActive ? " (filtered)" : ""} · Printed {new Date().toLocaleString("en-IN")}
              </p>
              <table className="report-print-table">
                <thead>
                  <tr>
                    {report.columns.map((column) => (
                      <th key={column.label}>{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row, index) => (
                    <tr key={`print-${report.id}-${index}`}>
                      {report.columns.map((column) => (
                        <td key={column.label}>{column.render(row)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="report-pager">
              <span>
                Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, sortedRows.length)} of {sortedRows.length} · Page {currentPage} of {pageCount}
              </span>
              <div className="report-pager-buttons">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage >= pageCount}
                  onClick={() => setPage(currentPage + 1)}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
