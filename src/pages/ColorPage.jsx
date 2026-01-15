import { useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import products from "../data/mockProducts.json";

const colorMap = {
    "pure-white": { name: "퓨어화이트", color: "#FFFFFF", border: true },
    "light-gray": { name: "라이트그레이", color: "#C0C0C0" },
    "mid-gray": { name: "미드그레이", color: "#808080" },
    "anthracite": { name: "앤트러사이트", color: "#383838" },
    "graphite-black": { name: "그래파이트블랙", color: "#1C1C1C" },
    "steel-blue": { name: "스틸블루", color: "#4682B4" },
    "genshan-blue": { name: "젠샨블루", color: "#4169E1" },
    "usm-green": { name: "USM그린", color: "#2E8B57" },
    "golden-yellow": { name: "골든이엘로우", color: "#F5C518" },
    "pure-orange": { name: "퓨어오렌지", color: "#FF6B35" },
    "usm-ruby-red": { name: "USM루비레드", color: "#B22222" },
    "usm-brown": { name: "USM브라운", color: "#8B4513" },
    "usm-beige": { name: "USM베이지", color: "#F5DEB3" },
    "olive-green": { name: "올리브그린", color: "#556B2F" }
};

export default function ColorPage() {
    const { colorName } = useParams();
    const decodedColorName = decodeURIComponent(colorName || "");

    const colorInfo = colorMap[decodedColorName];

    if (!colorInfo) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-light mb-4 text-gray-900 dark:text-white">
                    컬러를 찾을 수 없습니다
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    요청하신 컬러에 해당하는 제품이 없습니다.
                </p>
            </div>
        );
    }

    const colorProducts = products.filter(
        (product) => product.colors && product.colors.includes(decodedColorName)
    );

    return (
        <div className="pb-12">
            <div className="container mx-auto px-4">
                {/* Color Header */}
                <div className="text-center mb-8 md:mb-12 pt-4 md:pt-8">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-4 md:mb-6">
                        <div
                            className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex-shrink-0 ${
                                colorInfo.border ? "border border-gray-300 dark:border-gray-600" : ""
                            }`}
                            style={{ backgroundColor: colorInfo.color }}
                        />
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-gray-900 dark:text-white">
                            {colorInfo.name}
                        </h1>
                    </div>
                    <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-xl mx-auto px-4">
                        {colorInfo.name} 컬러의 USM 할러 모듈러 가구 컬렉션을 만나보세요.
                    </p>
                </div>

                {/* Products Count */}
                {colorProducts.length > 0 ? (
                    <>
                        <div className="mb-4 md:mb-6">
                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                {colorProducts.length}개의 제품이 있습니다
                            </p>
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-x-8 md:gap-y-12">
                            {colorProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12 md:py-16">
                        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
                            이 컬러에 해당하는 제품이 없습니다.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
