import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, '.auth.env');
const AUTH_STATE_PATH = path.resolve(__dirname, '.auth-state.json');

/** tests/.auth.env 파일을 process.env에 병합 (이미 설정된 값은 덮어쓰지 않음) */
function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}

/** JWT payload를 디코딩해 만료 시각(Unix seconds)을 반환 */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    return decoded.exp ?? null;
  } catch {
    return null;
  }
}

/** 5분 여유를 두고 토큰 유효 여부 판단 */
function isTokenValid(token: string): boolean {
  const exp = getTokenExpiry(token);
  if (!exp) return false;
  return Date.now() / 1000 < exp - 300;
}

/** .auth.env 의 특정 키 값을 교체 */
function updateEnvValue(key: string, value: string): void {
  if (!fs.existsSync(ENV_PATH)) return;
  const updated = fs.readFileSync(ENV_PATH, 'utf-8').replace(
    new RegExp(`^${key}=.*`, 'm'),
    `${key}=${value}`
  );
  fs.writeFileSync(ENV_PATH, updated, 'utf-8');
}

export default async function globalSetup() {
  loadEnvFile(ENV_PATH);

  const backendUrl = process.env.TEST_BACKEND_URL ?? 'http://localhost:8080';
  let accessToken = process.env.TEST_ACCESS_TOKEN ?? '';
  let refreshToken = process.env.TEST_REFRESH_TOKEN ?? '';

  // ── 토큰 준비 ───────────────────────────────────────────────────────────
  if (isTokenValid(accessToken)) {
    // accessToken 이 아직 유효하면 reissue 생략 (RT 소진 방지)
    console.log('[global-setup] accessToken 유효 — 재발급 생략');
  } else {
    // accessToken 만료 or 없음 → refreshToken 으로 재발급
    if (!refreshToken) {
      throw new Error(
        '\n[E2E 설정 오류] TEST_ACCESS_TOKEN 이 만료되었고 TEST_REFRESH_TOKEN 도 없습니다.\n' +
          'tests/.auth.env.example 을 참고해 앱에 로그인한 뒤\n' +
          'accessToken 과 refreshToken 을 모두 채워주세요.\n'
      );
    }

    console.log(`[global-setup] accessToken 만료 — 재발급 중... (${backendUrl})`);
    try {
      const res = await axios.post(
        `${backendUrl}/api/v1/auth/reissue`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const payload = res.data?.data ?? res.data;
      accessToken = payload.accessToken;
      const newRefreshToken: string = payload.refreshToken;

      // 새 토큰을 .auth.env 에 자동 저장 (다음 실행 때 재사용)
      updateEnvValue('TEST_ACCESS_TOKEN', accessToken);
      updateEnvValue('TEST_REFRESH_TOKEN', newRefreshToken);
      console.log('[global-setup] 재발급 완료 — .auth.env 갱신');
    } catch (err: any) {
      const status = err?.response?.status ?? err?.message;
      throw new Error(
        `[global-setup] 토큰 재발급 실패 (${status})\n` +
          `- 백엔드가 실행 중인지 확인: ${backendUrl}\n` +
          '- refreshToken 이 만료된 경우 앱에서 다시 로그인 후 두 토큰을 모두 갱신하세요.'
      );
    }
  }

  const authState: Record<string, any> = {
    accessToken,
    refreshToken: process.env.TEST_REFRESH_TOKEN ?? '',
    memberId: Number(process.env.TEST_MEMBER_ID ?? 1),
    email: process.env.TEST_EMAIL ?? '',
    nickname: process.env.TEST_NICKNAME ?? '테스터',
    portfolioId: process.env.TEST_PORTFOLIO_ID ?? null,
    backendUrl,
  };

  // ── 포트폴리오 종목 세팅 ─────────────────────────────────────────────────
  // 백엔드가 사용자당 포트폴리오 1개만 허용하므로 기존 포트폴리오에 종목을 채운다.
  // teardown 에서 원상복구하기 위해 원본 상태를 함께 저장한다.
  const portfolioId = authState.portfolioId;
  if (portfolioId) {
    try {
      const currentRes = await axios.get(
        `${backendUrl}/api/v1/portfolios/${portfolioId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const current = currentRes.data?.data ?? currentRes.data;

      authState.originalPortfolioItems = current?.items ?? [];
      authState.portfolioName = current?.name ?? '내 포트폴리오';
      authState.portfolioDescription = current?.description ?? '';

      await axios.put(
        `${backendUrl}/api/v1/portfolios/${portfolioId}`,
        {
          name: authState.portfolioName,
          description: authState.portfolioDescription,
          items: [
            { symbol: '005930', quantity: 10, purchasePrice: 70000, currency: 'KRW', assetType: 'STOCK', targetWeight: 60 },
            { symbol: '000660', quantity: 5,  purchasePrice: 130000, currency: 'KRW', assetType: 'STOCK', targetWeight: 40 },
          ],
        },
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
      );
      console.log(`[global-setup] 포트폴리오 ${portfolioId} 종목 세팅 완료 (원본 ${authState.originalPortfolioItems.length}개 → 테스트 2개)`);
    } catch (err: any) {
      console.warn(`[global-setup] 포트폴리오 종목 세팅 실패 (무시): ${err?.message}`);
    }
  }

  fs.writeFileSync(AUTH_STATE_PATH, JSON.stringify(authState, null, 2));
  console.log(`[global-setup] 완료 — memberId: ${authState.memberId}, portfolioId: ${authState.portfolioId}`);
}
