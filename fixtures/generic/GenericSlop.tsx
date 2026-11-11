// fixtures/generic/GenericSlop.tsx
// INTENTIONALLY SLOPPY — used as a regression fixture that MUST FAIL the audit.
// Every violation here maps to a policy rule with a penalty. If this file starts passing,
// it means a detector regressed and needs to be fixed.

import React from 'react';

// ❌ BLOCKER: unresolved relative import (no such file)
import { MissingHelper } from '../nonexistent/helpers';

export default function GenericSlop() {
  return (
    <section
      style={{
        // ❌ MAJOR: raw hex bypasses design tokens
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        // ❌ MAJOR: excessive AI glow / generic gradient
        boxShadow: '0 0 60px rgba(99, 102, 241, 0.6)',
        borderRadius: '9999px',   // ❌ MAJOR: unmotivated pill radius
        padding: '48px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        // ❌ BLOCKER: horizontal overflow risk
        width: '1440px',
        overflowX: 'hidden',
      }}
    >
      {/* ❌ BLOCKER: placeholder copy in finished product */}
      <h1 style={{ color: '#ffffff', fontSize: '48px' }}>Lorem ipsum dolor sit amet</h1>
      <p style={{ color: '#e2e8f0' }}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.
      </p>

      {/* ❌ img without alt attribute */}
      <img src="/hero.png" style={{ width: '100%' }} />

      {/* ❌ MAJOR: dead button — no onClick, no href, no type=submit */}
      <button
        style={{
          outline: 'none',          // ❌ BLOCKER: kills focus ring (accessibility)
          background: '#6366f1',
          color: '#ffffff',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '8px',
          // ❌ MAJOR: uncalibrated transition
          transition: 'all 0.3s ease',
        }}
      >
        Click me
      </button>

      {/* ❌ MAJOR: excessive glassmorphism */}
      <div
        style={{
          backdropFilter: 'blur(20px)',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          padding: '24px',
        }}
      >
        <p>Glass card content</p>
      </div>
    </section>
  );
}
