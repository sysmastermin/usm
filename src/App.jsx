import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Layout from "./components/Layout";
import ProductList from "./components/ProductList";
import ProductDetail from "./components/ProductDetail";
import ScenePage from "./pages/ScenePage";
import SceneDetailPage from "./pages/SceneDetailPage";
import CategoryPage from "./pages/CategoryPage";
import ColorPage from "./pages/ColorPage";
import ConfiguratorPage from "./pages/ConfiguratorPage";

// 사용자 페이지 (React.lazy - 코드 분할)
const LoginPage = lazy(
  () => import("./pages/auth/LoginPage")
);
const RegisterPage = lazy(
  () => import("./pages/auth/RegisterPage")
);
const UserRoute = lazy(
  () => import("./components/user/UserRoute")
);
const MyPage = lazy(
  () => import("./pages/user/MyPage")
);
const CartPage = lazy(
  () => import("./pages/user/CartPage")
);
const CheckoutPage = lazy(
  () => import("./pages/user/CheckoutPage")
);
const OrdersPage = lazy(
  () => import("./pages/user/OrdersPage")
);
const OrderDetailPage = lazy(
  () => import("./pages/user/OrderDetailPage")
);
const WishlistPage = lazy(
  () => import("./pages/user/WishlistPage")
);

// 관리자 페이지 (React.lazy - 코드 분할)
const AdminLoginPage = lazy(
  () => import("./pages/admin/AdminLoginPage")
);
const AdminLayout = lazy(
  () => import("./components/admin/AdminLayout")
);
const AdminRoute = lazy(
  () => import("./components/admin/AdminRoute")
);
const AdminDashboard = lazy(
  () => import("./pages/admin/AdminDashboard")
);
const AdminProducts = lazy(
  () => import("./pages/admin/AdminProducts")
);
const AdminProductEdit = lazy(
  () => import("./pages/admin/AdminProductEdit")
);
const AdminOrders = lazy(
  () => import("./pages/admin/AdminOrders")
);
const AdminOrderDetail = lazy(
  () => import("./pages/admin/AdminOrderDetail")
);
const AdminCategories = lazy(
  () => import("./pages/admin/AdminCategories")
);
const AdminCrawler = lazy(
  () => import("./pages/admin/AdminCrawler")
);
const AdminTranslations = lazy(
  () => import("./pages/admin/AdminTranslations")
);

/**
 * 페이지 로딩 UI
 */
function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}

/**
 * 관리자 페이지 로딩 UI
 */
function AdminFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <Loader2
          className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-600"
        />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          관리자 페이지 로딩 중...
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* 쇼핑몰 프론트엔드 */}
      <Route path="/" element={<Layout />}>
        <Route index element={<ProductList />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="scene" element={<ScenePage />} />
        <Route path="scene/:sceneId/:imageId" element={<SceneDetailPage />} />
        <Route path="category/:categoryName" element={<CategoryPage />} />
        <Route path="color/:colorName" element={<ColorPage />} />
        <Route path="configurator" element={<ConfiguratorPage />} />

        {/* 인증 페이지 (공개, Layout 내부) */}
        <Route
          path="login"
          element={
            <Suspense fallback={<PageFallback />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="register"
          element={
            <Suspense fallback={<PageFallback />}>
              <RegisterPage />
            </Suspense>
          }
        />

        {/* 사용자 전용 (인증 필요) */}
        <Route
          element={
            <Suspense fallback={<PageFallback />}>
              <UserRoute />
            </Suspense>
          }
        >
          <Route path="mypage" element={<MyPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
        </Route>
      </Route>

      {/* 관리자 로그인 (인증 불필요) */}
      <Route
        path="/admin/login"
        element={
          <Suspense fallback={<AdminFallback />}>
            <AdminLoginPage />
          </Suspense>
        }
      />

      {/* 관리자 페이지 (인증 필요) */}
      <Route
        path="/admin"
        element={
          <Suspense fallback={<AdminFallback />}>
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          </Suspense>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/:id" element={<AdminProductEdit />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="crawler" element={<AdminCrawler />} />
        <Route path="translations" element={<AdminTranslations />} />
      </Route>

      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="p-12 text-center text-gray-500">
            404 Not Found
          </div>
        }
      />
    </Routes>
  );
}

export default App;
