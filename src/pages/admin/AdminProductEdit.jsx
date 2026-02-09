import { useState, useEffect } from 'react';
import {
  useParams,
  useNavigate,
} from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  Package,
} from 'lucide-react';
import adminApi from '../../lib/adminApi';
import LoadingSkeleton from '../../components/admin/LoadingSkeleton';
import { useToast } from '../../components/admin/Toast';
import { cn } from '../../lib/utils';

const TABS = [
  { id: 'basic', label: '기본정보' },
  { id: 'translation', label: '번역' },
  { id: 'images', label: '이미지' },
  { id: 'specs', label: '스펙' },
];

/**
 * 상품 상세 편집 페이지
 * - 탭 구조: 기본정보 | 번역 | 이미지 | 스펙
 * - 모바일에서 탭 가로 스크롤
 */
export default function AdminProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('basic');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // 미저장 변경사항 이탈 경고
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener(
      'beforeunload',
      handleBeforeUnload
    );
    return () =>
      window.removeEventListener(
        'beforeunload',
        handleBeforeUnload
      );
  }, [dirty]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get(`/products/${id}`);
      if (res.data.success) {
        setProduct(res.data.data);
        setForm(res.data.data);
        setDirty(false);
      }
    } catch (err) {
      toast.error('상품 정보를 불러올 수 없습니다');
      navigate('/admin/products');
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
      // 변경된 필드만 추출
      const changes = {};
      for (const key of Object.keys(form)) {
        if (form[key] !== product[key]) {
          changes[key] = form[key];
        }
      }

      if (Object.keys(changes).length === 0) {
        toast.info('변경된 내용이 없습니다');
        setSaving(false);
        return;
      }

      const res = await adminApi.put(
        `/products/${id}`,
        changes
      );
      if (res.data.success) {
        setProduct(res.data.data);
        setForm(res.data.data);
        setDirty(false);
        toast.success('저장되었습니다');
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          '저장에 실패했습니다'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (
      dirty &&
      !window.confirm(
        '저장하지 않은 변경사항이 있습니다. 나가시겠습니까?'
      )
    ) {
      return;
    }
    navigate('/admin/products');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <LoadingSkeleton variant="card" count={4} />
      </div>
    );
  }

  if (!product) return null;

  // 이미지 갤러리 파싱
  let gallery = [];
  try {
    gallery = product.image_gallery
      ? JSON.parse(product.image_gallery)
      : [];
  } catch {
    gallery = [];
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
              {product.name_ko || product.name_ja}
            </h1>
            <p className="text-xs text-gray-500">
              ID: {product.id}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg',
            'text-sm font-medium',
            'bg-gray-900 dark:bg-white',
            'text-white dark:text-gray-900',
            'hover:bg-gray-800 dark:hover:bg-gray-100',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors min-h-[44px] shrink-0'
          )}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">저장</span>
        </button>
      </div>

      {/* 탭 네비게이션 */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 min-w-max">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium',
                'border-b-2 transition-colors',
                'min-h-[44px] whitespace-nowrap',
                tab === t.id
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 내용 */}
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6',
          'border border-gray-200 dark:border-gray-700'
        )}
      >
        {tab === 'basic' && (
          <BasicTab form={form} onChange={handleChange} />
        )}
        {tab === 'translation' && (
          <TranslationTab
            form={form}
            onChange={handleChange}
          />
        )}
        {tab === 'images' && (
          <ImagesTab
            form={form}
            gallery={gallery}
          />
        )}
        {tab === 'specs' && (
          <SpecsTab form={form} onChange={handleChange} />
        )}
      </div>
    </div>
  );
}

/** 기본정보 탭 */
function BasicTab({ form, onChange }) {
  return (
    <div className="space-y-4">
      <Field
        label="상품 코드"
        value={form.product_code || ''}
        onChange={(v) => onChange('product_code', v)}
      />
      <Field
        label="모델 번호"
        value={form.model_number || ''}
        onChange={(v) => onChange('model_number', v)}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field
          label="가격"
          type="number"
          value={form.price ?? ''}
          onChange={(v) => onChange('price', v)}
        />
        <Field
          label="정가"
          type="number"
          value={form.regular_price ?? ''}
          onChange={(v) => onChange('regular_price', v)}
        />
        <Field
          label="할인가"
          type="number"
          value={form.sale_price ?? ''}
          onChange={(v) => onChange('sale_price', v)}
        />
      </div>
      <Field
        label="치수"
        value={form.dimensions || ''}
        onChange={(v) => onChange('dimensions', v)}
      />
      <Field
        label="무게"
        value={form.weight || ''}
        onChange={(v) => onChange('weight', v)}
      />
      <Field
        label="순위 (rank)"
        type="number"
        value={form.rank ?? ''}
        onChange={(v) => onChange('rank', v)}
      />
    </div>
  );
}

