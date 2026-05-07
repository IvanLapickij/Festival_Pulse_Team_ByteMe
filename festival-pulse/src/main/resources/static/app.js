// ── Role-based access ────────────────────────────────────────────────────────
const role = sessionStorage.getItem('fpRole');
if (!role) { location.href = 'index.html'; }

const ROLE_LABELS     = { organiser: 'Organiser', steward: 'Steward', viewer: 'Viewer' };
const ROLE_DOT_COLORS = { organiser: '#7c3aed',   steward: '#1d4ed8',  viewer: '#059669' };

function initRole() {
  document.body.classList.add('role-' + role);
  document.querySelectorAll('.nav-link[data-roles]').forEach(link => {
    if (!link.dataset.roles.split(',').includes(role)) link.remove();
  });
  const label = document.getElementById('role-label');
  const dot   = document.getElementById('role-dot');
  if (label) label.textContent = ROLE_LABELS[role] || role;
  if (dot)   dot.style.background = ROLE_DOT_COLORS[role] || '#667085';
}
// ─────────────────────────────────────────────────────────────────────────────

// Festival centre: Athlone, County Westmeath, Ireland
const FESTIVAL_CENTRE = [53.4239, -7.9407];
const AREA_COORDS = [
  { name: "Main Stage",      lat: 53.4258, lng: -7.9440, type: "stage",    svgIcon: "stage"    },
  { name: "Food Village",    lat: 53.4248, lng: -7.9375, type: "food",     svgIcon: "food"     },
  { name: "Dance Tent",      lat: 53.4225, lng: -7.9435, type: "tent",     svgIcon: "tent"     },
  { name: "Bar Area",        lat: 53.4232, lng: -7.9380, type: "bar",      svgIcon: "bar"      },
  { name: "Entrance / Exit", lat: 53.4212, lng: -7.9407, type: "entrance", svgIcon: "entrance" }
];
const CROWD_WEIGHTS = { LOW: 0.25, MEDIUM: 0.65, FULL: 1.0 };

// SVG icons for venue pins
const VENUE_SVGS = {
  stage:    `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l9 7H3l9-7zm0 2.5L5.5 10h13L12 5.5zM3 11h18v2H3v-2zm2 3h14v7H5v-7zm2 2v3h10v-3H7z"/></svg>`,
  food:     `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7c0-8-15.03-8-15.03 0h15.03zM1.02 17h15v2h-15z"/></svg>`,
  tent:     `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 19h20L12 2zm0 3.5L19.5 19h-15L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>`,
  bar:      `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 3H4v2l6.5 9V19H8v2h8v-2h-2.5v-5L20 5V3zm-2.5 2l-2 3h-7l-2-3h11z"/></svg>`,
  entrance: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 19v-5h4v5c0 .55.45 1 1 1h3c.55 0 1-.45 1-1V7c0-.55-.45-1-1-1h-3c-.55 0-1 .45-1 1v5h-4V7c0-.55-.45-1-1-1H6c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h3c.55 0 1-.45 1-1z"/></svg>`,
  default:  `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>`
};

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
  const found = AREA_COORDS.find(c => c.name === area.name);
  if (found) return found;
  // Use stored lat/lng if backend has them, else scatter around centre
  if (area.latitude && area.longitude) return { lat: area.latitude, lng: area.longitude, svgIcon: "default" };
  return {
    lat: FESTIVAL_CENTRE[0] + (Math.random()-0.5)*0.008,
    lng: FESTIVAL_CENTRE[1] + (Math.random()-0.5)*0.008,
    svgIcon: "default"
  };
}

function venueIcon(area, level, hasAlert, draggable) {
  const c = coordsFor(area);
  const svg = VENUE_SVGS[c.svgIcon] || VENUE_SVGS.default;
  const levelCls = `level-${(level||"unknown").toLowerCase()}`;
  const alertCls = hasAlert ? " has-alert" : "";
  const dragCls  = draggable ? " draggable-pin" : "";
  return L.divIcon({
    className: "",
    html: `<div class="venue-pin ${levelCls}${alertCls}${dragCls}">
             <div class="venue-icon">${svg}</div>
             <div class="venue-pulse"></div>
           </div>
           <div class="venue-label">
             <strong>${area.name}</strong>
             <span>${level || "—"}</span>
           </div>`,
    iconSize:   [56, 72],
    iconAnchor: [28, 64],
    popupAnchor:[0, -64]
  });
}


function buildHeatPoints(areas) {
  const pts = [];
  for (const area of areas) {
    const c = coordsFor(area);
    const w = CROWD_WEIGHTS[area.currentCrowdLevel] || 0.1;
    const spread = area.currentCrowdLevel === "FULL" ? 0.0007 :
                   area.currentCrowdLevel === "MEDIUM" ? 0.00045 : 0.00025;
    const count  = area.currentCrowdLevel === "FULL" ? 18 :
                   area.currentCrowdLevel === "MEDIUM" ? 10 : 5;
    pts.push([c.lat, c.lng, w]);
    for (let i = 0; i < count; i++) {
      pts.push([
        c.lat + (Math.random()-0.5)*spread,
        c.lng + (Math.random()-0.5)*spread,
        w * (0.55 + Math.random()*0.35)
      ]);
    }
  }
  return pts;
}


