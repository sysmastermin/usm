import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Bot,
  Languages,
  LogOut,
  X,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  {
    to: '/admin',
    label: '대시보드',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: '/admin/products',
    label: '상품 관리',
    icon: Package,
  },
  {
    to: '/admin/categories',
    label: '카테고리',
    icon: FolderTree,
  },
  {
    to: '/admin/crawler',
    label: '크롤러',
    icon: Bot,
  },
  {
    to: '/admin/translations',
    label: '번역 관리',
    icon: Languages,
  },
];

/**
 * 관리자 사이드바 네비게이션
 * - Desktop: 240px 고정
 * - Tablet: 64px (아이콘만)
 * - Mobile: 오버레이 슬라이드
 *
 * @param {object} props
 * @param {boolean} props.mobileOpen - 모바일 메뉴 열림 상태
 * @param {function} props.onMobileClose - 모바일 메뉴 닫기
 */
export default function AdminSidebar({
  mobileOpen,
  onMobileClose,
}) {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAdminAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* 로고 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white dark:text-gray-900 text-sm font-bold">
              U
            </span>
          </div>
          <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap sidebar-text">
            USM Admin
          </span>
        </div>
        {/* 모바일에서만 닫기 버튼 */}
        <button
          onClick={onMobileClose}
          className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onMobileClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'text-sm font-medium transition-colors',
                'min-h-[44px]',
                isActive
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              )
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="sidebar-text truncate">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* 하단 액션 */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
        {/* 테마 토글 */}
        <button
          onClick={toggleTheme}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg w-full',
            'text-sm font-medium transition-colors',
            'text-gray-600 dark:text-gray-400',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            'min-h-[44px]'
          )}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 shrink-0" />
          ) : (
            <Moon className="w-5 h-5 shrink-0" />
          )}
          <span className="sidebar-text truncate">
            {theme === 'dark' ? '라이트 모드' : '다크 모드'}
          </span>
        </button>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg w-full',
            'text-sm font-medium transition-colors',
            'text-red-600 dark:text-red-400',
            'hover:bg-red-50 dark:hover:bg-red-900/20',
            'min-h-[44px]'
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="sidebar-text truncate">
            로그아웃
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 데스크톱/태블릿 사이드바 */}
      <aside
        className={cn(
          'hidden md:flex flex-col',
          'bg-white dark:bg-gray-900',
          'border-r border-gray-200 dark:border-gray-700',
          'h-screen sticky top-0',
          'transition-all duration-300',
          // 데스크톱: 240px, 태블릿: 64px
          'w-16 lg:w-60'
        )}
      >
        {sidebarContent}
      </aside>

      {/* 모바일 오버레이 사이드바 */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}
      <aside
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-50',
          'w-72 bg-white dark:bg-gray-900',
          'border-r border-gray-200 dark:border-gray-700',
          'transition-transform duration-300',
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* 태블릿에서 sidebar-text 숨김용 CSS */}
      <style>{`
        @media (min-width: 768px) and (max-width: 1023px) {
          .sidebar-text { display: none; }
        }
      `}</style>
    </>
  );
}
