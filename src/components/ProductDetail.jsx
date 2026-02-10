import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Minus,
  Plus,
  Loader2,
} from "lucide-react";
import { useUserAuth } from "../context/UserAuthContext";
import userApi from "../lib/userApi";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3001/api";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    isLoggedIn,
    isLoading: authLoading,
    updateCartCount,
  } = useUserAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [inWishlist, setInWishlist] = useState(false);
  const [cartAdding, setCartAdding] = useState(false);
  const [wishToggling, setWishToggling] = useState(false);

  // 상품 데이터 로드
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${API_BASE_URL}/products/${id}`
        );
        if (!res.ok)
          throw new Error("상품을 찾을 수 없습니다");
        const data = await res.json();
        if (data.success && data.data) {
          setProduct(data.data);
        } else {
          throw new Error("상품 데이터 오류");
        }
      } catch (err) {
        setError(
          err.message || "상품 로딩 중 오류가 발생했습니다"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // 위시리스트 상태 확인 (로그인 시)
  useEffect(() => {
    if (!isLoggedIn || !product) return;
    const checkWishlist = async () => {
      try {
        const res = await userApi.get(
          `/wishlist/check/${product.id}`
        );
        setInWishlist(res.data.data?.inWishlist || false);
      } catch {
        // 무시
      }
    };
    checkWishlist();
  }, [isLoggedIn, product]);

  // 장바구니 담기
  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      navigate("/login", {
        state: { from: { pathname: `/product/${id}` } },
      });
      return;
    }
    setCartAdding(true);
    try {
      await userApi.post("/cart", {
        productId: product.id,
        quantity,
      });
      updateCartCount();
      alert("장바구니에 추가되었습니다");
    } catch {
      alert("장바구니 추가에 실패했습니다");
    } finally {
      setCartAdding(false);
    }
  };

  // 위시리스트 토글
  const handleToggleWishlist = async () => {
    if (!isLoggedIn) {
      navigate("/login", {
        state: { from: { pathname: `/product/${id}` } },
      });
      return;
    }
    setWishToggling(true);
    try {
      const res = await userApi.post("/wishlist", {
        productId: product.id,
      });
      setInWishlist(res.data.data?.added || false);
    } catch {
      alert("위시리스트 처리에 실패했습니다");
    } finally {
      setWishToggling(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          {error || "상품을 찾을 수 없습니다"}
        </h2>
        <Link
          to="/"
          className="text-blue-600 hover:underline"
        >
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const displayName =
    product.name_ko || product.name_ja || "상품";
  const displayPrice = Number(
    product.price || 0
  ).toLocaleString();
  const displayCategory =
    product.category_name_ko ||
    product.category_name_ja ||
    "";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center text-sm text-gray-500 hover:text-black dark:hover:text-white mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        목록으로 돌아가기
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        {/* Image Section */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-sm overflow-hidden aspect-square">
          <img
            src={product.image_url || "/placeholder.png"}
            alt={displayName}
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Info Section */}
        <div>
          <h1 className="text-3xl font-light text-gray-900 dark:text-white mb-2">
            {displayName}
          </h1>
          {displayCategory && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
              {displayCategory}
            </p>
          )}
          {product.product_code && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
              {product.product_code}
            </p>
          )}

          <p className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">
            {displayPrice}원
          </p>

          {product.description_ko && (
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
              {product.description_ko}
            </p>
          )}

          {/* 수량 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              수량
            </label>
            <div className="inline-flex items-center border border-gray-300 dark:border-gray-700 rounded-sm">
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) => Math.max(1, q - 1))
                }
                disabled={quantity <= 1}
                className="p-3 text-gray-500 hover:text-black dark:hover:text-white disabled:opacity-30"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center text-sm font-medium text-gray-900 dark:text-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) => Math.min(99, q + 1))
                }
                disabled={quantity >= 99}
                className="p-3 text-gray-500 hover:text-black dark:hover:text-white disabled:opacity-30"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* 장바구니 담기 */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={cartAdding}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-4 font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {cartAdding ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ShoppingCart className="w-5 h-5" />
              )}
              장바구니 담기
            </button>

            {/* 위시리스트 토글 */}
            <button
              type="button"
              onClick={handleToggleWishlist}
              disabled={wishToggling}
              className={`w-full border py-4 font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                inWishlist
                  ? "border-red-300 dark:border-red-700 text-red-500"
                  : "border-gray-200 dark:border-gray-700 text-black dark:text-white hover:border-black dark:hover:border-white"
              }`}
            >
              <Heart
                className={`w-5 h-5 ${
                  inWishlist ? "fill-current" : ""
                }`}
              />
              {inWishlist
                ? "관심상품 저장됨"
                : "관심상품 저장"}
            </button>
          </div>

          <div className="mt-12 border-t border-gray-100 dark:border-gray-800 pt-8 text-sm text-gray-500 dark:text-gray-400 space-y-2">
            <p>• 50만원 이상 구매 시 무료 배송</p>
            <p>• 모든 모듈 부품 2년 보증</p>
            <p>• 요청 시 맞춤형 구성 가능</p>
          </div>
        </div>
      </div>
    </div>
  );
}
