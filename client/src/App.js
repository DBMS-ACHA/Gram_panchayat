import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/citizens/citizenDashboard';
import HouseholdInfo from './pages/citizens/HouseholdInfo';
import PanchayatEmployees from './pages/citizens/PanchayatEmployees';
import Vaccinations from './pages/citizens/Vaccinations';
import Assets from './pages/citizens/Assets';
import CensusData from './pages/citizens/CensusData';
import LandRecords from './pages/citizens/LandRecords';
import Profile from './pages/citizens/Profile';
import './App.css';
import Schemes from './pages/citizens/Schemes';
import Applications from './pages/citizens/Applications';
import ProtectedRoute from './components/ProtectedRoute';
import LandRecordsMonitor from './pages/monitors/LandRecordsMonitor';
import MonitorDashboard from './pages/monitors/monitorDashboard';
import VillageStatisticsMonitor from './pages/monitors/VillageStatisticsMonitor';
import AssetsMonitor from './pages/monitors/AssetsMonitor';
import CitizenProfileMonitor from './pages/monitors/citizenProfileMonitor';
import CensusReporting from './pages/monitors/censusReporting';
import VaccinationMonitor from './pages/monitors/VaccinationMonitor';
import EmployeeDashboard from './pages/employee/employeeDashboard';
import EmployeeVaccinations from './pages/employee/employeeVaccinations';
import EmployeeLandRecords from './pages/employee/employeeLandRecords';
import EmployeeCensus from './pages/employee/employeeCensus';
import EmployeeCitizen from './pages/employee/employeeCitizens';
import EmployeeCitizenProfile from './pages/employee/employeeCitizenProfile';
import EmployeeSchemes from './pages/employee/employeeeSchemes';
import SchemeDetailsPage from './pages/employee/employeeSchemeDetails';
import EmployeeAssets from './pages/employee/employeeAssets';
import RoleGuard from './components/RoleGuard';
import AdminDashboard from './pages/admin/adminDashboard';
import AdminUsers from './pages/admin/adminUsers';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/citizen/dashboard" element={<RoleGuard requiredRole="citizen"><Dashboard /></RoleGuard>} />
        <Route path="/citizen/household" element={<RoleGuard requiredRole="citizen"><HouseholdInfo /></RoleGuard>} />
        <Route path="/citizen/employees" element={<RoleGuard requiredRole="citizen"><PanchayatEmployees /></RoleGuard>} />
        <Route path="/citizen/vaccinations" element={<RoleGuard requiredRole="citizen"><Vaccinations /></RoleGuard>} />
        <Route path="/citizen/assets" element={<RoleGuard requiredRole="citizen"><Assets /></RoleGuard>} />
        <Route path="/citizen/census" element={<RoleGuard requiredRole="citizen"><CensusData /></RoleGuard>} />
        <Route path="/citizen/land-records" element={<RoleGuard requiredRole="citizen"><LandRecords /></RoleGuard>} />
        <Route path="/citizen/profile" element={<RoleGuard requiredRole="citizen"><Profile /></RoleGuard>} />
        <Route path="/citizen/schemes" element={<RoleGuard requiredRole="citizen"><Schemes /></RoleGuard>} />
        <Route path="/citizen/applications" element={<RoleGuard requiredRole="citizen"><Applications /></RoleGuard>} />

        <Route path="/monitor/dashboard" element={<RoleGuard requiredRole="monitor"><MonitorDashboard /></RoleGuard>} />
        <Route path="/monitor/land" element={<RoleGuard requiredRole="monitor"><LandRecordsMonitor /></RoleGuard>} />
        <Route path="/monitor/village" element={<RoleGuard requiredRole="monitor"><VillageStatisticsMonitor /></RoleGuard>} />
        <Route path="/monitor/asset-tracking" element={<RoleGuard requiredRole="monitor"><AssetsMonitor /></RoleGuard>} />
        <Route path="/monitor/citizen/:id" element={<RoleGuard requiredRole="monitor"><CitizenProfileMonitor /></RoleGuard>} />
        <Route path="/monitor/census-reporting" element={<RoleGuard requiredRole="monitor"><CensusReporting /></RoleGuard>} />
        <Route path="/monitor/vaccination-records" element={<RoleGuard requiredRole="monitor"><VaccinationMonitor /></RoleGuard>} />

        <Route path="/employee/dashboard" element={<RoleGuard requiredRole="employee"><EmployeeDashboard /></RoleGuard>} />
        <Route path="/employee/vaccinations" element={<RoleGuard requiredRole="employee"><EmployeeVaccinations /></RoleGuard>} />
        <Route path="/employee/land-records" element={<RoleGuard requiredRole="employee"><EmployeeLandRecords /></RoleGuard>} />
        <Route path="/employee/census" element={<RoleGuard requiredRole="employee"><EmployeeCensus /></RoleGuard>} />
        <Route path="/employee/village" element={<RoleGuard requiredRole="employee"><EmployeeCitizen /></RoleGuard>} />
        <Route path="/employee/citizens/:id" element={<RoleGuard requiredRole="employee"><EmployeeCitizenProfile /></RoleGuard>} />
        <Route path="/employee/welfare-schemes" element={<RoleGuard requiredRole="employee"><EmployeeSchemes /></RoleGuard>} />
        <Route path="/employee/schemes/:schemeId" element={<RoleGuard requiredRole="employee"><SchemeDetailsPage /></RoleGuard>} />
        <Route path="/employee/assets" element={<RoleGuard requiredRole="employee"><EmployeeAssets /></RoleGuard>} />

        <Route path="/admin/dashboard" element={<RoleGuard requiredRole="admin"><AdminDashboard /></RoleGuard>} />
        <Route path="/admin/user-management" element={<RoleGuard requiredRole="admin"><AdminUsers /></RoleGuard>} />

        {/* Add other routes as needed */}
      </Routes>
    </Router>
  );
}

export default App;