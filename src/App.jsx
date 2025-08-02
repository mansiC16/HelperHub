// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import SignupPage from './components/SignupPage';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';
import ServiceProvidersPage from './components/ServiceProvidersPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
           <Route path="/edit-profile" element={<ProfilePage />} />
          <Route path="/service/:serviceType" element={<ProfilePage />} />
          <Route path="/service-providers/:serviceType" element={<ServiceProvidersPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;