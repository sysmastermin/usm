import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Image,
  Package,
  RefreshCw,
  Upload,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import adminApi from '../../lib/adminApi';
import LoadingSkeleton from '../../components/admin/LoadingSkeleton';
import { useToast } from '../../components/admin/Toast';
import { cn } from '../../lib/utils';

const SCENE_CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'living', label: '거실' },
  { id: 'dining', label: '주방' },
  { id: 'bedroom', label: '침실' },
  { id: 'kidsroom', label: '키즈룸' },
  { id: 'homeoffice', label: '오피스텔' },
  { id: 'smalloffice', label: '스몰오피스' },
];

export default function AdminScenes() {
  const toast = useToast();
  const navigate = useNavigate();
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [migrating, setMigrating] = useState(false);
  const [crawling, setCrawling] = useState(false);

  useEffect(() => {
    fetchScenes();
  }, [category]);

  const fetchScenes = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'all') {
        params.category = category;
      }
      const res = await adminApi.get('/scenes', {
        params,
      });
      if (res.data.success) {
        setScenes(res.data.data);
      }
    } catch {
      toast.error('씬 목록을 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      const res = await adminApi.post(
        '/scenes/migrate'
      );
      if (res.data.success) {
        toast.success(res.data.message);
        fetchScenes();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message
          || '마이그레이션 실패'
      );
    } finally {
      setMigrating(false);
    }
  };

  const handleCrawl = async () => {
    setCrawling(true);
    try {
      const res = await adminApi.post(
        '/scenes/crawl',
        {},
        { timeout: 120000 }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        fetchScenes();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || '크롤링 실패'
      );
    } finally {
      setCrawling(false);
    }
  };

  const getCategoryLabel = (catId) =>
    SCENE_CATEGORIES.find((c) => c.id === catId)
      ?.label || catId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            씬 관리
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            씬 이미지와 연결 상품을 관리합니다
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleMigrate}
            disabled={migrating}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2',
              'text-sm font-medium rounded-lg',
              'bg-blue-600 text-white',
              'hover:bg-blue-700',
              'disabled:opacity-50'
            )}
          >
            {migrating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            JSON 마이그레이션
          </button>
          <button
            onClick={handleCrawl}
            disabled={crawling}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2',
              'text-sm font-medium rounded-lg',
              'bg-green-600 text-white',
              'hover:bg-green-700',
              'disabled:opacity-50'
            )}
          >
            {crawling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            상품 크롤링
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {SCENE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg',
              'transition-colors',
              category === cat.id
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Scenes Grid */}
      {loading ? (
        <LoadingSkeleton count={8} type="card" />
      ) : scenes.length === 0 ? (
        <div className="text-center py-16">
          <Image className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            씬이 없습니다. JSON 마이그레이션을
            실행해주세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              onClick={() =>
                navigate(`/admin/scenes/${scene.id}`)
              }
              className={cn(
                'group cursor-pointer rounded-lg',
                'bg-white dark:bg-gray-800',
                'border border-gray-200 dark:border-gray-700',
                'overflow-hidden',
                'hover:shadow-lg transition-shadow'
              )}
            >
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-900">
                {scene.image_url ? (
                  <img
                    src={scene.image_url}
                    alt={scene.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Image className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {getCategoryLabel(
                      scene.scene_category
                    )}{' '}
                    #{scene.scene_number}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1',
                      'text-xs font-medium px-1.5 py-0.5 rounded',
                      scene.product_count > 0
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    )}
                  >
                    <Package className="w-3 h-3" />
                    {scene.product_count}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {scene.title || '제목 없음'}
                </p>
                {scene.source_url && (
                  <a
                    href={scene.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline mt-1"
                  >
                    원본
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
