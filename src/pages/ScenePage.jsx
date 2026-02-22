import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const API_BASE_URL = "/api";

const scenes = [
  {
    id: "living",
    name: "거실",
    description:
      "편안하고 아늑한 거실 공간을 위한 USM 가구 컬렉션",
  },
  {
    id: "dining",
    name: "주방",
    description:
      "가족과 함께하는 식사 시간을 더욱 특별하게 만들어주는 다이닝 공간",
  },
  {
    id: "bedroom",
    name: "침실",
    description:
      "편안한 수면과 휴식을 위한 침실 공간 연출",
  },
  {
    id: "kidsroom",
    name: "키즈룸",
    description:
      "아이들의 창의력과 상상력을 키워주는 안전한 공간",
  },
  {
    id: "homeoffice",
    name: "오피스텔",
    description:
      "집에서도 효율적으로 일할 수 있는 전문적인 업무 공간",
  },
  {
    id: "smalloffice",
    name: "스몰오피스",
    description:
      "작은 공간에도 최적화된 효율적인 사무실 솔루션",
  },
];

export default function ScenePage() {
  const location = useLocation();
  const initialScene =
    location.state?.sceneId || "living";
  const [selectedScene, setSelectedScene] =
    useState(initialScene);
  const navigate = useNavigate();

  const [sceneImages, setSceneImages] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScenes();
  }, []);

  const fetchScenes = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/scenes`
      );
      const json = await res.json();
      if (json.success && json.data) {
        setSceneImages(json.data);
      }
    } catch {
      console.error("씬 데이터를 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleSceneClick = (sceneId) => {
    setSelectedScene(sceneId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImageClick = (sceneId, imageId) => {
    navigate(`/scene/${sceneId}/${imageId}`);
  };

  const currentImages =
    (sceneImages[selectedScene] || []).map((s) => ({
      id: s.scene_number,
      image: s.image_url,
      title: s.title,
      description: s.description,
      dbId: s.id,
    }));

  return (
    <div className="pb-12">
      {/* Navigation Links */}
      <div className="sticky top-20 z-40 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 py-3 md:py-4 mb-6 md:mb-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {scenes.map((scene) => (
              <button
                key={scene.id}
                onClick={() =>
                  handleSceneClick(scene.id)
                }
                className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium transition-colors ${
                  selectedScene === scene.id
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {scene.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scene Images Grid */}
      <div className="container mx-auto px-4">
        <motion.div
          key={selectedScene}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-light mb-2">
              {scenes.find(
                (s) => s.id === selectedScene
              )?.name}
              의 씬
            </h1>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : currentImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {currentImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{
                    opacity: 0,
                    scale: 0.9,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                  }}
                  className="group cursor-pointer"
                  onClick={() =>
                    handleImageClick(
                      selectedScene,
                      image.id
                    )
                  }
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900">
                    <img
                      src={image.image}
                      alt={image.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 md:py-16">
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
                이 씬에 해당하는 이미지가 없습니다.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
