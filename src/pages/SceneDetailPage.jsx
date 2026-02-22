import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import ProductCard from "../components/ProductCard";

const API_BASE_URL = "/api";

const sceneNames = {
  living: "거실",
  dining: "주방",
  bedroom: "침실",
  kidsroom: "키즈룸",
  homeoffice: "오피스텔",
  smalloffice: "스몰오피스",
};

function buildImageUrl(imagePath) {
  if (!imagePath) return "";
  if (
    imagePath.startsWith("http://")
    || imagePath.startsWith("https://")
  ) {
    return imagePath;
  }
  const origin = API_BASE_URL.replace(/\/api\/?$/, "");
  return imagePath.startsWith("/")
    ? `${origin}${imagePath}`
    : `${origin}/${imagePath}`;
}

function mapApiProductToFront(p) {
  return {
    id: p.legacy_id ?? p.id,
    name: p.name_ko || p.name_ja,
    category:
      p.category_name_ko || p.category_name_ja,
    price:
      p.sale_price ?? p.price ?? p.regular_price ?? 0,
    image: buildImageUrl(p.image_url),
  };
}

export default function SceneDetailPage() {
  const { sceneId, imageId } = useParams();
  const navigate = useNavigate();

  const [sceneData, setSceneData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchSceneDetail();
  }, [sceneId, imageId]);

  const fetchSceneDetail = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(
        `${API_BASE_URL}/scenes/${sceneId}/${imageId}`
      );
      const json = await res.json();
      if (json.success && json.data) {
        setSceneData(json.data);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !sceneData) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">
          이미지를 찾을 수 없습니다
        </h2>
        <Link
          to="/scene"
          className="text-blue-600 hover:underline"
        >
          씬 페이지로 돌아가기
        </Link>
      </div>
    );
  }

  const sceneProducts = (sceneData.products || []).map(
    mapApiProductToFront
  );

  return (
    <div className="pb-12">
      {/* Back Button */}
      <div className="container mx-auto px-4 mb-6">
        <button
          onClick={() =>
            navigate("/scene", {
              state: { sceneId },
            })
          }
          className="inline-flex items-center text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          씬 페이지로 돌아가기
        </button>
      </div>

      {/* Main Image */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-4 mb-8 md:mb-12"
      >
        <div className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden bg-gray-100 dark:bg-gray-900 rounded-sm">
          <img
            src={sceneData.image_url}
            alt={sceneData.title}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
        <div className="mt-6 md:mt-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-light mb-2">
            {sceneData.title}
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400">
            {sceneData.description}
          </p>
        </div>
      </motion.div>

      {/* Products Section */}
      {sceneProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="container mx-auto px-4"
        >
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-light mb-2">
              {sceneNames[sceneId]}에 어울리는 제품
            </h2>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
              {sceneProducts.length}개의 제품
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-x-8 md:gap-y-12">
            {sceneProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Contact Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="container mx-auto px-4 mt-12 md:mt-16"
      >
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 md:pt-12">
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4">
            온라인 쇼핑몰에 게시된 제품 외의
            <br />
            커스터마이즈 주문을 원하시거나
            <br />
            기타 문의사항이 있으시면 아래로
            연락주세요.
          </p>
          <div className="text-sm md:text-base">
            <p className="font-medium mb-2">문의처</p>
            <p className="text-gray-600 dark:text-gray-400">
              050-5050-9850
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-xs md:text-sm mt-2">
              운영시간: 11:00-19:00 (수요일 휴무)
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
