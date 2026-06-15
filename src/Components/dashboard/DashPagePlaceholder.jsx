import DashNavbar from "../layout/DashNavbar";

const DashPagePlaceholder = ({ title, icon = "bi-tools" }) => (
  <div className="dash-root">
    <DashNavbar />
    <div className="dash-body">
      <main className="dash-main" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <i
            className={`bi ${icon}`}
            style={{ fontSize: "3.5rem", color: "#30a46c", display: "block", marginBottom: "1.25rem" }}
          />
          <h2 style={{ color: "#e6edf3", marginBottom: "0.75rem", fontWeight: 600 }}>{title}</h2>
          <p style={{ color: "#8b949e", maxWidth: "400px", margin: "0 auto", lineHeight: 1.6 }}>
            This feature is currently under development and will be available in an upcoming release.
          </p>
        </div>
      </main>
    </div>
  </div>
);

export default DashPagePlaceholder;
