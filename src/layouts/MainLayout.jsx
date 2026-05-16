import { useLocation } from "react-router-dom";
import MainHeader from "../Components/layout/main-header";

const HIDE_HEADER_ROUTES = [
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
];

const MainLayout = ({ children }) => {
  const location = useLocation();
  const hideHeader =
    HIDE_HEADER_ROUTES.includes(location.pathname) ||
    location.pathname.startsWith("/blogs/");

  return (
    <>
      {!hideHeader && <MainHeader />}
      {children}
    </>
  );
};

export default MainLayout;
