import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/citizenDashboard';
import HouseholdInfo from './pages/HouseholdInfo';
import PanchayatEmployees from './pages/PanchayatEmployees';
import Vaccinations from './pages/Vaccinations';
import Assets from './pages/Assets';
import CensusData from './pages/CensusData';
import LandRecords from './pages/LandRecords';
import Profile from './pages/Profile';
import './App.css';
import Schemes from './pages/Schemes';
import Applications from './pages/Applications';
import ProtectedRoute from './components/ProtectedRoute';

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
        {/* Add other routes as needed */}
      </Routes>
    </Router>
  );
}

export default App;