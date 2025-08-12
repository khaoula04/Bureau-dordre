import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ArriveeRegister from './components/ArriveeRegister';
import DepartRegister from './components/DepartRegister';
import Home from './components/Home'; 

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {/* Navbar */}



        <div className="container mx-auto px-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/arrivee" element={<ArriveeRegister />} />
            <Route path="/depart" element={<DepartRegister />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

