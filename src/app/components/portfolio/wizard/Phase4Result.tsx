import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePortfolio } from "@/hooks/use-portfolio";

interface Props {
  portfolioId: string | null;
  onComplete: () => void;
}

/**
 * Task #79 — 위저드 4단계: 생성 완료 + AI 1차 진단
 * canvas-confetti 미설치 시 CSS 애니메이션으로 대체
 */
export function Phase4Result({ portfolioId, onComplete }: Props) {
  const [showAdvice, setShowAdvice] = useState(false);
  const { advice } = usePortfolio();

  useEffect(() => {
    // 폭죽 이후 0.8초 뒤 AI 진단 카드 노출
    const timer = setTimeout(() => setShowAdvice(true), 800);

    // canvas-confetti 동적 import (설치된 경우)
    import("canvas-confetti")
      .then((mod) => {
        const confetti = mod.default;
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      })
      .catch(() => {
        // 미설치 — 무시
      });

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-12 text-center">
      {/* 완료 이모지 */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
        className="text-6xl mb-4"
      >
        🎉
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-foreground font-bold text-xl mb-2"
      >
        포트폴리오가 생성되었습니다!
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="text-muted-foreground text-sm"
      >
        AI가 내 포트폴리오를 분석하고 있어요
      </motion.p>

      {/* AI 1차 진단 카드 */}
      <AnimatePresence>
        {showAdvice && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full mt-8 bg-card rounded-2xl p-5 border border-border text-left shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🤖</span>
              <p className="text-foreground font-semibold text-sm">AI 1차 진단</p>
            </div>
            {advice ? (
              <p className="text-foreground text-sm leading-relaxed">{advice}</p>
            ) : (
              <p className="text-muted-foreground text-sm">분석 데이터를 불러오는 중...</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 상세 분석 보기 버튼 */}
      <AnimatePresence>
        {showAdvice && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={onComplete}
            className="mt-6 w-full py-4 bg-primary text-white rounded-xl font-semibold text-sm"
          >
            상세 분석 보기 →
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
