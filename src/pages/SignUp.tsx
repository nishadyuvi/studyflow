import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

// ─── Google Font injection ────────────────────────────────────────────────────
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600&display=swap';
if (!document.head.querySelector('[href*="DM+Sans"]')) document.head.appendChild(fontLink);

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  email: string;
  password: string;
  confirm: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirm?: string;
  general?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  if (form.confirm !== form.password) {
    errors.confirm = 'Passwords do not match.';
  }
  return errors;
}

function passwordStrength(pw: string): { score: number; label: string; barColor: string; textColor: string } {
  const checks = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/];
  const score = checks.filter((re) => re.test(pw)).length;
  const map: Record<number, { label: string; barColor: string; textColor: string }> = {
    0: { label: '', barColor: '', textColor: '' },
    1: { label: 'Weak',   barColor: 'bg-rose-500',   textColor: 'text-rose-400' },
    2: { label: 'Fair',   barColor: 'bg-amber-400',  textColor: 'text-amber-400' },
    3: { label: 'Good',   barColor: 'bg-sky-400',    textColor: 'text-sky-400' },
    4: { label: 'Strong', barColor: 'bg-emerald-400',textColor: 'text-emerald-400' },
  };
  return { score, ...map[score] };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface InputFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  placeholder: string;
  error?: string;
  autoComplete?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children?: React.ReactNode;
}

function InputField({ id, label, type, value, placeholder, error, autoComplete, onChange, children }: InputFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        htmlFor={id}
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#6272a4',
        }}
      >
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={onChange}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: children ? '13px 44px 13px 16px' : '13px 16px',
            background: 'rgba(10, 11, 20, 0.6)',
            border: error ? '1px solid rgba(244,63,94,0.45)' : '1px solid rgba(99,102,241,0.18)',
            borderRadius: '12px',
            color: '#e2e8f0',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14.5px',
            fontWeight: 400,
            letterSpacing: '0.01em',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocus={e => {
            (e.target as HTMLInputElement).style.borderColor = 'rgba(99,102,241,0.6)';
            (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)';
          }}
          onBlur={e => {
            (e.target as HTMLInputElement).style.borderColor = error ? 'rgba(244,63,94,0.45)' : 'rgba(99,102,241,0.18)';
            (e.target as HTMLInputElement).style.boxShadow = 'none';
          }}
        />
        {children}
      </div>
      {error && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#fb7185', margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}

interface EyeToggleProps {
  show: boolean;
  onToggle: () => void;
}

function EyeToggle({ show, onToggle }: EyeToggleProps) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onToggle}
      aria-label={show ? 'Hide password' : 'Show password'}
      style={{
        position: 'absolute',
        right: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#475569',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        transition: 'color 0.15s',
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#94a3b8')}
      onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = '#475569')}
    >
      {show ? (
        <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a9.97 9.97 0 015.45 1.605" />
          <line x1="3" y1="3" x2="21" y2="21" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );
}

interface StrengthBarProps {
  password: string;
}

function StrengthBar({ password }: StrengthBarProps) {
  if (!password) return null;
  const { score, label, barColor, textColor } = passwordStrength(password);
  return (
    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={i <= score ? barColor : 'bg-slate-800'}
            style={{ height: '3px', flex: 1, borderRadius: '99px', transition: 'all 0.3s' }}
          />
        ))}
      </div>
      {label && (
        <span className={textColor} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', fontWeight: 500 }}>
          {label}
        </span>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      style={{ width: '16px', height: '16px', animation: 'spin 0.8s linear infinite' }}
      fill="none" viewBox="0 0 24 24"
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" style={{ opacity: 0.25 }} />
      <path fill="currentColor" style={{ opacity: 0.8 }} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SignUp() {
  const [form, setForm] = useState<FormState>({ email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [showPass, setShowPass] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  function handleChange(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    };
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <>
        <AppBackground />
        <div style={pageWrap}>
          <div style={{ ...card, textAlign: 'center' }}>
            <div style={successIcon}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#818cf8" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 style={successHeading}>Check your inbox</h2>
            <p style={successBody}>
              A confirmation link was sent to{' '}
              <span style={{ color: '#818cf8', fontWeight: 500 }}>{form.email}</span>.
              <br />Click it to activate your account.
            </p>
            <a href="/login" style={backLink}
              onMouseEnter={e => ((e.target as HTMLAnchorElement).style.color = '#a5b4fc')}
              onMouseLeave={e => ((e.target as HTMLAnchorElement).style.color = '#6366f1')}>
              ← Back to login
            </a>
          </div>
        </div>
      </>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <>
      <AppBackground />

      <div style={pageWrap}>
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* ── Brand header ── */}
          <div style={{ textAlign: 'center' }}>
            <div style={brandBadge}>
              <span style={brandDot} />
              <span style={brandLabel}>StudyFlow</span>
            </div>
            <h1 style={pageTitle}>Create your account</h1>
            <p style={pageSubtitle}>Your focused study space starts here.</p>
          </div>

          {/* ── Card ── */}
          <div style={card}>
            {/* Top shimmer line */}
            <div style={shimmerLine} />

            {/* General error */}
            {errors.general && (
              <div style={errorBanner}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px' }}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#f87171' }}>
                  {errors.general}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Email */}
              <InputField
                id="email" label="Email address" type="email"
                value={form.email} placeholder="you@university.edu"
                error={errors.email} autoComplete="email"
                onChange={handleChange('email')}
              />

              {/* Password */}
              <div>
                <InputField
                  id="password" label="Password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password} placeholder="Minimum 8 characters"
                  error={errors.password} autoComplete="new-password"
                  onChange={handleChange('password')}
                >
                  <EyeToggle show={showPass} onToggle={() => setShowPass(v => !v)} />
                </InputField>
                <StrengthBar password={form.password} />
              </div>

              {/* Confirm password */}
              <div>
                <InputField
                  id="confirm" label="Confirm password"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirm} placeholder="Re-enter your password"
                  error={errors.confirm} autoComplete="new-password"
                  onChange={handleChange('confirm')}
                >
                  <EyeToggle show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
                </InputField>
                {form.confirm && form.confirm === form.password && !errors.confirm && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px' }}>
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#34d399' }}>
                      Passwords match
                    </span>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={loading ? { ...submitBtn, opacity: 0.55, cursor: 'not-allowed', transform: 'none' } : submitBtn}
                onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Spinner /> Creating account…
                  </span>
                ) : (
                  'Create account →'
                )}
              </button>
            </form>

            {/* Divider */}
            <div style={divider}>
              <div style={dividerLine} />
              <span style={dividerText}>or</span>
              <div style={dividerLine} />
            </div>

            <p style={loginPrompt}>
              Already have an account?{' '}
              <a href="/login" style={loginLink}
                onMouseEnter={e => ((e.target as HTMLAnchorElement).style.color = '#a5b4fc')}
                onMouseLeave={e => ((e.target as HTMLAnchorElement).style.color = '#6366f1')}>
                Sign in
              </a>
            </p>
          </div>

          {/* Fine print */}
          <p style={finePrint}>
            By signing up you agree to our{' '}
            <a href="/terms" style={finePrintLink}>Terms</a> and{' '}
            <a href="/privacy" style={finePrintLink}>Privacy Policy</a>.
          </p>

        </div>
      </div>
    </>
  );
}

