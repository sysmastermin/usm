import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { getImageUrl } from "../lib/api.js";

export default function ProductCard({ product }) {
    // 이미지가 없을 때 기본 플레이스홀더
    const placeholderUrl = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect fill="%23e5e7eb" width="400" height="400"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E이미지 없음%3C/text%3E%3C/svg%3E';
    const imageUrl = getImageUrl(product.image) || placeholderUrl;
    
    return (
        <Link to={`/product/${product.id}`} className="group block">
            <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-sm aspect-square mb-4">
                {product.image ? (
                    <motion.img
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover object-center"
                        onError={(e) => {
                            // 이미지 로드 실패 시 플레이스홀더로 대체
                            e.target.src = placeholderUrl;
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                        <span className="text-gray-400 dark:text-gray-500 text-sm">이미지 없음</span>
                    </div>
                )}
                {/* Quick Add Overlay (Optional) */}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
                <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                        {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{product.category}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-2">
                        {product.price}원
                    </p>
                </div>
            </div>
        </Link>
    );
}
