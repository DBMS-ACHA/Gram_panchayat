import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/citizens/Login';
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/citizen/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/citizen/household" element={<ProtectedRoute><HouseholdInfo /></ProtectedRoute>} />
        <Route path="/citizen/employees" element={<ProtectedRoute><PanchayatEmployees /></ProtectedRoute>} />
        <Route path="/citizen/vaccinations" element={<ProtectedRoute><Vaccinations /></ProtectedRoute>} />
        <Route path="/citizen/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
        <Route path="/citizen/census" element={<ProtectedRoute><CensusData /></ProtectedRoute>} />
        <Route path="/citizen/land-records" element={<ProtectedRoute><LandRecords /></ProtectedRoute>} />
        <Route path="/citizen/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/citizen/schemes" element={<ProtectedRoute><Schemes /></ProtectedRoute>} />
        <Route path="/citizen/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
        <Route path="/monitor/dashboard" element={<ProtectedRoute><MonitorDashboard /></ProtectedRoute>} />
        <Route path="/monitor/land" element={<ProtectedRoute><LandRecordsMonitor /></ProtectedRoute>} />
        <Route path="/monitor/village" element={<ProtectedRoute><VillageStatisticsMonitor /></ProtectedRoute>} />
        <Route path="/monitor/asset-tracking" element={<ProtectedRoute><AssetsMonitor /></ProtectedRoute>} />
        <Route path="/monitor/citizen/:id" element={<ProtectedRoute><CitizenProfileMonitor /></ProtectedRoute>} />
        {/* Add other routes as needed */}
      </Routes>
    </Router>
  );
}

export default App;