import { useState, useEffect } from "react";
import { X } from "lucide-react";

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

    return (
        <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 py-4 md:py-6 mb-6 md:mb-8">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 mb-4 md:mb-6">
                    <h2 className="text-lg md:text-xl font-light text-gray-900 dark:text-white">필터</h2>
                    {activeFilterCount > 0 && (
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors px-3 py-1.5 md:px-4 md:py-2 bg-gray-100 dark:bg-gray-800 rounded-sm"
                        >
                            <X className="w-3 h-3 md:w-4 md:h-4" />
                            필터 초기화 ({activeFilterCount})
                        </button>
                    )}
                </div>

                <div className="space-y-4 md:space-y-6">
                    {/* Scene Filter */}
                    <div>
                        <h3 className="text-xs md:text-sm font-medium text-gray-900 dark:text-white mb-2 md:mb-3">시나리오</h3>
                        <div className="flex flex-wrap gap-2">
                            {scenes.map((scene) => (
                                <button
                                    key={scene}
                                    onClick={() => handleSceneToggle(scene)}
                                    className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium transition-colors ${
                                        selectedScenes.includes(scene)
                                            ? "bg-black dark:bg-white text-white dark:text-black"
                                            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    }`}
                                >
                                    {sceneNames[scene]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div>
                        <h3 className="text-xs md:text-sm font-medium text-gray-900 dark:text-white mb-2 md:mb-3">카테고리</h3>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => handleCategoryToggle(category)}
                                    className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium transition-colors ${
                                        selectedCategories.includes(category)
                                            ? "bg-black dark:bg-white text-white dark:text-black"
                                            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Filter */}
                    <div>
                        <h3 className="text-xs md:text-sm font-medium text-gray-900 dark:text-white mb-2 md:mb-3">컬러</h3>
                        <div className="flex flex-wrap gap-2 md:gap-3">
                            {colors.map((color) => (
                                <button
                                    key={color.id}
                                    onClick={() => handleColorToggle(color.id)}
                                    title={color.name}
                                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full hover:scale-110 transition-all ${
                                        color.border ? "border border-gray-300 dark:border-gray-600" : ""
                                    } ${
                                        selectedColors.includes(color.id)
                                            ? "ring-2 ring-black dark:ring-white ring-offset-1 md:ring-offset-2 dark:ring-offset-black"
                                            : ""
                                    }`}
                                    style={{ backgroundColor: color.color }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
