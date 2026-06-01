import { NavLink, useNavigate } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '../../context/AuthContext'
import './Navbar.css'

const navItems = [
  { to: '/', label: 'Academic', icon: '📚', end: true },
  { to: '/day-planner', label: 'Day', icon: '⚡', end: false },
  { to: '/habit-tracker', label: 'Habits', icon: '🔥', end: false },
] as const

export function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut(): Promise<void> {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <NavLink to="/" className="navbar__brand" end>
          <span className="navbar__logo" aria-hidden="true">
            ✦
          </span>
          <span className="navbar__brand-text">
            StudyFlow
            <span className="navbar__tagline">Stay focused</span>
          </span>
        </NavLink>

        <nav className="navbar__nav" aria-label="Main navigation">
          <ul className="navbar__list">
            {navItems.map(({ to, label, icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `navbar__link${isActive ? ' navbar__link--active' : ''}`
                  }
                >
                  <span className="navbar__link-icon" aria-hidden="true">
                    {icon}
                  </span>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <ThemeToggle />

        {user ? (
          // ── Logged in — show user email + sign out button ──
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '12px',
              color: '#475569',
              fontFamily: 'sans-serif',
              maxWidth: '140px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="navbar__signup-btn"
              style={{
                background: 'rgba(239,68,68,0.1)',
                borderColor: 'rgba(239,68,68,0.25)',
                color: '#f87171',
              }}
            >
              Sign out
            </button>
          </div>
        ) : (
          // ── Logged out — show sign up button ──
          <NavLink
            to="/signup"
            className={({ isActive }) =>
              `navbar__signup-btn${isActive ? ' navbar__signup-btn--active' : ''}`
            }
          >
            Sign Up
          </NavLink>
        )}

      </div>
    </header>
  )
}