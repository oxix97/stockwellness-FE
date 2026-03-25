import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_STATE_PATH = path.resolve(__dirname, '.auth-state.json');

export default async function globalTeardown() {
  if (!fs.existsSync(AUTH_STATE_PATH)) return;

  try {
    const auth = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, 'utf-8'));
    const { accessToken, portfolioId, portfolioName, portfolioDescription, originalPortfolioItems, backendUrl } = auth;

    // 포트폴리오 종목을 테스트 전 상태로 복원
    if (portfolioId && accessToken && originalPortfolioItems !== undefined) {
      await axios.put(
        `${backendUrl}/api/v1/portfolios/${portfolioId}`,
        { name: portfolioName, description: portfolioDescription, items: originalPortfolioItems },
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
      );
      console.log(`[global-teardown] 포트폴리오 ${portfolioId} 원상복구 완료 (${originalPortfolioItems.length}개)`);
    }
  } catch (err: any) {
    console.warn(`[global-teardown] 포트폴리오 복구 실패 (무시): ${err?.message}`);
  }

  fs.unlinkSync(AUTH_STATE_PATH);
  console.log('[global-teardown] .auth-state.json 삭제');
}
