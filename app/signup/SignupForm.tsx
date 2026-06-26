'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleGetOtp = () => {
    setOtpError('');
    setOtpSuccessMsg('');

    if (!email.trim()) {
      setOtpError('Please enter your email to get an OTP.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setOtpError('Please enter a valid email address.');
      return;
    }

    setOtpLoading(true);
    // Mock OTP delivery
    setTimeout(() => {
      setOtpLoading(false);
      setOtpSent(true);
      setOtpSuccessMsg('OTP sent! Use 123456 to test.');
    }, 1200);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !username.trim() || !password || !confirmPassword || !otp) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (otp !== '123456') {
      setError('Invalid OTP code. Please enter the code sent to your email.');
      return;
    }

    setLoading(true);
    // Mock user creation
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  if (success) {
    return (
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h1 className="auth-title">Welcome to SudoX!</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Your account has been created successfully.
        </p>
        <Link href="/login" className="action-btn primary" style={{ textDecoration: 'none', justifyContent: 'center' }}>
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <Link href="/" className="auth-close-btn" aria-label="Close">
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </Link>
      <h1 className="auth-title">Create SudoX Account</h1>

      {error && (
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          backgroundColor: 'var(--wrong-bg)',
          color: 'var(--wrong-text)',
          fontSize: '13px',
          border: '1px solid rgba(190, 18, 60, 0.2)'
        }}>
          {error}
        </div>
      )}

      {otpError && (
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          backgroundColor: 'var(--wrong-bg)',
          color: 'var(--wrong-text)',
          fontSize: '13px',
          border: '1px solid rgba(190, 18, 60, 0.2)'
        }}>
          {otpError}
        </div>
      )}

      {otpSuccessMsg && (
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          fontSize: '13px',
          border: '1px solid rgba(46, 125, 50, 0.2)'
        }}>
          {otpSuccessMsg}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSignup}>
        <div className="form-group">
          <label className="form-label" htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            className="form-input"
            placeholder="example@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="signup-username">Username</label>
          <input
            id="signup-username"
            type="text"
            className="form-input"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            className="form-input"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="signup-confirm">Confirm Password</label>
          <input
            id="signup-confirm"
            type="password"
            className="form-input"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="otp-row">
          <div className="form-group">
            <label className="form-label" htmlFor="signup-otp">Verification OTP</label>
            <input
              id="signup-otp"
              type="text"
              className="form-input"
              placeholder={otpSent ? "Enter 6-digit OTP" : "Get OTP first"}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={!otpSent || loading}
              maxLength={6}
            />
          </div>
          <button
            id="signup-get-otp-btn"
            type="button"
            className="action-btn ghost otp-btn"
            onClick={handleGetOtp}
            disabled={otpLoading || loading}
          >
            {otpLoading ? 'Sending...' : otpSent ? 'Resend OTP' : 'Get OTP'}
          </button>
        </div>

        <button
          id="signup-submit-btn"
          type="submit"
          className="action-btn primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}
          disabled={!otpSent || loading}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <div className="auth-link-text">
        Already have an account? <Link href="/login">Login</Link>
      </div>
    </div>
  );
}
