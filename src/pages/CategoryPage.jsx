import { useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import products from "../data/mockProducts.json";

export default function CategoryPage() {
    const { categoryName } = useParams();
    const decodedCategoryName = decodeURIComponent(categoryName || "");

    const categoryProducts = products.filter(
        (product) => product.category === decodedCategoryName
    );

    if (categoryProducts.length === 0) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-light mb-4 text-gray-900 dark:text-white">
                    카테고리를 찾을 수 없습니다
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    요청하신 "{decodedCategoryName}" 카테고리에 해당하는 제품이 없습니다.
                </p>
            </div>
        );
    }

    return (
        <div className="pb-12">
            <div className="container mx-auto px-4">
                {/* Category Header */}
                <div className="text-center mb-8 md:mb-12 pt-4 md:pt-8">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-gray-900 dark:text-white mb-3 md:mb-4">
                        {decodedCategoryName}
                    </h1>
                    <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-xl mx-auto px-4">
                        {decodedCategoryName} 카테고리의 USM 할러 모듈러 가구 컬렉션을 만나보세요.
                    </p>
                </div>

                {/* Products Count */}
                <div className="mb-4 md:mb-6">
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        {categoryProducts.length}개의 제품이 있습니다
                    </p>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-x-8 md:gap-y-12">
                    {categoryProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </div>
    );
}
