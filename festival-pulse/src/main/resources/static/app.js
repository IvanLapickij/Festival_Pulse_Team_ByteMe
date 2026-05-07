const areaShapes = [
  { name: "Main Stage", x: 60, y: 60, width: 300, height: 170 },
  { name: "Food Village", x: 520, y: 50, width: 280, height: 150 },
  { name: "Dance Tent", x: 90, y: 310, width: 230, height: 170 },
  { name: "Bar Area", x: 405, y: 330, width: 210, height: 130 },
  { name: "Entrance / Exit", x: 650, y: 360, width: 190, height: 100 }
];

const mapAreas = document.querySelector("#map-areas");
const areaSelect = document.querySelector("#area-select");
const reportForm = document.querySelector("#report-form");
const formMessage = document.querySelector("#form-message");
const alertsList = document.querySelector("#alerts-list");
const alertCount = document.querySelector("#alert-count");
const refreshButton = document.querySelector("#refresh-button");

let dashboard = { areas: [], activeAlerts: [] };

function levelClass(level) {
  return `area-${String(level || "LOW").toLowerCase()}`;
}

function shapeFor(area, index) {
  return areaShapes.find((shape) => shape.name === area.name) || {
    x: 70 + (index % 3) * 260,
    y: 70 + Math.floor(index / 3) * 170,
    width: 220,
    height: 120
  };
}

function renderAreas() {
  mapAreas.innerHTML = "";
  areaSelect.innerHTML = "";

  dashboard.areas.forEach((area, index) => {
    const shape = shapeFor(area, index);
    const option = document.createElement("option");
    option.value = area.id;
    option.textContent = area.name;
    areaSelect.appendChild(option);

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.dataset.areaId = area.id;
    group.addEventListener("click", () => {
      areaSelect.value = area.id;
    });

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", shape.x);
    rect.setAttribute("y", shape.y);
    rect.setAttribute("width", shape.width);
    rect.setAttribute("height", shape.height);
    rect.setAttribute("rx", "8");
    rect.setAttribute("class", `area-shape ${levelClass(area.currentCrowdLevel)}`);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", shape.x + shape.width / 2);
    label.setAttribute("y", shape.y + shape.height / 2 - 8);
    label.setAttribute("class", "area-label");
    label.textContent = area.name;

    const level = document.createElementNS("http://www.w3.org/2000/svg", "text");
    level.setAttribute("x", shape.x + shape.width / 2);
    level.setAttribute("y", shape.y + shape.height / 2 + 18);
    level.setAttribute("class", "area-level");
    level.textContent = area.currentCrowdLevel;

    group.append(rect, label, level);
    mapAreas.appendChild(group);
  });
}

function renderAlerts() {
  alertsList.innerHTML = "";
  alertCount.textContent = dashboard.activeAlerts.length;

  if (dashboard.activeAlerts.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No active alerts.";
    alertsList.appendChild(empty);
    return;
  }

  dashboard.activeAlerts.forEach((alert) => {
    const item = document.createElement("li");
    item.className = "alert-item";

    const title = document.createElement("div");
    title.className = "alert-title";
    title.textContent = alert.message;

    const meta = document.createElement("div");
    meta.className = "alert-meta";
    meta.textContent = `${alert.area.name} · ${new Date(alert.createdAt).toLocaleString()}`;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Resolve Alert";
    button.addEventListener("click", () => resolveAlert(alert.id));

    item.append(title, meta, button);
    alertsList.appendChild(item);
  });
}

async function loadDashboard() {
  const response = await fetch("/api/dashboard");
  if (!response.ok) {
    throw new Error("Failed to load dashboard");
  }
  dashboard = await response.json();
  renderAreas();
  renderAlerts();
}

async function submitReport(event) {
  event.preventDefault();
  formMessage.textContent = "";

  const payload = {
    areaId: Number(areaSelect.value),
    crowdLevel: document.querySelector("#crowd-level").value,
    steward: document.querySelector("#steward").value || null
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

  reportForm.reset();
  formMessage.textContent = "Report submitted.";
  await loadDashboard();
}

async function resolveAlert(id) {
  const response = await fetch(`/api/alerts/${id}/resolve`, { method: "PUT" });
  if (response.ok) {
    await loadDashboard();
  }
}

reportForm.addEventListener("submit", submitReport);
refreshButton.addEventListener("click", loadDashboard);
loadDashboard().catch(() => {
  formMessage.textContent = "Dashboard could not be loaded.";
});
