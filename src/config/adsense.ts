export const ADSENSE_CONFIG = {
  clientId: "ca-pub-XXXXXXXXXXXX", // 실제 연동 시 발급받은 ID로 교체 필요
  slots: {
    homeInFeed: "1111111111",
    searchInFeed: "2222222222",
    detailInArticle: "3333333333"
  },
  isDevelopment: import.meta.env.DEV
};
