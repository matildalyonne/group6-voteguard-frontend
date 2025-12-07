import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { AdminDashboard } from './pages/AdminDashboard';
import { OfficerDashboard } from './pages/OfficerDashboard';
import { CandidatePortal } from './pages/CandidatePortal';
import { VoterPortal } from './pages/VoterPortal';
import { UserRole } from './types';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  // Special case for Voter: They might not be 'logged in' at the start of /voter, 
  // but the page handles verification. However, if this route protects /voter/ballot etc., we need logic.
  // For this simple app, /voter is public (verification), others are protected.
  
  if (!user && allowedRoles) {
    return <Navigate to="/" replace />;
  }

  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/voter" element={<VoterPortal />} />
      
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/officer" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.OFFICER, UserRole.ADMIN]}>
            <OfficerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/candidate" 
        element={
          <ProtectedRoute allowedRoles={[UserRole.CANDIDATE]}>
            <CandidatePortal />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <AppRoutes />
        </Layout>
      </Router>
    </AuthProvider>
  );
}