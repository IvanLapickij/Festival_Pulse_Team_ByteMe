const areaShapes = [
  { name: "Main Stage",    x: 56,  y: 62,  width: 300, height: 170, icon: "🎤" },
  { name: "Food Village",  x: 540, y: 54,  width: 300, height: 150, icon: "🍔" },
  { name: "Dance Tent",    x: 88,  y: 324, width: 248, height: 170, icon: "🎧" },
  { name: "Bar Area",      x: 396, y: 348, width: 222, height: 130, icon: "🍺" },
  { name: "Entrance / Exit", x: 666, y: 386, width: 190, height: 104, icon: "🚪" }
];

const state = {
  areas: [],
  reports: [],
  alerts: [],
  activeAlerts: []
};

const pages = {
  dashboard: document.querySelector("#dashboard-page"),
  areas: document.querySelector("#areas-page"),
  reports: document.querySelector("#reports-page"),
  detail: document.querySelector("#report-detail-page"),
  alerts: document.querySelector("#alerts-page")
};

const pageTitle = document.querySelector("#page-title");
const pageKicker = document.querySelector("#page-kicker");
const refreshButton = document.querySelector("#refresh-button");
const mapTemplate = document.querySelector("#festival-map-template");

function levelClass(level) {
  return `level-${String(level || "LOW").toLowerCase()}`;
}

function statusClass(status) {
  return `status-${String(status || "ACTIVE").toLowerCase()}`;
}

function formatDate(value) {
  if (!value) {
    return "Not recorded";
  }

  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getReportNote(report) {
  return report.note || report.notes || report.message || "No note";
}

function getReporter(report) {
  return report.reportedBy || report.steward || "Unassigned";
}

function shapeFor(area, index) {
  return areaShapes.find((shape) => shape.name === area.name) || {
    x: 70 + (index % 3) * 270,
    y: 80 + Math.floor(index / 3) * 172,
    width: 230,
    height: 126
  };
}

function sortedReports() {
  return [...state.reports].sort((a, b) => new Date(b.reportedAt || 0) - new Date(a.reportedAt || 0));
}

function sortedAlerts() {
  return [...state.alerts].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function countAreasByLevel(level) {
  return state.areas.filter((area) => area.currentCrowdLevel === level).length;
}

function badge(text, className) {
  return `<span class="badge ${className}">${escapeHtml(text)}</span>`;
}

function emptyState(text) {
  return `<div class="empty-state">${text}</div>`;
}

function activatePage(route) {
  Object.values(pages).forEach((page) => {
    page.hidden = true;
  });

  const isDetail = route.startsWith("reports/");
  const activePage = isDetail ? pages.detail : pages[route] || pages.dashboard;
  activePage.hidden = false;

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.route === (isDetail ? "reports" : route));
  });
}

function setHeading(kicker, title) {
  pageKicker.textContent = kicker;
  pageTitle.textContent = title;
}

function renderDashboard() {
  setHeading("Overview", "Festival Pulse Dashboard");
  pages.dashboard.innerHTML = `
    <div class="welcome-panel">
      <div>
        <p class="kicker">Command Centre</p>
        <h2>Festival Pulse Dashboard</h2>
        <p>Monitor crowd levels, review recent reports, and respond to active alerts from one clean operations view.</p>
      </div>
    </div>

    <div class="summary-grid">
      <article class="summary-card">
        <span>Total Areas</span>
        <strong>${state.areas.length}</strong>
      </article>
      <article class="summary-card">
        <span>Active Alerts</span>
        <strong>${state.activeAlerts.length}</strong>
      </article>
      <article class="summary-card">
        <span>Full Areas</span>
        <strong>${countAreasByLevel("FULL")}</strong>
      </article>
      <article class="summary-card">
        <span>Recent Reports</span>
        <strong>${state.reports.length}</strong>
      </article>
    </div>

    <div class="content-grid">
      <section class="panel">
        <div class="panel-heading">
          <h2>Latest Reports</h2>
          <a class="text-link" href="#reports">View all</a>
        </div>
        ${renderReportTable(sortedReports().slice(0, 5), true)}
      </section>

      <section class="panel">
        <div class="panel-heading">
          <h2>Active Alerts</h2>
          <a class="text-link" href="#alerts">View all</a>
        </div>
        ${renderAlertList(state.activeAlerts.slice(0, 4), false)}
      </section>
    </div>
  `;
}

