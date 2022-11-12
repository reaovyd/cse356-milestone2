import React from 'react';
import ReactDOM from 'react-dom/client';
import {
    BrowserRouter as Router,
    Routes, Route
} from 'react-router-dom'
import Editor from './Editor';
//import App from './App';

import Login from './Login.js'
import Home from './Home.js';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Router>
    <Routes>
       <Route path="/" element={<Login />}/> 
       <Route path="/home" element={<Home />}/> 
       <Route path="/edit/:id" element={<Editor />}/> 
    </Routes>
  </Router>
);


// <Route path="/:id" element={<Editor />}/> 
