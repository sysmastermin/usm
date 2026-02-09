import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import sceneImages from "../data/sceneImages.json";

const SLIDE_COUNT = 5;

const categoryMeta = {
  living: {
    name: "거실",
    subtitle: "편안하고 아늑한 거실 공간을 위한 USM 가구 컬렉션",
  },
  dining: {
    name: "주방",
    subtitle: "가족과 함께하는 식사 시간을 더욱 특별하게",
  },
  bedroom: {
    name: "침실",
    subtitle: "편안한 수면과 휴식을 위한 침실 공간 연출",
  },
  kidsroom: {
    name: "키즈룸",
    subtitle: "아이들의 창의력과 상상력을 키워주는 공간",
  },
  homeoffice: {
    name: "오피스텔",
    subtitle: "효율적으로 일할 수 있는 전문적인 업무 공간",
  },
  smalloffice: {
    name: "스몰오피스",
    subtitle: "작은 공간에도 최적화된 사무실 솔루션",
  },
};

export default function HeroCarousel() {
    const [current, setCurrent] = useState(0);

    // 모든 씬 이미지를 평탄화하고 랜덤 셔플하여 슬라이드 생성
    const slides = useMemo(() => {
        const allImages = Object.entries(sceneImages).flatMap(
            ([sceneId, images]) =>
                images.map((img) => ({ ...img, sceneId }))
        );
        const shuffled = [...allImages]
            .sort(() => Math.random() - 0.5);
        return shuffled.slice(0, SLIDE_COUNT).map((img) => ({
            id: img.id,
            image: img.image,
            title: categoryMeta[img.sceneId]?.name
                + " 컬렉션",
            subtitle: categoryMeta[img.sceneId]?.subtitle,
            link: "/scene",
            sceneId: img.sceneId,
        }));
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    const nextSlide = () =>
        setCurrent((prev) => (prev + 1) % slides.length);
    const prevSlide = () =>
        setCurrent((prev) =>
            (prev - 1 + slides.length) % slides.length
        );

    return (
        <div className="relative h-[70vh] min-h-[500px] mb-16 overflow-hidden bg-gray-100 dark:bg-gray-900 group">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0"
                >
                    <img
                        src={slides[current].image}
                        alt={slides[current].title}
                        className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </motion.div>
            </AnimatePresence>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 text-white text-center md:text-left z-10">
                <motion.div
                    key={`content-${current}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    <h1 className="text-4xl md:text-6xl font-light tracking-tight mb-4 drop-shadow-md">
                        {slides[current].title}
                    </h1>
                    <p className="text-lg md:text-xl opacity-90 max-w-xl mb-6 drop-shadow-sm md:mx-0 mx-auto">
                        {slides[current].subtitle}
                    </p>
                    <Link
                        to={slides[current].link}
                        state={{
                            sceneId: slides[current].sceneId,
                        }}
                        className="inline-block bg-white text-black px-8 py-3 font-medium hover:bg-gray-100 transition-colors"
                    >
                        자세히 보기
                    </Link>
                </motion.div>
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <ChevronLeft className="w-8 h-8" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <ChevronRight className="w-8 h-8" />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-8 right-8 flex gap-3 z-10">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrent(index)}
                        className={`h-1 rounded-full transition-all duration-300 ${current === index ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
