import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import globalSetup from '../../tests/global-setup';
import globalTeardown from '../../tests/global-teardown';

const mocks = vi.hoisted(() => ({
  delete: vi.fn(),
  existsSync: vi.fn(),
  isAxiosError: vi.fn(),
  post: vi.fn(),
  readFileSync: vi.fn(),
  unlinkSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock('node:fs', () => ({
  default: {
    existsSync: mocks.existsSync,
    readFileSync: mocks.readFileSync,
    unlinkSync: mocks.unlinkSync,
    writeFileSync: mocks.writeFileSync,
  },
}));

vi.mock('axios', () => ({
  default: {
    delete: mocks.delete,
    isAxiosError: mocks.isAxiosError,
    post: mocks.post,
  },
}));

const BACKEND_URL = 'http://127.0.0.1:9';
const ACCESS_TOKEN = 'sensitive-test-token';
const EXPECTED_MEMBER_ID = 41;
const EXPECTED_DATABASE_ID = 'isolated-e2e-database';

function attestationResponse(
  overrides: Record<string, unknown> = {}
): { data: { data: Record<string, unknown> } } {
  return {
    data: {
      data: {
        memberId: EXPECTED_MEMBER_ID,
        databaseId: EXPECTED_DATABASE_ID,
        isolated: true,
        ...overrides,
      },
    },
  };
}

function mockSuccessfulPosts(
  attestation = attestationResponse()
): void {
  mocks.post.mockImplementation((url: string) => {
    if (url.endsWith('/api/v1/test-support/attestation')) {
      return Promise.resolve(attestation);
    }
    if (url.endsWith('/api/v1/portfolios')) {
      return Promise.resolve({ data: { data: 101 } });
    }
    return Promise.reject(new Error('unexpected URL: ' + url));
  });
}

function configureValidRealApiEnvironment(): void {
  vi.clearAllMocks();
  vi.stubEnv('RUN_REAL_API_E2E', '1');
  vi.stubEnv('E2E_DEDICATED_MEMBER_ID', String(EXPECTED_MEMBER_ID));
  vi.stubEnv('E2E_ISOLATED_DATABASE_ID', EXPECTED_DATABASE_ID);
  vi.stubEnv('TEST_BACKEND_URL', BACKEND_URL);
  vi.stubEnv('TEST_ACCESS_TOKEN', ACCESS_TOKEN);
  vi.stubEnv('TEST_ACCOUNT_IS_DEDICATED', undefined);
  vi.stubEnv('TEST_DATABASE_IS_ISOLATED', undefined);
  vi.stubEnv('TEST_ACCOUNT_ID', undefined);
  mocks.existsSync.mockReturnValue(false);
  mocks.readFileSync.mockReturnValue(JSON.stringify({ createdPortfolioId: 101 }));
  mocks.delete.mockResolvedValue({ status: 204 });
  mockSuccessfulPosts();
}

describe('isolated Real API global setup security', () => {
  beforeEach(() => {
    configureValidRealApiEnvironment();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    'RUN_REAL_API_E2E',
    'E2E_DEDICATED_MEMBER_ID',
    'E2E_ISOLATED_DATABASE_ID',
    'TEST_BACKEND_URL',
    'TEST_ACCESS_TOKEN',
  ])('%s가 없으면 네트워크 요청 전에 중단한다', async (key) => {
    vi.stubEnv(key, '');

    await expect(globalSetup()).rejects.toThrow(key);
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it.each(['0', '-1', 'not-a-number', '1.5', '9007199254740992'])(
    '전용 member ID가 안전한 양의 정수가 아니면 중단한다: %s',
    async (memberId) => {
      vi.stubEnv('E2E_DEDICATED_MEMBER_ID', memberId);

      await expect(globalSetup()).rejects.toThrow('E2E_DEDICATED_MEMBER_ID');
      expect(mocks.post).not.toHaveBeenCalled();
    }
  );

  it('기존 cleanup state가 있으면 POST 전에 중단한다', async () => {
    mocks.existsSync.mockReturnValue(true);

    await expect(globalSetup()).rejects.toThrow('이전 테스트 정리 상태가 남아 있습니다');
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it('서버 attestation을 먼저 검증한 뒤에만 포트폴리오를 생성한다', async () => {
    await globalSetup();

    expect(mocks.post).toHaveBeenNthCalledWith(
      1,
      BACKEND_URL + '/api/v1/test-support/attestation',
      { expectedDatabaseId: EXPECTED_DATABASE_ID },
      {
        headers: {
          Authorization: 'Bearer ' + ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );
    expect(mocks.post).toHaveBeenNthCalledWith(
      2,
      BACKEND_URL + '/api/v1/portfolios',
      expect.any(Object),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer ' + ACCESS_TOKEN,
        }),
      })
    );
    expect(mocks.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify({ createdPortfolioId: 101 }),
      { encoding: 'utf-8', mode: 0o600 }
    );
  });

  it.each([
    [401, '401'],
    [403, '403'],
  ])('attestation %s이면 portfolio POST 전에 중단한다', async (status, expected) => {
    mocks.isAxiosError.mockReturnValue(true);
    mocks.post.mockRejectedValueOnce({ response: { status } });

    await expect(globalSetup()).rejects.toThrow(expected);
    expect(mocks.post).toHaveBeenCalledTimes(1);
    expect(mocks.post).toHaveBeenCalledWith(
      BACKEND_URL + '/api/v1/test-support/attestation',
      expect.any(Object),
      expect.any(Object)
    );
    expect(mocks.writeFileSync).not.toHaveBeenCalled();
  });

  it('attestation endpoint가 404이면 backend profile 불일치로 중단한다', async () => {
    mocks.isAxiosError.mockReturnValue(true);
    mocks.post.mockRejectedValueOnce({ response: { status: 404 } });

    await expect(globalSetup()).rejects.toThrow('profile');
    expect(mocks.post).toHaveBeenCalledTimes(1);
    expect(mocks.writeFileSync).not.toHaveBeenCalled();
  });

  it.each([
    ['member ID', attestationResponse({ memberId: EXPECTED_MEMBER_ID + 1 })],
    ['database ID', attestationResponse({ databaseId: 'wrong-database' })],
    ['isolated flag', attestationResponse({ isolated: false })],
    ['exact payload', attestationResponse({ accessToken: 'must-not-be-returned' })],
  ])('attestation %s 불일치이면 portfolio POST 전에 중단한다', async (_case, response) => {
    mockSuccessfulPosts(response);

    await expect(globalSetup()).rejects.toThrow('attestation');
    expect(mocks.post).toHaveBeenCalledTimes(1);
    expect(mocks.writeFileSync).not.toHaveBeenCalled();
  });

  it('Axios 생성 실패에서 config, header, token을 노출하지 않는다', async () => {
    mocks.isAxiosError.mockReturnValue(true);
    mocks.post.mockImplementation((url: string) => {
      if (url.endsWith('/api/v1/test-support/attestation')) {
        return Promise.resolve(attestationResponse());
      }
      return Promise.reject({
        response: { status: 503 },
        config: {
          headers: { Authorization: 'Bearer ' + ACCESS_TOKEN },
        },
      });
    });

    const caught = await globalSetup().catch((error: unknown) => error);

    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toBe(
      '[global-setup] 격리 테스트 포트폴리오 생성에 실패했습니다 (503).'
    );
    expect(JSON.stringify(caught)).not.toContain('Authorization');
    expect(JSON.stringify(caught)).not.toContain(ACCESS_TOKEN);
  });
});

describe('isolated Real API global teardown security', () => {
  beforeEach(() => {
    configureValidRealApiEnvironment();
    mocks.existsSync.mockReturnValue(true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('서버 attestation을 다시 검증한 뒤 setup이 기록한 ID만 삭제한다', async () => {
    await globalTeardown();

    expect(mocks.post).toHaveBeenCalledWith(
      BACKEND_URL + '/api/v1/test-support/attestation',
      { expectedDatabaseId: EXPECTED_DATABASE_ID },
      expect.any(Object)
    );
    expect(mocks.post.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.delete.mock.invocationCallOrder[0]
    );
    expect(mocks.delete).toHaveBeenCalledWith(
      BACKEND_URL + '/api/v1/portfolios/101',
      { headers: { Authorization: 'Bearer ' + ACCESS_TOKEN } }
    );
    expect(mocks.unlinkSync).toHaveBeenCalledTimes(1);
  });

  it('teardown attestation이 거부되면 DELETE하지 않고 state를 보존한다', async () => {
    mocks.isAxiosError.mockReturnValue(true);
    mocks.post.mockRejectedValueOnce({ response: { status: 403 } });

    await expect(globalTeardown()).rejects.toThrow('403');
    expect(mocks.delete).not.toHaveBeenCalled();
    expect(mocks.unlinkSync).not.toHaveBeenCalled();
  });

  it('DELETE 실패 시 token을 노출하지 않고 state를 보존한다', async () => {
    mocks.isAxiosError.mockReturnValue(true);
    mocks.delete.mockRejectedValue({
      response: { status: 503 },
      config: {
        headers: { Authorization: 'Bearer ' + ACCESS_TOKEN },
      },
    });

    const caught = await globalTeardown().catch((error: unknown) => error);

    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toBe(
      '[global-teardown] 테스트 포트폴리오 정리에 실패했습니다 (503). 복구를 위해 상태 파일을 보존합니다.'
    );
    expect(JSON.stringify(caught)).not.toContain('Authorization');
    expect(JSON.stringify(caught)).not.toContain(ACCESS_TOKEN);
    expect(mocks.unlinkSync).not.toHaveBeenCalled();
  });
});
