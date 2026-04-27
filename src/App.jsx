import { Routes, Route, useLocation } from "react-router-dom";

import MainHeader from "./header-navigation/main-header";

import Home from "./pages/home";
import Login from "./pages/login";
import ForgotPassword from "./pages/forgot-password";
import Signup from "./pages/signup";
import ResetPassword from "./pages/reset-password";

import Artbitrage from "./pages/arbitrage";
import Subscription from "./pages/subscription";
import Trade from "./pages/trade";
import Contact from "./pages/contact";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import CompliancePolicy from "./pages/CompliancePolicy";
import WhistleblowingPolicy from "./pages/WhistleblowingPolicy";
import AntiBriberyPolicy from "./pages/AntiBriberyPolicy";
import UserAgreement from "./pages/UserAgreement";
import CookieBanner from "./pages/CookieBanner";
import ElectronicCommunications from "./pages/ElectronicCommunications";
import AssetListingPolicy from "./pages/AssetListingPolicy";
import TradingRules from "./pages/TradingRules";
import LiquidationGuard from "./pages/LiquidationGuard";
import FeeSchedule from "./pages/FeeSchedule";

import Terms from "./pages/terms";

import Dashborad from "./pages/Dashboard";

import Blogs from "./Blogs-page/blogs";
import BlogUpdate from "./Components/BlogUpdate";
import BlogDetail from "./Blogs-page/blog-detail";

import Spot from "./Crypto-Trade/Spot";
import Futures from "./Crypto-Trade/Futures";

import Support from "./Components/Support";

import VerifyEmail from "./pages/verify-email";

import "./App.css";

// Main app router and top-level layout.
const App = () => {
  const location = useLocation();

  const hideHeaderRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/terms",
    "/Dashboard",
    "/trade",
    "/Blogs",
    "/blog",
    "/BlogUpdate",
    "/Spot",
    "/Futures",
    "/Support",

    //add any other auth pages here
  ];

  const hideHeader =
    hideHeaderRoutes.includes(location.pathname) ||
    location.pathname.startsWith("/blogs/");

  return (
    <>
      {!hideHeader && <MainHeader />} {/* this line hides it automatically*/}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/Dashboard" element={<Dashborad />} />
        <Route path="/arbitrage" element={<Artbitrage />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/trade" element={<Trade />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/compliance-policy" element={<CompliancePolicy />} />
        <Route
          path="/whistleblowing-policy"
          element={<WhistleblowingPolicy />}
        />
        <Route path="/anti-bribery-policy" element={<AntiBriberyPolicy />} />
        <Route path="/user-agreement" element={<UserAgreement />} />
        <Route path="/cookie-banner" element={<CookieBanner />} />
        <Route
          path="/electronic-communications"
          element={<ElectronicCommunications />}
        />
        <Route path="/asset-listing-policy" element={<AssetListingPolicy />} />
        <Route path="/trading-rules" element={<TradingRules />} />
        <Route path="/liquidation-guard" element={<LiquidationGuard />} />
        <Route path="/fee-schedule" element={<FeeSchedule />} />
        <Route path="/blog" element={<Blogs />} />
        <Route path="/Blogs" element={<Blogs />} />
        <Route path="/BlogUpdate" element={<BlogUpdate />} />
        <Route path="/blogs/:id" element={<BlogDetail />} />
        <Route path="/Spot" element={<Spot />} />
        <Route path="/Futures" element={<Futures />} />
        <Route path="/Support" element={<Support />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>
    </>
  );
};

export default App;