/** 번역 탭 */
function TranslationTab({ form, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          상품명
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="일본어 (원문)"
            value={form.name_ja || ''}
            onChange={(v) => onChange('name_ja', v)}
          />
          <Field
            label="한국어 (번역)"
            value={form.name_ko || ''}
            onChange={(v) => onChange('name_ko', v)}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          설명
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="일본어"
            value={form.description_ja || ''}
            onChange={(v) => onChange('description_ja', v)}
            multiline
          />
          <Field
            label="한국어"
            value={form.description_ko || ''}
            onChange={(v) => onChange('description_ko', v)}
            multiline
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          소재
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="일본어"
            value={form.material_ja || ''}
            onChange={(v) => onChange('material_ja', v)}
          />
          <Field
            label="한국어"
            value={form.material_ko || ''}
            onChange={(v) => onChange('material_ko', v)}
          />
        </div>
      </div>
    </div>
  );
}

/** 이미지 폴백 핸들러 */
function handleImgError(e) {
  e.target.onerror = null;
  e.target.style.display = 'none';
  const fallback = e.target.nextElementSibling;
  if (fallback) fallback.style.display = 'flex';
}

/** 이미지 탭 */
function ImagesTab({ form, gallery }) {
  return (
    <div className="space-y-4">
      {/* 메인 이미지 */}
      <div>
        <h3
          className={cn(
            'text-sm font-medium mb-3',
            'text-gray-700 dark:text-gray-300'
          )}
        >
          메인 이미지
        </h3>
        <div
          className={cn(
            'w-full max-w-xs aspect-square',
            'rounded-lg overflow-hidden',
            'bg-gray-100 dark:bg-gray-700'
          )}
        >
          {form.image_url ? (
            <div className="relative w-full h-full">
              <img
                src={form.image_url}
                alt="메인 이미지"
                className="w-full h-full object-contain"
                onError={handleImgError}
              />
              <div
                className={cn(
                  'w-full h-full items-center',
                  'justify-center hidden'
                )}
              >
                <Package
                  className={cn(
                    'w-12 h-12 text-gray-400'
                  )}
                />
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'w-full h-full flex items-center',
                'justify-center'
              )}
            >
              <Package
                className="w-12 h-12 text-gray-400"
              />
            </div>
          )}
        </div>
        <p
          className={cn(
            'text-xs text-gray-400',
            'mt-2 break-all'
          )}
        >
          {form.image_url || '이미지 없음'}
        </p>
      </div>

      {/* 갤러리 */}
      {gallery.length > 0 && (
        <div>
          <h3
            className={cn(
              'text-sm font-medium mb-3',
              'text-gray-700 dark:text-gray-300'
            )}
          >
            이미지 갤러리 ({gallery.length}개)
          </h3>
          <div
            className={cn(
              'grid grid-cols-3 sm:grid-cols-4',
              'lg:grid-cols-6 gap-2'
            )}
          >
            {gallery.map((url, i) => (
              <div
                key={i}
                className={cn(
                  'aspect-square rounded-lg',
                  'overflow-hidden',
                  'bg-gray-100 dark:bg-gray-700'
                )}
              >
                <img
                  src={url}
                  alt={`갤러리 ${i + 1}`}
                  className={cn(
                    'w-full h-full object-cover'
                  )}
                  loading="lazy"
                  onError={handleImgError}
                />
                <div
                  className={cn(
                    'w-full h-full items-center',
                    'justify-center hidden'
                  )}
                >
                  <Package
                    className={cn(
                      'w-6 h-6 text-gray-400'
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** 스펙 탭 */
function SpecsTab({ form, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          스펙 (일본어)
        </h3>
        <Field
          value={
            typeof form.specs_ja === 'string'
              ? form.specs_ja
              : JSON.stringify(form.specs_ja || '', null, 2)
          }
          onChange={(v) => onChange('specs_ja', v)}
          multiline
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          스펙 (한국어)
        </h3>
        <Field
          value={
            typeof form.specs_ko === 'string'
              ? form.specs_ko
              : JSON.stringify(form.specs_ko || '', null, 2)
          }
          onChange={(v) => onChange('specs_ko', v)}
          multiline
        />
      </div>
      <Field
        label="특이사항"
        value={
          typeof form.special_notes === 'string'
            ? form.special_notes
            : JSON.stringify(form.special_notes || '', null, 2)
        }
        onChange={(v) => onChange('special_notes', v)}
        multiline
      />
    </div>
  );
}

/** 재사용 필드 컴포넌트 */
function Field({
  label,
  value,
  onChange,
  type = 'text',
  multiline = false,
}) {
  const inputClass = cn(
    'w-full px-3 py-2.5 text-sm rounded-lg',
    'bg-white dark:bg-gray-700',
    'border border-gray-300 dark:border-gray-600',
    'text-gray-900 dark:text-white',
    'placeholder-gray-400',
    'focus:outline-none focus:ring-2',
    'focus:ring-gray-900/20 dark:focus:ring-white/20',
    'focus:border-gray-900 dark:focus:border-white',
    'min-h-[44px]'
  );

  return (
    <div>
      {label && (
        <label className="block mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          rows={4}
          className={cn(inputClass, 'resize-y')}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={inputClass}
        />
      )}
    </div>
  );
}
