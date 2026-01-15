import { Link } from "react-router-dom";

const categories = ["거실장", "수납장", "테이블", "서랍장", "침실"];
const scenes = ["living", "dining", "bedroom", "kidsroom", "homeoffice", "smalloffice", "washitsu"];
const sceneNames = {
    living: "리비링",
    dining: "다이닝",
    bedroom: "베드룸",
    kidsroom: "키즈룸",
    homeoffice: "홈오피스",
    smalloffice: "스몰오피스",
    washitsu: "와실"
};
const colors = [
    { id: "pure-white", name: "퓨어화이트" },
    { id: "light-gray", name: "라이트그레이" },
    { id: "mid-gray", name: "미드그레이" },
    { id: "anthracite", name: "앤트러사이트" },
    { id: "graphite-black", name: "그래파이트블랙" }
];

export default function Footer() {
    return (
        <footer className="bg-gray-900 dark:bg-black text-white py-16 transition-colors duration-300">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
                    <div>
                        <h3 className="text-2xl font-bold mb-4">USM</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            1885년 스위스에서 설립된 USM은 시대를 초월한 모듈러 가구 시스템을 제공합니다.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">카테고리</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><Link to="/" className="hover:text-white transition-colors">전체 상품</Link></li>
                            {categories.map((category) => (
                                <li key={category}>
                                    <Link
                                        to={`/category/${encodeURIComponent(category)}`}
                                        className="hover:text-white transition-colors"
                                    >
                                        {category}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">시나리오</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><Link to="/scene" className="hover:text-white transition-colors">전체 시나리오</Link></li>
                            {scenes.map((scene) => (
                                <li key={scene}>
                                    <Link
                                        to={`/scene#${scene}`}
                                        className="hover:text-white transition-colors"
                                    >
                                        {sceneNames[scene]}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">컬러</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            {colors.map((color) => (
                                <li key={color.id}>
                                    <Link
                                        to={`/color/${encodeURIComponent(color.id)}`}
                                        className="hover:text-white transition-colors"
                                    >
                                        {color.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">온라인 쇼핑몰 가이드</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><Link to="#" className="hover:text-white transition-colors">주문의 흐름</Link></li>
                            <li><Link to="#" className="hover:text-white transition-colors">결제 및 영수증</Link></li>
                            <li><Link to="#" className="hover:text-white transition-colors">배송 안내</Link></li>
                            <li><Link to="#" className="hover:text-white transition-colors">회원 및 마이페이지</Link></li>
                            <li><Link to="#" className="hover:text-white transition-colors">포인트 안내</Link></li>
                            <li><Link to="#" className="hover:text-white transition-colors">반품 및 교환</Link></li>
                            <li><Link to="#" className="hover:text-white transition-colors">수리 및 서비스</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-500">
                        &copy; {new Date().getFullYear()} USM Clone. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-xs text-gray-500">
                        <Link to="#" className="hover:text-white transition-colors">개인정보처리방침</Link>
                        <Link to="#" className="hover:text-white transition-colors">이용약관</Link>
                        <Link to="#" className="hover:text-white transition-colors">사업자정보</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
