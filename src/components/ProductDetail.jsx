import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Minus,
  Plus,
  Loader2,
  Truck,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { useUserAuth } from "../context/UserAuthContext";
import userApi from "../lib/userApi";

const API_BASE_URL = "/api";

const SPEC_KEYS = [
  "상품번호", "크기", "무게", "재질", "원산지",
];
const SPEC_PATTERN = new RegExp(
  `(${SPEC_KEYS.join("|")})\\s*[:：]\\s*`,
  "g"
);

/**
 * description_ko 텍스트에서 구조화된 스펙 정보를 추출하고,
 * DB 개별 필드가 있으면 우선 사용한다.
 * @returns {{ specs: Array<{label,value}>, notes: string, pureDesc: string }}
 */
function parseProductInfo(product) {
  const desc = product.description_ko || "";

  const parsed = {};
  let notes = "";
  let pureDesc = desc;

  const specStart = desc.indexOf("제품 정보");
  const noteStart = desc.indexOf("특기사항");

  if (specStart !== -1) {
    pureDesc = desc.slice(0, specStart).trim();

    const specSection = noteStart !== -1
      ? desc.slice(specStart, noteStart)
      : desc.slice(specStart);

    const tokens = specSection
      .replace(/^제품\s*정보\s*/, "")
      .split(SPEC_PATTERN)
      .filter(Boolean);

    for (let i = 0; i < tokens.length - 1; i += 2) {
      const key = tokens[i].trim();
      const val = tokens[i + 1]?.trim();
      if (key && val) parsed[key] = val;
    }
  }

  if (noteStart !== -1) {
    notes = desc
      .slice(noteStart)
      .replace(/^특기사항\s*/, "")
      .trim();
  }

  let specsKo = null;
  try {
    specsKo = product.specs_ko
      ? JSON.parse(product.specs_ko)
      : null;
  } catch {
    /* ignore */
  }

  const origin =
    specsKo?.["원산지"] ||
    specsKo?.["原産国"] ||
    parsed["원산지"] ||
    null;

  const rows = [
    {
      label: "상품번호",
      value: product.product_code || parsed["상품번호"],
    },
    {
      label: "크기",
      value: product.dimensions || parsed["크기"],
    },
    {
      label: "무게",
      value: product.weight || parsed["무게"],
    },
    {
      label: "재질",
      value:
        product.material_ko ||
        product.material ||
        parsed["재질"],
    },
    {
      label: "원산지",
      value: origin,
    },
  ].filter((r) => r.value);

  return { specs: rows, notes, pureDesc };
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

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
  const [imgHover, setImgHover] = useState(false);

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

  useEffect(() => {
    if (!isLoggedIn || !product) return;
    const checkWishlist = async () => {
      try {
        const res = await userApi.get(
          `/wishlist/check/${product.id}`
        );
        setInWishlist(res.data.data?.inWishlist || false);
      } catch {
        /* ignore */
      }
    };
    checkWishlist();
  }, [isLoggedIn, product]);

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300 dark:text-gray-600" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white">
          {error || "상품을 찾을 수 없습니다"}
        </h2>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
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

  const { specs, notes, pureDesc } =
    parseProductInfo(product);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* 뒤로가기 */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-8 sm:mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          목록으로
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 xl:gap-24">
        {/* 이미지 */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="lg:sticky lg:top-24 lg:self-start"
        >
          <div
            className="relative bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden aspect-square"
            onMouseEnter={() => setImgHover(true)}
            onMouseLeave={() => setImgHover(false)}
          >
            <motion.img
              src={product.image_url || "/placeholder.png"}
              alt={displayName}
              className="w-full h-full object-cover object-center"
              animate={{ scale: imgHover ? 1.05 : 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* 상품 정보 */}
        <div className="flex flex-col">
          {/* 카테고리 + 상품 코드 */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="flex items-center gap-3 mb-4"
          >
            {displayCategory && (
              <span className="text-xs font-medium uppercase tracking-widest text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-full">
                {displayCategory}
              </span>
            )}
            {product.product_code && (
              <span className="text-xs text-gray-400 dark:text-gray-500 tracking-wide">
                {product.product_code}
              </span>
            )}
          </motion.div>

          {/* 상품명 */}
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-gray-900 dark:text-white leading-tight"
          >
            {displayName}
          </motion.h1>

          {/* 가격 */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white"
          >
            {displayPrice}
            <span className="text-lg font-normal ml-0.5">
              원
            </span>
          </motion.p>

          {/* 구분선 */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
            className="my-6 sm:my-8 border-t border-gray-100 dark:border-gray-800"
          />

          {/* 설명 (구조화 정보를 제외한 순수 텍스트) */}
          {pureDesc && (
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
              className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-8"
            >
              {pureDesc}
            </motion.p>
          )}

          {/* 수량 + 장바구니 */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={5}
            className="space-y-5"
          >
            {/* 수량 선택 */}
            <div>
              <span className="block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5">
                수량
              </span>
              <div className="inline-flex items-center border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.max(1, q - 1))
                  }
                  disabled={quantity <= 1}
                  className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-14 h-11 flex items-center justify-center text-sm font-medium text-gray-900 dark:text-white border-x border-gray-200 dark:border-gray-700 select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(99, q + 1))
                  }
                  disabled={quantity >= 99}
                  className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={cartAdding}
                className="flex-1 bg-black dark:bg-white text-white dark:text-black h-13 sm:h-14 rounded-md font-medium text-sm sm:text-base hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:pointer-events-none"
              >
                {cartAdding ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ShoppingCart className="w-5 h-5" />
                )}
                장바구니 담기
              </button>

              <button
                type="button"
                onClick={handleToggleWishlist}
                disabled={wishToggling}
                className={`w-13 sm:w-14 h-13 sm:h-14 rounded-md border flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
                  inWishlist
                    ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 text-red-500"
                    : "border-gray-200 dark:border-gray-700 text-gray-400 hover:text-black dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500"
                }`}
                title={
                  inWishlist
                    ? "관심상품 저장됨"
                    : "관심상품 저장"
                }
              >
                <Heart
                  className={`w-5 h-5 ${
                    inWishlist ? "fill-current" : ""
                  }`}
                />
              </button>
            </div>
          </motion.div>

          {/* 부가 정보 */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={6}
            className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <InfoBadge
              icon={Truck}
              title="무료 배송"
              desc="50만원 이상 구매 시"
            />
            <InfoBadge
              icon={ShieldCheck}
              title="2년 보증"
              desc="모든 모듈 부품"
            />
            <InfoBadge
              icon={Settings}
              title="맞춤 구성"
              desc="요청 시 제작 가능"
            />
          </motion.div>
        </div>
      </div>

      {/* 제품 정보 테이블 */}
      {specs.length > 0 && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={7}
          className="mt-16 sm:mt-20"
        >
          <ProductSpecTable
            specs={specs}
            notes={notes}
          />
        </motion.div>
      )}
    </div>
  );
}

function ProductSpecTable({ specs, notes }) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
        <h2 className="text-sm font-medium tracking-[0.15em] uppercase text-gray-400 dark:text-gray-500 shrink-0">
          제품 정보
        </h2>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* 스펙 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-0">
        {specs.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-baseline justify-between py-3.5 ${
              i < specs.length - (specs.length % 2 === 0 ? 2 : 1)
                ? "border-b border-gray-100 dark:border-gray-800/60"
                : ""
            }`}
          >
            <span className="text-sm text-gray-400 dark:text-gray-500 shrink-0">
              {row.label}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-right ml-4">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* 특기사항 */}
      {notes && (
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800/60">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            특기사항
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {notes}
          </p>
        </div>
      )}
    </div>
  );
}

function InfoBadge({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
      <Icon className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
          {title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {desc}
        </p>
      </div>
    </div>
  );
}
