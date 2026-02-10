import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Breadcrumb from "./Breadcrumb";
import { CategoriesProvider } from "../context/CategoriesContext";

export default function Layout() {
  return (
    <CategoriesProvider>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white font-sans transition-colors duration-300">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-4 md:py-8">
          <Breadcrumb />
          <Outlet />
        </main>
        <Footer />
      </div>
    </CategoriesProvider>
  );
}
