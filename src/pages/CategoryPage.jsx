import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

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

export default function CategoryPage() {
    const { categoryName } = useParams();
    const decodedCategoryName = decodeURIComponent(categoryName || "");

    const [categoryProducts, setCategoryProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!decodedCategoryName) {
            setCategoryProducts([]);
            setIsLoading(false);
            setErrorMessage("유효하지 않은 카테고리입니다.");
            return;
        }

        const fetchCategoryProducts = async () => {
            try {
                setIsLoading(true);
                setErrorMessage("");

                const response = await fetch(
                    `${API_BASE_URL}/products?categorySlug=${encodeURIComponent(decodedCategoryName)}`
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch products: ${response.status}`);
                }

                const data = await response.json();
                const productsFromApi = Array.isArray(data?.data) ? data.data : [];

                setCategoryProducts(
                    productsFromApi.map((p) => ({
                        id: p.legacy_id || p.id,
                        name: p.name_ko || p.name_ja,
                        category: p.category_name_ko || p.category_name_ja,
                        price: p.sale_price ?? p.price ?? p.regular_price ?? 0,
                        image: buildImageUrl(p.image_url),
                    }))
                );
            } catch (error) {
                setErrorMessage("카테고리 정보를 불러오는 중 오류가 발생했습니다.");
                setCategoryProducts([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategoryProducts();
    }, [decodedCategoryName]);

    if (isLoading) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl md:text-2xl font-light mb-4 text-gray-900 dark:text-white">
                    카테고리 정보를 불러오는 중입니다
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    잠시만 기다려 주세요.
                </p>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-light mb-4 text-gray-900 dark:text-white">
                    카테고리를 불러올 수 없습니다
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    {errorMessage}
                </p>
            </div>
        );
    }

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
                <div className="text-center mb-8 md:mb-12 pt-4 md:pt-8">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-gray-900 dark:text-white mb-3 md:mb-4">
                        {decodedCategoryName}
                    </h1>
                    <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-xl mx-auto px-4">
                        {decodedCategoryName} 카테고리의 USM 할러 모듈러 가구 컬렉션을 만나보세요.
                    </p>
                </div>

                <div className="mb-4 md:mb-6">
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        {categoryProducts.length}개의 제품이 있습니다
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-x-8 md:gap-y-12">
                    {categoryProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </div>
    );
}
