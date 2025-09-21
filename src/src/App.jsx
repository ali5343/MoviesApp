import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'; // Import necessary routing components
import Home from './pages/Home';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State to track login status

  const handleLogin = (username, password) => {
      // **Replace with your actual authentication logic**
      if (username === 'admin' && password === 'password') {
          setIsLoggedIn(true);
          return true;
      } else {
          alert('Invalid credentials');
          return false;
      }
  };

  const handleLogout = () => {
      setIsLoggedIn(false);
  };

  return (
      <Router>
          <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/admin" element={isLoggedIn ? <AdminPanel onLogout={handleLogout} /> : <Navigate to="/login" />} />
          </Routes>
      </Router>
  );
}

export default App;