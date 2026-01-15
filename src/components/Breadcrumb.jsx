import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const pathMap = {
    '/': '홈',
    '/scene': '시나리오',
    '/category': '카테고리',
    '/color': '컬러',
    '/product': '제품 상세',
    '/configurator': '3D 컨피규레이터'
};

export default function Breadcrumb() {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    // 홈에서는 표시하지 않음
    if (location.pathname === '/') {
        return null;
    }

    const getBreadcrumbName = (path, index, pathnames) => {
        // 첫 번째 경로 (카테고리, 컬러 등)
        if (index === 0) {
            const basePath = `/${path}`;
            if (pathMap[basePath]) {
                return pathMap[basePath];
            }
        }

        // 두 번째 경로 (파라미터 값)
        if (index === 1 && pathnames.length > 1) {
            try {
                return decodeURIComponent(path);
            } catch {
                return path;
            }
        }

        // 제품 상세 페이지
        if (pathnames[0] === 'product' && index === 1) {
            return '제품 상세';
        }

        return path;
    };

    const getBreadcrumbPath = (index, pathnames) => {
        const path = '/' + pathnames.slice(0, index + 1).join('/');
        return path;
    };

    return (
        <nav className="mb-4 md:mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                <li>
                    <Link
                        to="/"
                        className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors p-1"
                    >
                        <Home className="w-3 h-3 md:w-4 md:h-4" />
                    </Link>
                </li>
                {pathnames.map((path, index) => {
                    const isLast = index === pathnames.length - 1;
                    const breadcrumbName = getBreadcrumbName(path, index, pathnames);
                    const breadcrumbPath = getBreadcrumbPath(index, pathnames);

                    return (
                        <li key={breadcrumbPath} className="flex items-center gap-1.5 md:gap-2">
                            <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                            {isLast ? (
                                <span className="text-gray-900 dark:text-white font-medium truncate max-w-[150px] md:max-w-none">
                                    {breadcrumbName}
                                </span>
                            ) : (
                                <Link
                                    to={breadcrumbPath}
                                    className="hover:text-gray-900 dark:hover:text-white transition-colors truncate max-w-[150px] md:max-w-none"
                                >
                                    {breadcrumbName}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
