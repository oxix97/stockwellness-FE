import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertRealApiEnvironment,
  attestRealApiIsolation,
} from './global-setup';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_STATE_PATH = path.resolve(__dirname, '.auth-state.json');

interface RealApiState {
  createdPortfolioId: number;
}

export default async function globalTeardown(): Promise<void> {
  if (!fs.existsSync(AUTH_STATE_PATH)) return;

  const state = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, 'utf-8')) as RealApiState;
  const environment = assertRealApiEnvironment();

  if (
    !Number.isInteger(state.createdPortfolioId) ||
    state.createdPortfolioId <= 0
  ) {
    throw new Error(
      '[global-teardown] 격리 테스트 정리 설정이 불완전합니다. 복구를 위해 상태 파일을 보존합니다.'
    );
  }

  await attestRealApiIsolation(environment);

  try {
    await axios.delete(
      environment.backendUrl + '/api/v1/portfolios/' + state.createdPortfolioId,
      { headers: { Authorization: 'Bearer ' + environment.accessToken } }
    );
  } catch (error: unknown) {
    const reason = axios.isAxiosError(error)
      ? error.response?.status ?? error.code ?? 'unknown'
      : 'unknown';
    throw new Error(
      `[global-teardown] 테스트 포트폴리오 정리에 실패했습니다 (${reason}). 복구를 위해 상태 파일을 보존합니다.`
    );
  }

  fs.unlinkSync(AUTH_STATE_PATH);
}
