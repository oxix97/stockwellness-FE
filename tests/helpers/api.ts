import axios, { AxiosInstance } from 'axios';
import { readAuthState } from './auth';

/** 매 호출마다 최신 accessToken으로 클라이언트를 생성한다 */
function createClient(): AxiosInstance {
  const { accessToken, backendUrl } = readAuthState();
  return axios.create({
    baseURL: `${backendUrl}/api`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

interface PortfolioItemBody {
  symbol: string;
  quantity: number;
  purchasePrice: number;
  currency: string;
  assetType: 'STOCK' | 'CASH';
  targetWeight: number;
}

interface CreatePortfolioBody {
  name: string;
  description: string;
  items: PortfolioItemBody[];
}

/**
 * Playwright 테스트에서 직접 백엔드 API를 호출하기 위한 헬퍼.
 * 브라우저 컨텍스트 바깥(Node.js)에서 실행된다.
 */
export const testApi = {
  portfolio: {
    /** 포트폴리오 단건 조회 */
    get: async (id: number | string): Promise<any> => {
      const res = await createClient().get(`/v1/portfolios/${id}`);
      return res.data?.data ?? res.data;
    },

    /** 포트폴리오 수정 (종목 교체) */
    update: async (id: number | string, body: CreatePortfolioBody): Promise<void> => {
      await createClient().put(`/v1/portfolios/${id}`, body);
    },
  },
};
