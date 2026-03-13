import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  /** 에러 감싸기 범위 내의 하위 요소 */
  children?: ReactNode;
}

interface State {
  /** 에러 발생 여부 상태 */
  hasError: boolean;
}

/**
 * 런타임 에러 발생 시 UI 붕괴를 방지하고 폴백 화면을 보여주는 컴포넌트
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  /** 에러 발생 시 상태를 업데이트하여 다음 렌더링에서 폴백 UI를 보여줌 */
  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  /** 에러 로깅 처리 */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // 에러 폴백 UI 렌더링
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">문제가 발생했습니다</h1>
          <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
            화면을 불러오는 중 예상치 못한 에러가 발생했습니다. 잠시 후 다시 시도해 주세요.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform"
          >
            <RotateCcw className="w-5 h-5" />
            새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
