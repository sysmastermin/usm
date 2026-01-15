import { Link } from "react-router-dom";
import { ShoppingCart, Search, Menu, User } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
    return (
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
                    <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
                        <Link to="/" className="hover:text-black dark:hover:text-white transition-colors">카테고리</Link>
                        <Link to="#" className="hover:text-black dark:hover:text-white transition-colors">씬(Scene)</Link>
                        <Link to="#" className="hover:text-black dark:hover:text-white transition-colors">퀵쉽</Link>
                        <Link to="#" className="hover:text-black dark:hover:text-white transition-colors">3D 시뮬레이션</Link>
                        <Link to="#" className="hover:text-black dark:hover:text-white transition-colors">매장 안내</Link>
                    </nav>

                    {/* Icons */}
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <button className="p-2 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors">
                            <Search className="w-5 h-5" />
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
    );
}
