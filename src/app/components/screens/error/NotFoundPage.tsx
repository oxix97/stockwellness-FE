import { useNavigate } from "react-router";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/app/components/ui";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background">
      <div className="p-5 mb-8 rounded-full bg-primary/10 transition-transform hover:scale-105">
        <AlertCircle className="w-14 h-14 text-primary" />
      </div>
      <h1 className="text-3xl font-extrabold mb-3 tracking-tight text-foreground">
        404
      </h1>
      <p className="text-xl font-bold mb-4 text-foreground/90">
        페이지를 찾을 수 없습니다
      </p>
      <p className="text-muted-foreground mb-12 max-w-[280px] leading-relaxed">
        요청하신 페이지가 존재하지 않거나,<br />
        삭제되어 찾을 수 없습니다.
      </p>
      <Button 
        onClick={() => navigate("/")} 
        size="lg"
        className="gap-2.5 px-10 h-14 rounded-2xl font-bold shadow-lg shadow-primary/20"
      >
        <Home className="w-5 h-5" />
        홈으로 돌아가기
      </Button>
    </div>
  );
}
