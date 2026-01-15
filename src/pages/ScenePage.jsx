import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ProductCard from "../components/ProductCard";
import products from "../data/mockProducts.json";

const scenes = [
    {
        id: "living",
        name: "리비링",
        description: "편안하고 아늑한 거실 공간을 위한 USM 가구 컬렉션",
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1200&auto=format&fit=crop"
    },
    {
        id: "dining",
        name: "다이닝",
        description: "가족과 함께하는 식사 시간을 더욱 특별하게 만들어주는 다이닝 공간",
        image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1200&auto=format&fit=crop"
    },
    {
        id: "bedroom",
        name: "베드룸",
        description: "편안한 수면과 휴식을 위한 침실 공간 연출",
        image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?q=80&w=1200&auto=format&fit=crop"
    },
    {
        id: "kidsroom",
        name: "키즈룸",
        description: "아이들의 창의력과 상상력을 키워주는 안전한 공간",
        image: "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=1200&auto=format&fit=crop"
    },
    {
        id: "homeoffice",
        name: "홈오피스",
        description: "집에서도 효율적으로 일할 수 있는 전문적인 업무 공간",
        image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1200&auto=format&fit=crop"
    },
    {
        id: "smalloffice",
        name: "스몰오피스",
        description: "작은 공간에도 최적화된 효율적인 사무실 솔루션",
        image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop"
    },
    {
        id: "washitsu",
        name: "와실",
        description: "일본 전통 공간에 어울리는 미니멀하고 우아한 디자인",
        image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?q=80&w=1200&auto=format&fit=crop"
    }
];

export default function ScenePage() {
    const [activeSection, setActiveSection] = useState("");
    const sectionRefs = useRef({});

    useEffect(() => {
        const observers = scenes.map((scene) => {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            setActiveSection(scene.id);
                        }
                    });
                },
                { threshold: 0.3 }
            );

            if (sectionRefs.current[scene.id]) {
                observer.observe(sectionRefs.current[scene.id]);
            }

            return observer;
        });

        return () => {
            observers.forEach((observer) => observer.disconnect());
        };
    }, []);

    const scrollToSection = (sceneId) => {
        const element = sectionRefs.current[sceneId];
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const getProductsByScene = (sceneId) => {
        return products.filter((product) => product.scenes && product.scenes.includes(sceneId));
    };

    return (
        <div className="pb-12">
            {/* Navigation Links */}
            <div className="sticky top-20 z-40 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 py-3 md:py-4 mb-6 md:mb-8">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap gap-2 justify-center">
                        {scenes.map((scene) => (
                            <button
                                key={scene.id}
                                onClick={() => scrollToSection(scene.id)}
                                className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium transition-colors ${
                                    activeSection === scene.id
                                        ? "bg-black dark:bg-white text-white dark:text-black"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                }`}
                            >
                                {scene.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Scene Sections */}
            {scenes.map((scene, index) => {
                const sceneProducts = getProductsByScene(scene.id);

                return (
                    <section
                        key={scene.id}
                        id={scene.id}
                        ref={(el) => (sectionRefs.current[scene.id] = el)}
                        className="mb-12 md:mb-20 scroll-mt-20"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                        >
                            {/* Scene Header */}
                            <div className="container mx-auto px-4 mb-6 md:mb-8">
                                <div className="relative h-[300px] sm:h-[400px] md:h-[500px] overflow-hidden bg-gray-100 dark:bg-gray-900 mb-6 md:mb-8">
                                    <img
                                        src={scene.image}
                                        alt={scene.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-12 text-white">
                                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight mb-2 md:mb-4">
                                            {scene.name}
                                        </h2>
                                        <p className="text-base sm:text-lg md:text-xl opacity-90 max-w-2xl">
                                            {scene.description}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Products Grid */}
                            <div className="container mx-auto px-4">
                                {sceneProducts.length > 0 ? (
                                    <>
                                        <div className="mb-4 md:mb-6">
                                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                                {sceneProducts.length}개의 제품
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-x-8 md:gap-y-12">
                                            {sceneProducts.map((product) => (
                                                <ProductCard key={product.id} product={product} />
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-12 md:py-16">
                                        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
                                            이 시나리오에 해당하는 제품이 없습니다.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </section>
                );
            })}
        </div>
    );
}
