import { ReactNode } from "react";

export type HomeCardTrendTone = "up" | "down";

interface HomeCardTone {
  cardClassName: string;
  badgeClassName: string;
  decoration: ReactNode;
  headerDotClassName: string;
  headerUnderlineClassName: string;
  sectionBadgeClassName: string;
  topBadgeClassName: string;
  channelBadgeClassName: string;
}

export function getHomeCardTone(tone: HomeCardTrendTone): HomeCardTone {
  if (tone === "up") {
    return {
      cardClassName:
        "border-red-100/80 hover:border-red-300/40 dark:border-red-400/10 dark:hover:border-red-400/25 dark:bg-card",
      badgeClassName:
        "border border-red-200/60 bg-red-500/12 text-red-600 dark:border-red-400/20 dark:bg-red-500/18 dark:text-red-200",
      headerDotClassName:
        "bg-gradient-to-r from-red-500 to-orange-400 dark:from-red-400 dark:to-orange-300",
      headerUnderlineClassName:
        "from-red-500/50 via-orange-400/40 to-transparent dark:from-red-400/55 dark:via-orange-300/35",
      sectionBadgeClassName:
        "border border-red-200/60 bg-red-500/10 text-red-600 dark:border-red-400/20 dark:bg-red-500/15 dark:text-red-300",
      topBadgeClassName:
        "border border-red-200/60 bg-red-500/12 text-red-600 dark:border-red-400/20 dark:bg-red-500/18 dark:text-red-200",
      channelBadgeClassName:
        "border border-orange-200/60 bg-orange-100/70 text-orange-700 dark:border-orange-400/15 dark:bg-orange-400/10 dark:text-orange-200",
      decoration: (
        <>
          <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-red-400/20 blur-2xl animate-healing-breath dark:bg-red-400/25" />
          <div className="absolute left-0 top-0 h-20 w-full bg-gradient-to-br from-red-500/12 via-orange-400/8 to-transparent dark:from-red-400/16 dark:via-orange-300/10" />
          <div className="absolute left-0 top-0 h-px w-24 bg-gradient-to-r from-red-500/40 via-red-400/10 to-transparent" />
          <div className="absolute left-0 top-0 h-16 w-px bg-gradient-to-b from-red-500/40 via-red-400/10 to-transparent" />
          <div className="absolute left-4 top-4 h-px w-14 rotate-[-24deg] bg-gradient-to-r from-transparent via-red-300/50 to-transparent dark:via-red-300/35" />
        </>
      ),
    };
  }

  return {
    cardClassName:
      "border-sky-100/90 hover:border-sky-300/40 dark:border-sky-400/10 dark:hover:border-sky-400/25 dark:bg-card",
    badgeClassName:
      "border border-blue-200/60 bg-blue-500/12 text-blue-600 dark:border-blue-400/20 dark:bg-blue-500/18 dark:text-blue-200",
    headerDotClassName:
      "bg-gradient-to-r from-sky-500 to-blue-500 dark:from-sky-400 dark:to-blue-300",
    headerUnderlineClassName:
      "from-sky-500/50 via-blue-400/40 to-transparent dark:from-sky-400/55 dark:via-blue-300/35",
    sectionBadgeClassName:
      "border border-blue-200/60 bg-blue-500/10 text-blue-600 dark:border-blue-400/20 dark:bg-blue-500/15 dark:text-blue-300",
    topBadgeClassName:
      "border border-blue-200/60 bg-blue-500/12 text-blue-600 dark:border-blue-400/20 dark:bg-blue-500/18 dark:text-blue-200",
    channelBadgeClassName:
      "border border-sky-200/60 bg-sky-100/70 text-sky-700 dark:border-sky-400/15 dark:bg-sky-400/10 dark:text-sky-200",
    decoration: (
      <>
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-400/20 blur-2xl animate-healing-breath dark:bg-sky-400/25" />
        <div className="absolute right-0 top-0 h-20 w-full bg-gradient-to-bl from-sky-500/12 via-blue-400/8 to-transparent dark:from-sky-400/16 dark:via-blue-300/10" />
        <div className="absolute right-0 top-0 h-px w-24 bg-gradient-to-l from-sky-500/40 via-sky-400/10 to-transparent" />
        <div className="absolute right-0 top-0 h-16 w-px bg-gradient-to-b from-sky-500/40 via-sky-400/10 to-transparent" />
        <div className="absolute right-4 top-4 h-px w-16 bg-gradient-to-r from-transparent via-sky-300/50 to-transparent dark:via-sky-300/35" />
        <div className="absolute right-6 top-8 h-px w-10 bg-gradient-to-r from-transparent via-blue-200/40 to-transparent dark:via-blue-200/30" />
      </>
    ),
  };
}
