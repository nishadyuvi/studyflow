import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// ─── Font injection ───────────────────────────────────────────────────────────

const fontLink = document.createElement('link');

fontLink.rel = 'stylesheet';

fontLink.href =
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600&display=swap';

if (!document.head.querySelector('[href*="DM+Sans"]')) {
  document.head.appendChild(fontLink);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  email: string;
  name: string;
  joinedAt: string;
}

interface DashboardStats {
  daysActive: number;
  tasksDone: number;
  habitsLogged: number;
  studyStreak: number;
}

interface HabitEntry {
  date: string;
}

interface QuickLink {
  label: string;
  description: string;
  icon: string;
  path: string;
  accent: string;
  glow: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const quickLinks: QuickLink[] = [
  {
    label: 'Academic Planner',
    description: 'Manage subjects, deadlines & goals',
    icon: '📚',
    path: '/',
    accent: 'rgba(99,102,241,0.15)',
    glow: 'rgba(99,102,241,0.35)',
  },
  {
    label: 'Day Planner',
    description: 'Structure your day hour by hour',
    icon: '⚡',
    path: '/day-planner',
    accent: 'rgba(168,85,247,0.15)',
    glow: 'rgba(168,85,247,0.35)',
  },
  {
    label: 'Habit Tracker',
    description: 'Build streaks and stay consistent',
    icon: '🔥',
    path: '/habit-tracker',
    accent: 'rgba(245,158,11,0.15)',
    glow: 'rgba(245,158,11,0.35)',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();

  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';

  return 'Good evening';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        style={{
          width: '32px',
          height: '32px',
          animation: 'spin 0.8s linear infinite',
        }}
        fill="none"
        viewBox="0 0 24 24"
      >
        <style>
          {`
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}
        </style>

        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="#6366f1"
          strokeWidth="3"
          style={{ opacity: 0.25 }}
        />

        <path
          fill="#6366f1"
          style={{ opacity: 0.8 }}
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  );
}

// ─── Quick Link Card ──────────────────────────────────────────────────────────

interface QuickLinkCardProps {
  link: QuickLink;
}

function QuickLinkCard({
  link,
}: QuickLinkCardProps) {

  const [hovered, setHovered] =
    useState(false);

  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(link.path)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '22px 20px',
        background: hovered
          ? link.accent
          : 'rgba(8,10,18,0.6)',
        border: `1px solid ${
          hovered
            ? link.glow
            : 'rgba(99,102,241,0.12)'
        }`,
        borderRadius: '16px',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: hovered
          ? `0 8px 32px ${link.glow}`
          : '0 2px 12px rgba(0,0,0,0.3)',
        transition: 'all 0.22s ease',
        transform: hovered
          ? 'translateY(-3px)'
          : 'translateY(0)',
      }}
    >
      <span style={{ fontSize: '26px' }}>
        {link.icon}
      </span>

      <div>
        <p
          style={{
            fontFamily:
              "'DM Sans', sans-serif",
            fontSize: '14.5px',
            fontWeight: 600,
            color: '#e2e8f0',
            margin: '0 0 4px',
          }}
        >
          {link.label}
        </p>

        <p
          style={{
            fontFamily:
              "'DM Sans', sans-serif",
            fontSize: '12.5px',
            color: '#475569',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {link.description}
        </p>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Dashboard() {

  const navigate = useNavigate();

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [stats, setStats] =
    useState<DashboardStats>({
      daysActive: 0,
      tasksDone: 0,
      habitsLogged: 0,
      studyStreak: 0,
    });

  // ─────────────────────────────────────────────
  // FETCH DYNAMIC STATS
  // ─────────────────────────────────────────────

  async function fetchDashboardStats(
    userId: string,
  ) {

    // habits

    const { data: habits } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId);

    // entries

    const { data: entries } = await supabase
      .from('habit_entries')
      .select('*')
      .eq('user_id', userId);

    const totalHabits =
      habits?.length || 0;

    const totalEntries =
      entries?.length || 0;

    // unique active days

    const uniqueDays = new Set(
      entries?.map(
        (e: HabitEntry) => e.date,
      ),
    );

    const daysActive =
      uniqueDays.size;

    // streak calculation

    let streak = 0;

    if (entries && entries.length > 0) {

      const sortedDates = [
        ...new Set(
          entries.map(
            (e: HabitEntry) => e.date,
          ),
        ),
      ].sort(
        (a, b) =>
          new Date(b).getTime() -
          new Date(a).getTime(),
      );

      let currentDate =
        new Date();

      for (const d of sortedDates) {

        const entryDate =
          new Date(d);

        const diff =
          Math.floor(
            (
              currentDate.getTime() -
              entryDate.getTime()
            ) /
            (1000 * 60 * 60 * 24),
          );

        if (diff <= 1) {

          streak++;

          currentDate = entryDate;

        } else {
          break;
        }
      }
    }

    setStats({
      daysActive,
      tasksDone: totalEntries,
      habitsLogged: totalHabits,
      studyStreak: streak,
    });
  }

  // ─────────────────────────────────────────────
  // LOAD USER
  // ─────────────────────────────────────────────

  useEffect(() => {

    async function loadUser(): Promise<void> {

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate('/login');
        return;
      }

      const user = session.user;

      const email =
        user.email ?? '';

      const name =
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        email.split('@')[0];

      setProfile({
        email,
        name,
        joinedAt: new Date(
          user.created_at,
        ).toLocaleDateString(
          'en-US',
          {
            month: 'long',
            year: 'numeric',
          },
        ),
      });

      await fetchDashboardStats(
        user.id,
      );

      setLoading(false);
    }

    loadUser();

  }, [navigate]);

  // ─────────────────────────────────────────────
  // SIGN OUT
  // ─────────────────────────────────────────────

  async function handleSignOut(): Promise<void> {

    await supabase.auth.signOut();

    navigate('/login');
  }

  // ─────────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <AppBackground />
        <Spinner />
      </>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <>
      <AppBackground />

      <div style={pageWrap}>

        <div style={container}>

          {/* Top bar */}

          <div style={topBar}>

            <div style={brandBadge}>
              <span style={brandDot} />

              <span style={brandLabel}>
                StudyFlow
              </span>
            </div>

            <button
              onClick={handleSignOut}
              style={signOutBtn}
            >
              Sign out
            </button>

          </div>

          {/* Welcome */}

          <div style={welcomeCard}>

            <div style={shimmerLine} />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
              }}
            >

              <div style={avatar}>

                <span style={avatarText}>
                  {getInitials(
                    profile?.name ?? 'U',
                  )}
                </span>

              </div>

              <div>

                <p style={greetingLabel}>
                  {getGreeting()},
                </p>

                <h1 style={greetingName}>
                  {profile?.name}
                </h1>

                <p style={greetingMeta}>
                  {profile?.email}
                </p>

              </div>

            </div>

          </div>

          {/* Stats */}

          <div>

            <h2 style={sectionTitle}>
              Your Activity
            </h2>

            <div style={statsGrid}>

              {[
                {
                  label: 'Days Active',
                  value: stats.daysActive,
                  icon: '📅',
                },
              
                {
                  label: 'Habits Logged',
                  value: stats.habitsLogged,
                  icon: '🔥',
                },
                {
                  label: 'Study Streak',
                  value: stats.studyStreak,
                  icon: '⚡',
                },
              ].map((s) => (

                <div
                  key={s.label}
                  style={statCard}
                >

                  <span
                    style={{
                      fontSize: '20px',
                    }}
                  >
                    {s.icon}
                  </span>

                  <p style={statValue}>
                    {s.value}
                  </p>

                  <p style={statLabel}>
                    {s.label}
                  </p>

                </div>
              ))}

            </div>

          </div>

          {/* Quick Links */}

          <div>

            <h2 style={sectionTitle}>
              Jump back in
            </h2>

            <div style={quickLinksGrid}>

              {quickLinks.map((link) => (
                <QuickLinkCard
                  key={link.path}
                  link={link}
                />
              ))}

            </div>

          </div>

        </div>

      </div>
    </>
  );
}

// ─── Background ───────────────────────────────────────────────────────────────

function AppBackground() {
  return (
    <div className="app-background">
      <div className="app-background__orb app-background__orb--1" />
      <div className="app-background__orb app-background__orb--2" />
      <div className="app-background__orb app-background__orb--3" />
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const pageWrap: React.CSSProperties = {
  minHeight: '100vh',
  padding: '40px 16px 64px',
  display: 'flex',
  justifyContent: 'center',
};

const container: React.CSSProperties = {
  width: '100%',
  maxWidth: '720px',
  display: 'flex',
  flexDirection: 'column',
  gap: '32px',
};

const topBar: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const brandBadge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
};

const brandDot: React.CSSProperties = {
  width: '7px',
  height: '7px',
  borderRadius: '50%',
  background:
    'linear-gradient(135deg, #6366f1, #a855f7)',
};

const brandLabel: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '11.5px',
  fontWeight: 600,
  color: '#818cf8',
};

const signOutBtn: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: '10px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#cbd5e1',
  cursor: 'pointer',
};

const welcomeCard: React.CSSProperties = {
  background: 'rgba(8,10,18,0.75)',
  borderRadius: '20px',
  padding: '32px 28px',
  position: 'relative',
};

const shimmerLine: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: '12%',
  right: '12%',
  height: '1px',
  background:
    'linear-gradient(90deg, transparent, rgba(99,102,241,0.7), transparent)',
};

const avatar: React.CSSProperties = {
  width: '58px',
  height: '58px',
  borderRadius: '50%',
  background:
    'linear-gradient(135deg, #4f46e5, #7c3aed)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const avatarText: React.CSSProperties = {
  color: '#fff',
  fontSize: '18px',
  fontWeight: 600,
};

const greetingLabel: React.CSSProperties = {
  color: '#6366f1',
  margin: 0,
};

const greetingName: React.CSSProperties = {
  color: '#f1f5f9',
  margin: 0,
};

const greetingMeta: React.CSSProperties = {
  color: '#64748b',
};

const sectionTitle: React.CSSProperties = {
  color: '#94a3b8',
  marginBottom: '14px',
};

const statsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '12px',
};

const statCard: React.CSSProperties = {
  background: 'rgba(8,10,18,0.6)',
  borderRadius: '14px',
  padding: '18px 14px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
};

const statValue: React.CSSProperties = {
  color: '#e2e8f0',
  margin: 0,
  fontSize: '22px',
};

const statLabel: React.CSSProperties = {
  color: '#64748b',
  margin: 0,
};

const quickLinksGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '14px',
};