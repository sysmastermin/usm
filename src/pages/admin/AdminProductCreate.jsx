import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  Package,
  Plus,
  X,
} from 'lucide-react';
import adminApi from '../../lib/adminApi';
import { useToast } from '../../components/admin/Toast';
import { cn } from '../../lib/utils';

const TABS = [
  { id: 'basic', label: '기본정보' },
  { id: 'translation', label: '번역' },
  { id: 'images', label: '이미지' },
  { id: 'specs', label: '스펙' },
];

const INITIAL_FORM = {
  name_ja: '',
  name_ko: '',
  description_ja: '',
  description_ko: '',
  product_code: '',
  model_number: '',
  price: '',
  regular_price: '',
  sale_price: '',
  image_url: '',
  image_gallery: '[]',
  dimensions: '',
  weight: '',
  material_ja: '',
  material_ko: '',
  specs_ja: '',
  specs_ko: '',
  special_notes: '',
  rank: '',
  category_id: '',
};

export default function AdminProductCreate() {
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(INITIAL_FORM);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('basic');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    adminApi
      .get('/categories')
      .then((res) => {
        if (res.data.success) {
          setCategories(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

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

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!form.name_ja || form.name_ja.trim() === '') {
      toast.error('상품명(일본어)은 필수 입력입니다');
      setTab('translation');
      return;
    }

    setSaving(true);
    try {
      const payload = {};
      for (const [key, value] of Object.entries(form)) {
        if (value !== '' && value !== null) {
          payload[key] = value;
        }
      }

      const res = await adminApi.post(
        '/products',
        payload
      );
      if (res.data.success) {
        toast.success('상품이 등록되었습니다');
        navigate(
          `/admin/products/${res.data.data.id}`
        );
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message
          || '상품 등록에 실패했습니다'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (
      dirty
      && !window.confirm(
        '작성 중인 내용이 있습니다. 나가시겠습니까?'
      )
    ) {
      return;
    }
    navigate('/admin/products');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleBack}
            className={cn(
              'p-2 rounded-lg min-w-[44px] min-h-[44px]',
              'flex items-center justify-center shrink-0',
              'hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              상품 등록
            </h1>
            <p className="text-xs text-gray-500">
              새 상품을 등록합니다
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
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
          <span className="hidden sm:inline">등록</span>
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
          <BasicTab
            form={form}
            onChange={handleChange}
            categories={categories}
          />
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
            onChange={handleChange}
          />
        )}
        {tab === 'specs' && (
          <SpecsTab
            form={form}
            onChange={handleChange}
          />
        )}
      </div>
    </div>
  );
}

function BasicTab({ form, onChange, categories }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
          카테고리
        </label>
        <select
          value={form.category_id || ''}
          onChange={(e) =>
            onChange('category_id', e.target.value)
          }
          className={cn(
            'w-full px-3 py-2.5 text-sm rounded-lg',
            'bg-white dark:bg-gray-700',
            'border border-gray-300 dark:border-gray-600',
            'text-gray-900 dark:text-white',
            'focus:outline-none focus:ring-2',
            'focus:ring-gray-900/20 dark:focus:ring-white/20',
            'focus:border-gray-900 dark:focus:border-white',
            'min-h-[44px]'
          )}
        >
          <option value="">카테고리 선택</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name_ko || cat.name_ja}
            </option>
          ))}
        </select>
      </div>
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

function TranslationTab({ form, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          상품명
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="일본어 (필수)"
            value={form.name_ja || ''}
            onChange={(v) => onChange('name_ja', v)}
            required
          />
          <Field
            label="한국어"
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
            onChange={(v) =>
              onChange('description_ja', v)
            }
            multiline
          />
          <Field
            label="한국어"
            value={form.description_ko || ''}
            onChange={(v) =>
              onChange('description_ko', v)
            }
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

function ImagesTab({ form, onChange }) {
  let gallery = [];
  try {
    gallery = form.image_gallery
      ? JSON.parse(form.image_gallery)
      : [];
  } catch {
    gallery = [];
  }

  const [newUrl, setNewUrl] = useState('');

  const addGalleryUrl = () => {
    const url = newUrl.trim();
    if (!url) return;
    const updated = [...gallery, url];
    onChange(
      'image_gallery',
      JSON.stringify(updated)
    );
    setNewUrl('');
  };

  const removeGalleryUrl = (index) => {
    const updated = gallery.filter(
      (_, i) => i !== index
    );
    onChange(
      'image_gallery',
      JSON.stringify(updated)
    );
  };

  return (
    <div className="space-y-6">
      {/* 메인 이미지 */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          메인 이미지
        </h3>
        <Field
          label="이미지 URL"
          value={form.image_url || ''}
          onChange={(v) => onChange('image_url', v)}
          placeholder="https://..."
        />
        {form.image_url && (
          <div
            className={cn(
              'mt-3 w-full max-w-xs aspect-square',
              'rounded-lg overflow-hidden',
              'bg-gray-100 dark:bg-gray-700'
            )}
          >
            <img
              src={form.image_url}
              alt="미리보기"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* 갤러리 이미지 */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          이미지 갤러리 ({gallery.length}개)
        </h3>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addGalleryUrl();
              }
            }}
            placeholder="이미지 URL을 입력하세요"
            className={cn(
              'flex-1 px-3 py-2.5 text-sm rounded-lg',
              'bg-white dark:bg-gray-700',
              'border border-gray-300 dark:border-gray-600',
              'text-gray-900 dark:text-white',
              'placeholder-gray-400',
              'focus:outline-none focus:ring-2',
              'focus:ring-gray-900/20 dark:focus:ring-white/20',
              'min-h-[44px]'
            )}
          />
          <button
            type="button"
            onClick={addGalleryUrl}
            className={cn(
              'flex items-center gap-1 px-4 py-2.5',
              'rounded-lg text-sm font-medium',
              'bg-gray-900 dark:bg-white',
              'text-white dark:text-gray-900',
              'hover:bg-gray-800 dark:hover:bg-gray-100',
              'min-h-[44px] shrink-0'
            )}
          >
            <Plus className="w-4 h-4" />
            추가
          </button>
        </div>

        {gallery.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {gallery.map((url, i) => (
              <div
                key={i}
                className={cn(
                  'relative group aspect-square',
                  'rounded-lg overflow-hidden',
                  'bg-gray-100 dark:bg-gray-700'
                )}
              >
                <img
                  src={url}
                  alt={`갤러리 ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '';
                    e.target.style.display = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeGalleryUrl(i)}
                  className={cn(
                    'absolute top-1 right-1',
                    'p-1 rounded-full',
                    'bg-black/60 text-white',
                    'opacity-0 group-hover:opacity-100',
                    'transition-opacity'
                  )}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SpecsTab({ form, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          스펙 (일본어)
        </h3>
        <Field
          value={form.specs_ja || ''}
          onChange={(v) => onChange('specs_ja', v)}
          multiline
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          스펙 (한국어)
        </h3>
        <Field
          value={form.specs_ko || ''}
          onChange={(v) => onChange('specs_ko', v)}
          multiline
        />
      </div>
      <Field
        label="특이사항"
        value={form.special_notes || ''}
        onChange={(v) => onChange('special_notes', v)}
        multiline
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  multiline = false,
  required = false,
  placeholder,
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
          {required && (
            <span className="text-red-500 ml-0.5">
              *
            </span>
          )}
        </label>
      )}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          rows={4}
          placeholder={placeholder}
          className={cn(inputClass, 'resize-y')}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={inputClass}
        />
      )}
    </div>
  );
}
