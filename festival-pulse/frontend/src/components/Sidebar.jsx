import { NavLink } from "react-router-dom"

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: "▦" },
  { to: "/areas",     label: "Areas",     icon: "◎" },
  { to: "/reports",   label: "Reports",   icon: "≡" },
  { to: "/alerts",    label: "Alerts",    icon: "⚑" },
]

export default function Sidebar({ activeAlertCount }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-dot" />
        <span className="brand-name">Festival Pulse</span>
      </div>
      <nav className="sidebar-nav">
        {NAV.map(({ to, label, icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => "nav-link" + (isActive ? " nav-link--active" : "")}>
            <span className="nav-icon">{icon}</span>
            <span>{label}</span>
            {label === "Alerts" && activeAlertCount > 0 && (
              <span className="nav-badge">{activeAlertCount}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">ByteMe Team</div>
    </aside>
  )
}
