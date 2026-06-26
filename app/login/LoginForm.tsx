'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    // Mock authentication
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1000);
  };

  if (success) {
    return (
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h1 className="auth-title">Welcome back!</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          You have successfully logged in as <strong>{username}</strong>.
        </p>
        <Link href="/" className="action-btn primary" style={{ textDecoration: 'none', justifyContent: 'center' }}>
          Go to Home
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
      <h1 className="auth-title">Login to SudoX</h1>
      
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

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="login-username">Username</label>
          <input
            id="login-username"
            type="text"
            className="form-input"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            className="form-input"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <button 
          id="login-submit-btn"
          type="submit" 
          className="action-btn primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="auth-link-text">
        New to SudoX? <Link href="/signup">Sign Up</Link>
      </div>
    </div>
  );
}
