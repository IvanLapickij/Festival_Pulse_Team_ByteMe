const areaShapes = [
  { name: "Main Stage", x: 56, y: 62, width: 300, height: 170 },
  { name: "Food Village", x: 540, y: 54, width: 300, height: 150 },
  { name: "Dance Tent", x: 88, y: 324, width: 248, height: 170 },
  { name: "Bar Area", x: 396, y: 348, width: 222, height: 130 },
  { name: "Entrance / Exit", x: 666, y: 386, width: 190, height: 104 }
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
    <div class="map-layout">
      <section class="panel map-panel">
        <div class="panel-heading">
          <h2>Festival Map</h2>
          <div class="legend">
            ${badge("LOW", "level-low")}
            ${badge("MEDIUM", "level-medium")}
            ${badge("FULL", "level-full")}
          </div>
        </div>
        <div class="map-frame"></div>
      </section>

      <aside class="panel report-panel">
        <h2>Submit Crowd Report</h2>
        <form id="report-form" class="report-form">
          <label for="area-select">Area</label>
          <select id="area-select" required></select>

          <label for="crowd-level">Crowd level</label>
          <select id="crowd-level" required>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="FULL">FULL</option>
          </select>

          <label for="steward">Reported by</label>
          <input id="steward" type="text" maxlength="100" placeholder="Optional">

          <button type="submit">Submit Report</button>
        </form>
        <p id="form-message" class="form-message" aria-live="polite"></p>
      </aside>
    </div>
  `;

  const mapFrame = pages.areas.querySelector(".map-frame");
  mapFrame.appendChild(mapTemplate.content.cloneNode(true));
  const mapAreas = pages.areas.querySelector("#map-areas");
  const areaSelect = pages.areas.querySelector("#area-select");

  state.areas.forEach((area, index) => {
    const shape = shapeFor(area, index);
    const option = document.createElement("option");
    option.value = area.id;
    option.textContent = area.name;
    areaSelect.appendChild(option);

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.classList.add("map-area");
    group.addEventListener("click", () => {
      areaSelect.value = area.id;
    });

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", shape.x);
    rect.setAttribute("y", shape.y);
    rect.setAttribute("width", shape.width);
    rect.setAttribute("height", shape.height);
    rect.setAttribute("rx", "10");
    rect.setAttribute("class", `area-shape ${levelClass(area.currentCrowdLevel)}`);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", shape.x + shape.width / 2);
    label.setAttribute("y", shape.y + shape.height / 2 - 8);
    label.setAttribute("class", "area-label");
    label.textContent = area.name;

    const level = document.createElementNS("http://www.w3.org/2000/svg", "text");
    level.setAttribute("x", shape.x + shape.width / 2);
    level.setAttribute("y", shape.y + shape.height / 2 + 20);
    level.setAttribute("class", "area-level");
    level.textContent = area.currentCrowdLevel;

    group.append(rect, label, level);
    mapAreas.appendChild(group);
  });

  pages.areas.querySelector("#report-form").addEventListener("submit", submitReport);
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

async function submitReport(event) {
  event.preventDefault();
  const formMessage = pages.areas.querySelector("#form-message");
  formMessage.textContent = "";

  const payload = {
    areaId: Number(pages.areas.querySelector("#area-select").value),
    crowdLevel: pages.areas.querySelector("#crowd-level").value,
    steward: pages.areas.querySelector("#steward").value || null
  };

  const response = await fetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    formMessage.textContent = "Report could not be submitted.";
    return;
  }

  formMessage.textContent = "Report submitted.";
  await loadData();
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
