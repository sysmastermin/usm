export default function ConfiguratorPage() {
    return (
        <div className="pb-12">
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto text-center py-12 md:py-20">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-gray-900 dark:text-white mb-4 md:mb-6">
                        3D 컨피규레이터
                    </h1>
                    <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-6 md:mb-8 leading-relaxed px-4">
                        USM 할러 모듈러 가구를 3D로 직접 구성하고 시각화해보세요.
                        원하는 크기, 색상, 구성으로 나만의 가구를 만들어보실 수 있습니다.
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-800 p-8 md:p-12 rounded-sm mb-6 md:mb-8">
                        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mb-2 md:mb-4">
                            현재 3D 컨피규레이터는 준비 중입니다.
                        </p>
                        <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500">
                            곧 만나보실 수 있습니다.
                        </p>
                    </div>
                    <div className="space-y-3 md:space-y-4 px-4">
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                            문의사항이 있으시면 고객센터로 연락주세요.
                        </p>
                        <a
                            href="https://jp.shop.usm.com/pages/scene"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-black dark:bg-white text-white dark:text-black px-6 md:px-8 py-2.5 md:py-3 text-sm md:text-base font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                        >
                            공식 사이트에서 확인하기
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
