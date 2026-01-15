import { useState } from "react";
import ProductCard from "./ProductCard";
import products from "../data/mockProducts.json";
import { Link } from "react-router-dom";
import HeroCarousel from "./HeroCarousel";
import ProductFilter from "./ProductFilter";

const categories = [
    { name: "거실장", image: "https://images.unsplash.com/photo-1628157777174-88469e578c74?q=80&w=400&auto=format&fit=crop" },
    { name: "수납장", image: "https://images.unsplash.com/photo-1605218427361-bca4f5358045?q=80&w=400&auto=format&fit=crop" },
    { name: "테이블", image: "https://images.unsplash.com/photo-1594228941785-5df1453267b2?q=80&w=400&auto=format&fit=crop" },
    { name: "서랍장", image: "https://images.unsplash.com/photo-1590136932598-c17849c719e7?q=80&w=400&auto=format&fit=crop" },
    { name: "침실", image: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=400&auto=format&fit=crop" }
];

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
                            key={cat.name}
                            to={`/category/${encodeURIComponent(cat.name)}`}
                            className="group relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800"
                        >
                            <img
                                src={cat.image}
                                alt={cat.name}
                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white text-lg font-medium">{cat.name}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Color Selection Section */}
            <div className="container mx-auto px-4 mb-12 md:mb-16">
                <h2 className="text-xl md:text-2xl font-light text-gray-900 dark:text-white mb-6 md:mb-8 text-center">
                    컬러로 선택하기
                </h2>
                <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                    {colors.map((c) => (
                        <Link
                            key={c.id}
                            to={`/color/${encodeURIComponent(c.id)}`}
                            title={c.name}
                            className={`w-8 h-8 md:w-10 md:h-10 rounded-full hover:scale-110 transition-transform ${c.border ? 'border border-gray-300 dark:border-gray-600' : ''}`}
                            style={{ backgroundColor: c.color }}
                        />
                    ))}
                </div>
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
