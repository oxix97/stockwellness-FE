export function getSectorIcon(name: string | null | undefined) {
  if (!name) return "📊";
  const normalized = name.toLowerCase().replace(/\s/g, "");

  if (normalized.includes("반도체") || normalized.includes("hbm") || normalized.includes("파운드리")) return "📟";
  if (normalized.includes("인공지능") || normalized.includes("ai") || normalized.includes("llm")) return "🤖";
  if (normalized.includes("로봇") || normalized.includes("협동로봇") || normalized.includes("자동화")) return "🦾";
  if (normalized.includes("우주") || normalized.includes("항공") || normalized.includes("위성")) return "🚀";
  if (normalized.includes("디스플레이") || normalized.includes("oled") || normalized.includes("패널")) return "🖥️";
  if (normalized.includes("소프트웨어") || normalized.includes("it서비스") || normalized.includes("보안")) return "💻";
  if (normalized.includes("메타버스") || normalized.includes("vr") || normalized.includes("ar")) return "🥽";
  if (normalized.includes("양자") || normalized.includes("퀀텀")) return "⚛️";

  if (normalized.includes("2차전지") || normalized.includes("배터리") || normalized.includes("리튬") || normalized.includes("에너지저장")) return "🔋";
  if (normalized.includes("태양광") || normalized.includes("풍력") || normalized.includes("신재생")) return "🌱";
  if (normalized.includes("원자력") || normalized.includes("smr")) return "☢️";
  if (normalized.includes("철강") || normalized.includes("금속") || normalized.includes("비철")) return "⛓️";
  if (normalized.includes("화학") || normalized.includes("정유") || normalized.includes("에너지")) return "⛽";
  if (normalized.includes("기계") || normalized.includes("중장비") || normalized.includes("건설")) return "🏗️";

  if (normalized.includes("제약") || normalized.includes("바이오") || normalized.includes("백신")) return "🧪";
  if (normalized.includes("헬스케어") || normalized.includes("의료기기") || normalized.includes("디지털헬스")) return "🏥";
  if (normalized.includes("유전자") || normalized.includes("항암")) return "🧬";

  if (normalized.includes("은행") || normalized.includes("금융") || normalized.includes("지주")) return "🏦";
  if (normalized.includes("증권") || normalized.includes("투자") || normalized.includes("보험")) return "📉";
  if (normalized.includes("엔터") || normalized.includes("음반") || normalized.includes("드라마") || normalized.includes("미디어")) return "🎬";
  if (normalized.includes("게임") || normalized.includes("e스포츠")) return "🎮";
  if (normalized.includes("유통") || normalized.includes("면세") || normalized.includes("백화점")) return "🛍️";
  if (normalized.includes("식품") || normalized.includes("음식료") || normalized.includes("주류")) return "🥫";
  if (normalized.includes("자동차") || normalized.includes("완성차") || normalized.includes("부품")) return "🚗";
  if (normalized.includes("조선") || normalized.includes("해운") || normalized.includes("운송")) return "🚢";
  if (normalized.includes("항공") || normalized.includes("여행") || normalized.includes("숙박")) return "✈️";

  return "📊";
}