// ─── AppBackground ─────────────────────────────────────────────────────────────

function AppBackground() {
  return (
    <div className="app-background">
      <div className="app-background__orb app-background__orb--1" />
      <div className="app-background__orb app-background__orb--2" />
      <div className="app-background__orb app-background__orb--3" />
    </div>
  );
}

// ─── Style constants ───────────────────────────────────────────────────────────

const pageWrap: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '48px 16px',
};

const card: React.CSSProperties = {
  position: 'relative',
  background: 'rgba(8, 10, 18, 0.75)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(99,102,241,0.13)',
  borderRadius: '20px',
  padding: '36px 32px 32px',
  boxShadow: '0 0 0 1px rgba(255,255,255,0.02), 0 24px 60px rgba(0,0,0,0.55)',
};

const shimmerLine: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: '12%',
  right: '12%',
  height: '1px',
  background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.7), rgba(168,85,247,0.5), transparent)',
  borderRadius: '999px',
};

const brandBadge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  marginBottom: '14px',
  padding: '5px 14px',
  background: 'rgba(99,102,241,0.07)',
  border: '1px solid rgba(99,102,241,0.18)',
  borderRadius: '999px',
};

const brandDot: React.CSSProperties = {
  width: '7px',
  height: '7px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
  boxShadow: '0 0 8px rgba(99,102,241,0.8)',
};

const brandLabel: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '11.5px',
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: '#818cf8',
};

const pageTitle: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontSize: '28px',
  fontWeight: 600,
  color: '#f1f5f9',
  margin: '0 0 8px',
  letterSpacing: '-0.02em',
  lineHeight: 1.25,
};

const pageSubtitle: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '14px',
  fontWeight: 400,
  color: '#475569',
  margin: 0,
};

const errorBanner: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  padding: '12px 14px',
  background: 'rgba(239,68,68,0.07)',
  border: '1px solid rgba(239,68,68,0.22)',
  borderRadius: '12px',
  marginBottom: '4px',
};

const submitBtn: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
  border: 'none',
  borderRadius: '13px',
  color: '#fff',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '14.5px',
  fontWeight: 600,
  letterSpacing: '0.02em',
  cursor: 'pointer',
  boxShadow: '0 4px 24px rgba(99,102,241,0.32)',
  transition: 'transform 0.18s, box-shadow 0.18s',
};

const divider: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  margin: '24px 0 18px',
};

const dividerLine: React.CSSProperties = {
  flex: 1,
  height: '1px',
  background: 'rgba(255,255,255,0.05)',
};

const dividerText: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '12px',
  color: '#1e293b',
};

const loginPrompt: React.CSSProperties = {
  textAlign: 'center',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '13.5px',
  color: '#475569',
  margin: 0,
};

const loginLink: React.CSSProperties = {
  color: '#6366f1',
  fontWeight: 600,
  textDecoration: 'none',
  transition: 'color 0.15s',
};

const finePrint: React.CSSProperties = {
  textAlign: 'center',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '11.5px',
  color: '#1e293b',
  margin: 0,
};

const finePrintLink: React.CSSProperties = {
  color: '#334155',
  textDecoration: 'underline',
};

const successIcon: React.CSSProperties = {
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  background: 'rgba(99,102,241,0.1)',
  border: '1px solid rgba(99,102,241,0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 20px',
};

const successHeading: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontSize: '22px',
  fontWeight: 600,
  color: '#f1f5f9',
  margin: '0 0 10px',
};

const successBody: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '14px',
  color: '#64748b',
  lineHeight: 1.65,
  margin: 0,
};

const backLink: React.CSSProperties = {
  display: 'inline-block',
  marginTop: '24px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '13.5px',
  fontWeight: 500,
  color: '#6366f1',
  textDecoration: 'none',
  transition: 'color 0.15s',
};
