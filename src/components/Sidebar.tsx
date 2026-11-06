import { useEffect, useRef, useState } from "react";
import { SettingsDialog } from "./SettingsDialog";

type SidebarProps = {
  activeSection: string;
  onSectionChange: (section: string) => void;
  settingsOpen: boolean;
  onSettingsToggle: () => void;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
  onLogout: () => void;
};

const navItems = [
  { label: 'Tin nh\u1EAFn', icon: 'message' },
  { label: 'Danh b\u1EA1', icon: 'users' },
  { label: 'C\u00E0i \u0111\u1EB7t', icon: 'settings' },
];

function NavIcon({ name }: { name: string }) {
  if (name === 'message') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-1 2v-5.5A7.5 7.5 0 1 1 20 11.5Z" /></svg>;
  if (name === 'users') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20v-1.5a6.5 6.5 0 0 1 13 0V20M16 5a3.5 3.5 0 0 1 0 6.8M18 14a5 5 0 0 1 3.5 4.8V20" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 1 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 1 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 1 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 1 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" /></svg>;
}

export function Sidebar({ activeSection, onSectionChange, settingsOpen, onSettingsToggle, theme, onThemeChange, onLogout }: SidebarProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileActionsRef = useRef<HTMLDivElement>(null);
  const settingsAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileMenuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!profileActionsRef.current?.contains(event.target as Node)) setProfileMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [profileMenuOpen]);

  useEffect(() => {
    if (!settingsOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!settingsAnchorRef.current?.contains(event.target as Node)) onSettingsToggle();
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [settingsOpen, onSettingsToggle]);

  return <aside className="sidebar">
    <a className="brand" href="#" aria-label="AppChat"><span className="brand-mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-1 2v-5.5A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 11h.01M12 11h.01M16 11h.01" /></svg></span><span>AppChat</span></a>
    <nav className="sidebar-nav" aria-label="&#272;i&#7873;u h&#432;&#7899;ng ch&#237;nh">
      {navItems.map((item) => {
        const isSettings = item.icon === 'settings';
        const selected = isSettings ? settingsOpen : activeSection === item.label;
        const button = <button className={`nav-item ${selected ? 'is-active' : ''}`} onClick={() => isSettings ? onSettingsToggle() : onSectionChange(item.label)}><NavIcon name={item.icon} /><span>{item.label}</span></button>;
        if (isSettings) {
          return <div className="settings-popover-anchor" key={item.label} ref={settingsAnchorRef}>
            {button}
            {settingsOpen && <SettingsDialog theme={theme} onThemeChange={onThemeChange} onLogout={onLogout} onClose={() => onSettingsToggle()}/>}
          </div>;
        }
        return <div key={item.label}>{button}</div>;
      })}
    </nav>
    <div className="user-profile">
      <div className="profile-avatar">AL<span className="online-dot" /></div>
      <div className="profile-copy"><strong>Anh L&#234;</strong><span>&#272;ang ho&#7841;t &#273;&#7897;ng</span></div>
      <div className="profile-actions" ref={profileActionsRef}>
        <button className="more-button" aria-label="T&#249;y ch&#7885;n t&#224;i kho&#7843;n" aria-expanded={profileMenuOpen} onClick={() => setProfileMenuOpen((open) => !open)}>&#8230;</button>
        {profileMenuOpen && <div className="profile-menu"><button className="settings-logout" onClick={() => { setProfileMenuOpen(false); onLogout(); }}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3m9-8h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-7" /></svg>
          &#272;&#259;ng xu&#7845;t
        </button></div>}
      </div>
    </div>
  </aside>;
}
