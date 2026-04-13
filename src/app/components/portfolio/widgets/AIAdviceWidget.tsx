import { usePortfolioAdvice, useCreateAdvice } from "@/hooks/use-portfolio";
import { Skeleton } from "@/app/components/ui";
import { Sparkles, RefreshCcw, BrainCircuit } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

export function AIAdviceWidget() {
  const { data: advice, isLoading, isError } = usePortfolioAdvice();
  const createAdviceMutation = useCreateAdvice();

  const handleRefresh = async () => {
    try {
      await createAdviceMutation.mutateAsync();
      toast.success("AI 분석이 갱신되었습니다.");
    } catch {
      toast.error("AI 분석 갱신 중 오류가 발생했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-5 border border-border space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !advice) {
    return (
      <div className="bg-card rounded-2xl p-8 border border-border text-center space-y-4">
        <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
          <BrainCircuit className="h-6 w-6" />
        </div>
        <div>
          <p className="font-bold text-foreground">AI 조언을 가져올 수 없습니다.</p>
          <p className="text-xs text-muted-foreground mt-1">포트폴리오 분석을 다시 요청해보세요.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={createAdviceMutation.isPending}
          className="w-full"
        >
          {createAdviceMutation.isPending ? (
            <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2 text-primary" />
          )}
          분석 시작하기
        </Button>
      </div>
    );
  }

  const getActionStyles = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes("매수") || actionLower.includes("buy")) {
      return "bg-up/10 text-up border-up/20";
    }
    if (actionLower.includes("매도") || actionLower.includes("sell") || actionLower.includes("축소")) {
      return "bg-down/10 text-down border-down/20";
    }
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="bg-card rounded-2xl p-5 border border-border space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-lg">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-sm">AI 포트폴리오 진단</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          업데이트: {format(new Date(advice.createdAt), "yyyy.MM.dd HH:mm")}
        </span>
      </div>

      <div className="space-y-3">
        <div className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold ${getActionStyles(advice.action)}`}>
          {advice.action}
        </div>
        
        <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-muted/30 p-4 rounded-xl border border-border/50">
          {advice.content}
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs text-muted-foreground hover:text-primary h-9 gap-2 transition-colors"
        onClick={handleRefresh}
        disabled={createAdviceMutation.isPending}
      >
        <RefreshCcw className={`h-3.5 w-3.5 ${createAdviceMutation.isPending ? "animate-spin" : ""}`} />
        {createAdviceMutation.isPending ? "분석 갱신 중..." : "최신 분석 요청하기"}
      </Button>
    </div>
  );
}
