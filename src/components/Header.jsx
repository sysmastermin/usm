import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Search, Menu, User, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import SearchModal from "./SearchModal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

export default function Header() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const [navCategories, setNavCategories] = useState([]);
    const [isNavLoading, setIsNavLoading] = useState(true);

    useEffect(() => {
        const fetchCategoriesForNav = async () => {
            try {
                setIsNavLoading(true);

                const response = await fetch(`${API_BASE_URL}/categories`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch categories: ${response.status}`);
                }

                const data = await response.json();
                const categoriesFromApi = Array.isArray(data?.data) ? data.data : [];

                setNavCategories(categoriesFromApi);
            } catch {
                setNavCategories([]);
            } finally {
                setIsNavLoading(false);
            }
        };

        fetchCategoriesForNav();
    }, []);

    return (
        <>
            <header className="sticky top-0 z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
                {/* Top Bar */}
                <div className="bg-gray-900 dark:bg-gray-950 text-white text-xs py-2 text-center">
                    <span>전국 무료배송 | 2년 품질보증 | 공식 온라인 스토어</span>
                </div>

                {/* Main Header */}
                <div className="container mx-auto px-4">
                    <div className="h-16 flex items-center justify-between">
                        {/* Mobile Menu */}
                        <button className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white">
                            <Menu className="w-6 h-6" />
                        </button>

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2">
                            <span className="text-2xl font-bold tracking-tighter text-black dark:text-white">USM</span>
                            <span className="hidden md:block text-xs text-gray-500 dark:text-gray-400">모듈러 가구</span>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
                            <Link
                                to="/"
                                className="hover:text-black dark:hover:text-white transition-colors"
                            >
                                전체 상품
                            </Link>
                            {!isNavLoading && navCategories.length > 0 && (
                                <>
                                    {navCategories.slice(0, 4).map((cat) => {
                                        const displayName = cat.name_ko || cat.name_ja || cat.slug;
                                        return (
                                            <Link
                                                key={cat.id || cat.slug}
                                                to={`/category/${encodeURIComponent(cat.slug)}`}
                                                className="hover:text-black dark:hover:text-white transition-colors"
                                            >
                                                {displayName}
                                            </Link>
                                        );
                                    })}
                                </>
                            )}
                            <Link
                                to="/scene"
                                className="hover:text-black dark:hover:text-white transition-colors"
                            >
                                씬(Scene)
                            </Link>
                            <Link
                                to="/configurator"
                                className="hover:text-black dark:hover:text-white transition-colors"
                            >
                                3D 시뮬레이션
                            </Link>
                        </nav>

                        {/* Icons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="p-2 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                            <button
                                onClick={toggleTheme}
                                className="p-2 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:ring-offset-white dark:focus:ring-offset-black"
                                aria-label={theme === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"}
                                title={theme === "light" ? "다크 모드" : "라이트 모드"}
                            >
                                {theme === "light" ? (
                                    <Moon className="w-5 h-5" />
                                ) : (
                                    <Sun className="w-5 h-5" />
                                )}
                            </button>
                            <button className="hidden md:block p-2 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors">
                                <User className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors relative">
                                <ShoppingCart className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">0</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}