function renderAreas() {
  setHeading("Live Map", "Festival Areas");
  pages.areas.innerHTML = `
    <section class="panel map-panel-full">
      <div class="panel-heading">
        <h2>Festival Map</h2>
        <div class="legend">
          ${badge("LOW", "level-low")}
          ${badge("MEDIUM", "level-medium")}
          ${badge("FULL", "level-full")}
          <span class="live-badge">● LIVE</span>
        </div>
      </div>
      <div class="map-frame"></div>
    </section>
  `;

  const mapFrame = pages.areas.querySelector(".map-frame");
  mapFrame.appendChild(mapTemplate.content.cloneNode(true));
  const mapAreas = pages.areas.querySelector("#map-areas");
  const ns = "http://www.w3.org/2000/svg";

  state.areas.forEach((area, index) => {
    const shape = shapeFor(area, index);
    const crowdLevel = area.currentCrowdLevel || "UNKNOWN";
    const hasAlert = state.activeAlerts.some((a) => a.area?.id === area.id);
    const cx = shape.x + shape.width / 2;
    const cy = shape.y + shape.height / 2;

    const group = document.createElementNS(ns, "g");
    group.classList.add("map-area");
    group.setAttribute("role", "img");
    group.setAttribute("aria-label", `${area.name} — ${crowdLevel}`);

    const rect = document.createElementNS(ns, "rect");
    rect.setAttribute("x", shape.x);
    rect.setAttribute("y", shape.y);
    rect.setAttribute("width", shape.width);
    rect.setAttribute("height", shape.height);
    rect.setAttribute("rx", "12");
    rect.setAttribute("class", `area-shape level-${crowdLevel.toLowerCase()}`);

    const icon = document.createElementNS(ns, "text");
    icon.setAttribute("x", cx);
    icon.setAttribute("y", cy - 22);
    icon.setAttribute("class", "area-icon");
    icon.textContent = shape.icon || "";

    const label = document.createElementNS(ns, "text");
    label.setAttribute("x", cx);
    label.setAttribute("y", cy + 6);
    label.setAttribute("class", "area-label");
    label.textContent = area.name;

    const levelText = document.createElementNS(ns, "text");
    levelText.setAttribute("x", cx);
    levelText.setAttribute("y", cy + 24);
    levelText.setAttribute("class", "area-level");
    levelText.textContent = crowdLevel;

    group.append(rect, icon, label, levelText);

    if (hasAlert) {
      const bx = shape.x + shape.width - 14;
      const by = shape.y + 14;
      const pulse = document.createElementNS(ns, "circle");
      pulse.setAttribute("cx", bx);
      pulse.setAttribute("cy", by);
      pulse.setAttribute("r", "7");
      pulse.setAttribute("class", "alert-dot");
      const dot = document.createElementNS(ns, "circle");
      dot.setAttribute("cx", bx);
      dot.setAttribute("cy", by);
      dot.setAttribute("r", "5");
      dot.setAttribute("class", "alert-dot-inner");
      group.append(pulse, dot);
    }

    mapAreas.appendChild(group);
  });
}

