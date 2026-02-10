/**
 * Dashboard Page - Protected route with quick actions
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
}

interface StudentStats {
  coursesEnrolled: number;
  lessonsCompleted: number;
  currentStreak: number;
  totalTimeSpent: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);

  useEffect(() => {
    // Fetch current user from auth service
    fetch('http://localhost:3007/auth/me', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          // If admin, fetch stats
          if (data.user.role === 'admin' || data.user.role === 'super_admin') {
            fetch('http://localhost:3008/api/admin/stats', { credentials: 'include' })
              .then((res) => res.json())
              .then((statsData) => {
                if (statsData.success && statsData.stats) {
                  setAdminStats(statsData.stats);
                }
              })
              .catch(() => {});
          } else {
            // Fetch student stats from progress API
            fetch('http://localhost:3008/api/progress/overview', { credentials: 'include' })
              .then((res) => res.json())
              .then((progressData) => {
                if (progressData.success && progressData.progress) {
                  const p = progressData.progress;
                  setStudentStats({
                    coursesEnrolled: p.totalCoursesEnrolled || 0,
                    lessonsCompleted: p.courseProgress?.reduce((acc: number, c: any) => acc + (c.lessonsCompleted || 0), 0) || 0,
                    currentStreak: p.currentStreak || 0,
                    totalTimeSpent: p.totalTimeSpent || 0,
                  });
                }
              })
              .catch(() => {});
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        router.push('/login');
      });
  }, [router]);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isEducator = user?.role === 'educator' || isAdmin;

  // Format revenue for display
  const formatRevenue = (cents: number) => {
    return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Format time for display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Real stats for admin and students
  const quickStats = isAdmin
    ? [
        { label: 'Total Users', value: adminStats?.totalUsers?.toString() || '0', icon: '👥' },
        { label: 'Total Courses', value: adminStats?.totalCourses?.toString() || '0', icon: '📚' },
        { label: 'Enrollments', value: adminStats?.totalEnrollments?.toString() || '0', icon: '📝' },
        { label: 'Revenue', value: formatRevenue(adminStats?.totalRevenue || 0), icon: '💰' },
      ]
    : [
        { label: 'Courses Enrolled', value: studentStats?.coursesEnrolled?.toString() || '0', icon: '📚' },
        { label: 'Lessons Completed', value: studentStats?.lessonsCompleted?.toString() || '0', icon: '✅' },
        { label: 'Current Streak', value: `${studentStats?.currentStreak || 0} days`, icon: '🔥' },
        { label: 'Total Time', value: formatTime(studentStats?.totalTimeSpent || 0), icon: '⏱️' },
      ];

  const studentActions = [
    {
      title: 'Browse Courses',
      description: 'Explore new courses to learn',
      icon: '🎓',
      href: '/courses',
      color: '#3b82f6',
    },
    {
      title: 'My Progress',
      description: 'View your learning analytics',
      icon: '📊',
      href: '/progress',
      color: '#10b981',
    },
    {
      title: 'Continue Learning',
      description: 'Resume where you left off',
      icon: '▶️',
      href: '/courses',
      color: '#8b5cf6',
    },
  ];

  const educatorActions = [
    {
      title: 'Create Course',
      description: 'Build a new course',
      icon: '➕',
      href: '/admin/courses/new',
      color: '#3b82f6',
    },
    {
      title: 'My Courses',
      description: 'Manage your courses',
      icon: '📚',
      href: '/admin/courses',
      color: '#10b981',
    },
    {
      title: 'Analytics',
      description: 'View course performance',
      icon: '📈',
      href: '/admin/analytics',
      color: '#8b5cf6',
    },
  ];

  const adminActions = [
    {
      title: 'Manage Users',
      description: 'View and manage all users',
      icon: '👥',
      href: '/admin/users',
      color: '#ef4444',
    },
    {
      title: 'All Courses',
      description: 'Manage all platform courses',
      icon: '📚',
      href: '/admin/courses',
      color: '#f59e0b',
    },
    {
      title: 'Transactions',
      description: 'View payment history',
      icon: '💳',
      href: '/admin/transactions',
      color: '#10b981',
    },
    {
      title: 'Settings',
      description: 'Platform configuration',
      icon: '⚙️',
      href: '/admin/settings',
      color: '#6b7280',
    },
  ];

  const quickActions = isAdmin
    ? adminActions
    : isEducator
    ? educatorActions
    : studentActions;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Header */}
      <header
        style={{
          padding: '20px 40px',
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>
          Dashboard
        </h1>
        <nav style={{ display: 'flex', gap: '1.5rem' }}>
          <Link href="/courses" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            Courses
          </Link>
          <Link href="/progress" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            Progress
          </Link>
          <Link href="/login" style={{ color: '#ef4444', textDecoration: 'none' }}>
            Logout
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Welcome */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
            <h2 style={{ margin: 0, color: '#111827' }}>
              Welcome back, {user?.firstName || 'User'}! 👋
            </h2>
            {isAdmin && (
              <span
                style={{
                  padding: '4px 12px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </span>
            )}
            {user?.role === 'educator' && (
              <span
                style={{
                  padding: '4px 12px',
                  background: '#dbeafe',
                  color: '#2563eb',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                Educator
              </span>
            )}
          </div>
          <p style={{ margin: 0, color: '#6b7280' }}>
            {isAdmin
              ? 'Manage your LMS platform'
              : isEducator
              ? 'Create and manage your courses'
              : 'Continue your learning journey with Composey LMS'}
          </p>
        </div>

        {/* Quick Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          {quickStats.map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: '1.25rem',
                background: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{stat.icon}</span>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <h3 style={{ margin: '0 0 1rem', color: '#374151' }}>
          {isAdmin ? 'Admin Actions' : isEducator ? 'Educator Actions' : 'Quick Actions'}
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isAdmin ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              style={{
                display: 'block',
                padding: '1.5rem',
                background: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                textDecoration: 'none',
                borderLeft: `4px solid ${action.color}`,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
                {action.icon}
              </div>
              <h4 style={{ margin: '0 0 0.25rem', color: '#111827' }}>
                {action.title}
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                {action.description}
              </p>
            </Link>
          ))}
        </div>

        {/* Recent Activity Placeholder */}
        <h3 style={{ margin: '0 0 1rem', color: '#374151' }}>Recent Activity</h3>
        <div
          style={{
            padding: '2rem',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textAlign: 'center',
            color: '#6b7280',
          }}
        >
          <p style={{ margin: 0 }}>
            Start learning to see your activity here!
            <br />
            <Link href="/courses" style={{ color: '#3b82f6' }}>
              Browse courses →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
