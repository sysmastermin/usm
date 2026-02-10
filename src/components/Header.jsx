import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Search,
  Menu,
  User,
  Sun,
  Moon,
  X,
  LogOut,
  Package,
  Heart,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useUserAuth } from "../context/UserAuthContext";
import SearchModal from "./SearchModal";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "/api";

export default function Header() {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] =
    useState(false);
  const { theme, toggleTheme } = useTheme();
  const {
    user,
    isLoggedIn,
    cartCount,
    logout,
  } = useUserAuth();
  const [navCategories, setNavCategories] = useState([]);
  const [isNavLoading, setIsNavLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchCategoriesForNav = async () => {
      try {
        setIsNavLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/categories`
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch categories: ${response.status}`
          );
        }
        const data = await response.json();
        const categoriesFromApi = Array.isArray(
          data?.data
        )
          ? data.data
          : [];
        setNavCategories(categoriesFromApi);
      } catch {
        setNavCategories([]);
      } finally {
        setIsNavLoading(false);
      }
    };
    fetchCategoriesForNav();
  }, []);

  // 드롭다운 외부 클릭 닫기
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () =>
      document.removeEventListener("mousedown", handler);
  }, []);

  const handleNavClick = () => {
    setIsMobileNavOpen(false);
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    setIsMobileNavOpen(false);
    navigate("/");
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
        {/* Top Bar */}
        <div className="bg-gray-900 dark:bg-gray-950 text-white text-xs py-2 text-center">
          <span>
            전국 무료배송 | 2년 품질보증 | 공식 온라인 스토어
          </span>
        </div>

        {/* Main Header */}
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            {/* Mobile Menu */}
            <button
              type="button"
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
              aria-label="모바일 메뉴 열기"
              onClick={() => setIsMobileNavOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2"
              onClick={handleNavClick}
            >
              <span className="text-2xl font-bold tracking-tighter text-black dark:text-white">
                USM
              </span>
              <span className="hidden md:block text-xs text-gray-500 dark:text-gray-400">
                모듈러 가구
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
              <Link
                to="/"
                className="hover:text-black dark:hover:text-white transition-colors"
              >
                전체 상품
              </Link>
              {!isNavLoading &&
                navCategories.length > 0 && (
                  <>
                    {navCategories
                      .slice(0, 4)
                      .map((cat) => {
                        const displayName =
                          cat.name_ko ||
                          cat.name_ja ||
                          cat.slug;
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
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors"
                aria-label="검색 열기"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:ring-offset-white dark:focus:ring-offset-black"
                aria-label={
                  theme === "light"
                    ? "다크 모드로 전환"
                    : "라이트 모드로 전환"
                }
                title={
                  theme === "light"
                    ? "다크 모드"
                    : "라이트 모드"
                }
              >
                {theme === "light" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>

              {/* 사용자 아이콘 / 드롭다운 */}
              <div
                className="relative hidden md:block"
                ref={dropdownRef}
              >
                {isLoggedIn ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setShowDropdown(!showDropdown)
                      }
                      className="flex items-center gap-1 p-2 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors"
                      aria-label="내 계정 메뉴"
                    >
                      <User className="w-5 h-5" />
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {/* 드롭다운 메뉴 */}
                    {showDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-sm shadow-lg z-50">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user?.name || "회원"}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {user?.email}
                          </p>
                        </div>
                        <div className="py-1">
                          <DropdownLink
                            to="/mypage"
                            icon={User}
                            label="마이페이지"
                            onClick={() =>
                              setShowDropdown(false)
                            }
                          />
                          <DropdownLink
                            to="/orders"
                            icon={Package}
                            label="주문내역"
                            onClick={() =>
                              setShowDropdown(false)
                            }
                          />
                          <DropdownLink
                            to="/wishlist"
                            icon={Heart}
                            label="위시리스트"
                            onClick={() =>
                              setShowDropdown(false)
                            }
                          />
                        </div>
                        <div className="border-t border-gray-100 dark:border-gray-800 py-1">
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <LogOut className="w-4 h-4" />
                            로그아웃
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="p-2 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors"
                    aria-label="로그인"
                  >
                    <User className="w-5 h-5" />
                  </Link>
                )}
              </div>

              {/* 장바구니 */}
              <Link
                to={isLoggedIn ? "/cart" : "/login"}
                className="p-2 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors relative"
                aria-label="장바구니"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {cartCount > 99
                      ? "99+"
                      : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 w-full h-full bg-black/40"
            aria-label="모바일 메뉴 닫기"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div className="relative h-full w-72 max-w-[80%] bg-white dark:bg-neutral-900 shadow-xl">
            <div className="h-full flex flex-col p-4">
              <div className="flex items-center justify-between mb-4">
                <Link
                  to="/"
                  className="flex items-center gap-2"
                  onClick={handleNavClick}
                >
                  <span className="text-xl font-bold tracking-tighter text-black dark:text-white">
                    USM
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    모듈러 가구
                  </span>
                </Link>
                <button
                  type="button"
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                  aria-label="모바일 메뉴 닫기"
                  onClick={() =>
                    setIsMobileNavOpen(false)
                  }
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-2 text-sm font-medium text-gray-800 dark:text-gray-100">
                <Link
                  to="/"
                  className="block px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={handleNavClick}
                >
                  전체 상품
                </Link>
                {!isNavLoading &&
                  navCategories.length > 0 && (
                    <div className="pt-1 border-t border-gray-200 dark:border-gray-800 mt-1">
                      {navCategories
                        .slice(0, 6)
                        .map((cat) => {
                          const displayName =
                            cat.name_ko ||
                            cat.name_ja ||
                            cat.slug;
                          return (
                            <Link
                              key={cat.id || cat.slug}
                              to={`/category/${encodeURIComponent(cat.slug)}`}
                              className="block px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                              onClick={handleNavClick}
                            >
                              {displayName}
                            </Link>
                          );
                        })}
                    </div>
                  )}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-3 space-y-1">
                  <Link
                    to="/scene"
                    className="block px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={handleNavClick}
                  >
                    씬(Scene)
                  </Link>
                  <Link
                    to="/configurator"
                    className="block px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={handleNavClick}
                  >
                    3D 시뮬레이션
                  </Link>
                </div>

                {/* 모바일 사용자 메뉴 */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-3 space-y-1">
                  {isLoggedIn ? (
                    <>
                      <Link
                        to="/mypage"
                        className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={handleNavClick}
                      >
                        <User className="w-4 h-4" />
                        마이페이지
                      </Link>
                      <Link
                        to="/orders"
                        className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={handleNavClick}
                      >
                        <Package className="w-4 h-4" />
                        주문내역
                      </Link>
                      <Link
                        to="/wishlist"
                        className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={handleNavClick}
                      >
                        <Heart className="w-4 h-4" />
                        위시리스트
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-2 py-2 rounded text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        로그아웃
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      className="flex items-center gap-2 px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={handleNavClick}
                    >
                      <User className="w-4 h-4" />
                      로그인
                    </Link>
                  )}
                </div>
              </nav>

              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(true);
                    setIsMobileNavOpen(false);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Search className="w-4 h-4" />
                  <span>검색</span>
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-2 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label={
                    theme === "light"
                      ? "다크 모드로 전환"
                      : "라이트 모드로 전환"
                  }
                >
                  {theme === "light" ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}

/**
 * 드롭다운 메뉴 링크 아이템
 */
function DropdownLink({ to, icon: Icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}
