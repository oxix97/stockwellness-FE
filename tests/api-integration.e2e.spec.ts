import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertRealApiEnvironment } from './global-setup';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_STATE_PATH = path.resolve(__dirname, '.auth-state.json');

interface RealApiState {
  createdPortfolioId: number;
}

function readCreatedPortfolioId(): number {
  const state = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, 'utf-8')) as RealApiState;
  if (!Number.isInteger(state.createdPortfolioId)) {
    throw new Error('격리 테스트가 생성한 포트폴리오 ID를 찾을 수 없습니다.');
  }
  return state.createdPortfolioId;
}

test.describe('Isolated Real API Integration Tests', () => {
  test.beforeAll(() => {
    assertRealApiEnvironment();
  });

  test('setup이 생성한 임시 포트폴리오만 조회한다', async ({ request }) => {
    const createdPortfolioId = readCreatedPortfolioId();
    const response = await request.get(
      `${process.env.TEST_BACKEND_URL}/api/v1/portfolios/${createdPortfolioId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TEST_ACCESS_TOKEN}`,
        },
      }
    );

    expect(response.ok()).toBe(true);
  });
});
