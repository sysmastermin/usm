import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import products from "../data/mockProducts.json";

export default function ProductDetail() {
    const { id } = useParams();
    const product = products.find((p) => p.id === id);

    if (!product) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold mb-4">상품을 찾을 수 없습니다</h2>
                <Link to="/" className="text-blue-600 hover:underline">
                    홈으로 돌아가기
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-black dark:hover:text-white mb-8">
                <ArrowLeft className="w-4 h-4 mr-2" />
                목록으로 돌아가기
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
                {/* Image Section */}
                <div className="bg-gray-100 dark:bg-gray-800 rounded-sm overflow-hidden aspect-square">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover object-center"
                    />
                </div>

                {/* Info Section */}
                <div>
                    <h1 className="text-3xl font-light text-gray-900 dark:text-white mb-2">{product.name}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 uppercase tracking-wider">{product.category}</p>

                    <p className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">
                        {product.price}원
                    </p>

                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                        {product.description}
                    </p>

                    <div className="space-y-4">
                        <button className="w-full bg-black dark:bg-white text-white dark:text-black py-4 font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                            <ShoppingCart className="w-5 h-5" />
                            장바구니 담기
                        </button>
                        <button className="w-full border border-gray-200 dark:border-gray-700 py-4 font-medium hover:border-black dark:hover:border-white text-black dark:text-white transition-colors">
                            관심상품 저장
                        </button>
                    </div>

                    <div className="mt-12 border-t border-gray-100 dark:border-gray-800 pt-8 text-sm text-gray-500 dark:text-gray-400 space-y-2">
                        <p>• 50만원 이상 구매 시 무료 배송</p>
                        <p>• 모든 모듈 부품 2년 보증</p>
                        <p>• 요청 시 맞춤형 구성 가능</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
