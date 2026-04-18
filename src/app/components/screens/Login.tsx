import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { useLocation } from "react-router";
import { AppBrandMark } from "@/app/components/shared";

type SocialLoginType = "GOOGLE" | "KAKAO";

interface SocialButtonProps {
  type: SocialLoginType;
  label: string;
  onClick: () => void;
}

const TRUST_POINTS = [
  "복잡한 주식 데이터를 한눈에 진단",
  "안전한 소셜 로그인",
  "개인화된 투자 인사이트",
] as const;

const FEATURE_BLOCKS = [
  {
    title: "오늘 시장을 빠르게 읽기",
    description: "섹터 흐름과 수급 변화를 짧고 명확하게 정리합니다.",
  },
  {
    title: "내 포트폴리오 상태 점검",
    description: "수익률, 리스크, 다음 행동을 한 화면에서 확인합니다.",
  },
] as const;

export function Login() {
  const location = useLocation();

  const handleSocialLogin = (type: SocialLoginType) => {
    // OAuth 제공자 페이지로 이동하면 location state가 사라지므로 sessionStorage에 보관한다.
    const from = location.state?.from?.pathname || "/";
    if (from !== "/login") {
      sessionStorage.setItem("redirect_after_login", from);
    }

    const authorizeUrl = `/oauth2/authorization/${type.toLowerCase()}`;
    window.location.href = authorizeUrl;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-primary)_7%,var(--color-background)),var(--color-background)_32%,var(--color-card))]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-5.5rem] h-64 w-64 rounded-full bg-primary/18 blur-3xl" />
        <div className="absolute right-[-5rem] top-28 h-52 w-52 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-400/18" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="page-shell relative mx-auto flex min-h-screen w-full max-w-2xl flex-col pb-[calc(1.75rem+env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative"
        >
          <div className="absolute -right-3 top-3 hidden rounded-full border border-border/50 bg-card/55 px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm backdrop-blur md:block">
            투자 루틴을 더 가볍게
          </div>

          <div className="flex items-center justify-between">
            <AppBrandMark className="items-start" />
            <div className="rounded-full border border-border/60 bg-card/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Mobile web
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Daily Investing Garden
            </div>

            <div className="space-y-3">
              <h1 className="max-w-[18rem] text-[1.875rem] font-bold leading-[1.08] tracking-[-0.03em] text-foreground sm:max-w-[22rem] sm:text-[2.375rem]">
                투자 루틴이
                <br />
                더 선명해지는 모바일 웹
              </h1>
              <p className="max-w-[26rem] text-sm leading-6 text-muted-foreground sm:text-base">
                시장의 공기, 내 포트폴리오의 상태, 다음 행동까지 한 번에 읽을 수 있도록 Stockwellness가 투자 흐름을 정리합니다.
              </p>
            </div>

            <div className="rounded-[28px] border border-border/60 bg-card/78 p-5 shadow-[0_22px_60px_-44px_rgba(15,23,42,0.42)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">What you get</p>
                  <p className="mt-2 text-lg font-bold tracking-tight text-foreground">처음 들어와도 바로 탐색할 수 있는 투자 홈</p>
                </div>
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {FEATURE_BLOCKS.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-border/60 bg-background/70 px-4 py-4">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {TRUST_POINTS.map((point, index) => (
                <motion.div
                  key={point}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.08 + index * 0.06, ease: "easeOut" }}
                  className="rounded-[22px] border border-border/55 bg-card/72 px-4 py-3 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.38)] backdrop-blur"
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 rounded-full bg-primary/12 p-1 text-primary">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-xs font-medium leading-5 text-foreground">{point}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.08, ease: "easeOut" }}
          className="mt-auto pt-8"
        >
          <div className="rounded-[32px] border border-border/60 bg-card/78 p-5 shadow-[0_30px_80px_-42px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Start your routine</p>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground">소셜 계정으로 바로 시작하기</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  가입과 로그인을 한 번에 처리하고, 기존에 보던 페이지로 자연스럽게 돌아갑니다.
                </p>
              </div>
              <div className="hidden rounded-2xl border border-primary/15 bg-primary/10 p-3 text-primary sm:block">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <SocialButton
                type="KAKAO"
                label="카카오로 시작하기"
                onClick={() => handleSocialLogin("KAKAO")}
              />
              <SocialButton
                type="GOOGLE"
                label="구글로 시작하기"
                onClick={() => handleSocialLogin("GOOGLE")}
              />
            </div>

            <div className="mt-5 rounded-[24px] border border-border/60 bg-secondary/55 px-4 py-3">
              <p className="text-xs leading-5 text-muted-foreground">
                계속 진행하면 이용약관 및 개인정보 처리방침에 동의한 것으로 간주됩니다. 상세 페이지 연결은 추후 정책 화면이 준비되면 연결합니다.
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function SocialButton({ type, label, onClick }: SocialButtonProps) {
  const isKakao = type === "KAKAO";

  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      onClick={onClick}
      className={[
        "flex w-full items-center justify-center gap-3 rounded-[22px] border px-4 py-4 text-base font-bold shadow-[0_16px_30px_-26px_rgba(15,23,42,0.55)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2",
        isKakao
          ? "border-[#E7D300] bg-[#FEE500] text-[#191919] hover:bg-[#f7df00]"
          : "border-border/80 bg-white text-[#191919] hover:bg-neutral-50 dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-card/85",
      ].join(" ")}
      aria-label={label}
      type="button"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 dark:bg-black/20">
        {isKakao ? <KakaoIcon /> : <GoogleIcon />}
      </span>
      <span>{label}</span>
    </motion.button>
  );
}

function KakaoIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path
        fill="currentColor"
        d="M12 4.5C7.305 4.5 3.5 7.47 3.5 11.133c0 2.375 1.58 4.46 3.96 5.637l-.999 3.655a.52.52 0 0 0 .778.578l4.357-2.81c.133.006.266.01.404.01 4.695 0 8.5-2.97 8.5-6.634S16.695 4.5 12 4.5Z"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path
        fill="#4285F4"
        d="M21.805 12.23c0-.76-.068-1.49-.195-2.19H12v4.145h5.49a4.696 4.696 0 0 1-2.037 3.082v2.555h3.295c1.929-1.776 3.057-4.394 3.057-7.592Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.755 0 5.067-.913 6.756-2.47l-3.295-2.555c-.913.613-2.08.976-3.46.976-2.66 0-4.914-1.797-5.72-4.212H2.876v2.635A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.28 13.739A5.997 5.997 0 0 1 5.96 11.9c0-.638.11-1.257.32-1.839V7.426H2.876a9.997 9.997 0 0 0 0 8.948l3.405-2.635Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.85c1.497 0 2.842.515 3.9 1.526l2.925-2.925C17.063 2.8 14.75 1.8 12 1.8a10 10 0 0 0-9.124 5.626L6.28 10.06C7.086 7.647 9.34 5.85 12 5.85Z"
      />
    </svg>
  );
}
