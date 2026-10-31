type SidebarProps = { activeSection: string; onSectionChange: (section: string) => void }

const navItems = [
  { label: 'Tin nh\u1EAFn', icon: 'message' },
  { label: 'Danh b\u1EA1', icon: 'users' },
  { label: 'C\u00E0i \u0111\u1EB7t', icon: 'settings' },
]

function NavIcon({ name }: { name: string }) {
  if (name === 'message') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-1 2v-5.5A7.5 7.5 0 1 1 20 11.5Z" /></svg>
  if (name === 'users') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20v-1.5a6.5 6.5 0 0 1 13 0V20M16 5a3.5 3.5 0 0 1 0 6.8M18 14a5 5 0 0 1 3.5 4.8V20" /></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 1 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 1 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 1 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 1 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" /></svg>
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return <aside className="sidebar">
    <a className="brand" href="#" aria-label="AppChat"><span className="brand-mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-1 2v-5.5A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 11h.01M12 11h.01M16 11h.01" /></svg></span><span>AppChat</span></a>
    <nav className="sidebar-nav" aria-label="&#272;i&#7873;u h&#432;&#7899;ng ch&#237;nh">{navItems.map((item) => <button key={item.label} className={`nav-item ${activeSection === item.label ? 'is-active' : ''}`} onClick={() => onSectionChange(item.label)}><NavIcon name={item.icon} /><span>{item.label}</span></button>)}</nav>
    <div className="user-profile"><div className="profile-avatar">AL<span className="online-dot" /></div><div className="profile-copy"><strong>Anh L&#234;</strong><span>&#272;ang ho&#7841;t &#273;&#7897;ng</span></div><button className="more-button" aria-label="T&#249;y ch&#7885;n t&#224;i kho&#7843;n">&#8230;</button></div>
  </aside>
}
