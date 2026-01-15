import ProductCard from "./ProductCard";
import products from "../data/mockProducts.json";
import { Link } from "react-router-dom";
import HeroCarousel from "./HeroCarousel";

export default function ProductList() {
    return (
        <div className="pb-12">
            {/* Hero Section */}
            <HeroCarousel />

            {/* Category Section */}
            <div className="container mx-auto px-4 mb-16">
                <h2 className="text-2xl font-light text-gray-900 dark:text-white mb-8 text-center">
                    카테고리별 탐색
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { name: "거실장", image: "https://images.unsplash.com/photo-1628157777174-88469e578c74?q=80&w=400&auto=format&fit=crop" },
                        { name: "수납장", image: "https://images.unsplash.com/photo-1605218427361-bca4f5358045?q=80&w=400&auto=format&fit=crop" },
                        { name: "테이블", image: "https://images.unsplash.com/photo-1594228941785-5df1453267b2?q=80&w=400&auto=format&fit=crop" },
                        { name: "서랍장", image: "https://images.unsplash.com/photo-1590136932598-c17849c719e7?q=80&w=400&auto=format&fit=crop" }
                    ].map((cat) => (
                        <Link
                            key={cat.name}
                            to="#"
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
            <div className="container mx-auto px-4 mb-16">
                <h2 className="text-2xl font-light text-gray-900 dark:text-white mb-8 text-center">
                    컬러로 선택하기
                </h2>
                <div className="flex flex-wrap justify-center gap-3">
                    {[
                        { name: "퓨어 화이트", color: "#FFFFFF", border: true },
                        { name: "라이트 그레이", color: "#C0C0C0" },
                        { name: "미드 그레이", color: "#808080" },
                        { name: "앤트러사이트", color: "#383838" },
                        { name: "그래파이트 블랙", color: "#1C1C1C" },
                        { name: "골든 옐로우", color: "#F5C518" },
                        { name: "오렌지", color: "#FF6B35" },
                        { name: "USM 레드", color: "#B22222" },
                        { name: "USM 그린", color: "#2E8B57" },
                        { name: "USM 블루", color: "#4169E1" },
                    ].map((c) => (
                        <button
                            key={c.name}
                            title={c.name}
                            className={`w-10 h-10 rounded-full hover:scale-110 transition-transform ${c.border ? 'border border-gray-300' : ''}`}
                            style={{ backgroundColor: c.color }}
                        />
                    ))}
                </div>
            </div>

            {/* Products Section */}
            <div id="products" className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-light tracking-tight text-gray-900 dark:text-white mb-4">
                        전체 상품
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
                        USM 할러 모듈러 가구 컬렉션을 만나보세요.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </div>
    );
}
