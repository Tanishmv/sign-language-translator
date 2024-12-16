// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Use 'Routes' instead of 'Switch'
import WebcamPrediction from './sign-lang-predict';  // Home page component
import Translator from './text-to-sign';  // Translator page component

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Define routes for the pages */}
        <Route path="/" element={<WebcamPrediction />} />  {/* Use 'element' prop for JSX */}
        <Route path="/text-to-sign" element={<Translator />} />  
      </Routes>
    </Router>
  );
};

export default App;
