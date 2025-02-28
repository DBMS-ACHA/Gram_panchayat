import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/citizen_Dashboard';
import HouseholdInfo from './pages/HouseholdInfo';
import PanchayatEmployees from './pages/PanchayatEmployees';
import Vaccinations from './pages/Vaccinations';
import Assets from './pages/Assets';
import CensusData from './pages/CensusData';
import LandRecords from './pages/LandRecords';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/citizen/dashboard" element={<Dashboard />} />
        <Route path="/citizen/household" element={<HouseholdInfo />} />
        <Route path="/citizen/employees" element={<PanchayatEmployees />} />
        <Route path="/citizen/vaccinations" element={<Vaccinations />} />
        <Route path="/citizen/assets" element={<Assets />} />
        <Route path="/citizen/census" element={<CensusData />} />
        <Route path="/citizen/land-records" element={<LandRecords />} />
        {/* Add other routes as needed */}
      </Routes>
    </Router>
  );
}

export default App;