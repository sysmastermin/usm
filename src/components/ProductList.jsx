import { useState, useEffect, useMemo } from "react";
import ProductCard from "./ProductCard";
import { Link } from "react-router-dom";
import HeroCarousel from "./HeroCarousel";
import ProductFilter from "./ProductFilter";
import { getCategories, getProducts } from "../lib/api.js";

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
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const [categoriesData, productsData] = await Promise.all([
                    getCategories(),
                    getProducts(),
                ]);
                
                setCategories(categoriesData);
                setProducts(productsData);
                setFilteredProducts(productsData);
            } catch (err) {
                console.error('데이터 로딩 실패:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // useMemo를 컴포넌트 최상위로 이동
    const transformedProducts = useMemo(() => products.map((p) => ({
        id: p.legacy_id || p.id,
        name: p.name_ko || p.name_ja,
        price: p.price,
        image: p.image_url,
        category: p.category_name_ko || p.category_name_ja,
        description: p.description_ko || p.description_ja,
        colors: [],
        scenes: [],
    })), [products]);

    if (loading) {
        return (
            <div className="pb-12">
                <div className="container mx-auto px-4 py-20 text-center">
                    <p className="text-gray-500 dark:text-gray-400">로딩 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pb-12">
                <div className="container mx-auto px-4 py-20 text-center">
                    <p className="text-red-500 dark:text-red-400">오류: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-12">
            {/* Hero Section */}
            <HeroCarousel />

            {/* Category Section */}
            <div className="container mx-auto px-4 mb-12 md:mb-16">
                <h2 className="text-xl md:text-2xl font-light text-gray-900 dark:text-white mb-6 md:mb-8 text-center">
                    카테고리별 탐색
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                    {categories.map((cat) => (
                        <Link
                            key={cat.id || cat.slug}
                            to={`/category/${encodeURIComponent(cat.slug)}`}
                            className="group relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800 block"
                            onClick={() => {
                                console.log("카테고리 클릭:", cat.slug);
                            }}
                        >
                            {cat.image_url && (
                                <img
                                    src={cat.image_url}
                                    alt={cat.name_ko || cat.name_ja}
                                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                                />
                            )}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors pointer-events-none" />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-white text-lg font-medium">{cat.name_ko || cat.name_ja}</span>
                            </div>
                        </Link>
                    ))}
                </div>
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
            <ProductFilter
                products={transformedProducts}
                onFilterChange={(filtered) => {
                    // filtered는 ProductFilter에서 사용하는 단순화된 구조이므로,
                    // 원본 products와 id(legacy_id)를 기준으로 다시 매칭
                    const ids = new Set(filtered.map((f) => f.id));
                    const mapped = products.filter(
                        (p) => ids.has(p.legacy_id || p.id)
                    );
                    setFilteredProducts(mapped);
                }}
            />

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
                            <ProductCard
                                key={product.id}
                                product={{
                                    id: product.legacy_id || product.id,
                                    name: product.name_ko || product.name_ja,
                                    price: product.price
                                        ? `¥${parseInt(product.price, 10).toLocaleString()}`
                                        : null,
                                    image: product.image_url,
                                    category: product.category_name_ko || product.category_name_ja,
                                    description: product.description_ko || product.description_ja,
                                }}
                            />
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
