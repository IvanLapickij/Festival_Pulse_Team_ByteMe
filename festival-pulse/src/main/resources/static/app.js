// Coordinate-based area definitions — fictional festival at Hyde Park, London
const FESTIVAL_CENTRE = [51.5074, -0.1278];
const AREA_COORDS = [
  { name: "Main Stage",      lat: 51.5092, lng: -0.1310, icon: "🎤", radius: 60 },
  { name: "Food Village",    lat: 51.5082, lng: -0.1245, icon: "🍔", radius: 45 },
  { name: "Dance Tent",      lat: 51.5058, lng: -0.1305, icon: "🎧", radius: 40 },
  { name: "Bar Area",        lat: 51.5065, lng: -0.1255, icon: "🍺", radius: 35 },
  { name: "Entrance / Exit", lat: 51.5048, lng: -0.1278, icon: "🚪", radius: 30 }
];
const CROWD_WEIGHTS = { LOW: 0.25, MEDIUM: 0.65, FULL: 1.0 };

// Legacy shape lookup kept for report table icon display
const areaShapes = [
  { name: "Main Stage",      x: 56,  y: 62,  width: 300, height: 170, icon: "🎤" },
  { name: "Food Village",    x: 540, y: 54,  width: 300, height: 150, icon: "🍔" },
  { name: "Dance Tent",      x: 88,  y: 324, width: 248, height: 170, icon: "🎧" },
  { name: "Bar Area",        x: 396, y: 348, width: 222, height: 130, icon: "🍺" },
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

function coordsFor(area) {
  return AREA_COORDS.find(c => c.name === area.name)
    || { lat: FESTIVAL_CENTRE[0] + (Math.random()-0.5)*0.01,
         lng: FESTIVAL_CENTRE[1] + (Math.random()-0.5)*0.01,
         icon: "📍", radius: 30 };
}

function buildHeatPoints(areas) {
  const pts = [];
  for (const area of areas) {
    const c = coordsFor(area);
    const w = CROWD_WEIGHTS[area.currentCrowdLevel] || 0.1;
    pts.push([c.lat, c.lng, w]);
    const jitter = area.currentCrowdLevel === "FULL" ? 8 : area.currentCrowdLevel === "MEDIUM" ? 5 : 2;
    for (let i = 0; i < jitter; i++) {
      pts.push([c.lat + (Math.random()-0.5)*0.0018, c.lng + (Math.random()-0.5)*0.0018, w * 0.6]);
    }
  }
  return pts;
}

function levelColour(level) {
  return level === "FULL" ? "#ef4444" : level === "MEDIUM" ? "#f59e0b" : "#22c55e";
}

let _orgMap = null;

function renderAreas() {
  setHeading("Live Map", "Festival Areas");
  let editMode = false;

  pages.areas.innerHTML = `
    <div class="org-map-shell">
      <div class="org-map-toolbar">
        <div class="legend">
          ${badge("LOW", "level-low")}
          ${badge("MEDIUM", "level-medium")}
          ${badge("FULL", "level-full")}
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="live-badge">● LIVE</span>
          <button id="edit-mode-btn" class="secondary-button" style="min-height:32px;padding:0 12px;font-size:12px">✏ Edit Map</button>
        </div>
      </div>
      <div class="org-map-body">
        <div id="festival-map-root"></div>
        <aside id="area-detail-panel" class="area-detail-panel" hidden>
          <button id="detail-close" class="detail-close" aria-label="Close">✕</button>
          <div id="detail-content"></div>
        </aside>
      </div>
    </div>
  `;

  document.getElementById("detail-close").addEventListener("click", () => {
    document.getElementById("area-detail-panel").hidden = true;
  });

  document.getElementById("edit-mode-btn").addEventListener("click", () => {
    editMode = !editMode;
    const btn = document.getElementById("edit-mode-btn");
    btn.textContent = editMode ? "✕ Exit Edit" : "✏ Edit Map";
    btn.style.background = editMode ? "#ef4444" : "";
    btn.style.color = editMode ? "#fff" : "";
    showEditPanel(editMode);
  });

  function showEditPanel(show) {
    const panel = document.getElementById("area-detail-panel");
    if (!show) { panel.hidden = true; return; }
    panel.hidden = false;
    document.getElementById("detail-content").innerHTML = `
      <div class="detail-area-name" style="margin-bottom:14px">Manage Areas</div>

      <div style="margin-bottom:16px">
        <div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Add New Area</div>
        <input id="new-area-name" type="text" placeholder="Area name"
          style="width:100%;background:#0d1117;border:1px solid #1e293b;border-radius:6px;color:#e2e8f0;font-size:13px;padding:8px 10px;margin-bottom:8px">
        <button id="add-area-btn" class="resolve-button" style="width:100%;background:#2dd4bf;color:#042f2e">+ Add Area</button>
        <p id="add-area-msg" style="font-size:12px;margin-top:6px;min-height:16px;color:#64748b"></p>
      </div>

      <div>
        <div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Existing Areas</div>
        <div id="area-edit-list"></div>
      </div>
    `;

    renderAreaEditList();

    document.getElementById("add-area-btn").addEventListener("click", async () => {
      const name = document.getElementById("new-area-name").value.trim();
      const msg  = document.getElementById("add-area-msg");
      if (!name) { msg.textContent = "Name is required."; return; }
      const res = await fetch("/api/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        document.getElementById("new-area-name").value = "";
        msg.textContent = "✓ Area added.";
        await loadData();
        renderAreaEditList();
      } else {
        msg.textContent = "Failed to add area.";
      }
    });
  }

  function renderAreaEditList() {
    const list = document.getElementById("area-edit-list");
    if (!list) return;
    list.innerHTML = state.areas.map(area => `
      <div class="edit-area-row" data-id="${area.id}">
        <input class="edit-area-input" value="${escapeHtml(area.name)}"
          style="flex:1;background:#0d1117;border:1px solid #1e293b;border-radius:6px;color:#e2e8f0;font-size:12px;padding:6px 8px">
        <button class="save-area-btn" data-id="${area.id}" title="Save"
          style="background:#2dd4bf;color:#042f2e;border:none;border-radius:6px;padding:6px 10px;cursor:pointer;font-weight:900">✓</button>
        <button class="del-area-btn" data-id="${area.id}" title="Delete"
          style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:6px 10px;cursor:pointer;font-weight:900">✕</button>
      </div>
    `).join("");

    list.querySelectorAll(".save-area-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const row  = btn.closest(".edit-area-row");
        const name = row.querySelector(".edit-area-input").value.trim();
        if (!name) return;
        const res = await fetch(`/api/areas/${btn.dataset.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name })
        });
        if (res.ok) { await loadData(); renderAreaEditList(); }
      });
    });

    list.querySelectorAll(".del-area-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this area?")) return;
        const res = await fetch(`/api/areas/${btn.dataset.id}`, { method: "DELETE" });
        if (res.ok) { await loadData(); renderAreaEditList(); }
      });
    });
  }

  if (_orgMap) { _orgMap.remove(); _orgMap = null; }

  _orgMap = L.map("festival-map-root", {
    center: FESTIVAL_CENTRE, zoom: 15, zoomControl: true, attributionControl: false
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(_orgMap);

  L.circle(FESTIVAL_CENTRE, {
    radius: 400, color: "#2dd4bf", weight: 2, dashArray: "8 6",
    fillColor: "#2dd4bf", fillOpacity: 0.04
  }).addTo(_orgMap);

  L.heatLayer(buildHeatPoints(state.areas), {
    radius: 55, blur: 40, maxZoom: 17,
    gradient: { 0.0: "#1a3a2a", 0.3: "#22c55e", 0.6: "#f59e0b", 0.85: "#ef4444", 1.0: "#fff" }
  }).addTo(_orgMap);

  state.areas.forEach(area => {
    const c = coordsFor(area);
    const level = area.currentCrowdLevel || "UNKNOWN";
    const hasAlert = state.activeAlerts.some(a => a.area?.id === area.id);

    if (level === "FULL") {
      L.circleMarker([c.lat, c.lng], {
        radius: 28, color: "#ef4444", weight: 2, fillOpacity: 0, className: "hotspot-pulse"
      }).addTo(_orgMap);
    }
    if (hasAlert) {
      L.circleMarker([c.lat, c.lng], {
        radius: 36, color: "#ef4444", weight: 2, fillOpacity: 0, className: "alert-ring"
      }).addTo(_orgMap);
    }

    const marker = L.marker([c.lat, c.lng], {
      icon: L.divIcon({
        className: "",
        html: `<div class="area-marker level-${level.toLowerCase()}${hasAlert ? " has-alert" : ""}">
                 <span class="marker-icon">${c.icon}</span>
                 <span class="marker-name">${area.name}</span>
                 <span class="marker-level">${level}</span>
               </div>`,
        iconAnchor: [60, 20]
      })
    }).addTo(_orgMap);

    marker.on("click", () => {
      if (editMode) return; // in edit mode, panel is already showing the edit list
      const alert = state.activeAlerts.find(a => a.area?.id === area.id);
      document.getElementById("detail-content").innerHTML = `
        <div class="detail-area-name">${escapeHtml(area.name)}</div>
        <div class="detail-level-badge ${levelClass(level)}">${level}</div>
        ${alert ? `<div class="detail-alert-box">
          <strong>⚠ Active Alert</strong>
          <p>${escapeHtml(alert.message)}</p>
          <button class="resolve-button" data-alert-id="${alert.id}">Resolve Alert</button>
        </div>` : "<p class='detail-no-alert'>No active alert</p>"}
        <p class="detail-coords">📍 ${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}</p>
      `;
      const panel = document.getElementById("area-detail-panel");
      panel.hidden = false;
      panel.querySelector(".resolve-button")?.addEventListener("click", async e => {
        await resolveAlert(e.target.dataset.alertId);
        panel.hidden = true;
      });
    });
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
