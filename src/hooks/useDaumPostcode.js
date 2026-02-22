import { useCallback } from "react";

const SCRIPT_URL =
  "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

function ensureDaumScript() {
  return new Promise((resolve, reject) => {
    if (window.daum?.Postcode) {
      resolve();
      return;
    }

    const existing = document.querySelector(
      `script[src="${SCRIPT_URL}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("스크립트 로드 실패"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("스크립트 로드 실패"));
    document.head.appendChild(script);
  });
}

/**
 * 다음(Kakao) 우편번호 검색 팝업을 여는 재사용 훅.
 *
 * @param {{ onComplete: (result: { zonecode: string, address: string, buildingName: string }) => void }} opts
 * @returns {{ open: () => void }}
 */
export function useDaumPostcode({ onComplete }) {
  const open = useCallback(async () => {
    try {
      await ensureDaumScript();
    } catch {
      alert("주소 검색 서비스를 불러오지 못했습니다.");
      return;
    }

    new window.daum.Postcode({
      oncomplete(data) {
        onComplete({
          zonecode: data.zonecode,
          address: data.roadAddress || data.jibunAddress,
          buildingName: data.buildingName || "",
        });
      },
    }).open();
  }, [onComplete]);

  return { open };
}
