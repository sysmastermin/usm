import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Filter, Sparkles } from "lucide-react";

const scenes = ["living", "dining", "bedroom", "kidsroom", "homeoffice", "smalloffice", "washitsu"];
const sceneNames = {
    living: "리비링",
    dining: "다이닝",
    bedroom: "베드룸",
    kidsroom: "키즈룸",
    homeoffice: "홈오피스",
    smalloffice: "스몰오피스",
    washitsu: "와실"
};

const colors = [
    { id: "pure-white", name: "퓨어화이트", color: "#FFFFFF", border: true },
    { id: "light-gray", name: "라이트그레이", color: "#C0C0C0" },
    { id: "mid-gray", name: "미드그레이", color: "#808080" },
    { id: "anthracite", name: "앤트러사이트", color: "#383838" },
    { id: "graphite-black", name: "그래파이트블랙", color: "#1C1C1C" },
    { id: "steel-blue", name: "스틸블루", color: "#4682B4" },
    { id: "genshan-blue", name: "젠샨블루", color: "#4169E1" },
    { id: "usm-green", name: "USM그린", color: "#2E8B57" },
    { id: "golden-yellow", name: "골든이엘로우", color: "#F5C518" },
    { id: "pure-orange", name: "퓨어오렌지", color: "#FF6B35" },
    { id: "usm-ruby-red", name: "USM루비레드", color: "#B22222" },
    { id: "usm-brown", name: "USM브라운", color: "#8B4513" },
    { id: "usm-beige", name: "USM베이지", color: "#F5DEB3" },
    { id: "olive-green", name: "올리브그린", color: "#556B2F" }
];

export default function ProductFilter({ products, onFilterChange }) {
    const [selectedScenes, setSelectedScenes] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedColors, setSelectedColors] = useState([]);
    const filterRef = useRef(null);

    // Get unique categories from products
    const categories = [...new Set(products.map((p) => p.category))];

    const handleSceneToggle = (scene) => {
        setSelectedScenes((prev) =>
            prev.includes(scene) ? prev.filter((s) => s !== scene) : [...prev, scene]
        );
    };

    const handleCategoryToggle = (category) => {
        setSelectedCategories((prev) =>
            prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
        );
    };

    const handleColorToggle = (colorId) => {
        setSelectedColors((prev) =>
            prev.includes(colorId) ? prev.filter((c) => c !== colorId) : [...prev, colorId]
        );
    };

    const handleReset = () => {
        setSelectedScenes([]);
        setSelectedCategories([]);
        setSelectedColors([]);
    };

    // Apply filters and notify parent
    useEffect(() => {
        const filtered = products.filter((product) => {
            // Scene filter
            if (selectedScenes.length > 0) {
                const hasScene = selectedScenes.some((scene) => product.scenes && product.scenes.includes(scene));
                if (!hasScene) return false;
            }

            // Category filter
            if (selectedCategories.length > 0) {
                if (!selectedCategories.includes(product.category)) return false;
            }

            // Color filter
            if (selectedColors.length > 0) {
                const hasColor = selectedColors.some((color) => product.colors && product.colors.includes(color));
                if (!hasColor) return false;
            }

            return true;
        });

        onFilterChange(filtered);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedScenes, selectedCategories, selectedColors, products]);

    const activeFilterCount = selectedScenes.length + selectedCategories.length + selectedColors.length;

    const scrollToFilter = () => {
        if (filterRef.current) {
            filterRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <>
            <div
                ref={filterRef}
                className="md:sticky md:top-20 md:z-30 bg-gradient-to-b from-gray-50/50 via-white to-gray-50/50 dark:from-gray-950/50 dark:via-black dark:to-gray-950/50 backdrop-blur-sm border-t border-b border-gray-200/80 dark:border-gray-800/80 py-6 md:py-8 mb-8 md:mb-12 shadow-sm"
            >
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6 mb-6 md:mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <Filter className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            </div>
                            <div>
                                <h2 className="text-lg md:text-xl font-light text-gray-900 dark:text-white">필터</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">원하는 조건을 선택하세요</p>
                            </div>
                        </div>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-all px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <X className="w-4 h-4" />
                                <span>초기화</span>
                                <span className="px-1.5 py-0.5 bg-gray-300 dark:bg-gray-600 rounded text-xs font-medium">
                                    {activeFilterCount}
                                </span>
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        {/* Scene Filter */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-gray-200/50 dark:border-gray-800/50 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <h3 className="text-xs md:text-sm font-medium text-gray-900 dark:text-white mb-3 md:mb-4 flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                시나리오
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {scenes.map((scene) => {
                                    const isSelected = selectedScenes.includes(scene);
                                    return (
                                        <motion.button
                                            key={scene}
                                            onClick={() => handleSceneToggle(scene)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium transition-all duration-200 rounded-lg ${
                                                isSelected
                                                    ? "bg-black dark:bg-white text-white dark:text-black shadow-md"
                                                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                            }`}
                                        >
                                            {sceneNames[scene]}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Category Filter */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-gray-200/50 dark:border-gray-800/50 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <h3 className="text-xs md:text-sm font-medium text-gray-900 dark:text-white mb-3 md:mb-4 flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                카테고리
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {categories.map((category) => {
                                    const isSelected = selectedCategories.includes(category);
                                    return (
                                        <motion.button
                                            key={category}
                                            onClick={() => handleCategoryToggle(category)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium transition-all duration-200 rounded-lg ${
                                                isSelected
                                                    ? "bg-black dark:bg-white text-white dark:text-black shadow-md"
                                                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                            }`}
                                        >
                                            {category}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Color Filter */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                            className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-gray-200/50 dark:border-gray-800/50 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-3 md:mb-4">
                                <h3 className="text-xs md:text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                    컬러
                                </h3>
                                <span className="text-xs text-gray-400 dark:text-gray-500">다중 선택</span>
                            </div>
                            <div className="flex flex-wrap gap-2.5 md:gap-3">
                                {colors.map((color) => {
                                    const isSelected = selectedColors.includes(color.id);
                                    return (
                                        <motion.button
                                            key={color.id}
                                            onClick={() => handleColorToggle(color.id)}
                                            title={color.name}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`relative w-9 h-9 md:w-11 md:h-11 rounded-full transition-all duration-200 ${
                                                color.border ? "border border-gray-200 dark:border-gray-700" : ""
                                            } ${
                                                isSelected
                                                    ? "ring-2 ring-gray-900 dark:ring-gray-100 ring-offset-2 dark:ring-offset-gray-900 shadow-lg"
                                                    : ""
                                            }`}
                                            style={{ backgroundColor: color.color }}
                                        >
                                            <AnimatePresence>
                                                {isSelected && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="absolute inset-0 flex items-center justify-center"
                                                    >
                                                        <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-900 dark:text-gray-100" strokeWidth={2.5} />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Floating Action Button */}
            <AnimatePresence>
                {activeFilterCount > 0 && (
                    <motion.button
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        transition={{ duration: 0.3, type: "spring" }}
                        onClick={scrollToFilter}
                        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                    >
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-medium">필터</span>
                        <motion.span
                            key={activeFilterCount}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 15 }}
                            className="px-2 py-0.5 bg-white/20 dark:bg-black/20 rounded-full text-xs font-semibold"
                        >
                            {activeFilterCount}
                        </motion.span>
                    </motion.button>
                )}
            </AnimatePresence>
        </>
    );
}
