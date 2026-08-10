import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_STATE_PATH = path.resolve(__dirname, '.auth-state.json');

const REQUIRED_ENVIRONMENT = {
  RUN_REAL_API_E2E: '1',
} as const;

const REQUIRED_VALUES = [
  'E2E_DEDICATED_MEMBER_ID',
  'E2E_ISOLATED_DATABASE_ID',
  'TEST_BACKEND_URL',
  'TEST_ACCESS_TOKEN',
] as const;

const ATTESTATION_KEYS = ['databaseId', 'isolated', 'memberId'] as const;

export interface RealApiEnvironment {
  accessToken: string;
  backendUrl: string;
  expectedDatabaseId: string;
  expectedMemberId: number;
}

interface IsolationAttestation {
  databaseId: string;
  isolated: true;
  memberId: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function assertRealApiEnvironment(): RealApiEnvironment {
  const invalidFlags = Object.entries(REQUIRED_ENVIRONMENT)
    .filter(([key, expected]) => process.env[key] !== expected)
    .map(([key, expected]) => key + '=' + expected);
  const missingValues = REQUIRED_VALUES.filter((key) => !process.env[key]?.trim());
  const invalid = [...invalidFlags, ...missingValues];

  if (invalid.length > 0) {
    throw new Error(
      '[Real API E2E 차단] 전용 테스트 member와 격리 DB 설정이 필요합니다: ' +
        invalid.join(', ')
    );
  }

  const expectedMemberId = Number(process.env.E2E_DEDICATED_MEMBER_ID);
  if (!Number.isSafeInteger(expectedMemberId) || expectedMemberId <= 0) {
    throw new Error(
      '[Real API E2E 차단] E2E_DEDICATED_MEMBER_ID는 안전한 양의 정수여야 합니다.'
    );
  }

  return {
    accessToken: process.env.TEST_ACCESS_TOKEN!.trim(),
    backendUrl: process.env.TEST_BACKEND_URL!.trim().replace(/\/+$/, ''),
    expectedDatabaseId: process.env.E2E_ISOLATED_DATABASE_ID!.trim(),
    expectedMemberId,
  };
}

function extractAttestation(responseBody: unknown): IsolationAttestation {
  if (!isRecord(responseBody) || !isRecord(responseBody.data)) {
    throw new Error(
      '[Real API E2E attestation] 서버 응답 계약이 일치하지 않습니다.'
    );
  }

  const payload = responseBody.data;
  const responseKeys = Object.keys(payload).sort();
  if (
    responseKeys.length !== ATTESTATION_KEYS.length ||
    responseKeys.some((key, index) => key !== ATTESTATION_KEYS[index])
  ) {
    throw new Error(
      '[Real API E2E attestation] 서버 응답 계약이 일치하지 않습니다.'
    );
  }

  if (
    !Number.isSafeInteger(payload.memberId) ||
    Number(payload.memberId) <= 0 ||
    typeof payload.databaseId !== 'string' ||
    payload.isolated !== true
  ) {
    throw new Error(
      '[Real API E2E attestation] 서버 응답 계약이 일치하지 않습니다.'
    );
  }

  return {
    memberId: Number(payload.memberId),
    databaseId: payload.databaseId,
    isolated: true,
  };
}

export async function attestRealApiIsolation(
  environment: RealApiEnvironment
): Promise<void> {
  let responseBody: unknown;
  try {
    const response = await axios.post(
      environment.backendUrl + '/api/v1/test-support/attestation',
      { expectedDatabaseId: environment.expectedDatabaseId },
      {
        headers: {
          Authorization: 'Bearer ' + environment.accessToken,
          'Content-Type': 'application/json',
        },
      }
    );
    responseBody = response.data;
  } catch (error: unknown) {
    const reason = axios.isAxiosError(error)
      ? error.response?.status ?? error.code ?? 'unknown'
      : 'unknown';
    if (reason === 404) {
      throw new Error(
        '[Real API E2E attestation] backend profile이 test/e2e가 아니거나 endpoint가 없습니다 (404).'
      );
    }
    throw new Error(
      '[Real API E2E attestation] 인증 또는 격리 정책 검증에 실패했습니다 (' +
        reason +
        ').'
    );
  }

  const attestation = extractAttestation(responseBody);
  if (
    attestation.memberId !== environment.expectedMemberId ||
    attestation.databaseId !== environment.expectedDatabaseId ||
    attestation.isolated !== true
  ) {
    throw new Error(
      '[Real API E2E attestation] 전용 member 또는 격리 DB 검증이 일치하지 않습니다.'
    );
  }
}

function extractPortfolioId(responseBody: unknown): number {
  const body = responseBody as {
    data?: number | { id?: number; portfolioId?: number };
    id?: number;
    portfolioId?: number;
  };
  const payload = body.data ?? body;
  const candidate = typeof payload === 'number'
    ? payload
    : payload.portfolioId ?? payload.id;

  if (!Number.isInteger(candidate) || Number(candidate) <= 0) {
    throw new Error('[global-setup] 생성된 테스트 포트폴리오 ID가 유효하지 않습니다.');
  }

  return Number(candidate);
}

export default async function globalSetup(): Promise<void> {
  const environment = assertRealApiEnvironment();

  if (fs.existsSync(AUTH_STATE_PATH)) {
    throw new Error(
      '[global-setup] 이전 테스트 정리 상태가 남아 있습니다. 상태를 확인하고 정리한 뒤 다시 실행하세요.'
    );
  }

  await attestRealApiIsolation(environment);

  let response;
  try {
    response = await axios.post(
      environment.backendUrl + '/api/v1/portfolios',
      {
        name: 'isolated-e2e-' + Date.now(),
        description: '격리된 Real API E2E 실행에서 생성한 임시 포트폴리오',
        items: [],
      },
      {
        headers: {
          Authorization: 'Bearer ' + environment.accessToken,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: unknown) {
    const reason = axios.isAxiosError(error)
      ? error.response?.status ?? error.code ?? 'unknown'
      : 'unknown';
    throw new Error(
      '[global-setup] 격리 테스트 포트폴리오 생성에 실패했습니다 (' +
        reason +
        ').'
    );
  }

  const createdPortfolioId = extractPortfolioId(response.data);
  fs.writeFileSync(
    AUTH_STATE_PATH,
    JSON.stringify({ createdPortfolioId }),
    { encoding: 'utf-8', mode: 0o600 }
  );
}