function levelColour(level) {
  return level === "FULL" ? "#ef4444" : level === "MEDIUM" ? "#f59e0b" : "#22c55e";
}

let _orgMap = null;
let _buildMarkers = null;

function renderAreas() {
  setHeading("Live Map", "Festival Areas");

  if (_orgMap) {
    if (_buildMarkers) _buildMarkers(false);
    setTimeout(() => _orgMap.invalidateSize(), 0);
    return;
  }

  let editMode = false;
  const editMarkers = {}; // areaId -> L.marker (for dragend)

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
    // Rebuild markers with draggable state
    buildMarkers(editMode);
    showEditPanel(editMode);
  });

  function showEditPanel(show) {
    const panel = document.getElementById("area-detail-panel");
    if (!show) { panel.hidden = true; return; }
    panel.hidden = false;
    document.getElementById("detail-content").innerHTML = `
      <div class="detail-area-name" style="margin-bottom:10px">Edit Areas</div>
      <p style="font-size:11px;color:#64748b;margin-bottom:14px">Drag markers on the map to reposition. Use the form below to add or rename areas.</p>

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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        document.getElementById("new-area-name").value = "";
        msg.textContent = "✓ Area added.";
        await loadData(); renderAreaEditList(); buildMarkers(editMode);
      } else { msg.textContent = "Failed to add area."; }
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
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name })
        });
        if (res.ok) { await loadData(); renderAreaEditList(); buildMarkers(editMode); }
      });
    });

    list.querySelectorAll(".del-area-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this area?")) return;
        const res = await fetch(`/api/areas/${btn.dataset.id}`, { method: "DELETE" });
        if (res.ok) { await loadData(); renderAreaEditList(); buildMarkers(editMode); }
      });
    });
  }

  // ── Map init ──────────────────────────────────────────────────────────────
  _orgMap = L.map("festival-map-root", {
    center: FESTIVAL_CENTRE,
    zoom: 16,
    minZoom: 14,
    maxZoom: 20,
    dragging: true,
    touchZoom: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    boxZoom: true,
    keyboard: true,
    zoomControl: true,
    attributionControl: false
  });

  // Soft bounds — allow generous padding so map doesn't feel locked
  const festivalBounds = L.latLngBounds(
    [FESTIVAL_CENTRE[0] - 0.015, FESTIVAL_CENTRE[1] - 0.020],
    [FESTIVAL_CENTRE[0] + 0.015, FESTIVAL_CENTRE[1] + 0.020]
  );
  _orgMap.setMaxBounds(festivalBounds.pad(0.5));

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 20 }).addTo(_orgMap);

  // Festival boundary ring
  L.circle(FESTIVAL_CENTRE, {
    radius: 350, color: "#2dd4bf", weight: 2, dashArray: "8 6",
    fillColor: "#2dd4bf", fillOpacity: 0.04
  }).addTo(_orgMap);

  // Heatmap layer
  const heatLayer = L.heatLayer(buildHeatPoints(state.areas), {
    radius: 42, blur: 34, maxZoom: 19, max: 1.0,
    gradient: { 0.20: "#22c55e", 0.45: "#facc15", 0.70: "#f97316", 1.00: "#ef4444" }
  }).addTo(_orgMap);

  // Marker layer group
  const markerGroup = L.layerGroup().addTo(_orgMap);

  function buildMarkers(isDraggable) {
    markerGroup.clearLayers();
    Object.keys(editMarkers).forEach(k => delete editMarkers[k]);

    state.areas.forEach(area => {
      const c = coordsFor(area);
      const level = area.currentCrowdLevel || "UNKNOWN";
      const hasAlert = state.activeAlerts.some(a => a.area?.id === area.id);

      // Alert ring
      if (hasAlert) {
        L.circleMarker([c.lat, c.lng], {
          radius: 38, color: "#ef4444", weight: 2, fillOpacity: 0, className: "alert-ring"
        }).addTo(markerGroup);
      }

      const marker = L.marker([c.lat, c.lng], {
        icon: venueIcon(area, level, hasAlert, isDraggable),
        draggable: isDraggable
      }).addTo(markerGroup);

      if (isDraggable) {
        editMarkers[area.id] = marker;
        marker.on("dragend", async () => {
          const pos = marker.getLatLng();
          // Persist to backend
          await fetch(`/api/areas/${area.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: area.name, latitude: pos.lat, longitude: pos.lng })
          });
          // Update local AREA_COORDS so heatmap refreshes correctly
          const coord = AREA_COORDS.find(c => c.name === area.name);
          if (coord) { coord.lat = pos.lat; coord.lng = pos.lng; }
          heatLayer.setLatLngs(buildHeatPoints(state.areas));
        });
      } else {
        marker.on("click", () => {
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
      }
    });
  }

  _buildMarkers = buildMarkers;
  buildMarkers(false);
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
      ${renderAlertList(sortedAlerts(), role === 'organiser')}
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

initRole();
window.addEventListener("hashchange", renderRoute);
refreshButton.addEventListener("click", loadData);
loadData().catch(() => {
  pages.dashboard.innerHTML = emptyState("Dashboard could not be loaded.");
});

// Auto-refresh every 15 s so steward reports appear without manual refresh
setInterval(() => loadData().catch(() => {}), 15000);
