import { useState } from 'react';
import {
  Outlet,
  NavLink,
  useLocation,
} from 'react-router-dom';
import {
  Menu,
  LayoutDashboard,
  Package,
  FolderTree,
  Bot,
  Languages,
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import ErrorBoundary from './ErrorBoundary';
import { ToastProvider } from './Toast';
import { cn } from '../../lib/utils';

const BOTTOM_NAV_ITEMS = [
  {
    to: '/admin',
    label: '대시보드',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: '/admin/products',
    label: '상품',
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
    label: '번역',
    icon: Languages,
  },
];

/**
 * 관리자 레이아웃
 * - 사이드바 + 메인 콘텐츠
 * - 모바일 햄버거 메뉴 + 하단 내비게이션 바
 * - ToastProvider + ErrorBoundary 래핑
 */
export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* 사이드바 */}
        <AdminSidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 모바일 헤더 */}
          <header
            className={cn(
              'md:hidden flex items-center gap-3',
              'px-4 h-14 sticky top-0 z-30',
              'bg-white dark:bg-gray-900',
              'border-b border-gray-200',
              'dark:border-gray-700'
            )}
          >
            <button
              onClick={() => setMobileOpen(true)}
              className={cn(
                'min-w-[44px] min-h-[44px]',
                'flex items-center justify-center',
                'text-gray-600 dark:text-gray-400'
              )}
            >
              <Menu className="w-6 h-6" />
            </button>
            <span
              className={cn(
                'font-semibold',
                'text-gray-900 dark:text-white'
              )}
            >
              USM Admin
            </span>
          </header>

          {/* 페이지 콘텐츠 (하단 내비 여백) */}
          <main
            className={cn(
              'flex-1 p-4 sm:p-6 lg:p-8',
              'pb-20 md:pb-4 lg:pb-8'
            )}
          >
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>

        {/* 모바일 하단 고정 내비게이션 */}
        <nav
          className={cn(
            'md:hidden fixed bottom-0 left-0 right-0 z-40',
            'bg-white dark:bg-gray-900',
            'border-t border-gray-200',
            'dark:border-gray-700',
            'flex items-center justify-around',
            'h-16'
          )}
          style={{
            paddingBottom:
              'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {BOTTOM_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5',
                  'px-2 py-1.5 rounded-lg',
                  'min-w-[56px] min-h-[44px]',
                  'text-[10px] font-medium',
                  'transition-colors',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </ToastProvider>
  );
}
