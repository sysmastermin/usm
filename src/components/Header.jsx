import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Search, Menu, User, X, Grid3x3, Image, Zap, Box, MapPin, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SearchModal from "./SearchModal";

const menuItems = [
    { to: "/", label: "카테고리", icon: Grid3x3, description: "제품 카테고리 탐색" },
    { to: "/scene", label: "씬(Scene)", icon: Image, description: "인테리어 시나리오" },
    { to: "#", label: "퀵쉽", icon: Zap, description: "빠른 배송 서비스" },
    { to: "/configurator", label: "3D 시뮬레이션", icon: Box, description: "가구 구성하기" },
    { to: "#", label: "매장 안내", icon: MapPin, description: "오프라인 매장 찾기" },
];

export default function Header() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // ESC 키로 모바일 메뉴 닫기
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isMobileMenuOpen]);

    // 모바일 메뉴 열려있을 때 body 스크롤 방지
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [isMobileMenuOpen]);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen((prev) => !prev);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

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
                        {/* Mobile Menu Button */}
                        <button
                            onClick={toggleMobileMenu}
                            className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
                            aria-label="메뉴 열기"
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2">
                            <span className="text-2xl font-bold tracking-tighter text-black dark:text-white">USM</span>
                            <span className="hidden md:block text-xs text-gray-500 dark:text-gray-400">모듈러 가구</span>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
                            <Link to="/" className="hover:text-black dark:hover:text-white transition-colors">카테고리</Link>
                            <Link to="/scene" className="hover:text-black dark:hover:text-white transition-colors">씬(Scene)</Link>
                            <Link to="#" className="hover:text-black dark:hover:text-white transition-colors">퀵쉽</Link>
                            <Link to="/configurator" className="hover:text-black dark:hover:text-white transition-colors">3D 시뮬레이션</Link>
                            <Link to="#" className="hover:text-black dark:hover:text-white transition-colors">매장 안내</Link>
                        </nav>

                        {/* Icons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="p-2 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors"
                            >
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

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Overlay with blur */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                            onClick={closeMobileMenu}
                        />

                        {/* Menu Panel */}
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ 
                                type: "spring", 
                                damping: 25, 
                                stiffness: 200 
                            }}
                            className="fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-white via-white to-gray-50 dark:from-black dark:via-gray-950 dark:to-black border-r border-gray-200/50 dark:border-gray-800/50 z-50 md:hidden overflow-y-auto shadow-2xl"
                        >
                            {/* Menu Header with gradient */}
                            <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-900 to-black dark:from-gray-950 dark:to-black border-b border-gray-800/50 backdrop-blur-xl">
                                <div className="px-6 py-5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                            <span className="text-white text-sm font-bold">USM</span>
                                        </div>
                                        <div>
                                            <h2 className="text-white text-lg font-bold tracking-tight">메뉴</h2>
                                            <p className="text-gray-400 text-xs">모듈러 가구</p>
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={closeMobileMenu}
                                        className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
                                        aria-label="메뉴 닫기"
                                    >
                                        <X className="w-5 h-5" />
                                    </motion.button>
                                </div>
                            </div>

                            {/* Menu Links with stagger animation */}
                            <nav className="px-4 py-6 flex flex-col gap-2">
                                {menuItems.map((item, index) => {
                                    const Icon = item.icon;
                                    return (
                                        <motion.div
                                            key={item.to}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{
                                                delay: index * 0.08,
                                                type: "spring",
                                                stiffness: 300,
                                                damping: 24
                                            }}
                                        >
                                            <Link
                                                to={item.to}
                                                onClick={closeMobileMenu}
                                                className="group relative flex items-center gap-4 px-5 py-4 rounded-xl bg-white/50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/80 border border-gray-200/50 dark:border-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                {/* Icon */}
                                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 group-hover:from-gray-200 group-hover:to-gray-300 dark:group-hover:from-gray-700 dark:group-hover:to-gray-600 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                                                    <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors" />
                                                </div>

                                                {/* Text Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-black dark:group-hover:text-white transition-colors">
                                                        {item.label}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                                                        {item.description}
                                                    </div>
                                                </div>

                                                {/* Chevron */}
                                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-all duration-300 group-hover:translate-x-1 flex-shrink-0" />

                                                {/* Hover effect background */}
                                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </nav>

                            {/* Footer */}
                            <div className="px-4 pb-6 pt-4 border-t border-gray-200/50 dark:border-gray-800/50 mt-auto">
                                <div className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                                    © 2026 USM Clone
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}
