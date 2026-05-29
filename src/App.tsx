/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Home from './pages/Home';
import DashboardPage from './pages/DashboardPage';
import Dashboard from './components/Dashboard';
import Login from './pages/Login';
import NewSale from './pages/NewSale';
import Inventory from './pages/Inventory';
import Prescriptions from './pages/Prescriptions';
import Employees from './pages/Employees';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import AboutUs from './pages/AboutUs';
import Register from './pages/Register';
import PatientLogin from './pages/PatientLogin';
import PatientPortal from './pages/PatientPortal';
import SupplierManagement from './pages/SupplierManagement';
import Reports from './pages/Reports';
import Transactions from './pages/Transactions';
import Insurance from './pages/Insurance';
import Patients from './pages/Patients';
import ClinicalRecords from './pages/ClinicalRecords';
import SalesReturns from './pages/SalesReturns';
import AuditGovernance from './pages/AuditGovernance';
import { useEffect } from 'react';

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/patient-login" element={<PatientLogin />} />
            
            {/* Patient Specific Portal */}
            <Route 
              path="/patient-portal" 
              element={
                <ProtectedRoute allowedRoles={['Patient']}>
                  <PatientPortal />
                </ProtectedRoute>
              } 
            />

            {/* Staff Dashboard - Role Specific Sub-routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['Administrator', 'Pharmacist', 'Cashier']}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route 
                path="sale" 
                element={
                  <ProtectedRoute allowedRoles={['Administrator', 'Cashier', 'Pharmacist']}>
                    <NewSale />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="inventory" 
                element={
                  <ProtectedRoute allowedRoles={['Administrator', 'Pharmacist']}>
                    <Inventory />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="suppliers" 
                element={
                  <ProtectedRoute allowedRoles={['Administrator', 'Pharmacist']}>
                    <SupplierManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="reports" 
                element={
                  <ProtectedRoute allowedRoles={['Administrator', 'Pharmacist']}>
                    <Reports />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="transactions" 
                element={
                  <ProtectedRoute allowedRoles={['Administrator', 'Pharmacist', 'Cashier']}>
                    <Transactions />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="returns" 
                element={
                  <ProtectedRoute allowedRoles={['Administrator', 'Cashier', 'Pharmacist']}>
                    <SalesReturns />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="audit" 
                element={
                  <ProtectedRoute allowedRoles={['Administrator']}>
                    <AuditGovernance />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="insurance" 
                element={
                  <ProtectedRoute allowedRoles={['Administrator', 'Pharmacist']}>
                    <Insurance />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="patients" 
                element={
                  <ProtectedRoute allowedRoles={['Administrator', 'Pharmacist', 'Cashier']}>
                    <Patients />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="clinical-files/:patientId" 
                element={
                  <ProtectedRoute allowedRoles={['Administrator', 'Pharmacist']}>
                    <ClinicalRecords />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="prescriptions" 
                element={
                  <ProtectedRoute allowedRoles={['Administrator', 'Pharmacist', 'Cashier']}>
                    <Prescriptions />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="employees" 
                element={
                  <ProtectedRoute allowedRoles={['Administrator', 'Pharmacist']}>
                    <Employees />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="analytics" 
                element={
                  <ProtectedRoute allowedRoles={['Administrator', 'Pharmacist']}>
                    <Analytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="settings" 
                element={
                  <ProtectedRoute allowedRoles={['Administrator', 'Pharmacist']}>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}


