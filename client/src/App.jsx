import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { initDB } from './services/Database';

// Lazy Load Pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Members = React.lazy(() => import('./pages/Members'));
const Chores = React.lazy(() => import('./pages/Chores'));
const Calendar = React.lazy(() => import('./pages/Calendar'));

function App() {
  useEffect(() => {
    initDB();
  }, []);

  return (
    <Router>
      <Layout>
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/members" element={<Members />} />
            <Route path="/chores" element={<Chores />} />
            <Route path="/calendar" element={<Calendar />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
}

export default App;
