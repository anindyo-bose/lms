/**
 * Home Page
 */

import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ padding: '40px' }}>
      <h1>Welcome to Composey LMS</h1>
      <p>Production-grade Learning Management System with e-commerce</p>

      <div style={{ marginTop: '40px', display: 'flex', gap: '20px' }}>
        <Link href="/login">
          <a style={{ padding: '10px 20px', background: '#667eea', color: 'white', borderRadius: '6px', textDecoration: 'none' }}>
            Login
          </a>
        </Link>
        <Link href="/signup">
          <a style={{ padding: '10px 20px', background: '#764ba2', color: 'white', borderRadius: '6px', textDecoration: 'none' }}>
            Signup
          </a>
        </Link>
      </div>
    </div>
  );
}
