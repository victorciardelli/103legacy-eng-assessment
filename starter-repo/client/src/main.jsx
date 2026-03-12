import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import UploadPage from "./UploadPage";
import DashboardPage from "./DashboardPage";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/upload/:cardId" element={<UploadPage />} />
      <Route path="/dashboard/:cardId" element={<DashboardPage />} />
    </Routes>
  </BrowserRouter>
);
