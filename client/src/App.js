import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/citizen_Dashboard';
import Vaccinations from './pages/Vaccinations';
import HouseholdInfo from './pages/HouseholdInfo';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/citizen/dashboard" element={<Dashboard />} />
          <Route path="/vaccinations" element={<Vaccinations />} />
          <Route path="/citizen/household" element={<HouseholdInfo />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;