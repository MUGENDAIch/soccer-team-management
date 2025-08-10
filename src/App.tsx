import React, { useState } from "react";
import LandingPage from "./components/LandingPage";
import SoccerTeamManagement from "./components/SoccerTeamManagement";
import PrivacyPolicy from "./components/pages/PrivacyPolicy";
import TermsOfService from "./components/pages/TermsOfService";
import About from "./components/pages/About";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import "./App.css";

type Page = "home" | "app" | "privacy" | "terms" | "about";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <LandingPage onStartApp={() => setCurrentPage("app")} />;
      case "app":
        return <SoccerTeamManagement />;
      case "privacy":
        return <PrivacyPolicy />;
      case "terms":
        return <TermsOfService />;
      case "about":
        return <About />;
      default:
        return <LandingPage onStartApp={() => setCurrentPage("app")} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <main>{renderPage()}</main>
      <Footer onPageChange={setCurrentPage} />
    </div>
  );
}

export default App;
