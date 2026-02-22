import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  Trash2,
  Plus,
  X,
  Search,
  GripVertical,
  ExternalLink,
  RefreshCw,
  Package,
} from 'lucide-react';
import adminApi from '../../lib/adminApi';
import LoadingSkeleton from '../../components/admin/LoadingSkeleton';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { useToast } from '../../components/admin/Toast';
import { cn } from '../../lib/utils';

export default function AdminSceneDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [scene, setScene] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [showProductSearch, setShowProductSearch] =
    useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(
    []
  );
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);

  const [deleteTarget, setDeleteTarget] =
    useState(null);
  const [crawlingSingle, setCrawlingSingle] =
    useState(false);

  useEffect(() => {
    fetchScene();
  }, [id]);

  const fetchScene = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get(`/scenes/${id}`);
      if (res.data.success) {
        setScene(res.data.data);
        setForm({
          title: res.data.data.title || '',
          description: res.data.data.description || '',
        });
        setDirty(false);
      }
    } catch {
      toast.error('씬 정보를 불러올 수 없습니다');
      navigate('/admin/scenes');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminApi.put(
        `/scenes/${id}`,
        form
      );
      if (res.data.success) {
        toast.success('씬이 수정되었습니다');
        setScene((prev) => ({
          ...prev,
          ...res.data.data,
        }));
        setDirty(false);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || '수정 실패'
      );
    } finally {
      setSaving(false);
    }
  };

  const searchProducts = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await adminApi.get('/products', {
        params: {
          search: searchQuery,
          limit: 20,
        },
      });
      if (res.data.success) {
        const linkedIds = new Set(
          (scene?.products || []).map((p) => p.id)
        );
        setSearchResults(
          res.data.data.filter(
            (p) => !linkedIds.has(p.id)
          )
        );
      }
    } catch {
      toast.error('상품 검색 실패');
    } finally {
      setSearching(false);
    }
  }, [searchQuery, scene?.products]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (showProductSearch) searchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, showProductSearch, searchProducts]);

  const handleLinkProduct = async (productId) => {
    setLinking(true);
    try {
      const res = await adminApi.post(
        `/scenes/${id}/products`,
        { productId }
      );
      if (res.data.success) {
        toast.success('상품이 연결되었습니다');
        fetchScene();
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || '연결 실패'
      );
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkProduct = async (productId) => {
    try {
      const res = await adminApi.delete(
        `/scenes/${id}/products/${productId}`
      );
      if (res.data.success) {
        toast.success('상품 연결이 해제되었습니다');
        fetchScene();
      }
    } catch {
      toast.error('연결 해제 실패');
    }
  };

  const handleCrawlSingle = async () => {
    setCrawlingSingle(true);
    try {
      const res = await adminApi.post(
        '/scenes/crawl',
        { sceneIds: [parseInt(id)] },
        { timeout: 60000 }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        fetchScene();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || '크롤링 실패'
      );
    } finally {
      setCrawlingSingle(false);
    }
  };

  const handleDeleteScene = async () => {
    try {
      const res = await adminApi.delete(
        `/scenes/${id}`
      );
      if (res.data.success) {
        toast.success('씬이 삭제되었습니다');
        navigate('/admin/scenes');
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || '삭제 실패'
      );
    }
    setDeleteTarget(null);
  };

  const formatPrice = (price) => {
    if (!price) return '-';
    return `¥${Number(price).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={1} type="card" />
        <LoadingSkeleton count={3} type="list" />
      </div>
    );
  }

  if (!scene) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/scenes')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
            {scene.title || `씬 #${scene.scene_number}`}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {scene.scene_category} #{scene.scene_number}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCrawlSingle}
            disabled={crawlingSingle}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2',
              'text-sm font-medium rounded-lg',
              'bg-green-600 text-white hover:bg-green-700',
              'disabled:opacity-50'
            )}
          >
            {crawlingSingle ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              크롤링
            </span>
          </button>
          <button
            onClick={() => setDeleteTarget(scene)}
            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scene Image + Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {scene.image_url ? (
            <img
              src={scene.image_url}
              alt={scene.title}
              className="w-full aspect-[4/3] object-cover"
            />
          ) : (
            <div className="w-full aspect-[4/3] flex items-center justify-center bg-gray-100 dark:bg-gray-900">
              <p className="text-gray-400">
                이미지 없음
              </p>
            </div>
          )}
          {scene.source_url && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <a
                href={scene.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-500 hover:underline"
              >
                USM Japan 원본 페이지
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Edit Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            씬 정보
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                제목
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  handleChange(
                    'title',
                    e.target.value
                  )
                }
                className={cn(
                  'w-full px-3 py-2 rounded-lg',
                  'border border-gray-300 dark:border-gray-600',
                  'bg-white dark:bg-gray-700',
                  'text-gray-900 dark:text-white',
                  'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                설명
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) =>
                  handleChange(
                    'description',
                    e.target.value
                  )
                }
                className={cn(
                  'w-full px-3 py-2 rounded-lg',
                  'border border-gray-300 dark:border-gray-600',
                  'bg-white dark:bg-gray-700',
                  'text-gray-900 dark:text-white',
                  'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  'resize-none'
                )}
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2',
                'text-sm font-medium rounded-lg',
                'bg-gray-900 dark:bg-white',
                'text-white dark:text-gray-900',
                'hover:bg-gray-800 dark:hover:bg-gray-100',
                'disabled:opacity-50'
              )}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              저장
            </button>
          </div>
        </div>
      </div>

      {/* Linked Products */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5" />
            연결된 상품
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              ({scene.products?.length || 0}개)
            </span>
          </h2>
          <button
            onClick={() =>
              setShowProductSearch((v) => !v)
            }
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2',
              'text-sm font-medium rounded-lg',
              'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            <Plus className="w-4 h-4" />
            상품 추가
          </button>
        </div>

        {/* Product Search Modal */}
        {showProductSearch && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                placeholder="상품명 또는 코드로 검색..."
                className={cn(
                  'w-full pl-10 pr-10 py-2 rounded-lg',
                  'border border-gray-300 dark:border-gray-600',
                  'bg-white dark:bg-gray-700',
                  'text-gray-900 dark:text-white',
                  'focus:ring-2 focus:ring-blue-500',
                  'text-sm'
                )}
                autoFocus
              />
              <button
                onClick={() => {
                  setShowProductSearch(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {searching ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                검색 중...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="max-h-64 overflow-y-auto space-y-1">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() =>
                      handleLinkProduct(product.id)
                    }
                    disabled={linking}
                    className={cn(
                      'w-full flex items-center gap-3 p-2',
                      'rounded-lg text-left',
                      'hover:bg-white dark:hover:bg-gray-800',
                      'transition-colors'
                    )}
                  >
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden shrink-0">
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {product.name_ko
                          || product.name_ja}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.product_code}
                        {product.price
                          && ` | ${formatPrice(product.price)}`}
                      </p>
                    </div>
                    <Plus className="w-4 h-4 text-blue-500 shrink-0" />
                  </button>
                ))}
              </div>
            ) : searchQuery.trim() ? (
              <p className="text-sm text-gray-500 py-2">
                검색 결과가 없습니다
              </p>
            ) : null}
          </div>
        )}

        {/* Products List */}
        {scene.products?.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {scene.products.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <GripVertical className="w-4 h-4 text-gray-400 shrink-0 cursor-grab" />
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900 rounded overflow-hidden shrink-0">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {product.name_ko
                      || product.name_ja}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {product.product_code}
                    {product.dimensions
                      && ` | ${product.dimensions}`}
                    {product.price
                      && ` | ${formatPrice(product.price)}`}
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleUnlinkProduct(product.id)
                  }
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg shrink-0"
                  title="연결 해제"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              연결된 상품이 없습니다
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              "상품 추가" 버튼으로 수동 추가하거나,
              크롤링으로 자동 수집할 수 있습니다
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="씬 삭제"
        message={`"${deleteTarget?.title || '이 씬'}"을 삭제하시겠습니까? 연결된 상품 정보도 함께 삭제됩니다.`}
        onConfirm={handleDeleteScene}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="삭제"
        variant="danger"
      />
    </div>
  );
}
