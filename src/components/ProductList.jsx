import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import products from "../data/mockProducts.json";
import { Link } from "react-router-dom";
import HeroCarousel from "./HeroCarousel";
import ProductFilter from "./ProductFilter";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

function buildImageUrl(imagePath) {
    if (!imagePath) return "";
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
    }
    const origin = API_BASE_URL.replace(/\/api\/?$/, "");
    if (imagePath.startsWith("/")) {
        return `${origin}${imagePath}`;
    }
    return `${origin}/${imagePath}`;
}

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
    { id: "pure-orange", name: "퓨어오렌지", color: "#FF6B35" }
];

export default function ProductList() {
    const [filteredProducts, setFilteredProducts] = useState(products);
    const [categories, setCategories] = useState([]);
    const [isCategoryLoading, setIsCategoryLoading] = useState(true);
    const [categoryErrorMessage, setCategoryErrorMessage] = useState("");

    useEffect(() => {
        let isMounted = true;

        const fetchCategories = async () => {
            try {
                setIsCategoryLoading(true);
                setCategoryErrorMessage("");

                const response = await fetch(`${API_BASE_URL}/categories`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch categories: ${response.status}`);
                }

                const data = await response.json();
                const categoriesFromApi = Array.isArray(data?.data) ? data.data : [];

                if (!isMounted) return;
                setCategories(categoriesFromApi);
            } catch (error) {
                if (!isMounted) return;
                setCategoryErrorMessage("카테고리 목록을 불러오는 중 오류가 발생했습니다.");
                setCategories([]);
            } finally {
                if (!isMounted) return;
                setIsCategoryLoading(false);
            }
        };

        fetchCategories();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="pb-12">
            {/* Hero Section */}
            <HeroCarousel />

            {/* Category Section */}
            <div className="container mx-auto px-4 mb-12 md:mb-16">
                <h2 className="text-xl md:text-2xl font-light text-gray-900 dark:text-white mb-6 md:mb-8 text-center">
                    카테고리별 탐색
                </h2>
                {isCategoryLoading ? (
                    <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        카테고리 정보를 불러오는 중입니다...
                    </div>
                ) : categoryErrorMessage ? (
                    <div className="py-8 text-center text-sm text-red-500">
                        {categoryErrorMessage}
                    </div>
                ) : categories.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        등록된 카테고리가 없습니다.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                        {categories.map((cat) => {
                            const displayName = cat.name_ko || cat.name_ja || cat.slug;
                            return (
                            <Link
                                key={cat.id || cat.slug}
                                to={`/category/${encodeURIComponent(cat.slug)}`}
                                className="group relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800"
                            >
                                <img
                                    src={buildImageUrl(cat.image_url) || "https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=400&auto=format&fit=crop"}
                                    alt={displayName}
                                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-white text-lg font-medium">{displayName}</span>
                                </div>
                            </Link>
                        );
                        })}
                    </div>
                )}
            </div>

            {/* Color Selection Section */}
            <div className="container mx-auto px-4 mb-12 md:mb-16">
                <h2 className="text-xl md:text-2xl font-light text-gray-900 dark:text-white mb-8 md:mb-10 text-center">
                    컬러별 제품 보기
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6 md:gap-8">
                    {colors.map((c) => (
                        <Link
                            key={c.id}
                            to={`/color/${encodeURIComponent(c.id)}`}
                            className="group flex flex-col items-center"
                        >
                            <div
                                className={`w-16 h-16 md:w-20 md:h-20 rounded-full mb-3 transition-all duration-300 ${
                                    c.border ? 'border border-gray-200 dark:border-gray-700' : ''
                                } group-hover:scale-110 group-hover:shadow-lg`}
                                style={{ backgroundColor: c.color }}
                            />
                            <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors text-center">
                                {c.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Divider */}
            <div className="container mx-auto px-4 mb-8 md:mb-12">
                <div className="border-t border-gray-200 dark:border-gray-800"></div>
            </div>

            {/* Filter Section */}
            <ProductFilter products={products} onFilterChange={setFilteredProducts} />

            {/* Products Section */}
            <div id="products" className="container mx-auto px-4">
                <div className="text-center mb-8 md:mb-12">
                    <h2 className="text-2xl md:text-3xl font-light tracking-tight text-gray-900 dark:text-white mb-3 md:mb-4">
                        전체 상품
                    </h2>
                    <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-2">
                        USM 할러 모듈러 가구 컬렉션을 만나보세요.
                    </p>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        {filteredProducts.length}개의 제품이 있습니다
                    </p>
                </div>

                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-x-8 md:gap-y-12">
                        {filteredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 md:py-16">
                        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
                            필터 조건에 맞는 제품이 없습니다.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
