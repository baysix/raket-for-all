"use client";

import { useEffect, useState } from "react";
import { Download, Share, X, Smartphone } from "lucide-react";
import { ChevronRight } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone;
    setIsStandalone(!!standalone);

    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.userAgent.includes("Mac") && "ontouchend" in document);
    setIsIos(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // 이미 앱으로 설치된 경우 숨김
  if (isStandalone) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-3 p-4 active:bg-gray-50 transition-colors w-full text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
          <Smartphone className="w-4 h-4 text-[#4CAF50]" />
        </div>
        <span className="flex-1 text-sm font-medium">앱 설치하기</span>
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </button>

      {/* 안내 모달 */}
      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-2xl p-5 pb-8 animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">홈 화면에 앱 추가</h3>
              <button
                onClick={() => setShowGuide(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-5">
              <img
                src="/icon-192.png"
                alt="라켓포올"
                className="w-16 h-16 rounded-2xl shadow-sm"
              />
              <div>
                <p className="font-bold">라켓포올</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  홈 화면에서 앱처럼 바로 실행
                </p>
              </div>
            </div>

            {isIos ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3.5">
                  <span className="w-6 h-6 bg-[#4CAF50] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </span>
                  <p className="text-sm text-gray-600">
                    하단 Safari 메뉴바에서{" "}
                    <Share className="w-4 h-4 inline -mt-0.5 text-[#007AFF]" />{" "}
                    <span className="font-semibold">공유 버튼</span>을 탭하세요
                  </p>
                </div>
                <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3.5">
                  <span className="w-6 h-6 bg-[#4CAF50] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </span>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">&quot;홈 화면에 추가&quot;</span>를
                    선택하세요
                  </p>
                </div>
                <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3.5">
                  <span className="w-6 h-6 bg-[#4CAF50] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </span>
                  <p className="text-sm text-gray-600">
                    오른쪽 상단 <span className="font-semibold">&quot;추가&quot;</span>를
                    탭하면 완료!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3.5">
                  <span className="w-6 h-6 bg-[#4CAF50] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </span>
                  <p className="text-sm text-gray-600">
                    브라우저 오른쪽 상단{" "}
                    <span className="font-semibold">⋮ 메뉴</span>를 탭하세요
                  </p>
                </div>
                <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3.5">
                  <span className="w-6 h-6 bg-[#4CAF50] text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </span>
                  <p className="text-sm text-gray-600">
                    <Download className="w-4 h-4 inline -mt-0.5 text-gray-500" />{" "}
                    <span className="font-semibold">&quot;앱 설치&quot;</span> 또는{" "}
                    <span className="font-semibold">&quot;홈 화면에 추가&quot;</span>를
                    선택하세요
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
