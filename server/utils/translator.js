import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const DEEPL_API_KEY = process.env.DEEPL_API_KEY || '507236b4-4da6-46e2-b3cf-183194b4e602:fx';
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

/**
 * 딥엘 API를 사용하여 일본어를 한국어로 번역
 * @param {string} text - 번역할 텍스트
 * @returns {Promise<string|null>} 번역된 텍스트 또는 null (실패 시)
 */
export async function translateJaToKo(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return null;
  }

  try {
    const response = await axios.post(
      DEEPL_API_URL,
      {
        text: [text],
        source_lang: 'JA',
        target_lang: 'KO',
      },
      {
        headers: {
          'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    if (response.data?.translations?.[0]?.text) {
      return response.data.translations[0].text;
    }

    return null;
  } catch (error) {
    console.error('번역 실패:', error.message);
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
    }
    return null;
  }
}

/**
 * 여러 텍스트를 배치로 번역
 * @param {string[]} texts - 번역할 텍스트 배열
 * @returns {Promise<Array<{original: string, translated: string|null}>>}
 */
export async function translateBatch(texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  const validTexts = texts.filter(t => t && typeof t === 'string' && t.trim().length > 0);
  
  if (validTexts.length === 0) {
    return texts.map(t => ({ original: t || '', translated: null }));
  }

  try {
    const response = await axios.post(
      DEEPL_API_URL,
      {
        text: validTexts,
        source_lang: 'JA',
        target_lang: 'KO',
      },
      {
        headers: {
          'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    const translations = response.data?.translations || [];
    const result = [];

    let translationIndex = 0;
    for (let i = 0; i < texts.length; i++) {
      if (texts[i] && typeof texts[i] === 'string' && texts[i].trim().length > 0) {
        result.push({
          original: texts[i],
          translated: translations[translationIndex]?.text || null,
        });
        translationIndex++;
      } else {
        result.push({
          original: texts[i] || '',
          translated: null,
        });
      }
    }

    return result;
  } catch (error) {
    console.error('배치 번역 실패:', error.message);
    return texts.map(t => ({ original: t || '', translated: null }));
  }
}
