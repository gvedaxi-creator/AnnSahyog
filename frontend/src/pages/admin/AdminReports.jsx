import { useEffect, useState } from "react";
import BackButton from "../../components/BackButton";
import Footer from "../../components/Footer";
import AdminSidebar from "../../components/AdminSidebar";
import ReportView from "./reports/ReportView";
import { REPORT_CONFIGS } from "./reports/reportConfigs";
import { getAdminDonations, getAdminPickups, getAdminNgos, getAdminUsers } from "../../services/api";
import "../../styles/admin-reports.css";

// Results from a failed request become an empty list so one
// broken endpoint does not blank the whole page.
const pickList = (result, key) =>
  result.status === "fulfilled" ? result.value?.[key] || [] : [];

function AdminReports() {
  const [data, setData] = useState({ donations: [], pickups: [], ngos: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadedAt, setLoadedAt] = useState(null);
  const [activeId, setActiveId] = useState(REPORT_CONFIGS[0].id);

  useEffect(() => {
    const loadReportData = async () => {
      const results = await Promise.allSettled([
        getAdminDonations(),
        getAdminPickups(),
        getAdminNgos(),
        getAdminUsers(),
      ]);
      const [donations, pickups, ngos, users] = results;

      setData({
        donations: pickList(donations, "donations"),
        pickups: pickList(pickups, "pickups"),
        ngos: pickList(ngos, "ngos"),
        users: pickList(users, "users"),
      });

      const failedCount = results.filter((r) => r.status === "rejected").length;
      if (failedCount > 0) {
        setError(`${failedCount} of 4 data sources could not be loaded, so some reports may be incomplete.`);
      }
      setLoadedAt(new Date());
      setLoading(false);
    };

    loadReportData();
  }, []);

  const report = REPORT_CONFIGS.find((item) => item.id === activeId) || REPORT_CONFIGS[0];

  return (
    <div className="donor-layout admin-layout">
      <AdminSidebar />

      <main className="donor-main admin-main">
        <div className="dashboard-page admin-dashboard-page">
          <div className="container">
            <div className="page-back-bar">
              <BackButton />
            </div>

            <div className="dashboard-header admin-header">
              <div>
                <span className="dashboard-eyebrow admin-eyebrow">REPORTS & ANALYTICS</span>
                <h1>Reports & Analytics</h1>
                <p>Choose a report. Each one has its own measures, charts and filters, and can be exported as CSV.</p>
              </div>
              <div className="admin-header-actions">
                <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
                  <span>Print</span>
                </button>
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="report-picker" role="tablist" aria-label="Choose a report">
              {REPORT_CONFIGS.map((item) => {
                const Icon = item.icon;
                const isActive = item.id === report.id;
                const count = (data[item.dataKey] || []).length;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`report-option ${isActive ? "is-active" : ""}`}
                    style={{ "--accent": item.accent }}
                    onClick={() => setActiveId(item.id)}
                  >
                    <span className="report-option-icon">
                      <Icon size={18} />
                    </span>
                    <span className="report-option-title">{item.title}</span>
                    <span className="report-option-desc">{item.description}</span>
                    <span className="report-option-count">
                      {loading ? "Loading…" : `${count} record${count === 1 ? "" : "s"}`}
                    </span>
                  </button>
                );
              })}
            </div>

            <ReportView
              key={report.id}
              report={report}
              rows={data[report.dataKey] || []}
              loading={loading}
              loadedAt={loadedAt}
            />
          </div>
        </div>
        <Footer variant="app" />
      </main>
    </div>
  );
}

export default AdminReports;
