import React, { useState, createContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./components/Home/Home";
import Login from "./components/Login/Login";
import Signup from "./components/Signup/Signup";
import AudioListing from "./components/AudioListing/AudioListing";

import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
export const AppContext = createContext();

function App() {
  const [file, setFile] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [summarizedText, setSummarizedText] = useState("");
  const [loader, setLoader] = useState(false);

  const value = {
    file,
    setFile,
    generatedText,
    setGeneratedText,
    summarizedText,
    setSummarizedText,
    loader,
    setLoader,
  };
  return (
    <AppContext.Provider value={value}>
      <div className="App">
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Home />} />
            <Route path="/history" element={<AudioListing />} />
          </Routes>
        </Router>
      </div>
    </AppContext.Provider>
  );
}

export default App;
