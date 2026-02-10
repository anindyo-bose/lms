/**
 * Admin Settings Page - Platform configuration
 */

import React, { useState } from 'react';
import Link from 'next/link';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    platformName: 'Composey LMS',
    supportEmail: 'support@composey.local',
    enableSignup: true,
    enablePayments: true,
    stripeMode: 'test',
    maintenanceMode: false,
  });

  const handleSave = () => {
    alert('Settings saved! (In production, this would call an API)');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <header style={{ padding: '20px 40px', background: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/dashboard" style={{ color: '#6b7280', textDecoration: 'none' }}>← Back</Link>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>Platform Settings</h1>
        </div>
      </header>

      <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {/* General */}
          <h2 style={{ margin: '0 0 24px', fontSize: '1.25rem', color: '#111827' }}>General</h2>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Platform Name</label>
            <input
              type="text"
              value={settings.platformName}
              onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Support Email</label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px' }}
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '32px 0' }} />

          {/* Features */}
          <h2 style={{ margin: '0 0 24px', fontSize: '1.25rem', color: '#111827' }}>Features</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.enableSignup}
                onChange={(e) => setSettings({ ...settings, enableSignup: e.target.checked })}
                style={{ width: '20px', height: '20px' }}
              />
              <div>
                <span style={{ fontWeight: 500, color: '#374151' }}>Enable User Signup</span>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>Allow new users to register on the platform</p>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.enablePayments}
                onChange={(e) => setSettings({ ...settings, enablePayments: e.target.checked })}
                style={{ width: '20px', height: '20px' }}
              />
              <div>
                <span style={{ fontWeight: 500, color: '#374151' }}>Enable Payments</span>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>Allow paid courses and process payments via Stripe</p>
              </div>
            </label>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '32px 0' }} />

          {/* Payment */}
          <h2 style={{ margin: '0 0 24px', fontSize: '1.25rem', color: '#111827' }}>Payment Settings</h2>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151' }}>Stripe Mode</label>
            <select
              value={settings.stripeMode}
              onChange={(e) => setSettings({ ...settings, stripeMode: e.target.value })}
              style={{ width: '100%', maxWidth: '300px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', background: '#fff' }}
            >
              <option value="test">Test Mode</option>
              <option value="live">Live Mode</option>
            </select>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '32px 0' }} />

          {/* Maintenance */}
          <h2 style={{ margin: '0 0 24px', fontSize: '1.25rem', color: '#111827' }}>Maintenance</h2>

          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '24px' }}>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
              style={{ width: '20px', height: '20px' }}
            />
            <div>
              <span style={{ fontWeight: 500, color: settings.maintenanceMode ? '#dc2626' : '#374151' }}>Maintenance Mode</span>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>When enabled, only admins can access the platform</p>
            </div>
          </label>

          {/* Save */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSave}
              style={{ padding: '12px 32px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '16px' }}
            >
              Save Settings
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
