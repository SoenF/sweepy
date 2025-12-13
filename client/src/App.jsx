import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { initDB } from './services/Database';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy Load Pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Members = React.lazy(() => import('./pages/Members'));
const Chores = React.lazy(() => import('./pages/Chores'));
const Calendar = React.lazy(() => import('./pages/Calendar'));
const Login = React.lazy(() => import('./pages/Login'));

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, isMobile } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  // Mobile app doesn't need authentication
  if (isMobile) {
    return children;
  }

  // Web app requires authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  useEffect(() => {
    initDB();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/members" element={
              <ProtectedRoute>
                <Layout>
                  <Members />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/chores" element={
              <ProtectedRoute>
                <Layout>
                  <Chores />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/calendar" element={
              <ProtectedRoute>
                <Layout>
                  <Calendar />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
