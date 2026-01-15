import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
    return (
        <Link to={`/product/${product.id}`} className="group block">
            <div className="relative overflow-hidden bg-gray-100 rounded-sm aspect-square mb-4">
                <motion.img
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover object-center"
                />
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
