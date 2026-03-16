import { AxiosError } from "axios";

export const apiErrorHandler = (error: AxiosError) => {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data as any;

    switch (status) {
      case 400:
        return data.message || "잘못된 요청입니다.";
      case 401:
        return "인증이 필요합니다. 다시 로그인해주세요.";
      case 403:
        return "권한이 없습니다.";
      case 404:
        return "요청하신 리소스를 찾을 수 없습니다.";
      case 500:
        return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      default:
        return data.message || "알 수 없는 오류가 발생했습니다.";
    }
  } else if (error.request) {
    return "서버와 연결할 수 없습니다. 네트워크 상태를 확인해주세요.";
  } else {
    return error.message;
  }
};