function renderReportTable(reports, compact = false) {
  if (reports.length === 0) {
    return emptyState("No crowd reports yet.");
  }

  return `
    <div class="table-wrap">
      <table class="${compact ? "compact-table" : ""}">
        <thead>
          <tr>
            <th>Time</th>
            <th>Area</th>
            <th>Crowd Level</th>
            <th>Note</th>
            <th>Reported By</th>
          </tr>
        </thead>
        <tbody>
          ${reports.map((report) => `
            <tr class="clickable-row" data-report-id="${report.id}">
              <td>${formatDate(report.reportedAt)}</td>
              <td>${escapeHtml(report.area?.name || "Unknown area")}</td>
              <td>${badge(report.crowdLevel, levelClass(report.crowdLevel))}</td>
              <td>${escapeHtml(getReportNote(report))}</td>
              <td>${escapeHtml(getReporter(report))}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function bindReportRows(container) {
  container.querySelectorAll(".clickable-row").forEach((row) => {
    row.addEventListener("click", () => {
      window.location.hash = `reports/${row.dataset.reportId}`;
    });
  });
}

function renderReports() {
  setHeading("Crowd Reports", "Reports");
  pages.reports.innerHTML = `
    <section class="panel">
      <div class="panel-heading">
        <h2>Recent Crowd Reports</h2>
        <span class="count-pill">${state.reports.length} total</span>
      </div>
      ${renderReportTable(sortedReports())}
    </section>
  `;
  bindReportRows(pages.reports);
}

function renderReportDetail(reportId) {
  const report = state.reports.find((item) => String(item.id) === String(reportId));
  setHeading("Report Details", report ? `${report.area?.name || "Area"} Report` : "Report Details");

  if (!report) {
    pages.detail.innerHTML = `
      <section class="panel">
        ${emptyState("Report not found.")}
        <a class="button-link" href="#reports">Back to reports</a>
      </section>
    `;
    return;
  }

  const relatedAlert = state.alerts.find((alert) => alert.area?.id === report.area?.id && alert.status === "ACTIVE");
  pages.detail.innerHTML = `
    <section class="detail-grid">
      <article class="panel detail-card primary-detail">
        <div class="detail-header">
          <div>
            <p class="kicker">Area</p>
            <h2>${escapeHtml(report.area?.name || "Unknown area")}</h2>
          </div>
          ${badge(report.crowdLevel, levelClass(report.crowdLevel))}
        </div>
        <dl class="detail-list">
          <div>
            <dt>Note</dt>
            <dd>${escapeHtml(getReportNote(report))}</dd>
          </div>
          <div>
            <dt>Reported by</dt>
            <dd>${escapeHtml(getReporter(report))}</dd>
          </div>
          <div>
            <dt>Reported time</dt>
            <dd>${formatDate(report.reportedAt)}</dd>
          </div>
          <div>
            <dt>Alert status</dt>
            <dd>${relatedAlert ? badge(relatedAlert.status, statusClass(relatedAlert.status)) : "No active alert"}</dd>
          </div>
        </dl>
      </article>

      <aside class="panel detail-card">
        <h2>Area Status</h2>
        <p class="detail-note">${escapeHtml(relatedAlert ? relatedAlert.message : "No active alert is linked to this area.")}</p>
        <a class="button-link" href="#reports">Back to reports</a>
      </aside>
    </section>
  `;
}

function renderAlertList(alerts, showResolve = true) {
  if (alerts.length === 0) {
    return emptyState("No alerts to show.");
  }

  return `
    <div class="alert-list">
      ${alerts.map((alert) => `
        <article class="alert-card ${statusClass(alert.status)}">
          <div>
            <div class="alert-card-title">${escapeHtml(alert.area?.name || "Unknown area")}</div>
            <p>${escapeHtml(alert.message)}</p>
            <span>${formatDate(alert.createdAt)}</span>
          </div>
          <div class="alert-actions">
            ${badge(alert.status, statusClass(alert.status))}
            ${showResolve && alert.status === "ACTIVE" ? `<button type="button" data-alert-id="${alert.id}" class="resolve-button">Resolve</button>` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderAlerts() {
  setHeading("Alert Centre", "Alerts");
  pages.alerts.innerHTML = `
    <section class="panel">
      <div class="panel-heading">
        <h2>All Alerts</h2>
        <span class="count-pill">${state.alerts.length} total</span>
      </div>
      ${renderAlertList(sortedAlerts(), true)}
    </section>
  `;

  pages.alerts.querySelectorAll(".resolve-button").forEach((button) => {
    button.addEventListener("click", () => resolveAlert(button.dataset.alertId));
  });
}

function renderRoute() {
  const route = (window.location.hash || "#dashboard").slice(1);
  activatePage(route);

  if (route === "areas") {
    renderAreas();
  } else if (route === "reports") {
    renderReports();
  } else if (route.startsWith("reports/")) {
    renderReportDetail(route.split("/")[1]);
  } else if (route === "alerts") {
    renderAlerts();
  } else {
    renderDashboard();
    bindReportRows(pages.dashboard);
  }
}

async function loadJson(path, fallback) {
  const response = await fetch(path);
  if (!response.ok) {
    return fallback;
  }
  return response.json();
}

async function loadData() {
  const dashboard = await loadJson("/api/dashboard", { areas: [], reports: [], activeAlerts: [] });
  state.areas = dashboard.areas || [];
  state.reports = dashboard.reports || [];
  state.activeAlerts = dashboard.activeAlerts || [];
  state.alerts = await loadJson("/api/alerts", state.activeAlerts);
  renderRoute();
}

async function resolveAlert(id) {
  const response = await fetch(`/api/alerts/${id}/resolve`, { method: "PUT" });
  if (response.ok) {
    await loadData();
  }
}

window.addEventListener("hashchange", renderRoute);
refreshButton.addEventListener("click", loadData);
loadData().catch(() => {
  pages.dashboard.innerHTML = emptyState("Dashboard could not be loaded.");
});

// Auto-refresh every 15 s so steward reports appear without manual refresh
setInterval(() => loadData().catch(() => {}), 15000);
