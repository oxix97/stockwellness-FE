import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
} from "@/app/components/ui/drawer";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Trash2, AlertCircle, Search, X } from "lucide-react";
import { usePortfolioDetails, useUpdatePortfolio } from "@/hooks/use-portfolio";
import { useSearch } from "@/hooks/use-search";
import { CreatePortfolioItemRequest, StockSearchResult } from "@/types/api";
import { toast } from "sonner";
import { DrawerSheetHeader } from "@/app/components/shared/DrawerSheetHeader";

interface PortfolioEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PortfolioEditSheet({ isOpen, onClose }: PortfolioEditSheetProps) {
  const { data: portfolio } = usePortfolioDetails();
  const updateMutation = useUpdatePortfolio();
  const { keyword, setKeyword, autocomplete } = useSearch();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<CreatePortfolioItemRequest[]>([]);

  useEffect(() => {
    if (portfolio) {
      setName(portfolio.name);
      setDescription(portfolio.description || "");
      setItems(
        portfolio.items.map((item) => ({
          symbol: item.symbol,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
          currency: item.currency,
          assetType: item.assetType,
          targetWeight: item.targetWeight,
        }))
      );
    }
  }, [portfolio]);

  const totalWeight = items.reduce((sum, item) => sum + item.targetWeight, 0);
  const isWeightValid = Math.abs(totalWeight - 100) < 0.1 || items.length === 0;

  const handleUpdateItem = <TField extends keyof CreatePortfolioItemRequest>(
    index: number,
    field: TField,
    value: CreatePortfolioItemRequest[TField],
  ) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleAddItem = (stock: StockSearchResult) => {
    if (items.some((item) => item.symbol === stock.ticker)) {
      toast.error("이미 추가된 종목입니다.");
      return;
    }

    if (stock.marketType !== "KOSPI" && stock.marketType !== "KOSDAQ") {
      toast.info("환율 지원 전에는 포트폴리오에 담을 수 없습니다");
      return;
    }

    const newItem: CreatePortfolioItemRequest = {
      symbol: stock.ticker,
      quantity: 0,
      purchasePrice: 0,
      currency: stock.marketType === "KOSPI" || stock.marketType === "KOSDAQ" ? "KRW" : "USD",
      assetType: "STOCK",
      targetWeight: 0,
    };

    setItems([...items, newItem]);
    setKeyword("");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!isWeightValid) {
      toast.error("비중의 합계가 100%여야 합니다.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        name,
        description,
        items,
      });
      toast.success("포트폴리오가 수정되었습니다.");
      onClose();
    } catch {
      toast.error("수정 중 오류가 발생했습니다.");
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerSheetHeader title="포트폴리오 편집" />

        <div className="overflow-y-auto p-5 space-y-6 scrollbar-hide">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="portfolio-name">포트폴리오 이름</Label>
              <Input
                id="portfolio-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="내 포트폴리오 이름"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio-desc">설명</Label>
              <Input
                id="portfolio-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="포트폴리오에 대한 간단한 설명"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold">종목 및 목표 비중</Label>
              <div className={`text-xs font-bold px-2 py-1 rounded-full ${isWeightValid ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                합계: {totalWeight.toFixed(1)}%
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.symbol} className="flex flex-col gap-3 p-3 rounded-lg border bg-card">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{item.symbol}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{item.assetType}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">목표 비중</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={item.targetWeight}
                          onChange={(e) => handleUpdateItem(index, "targetWeight", Number(e.target.value))}
                          className="h-8 text-right text-xs pr-5"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">보유 수량</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(index, "quantity", Number(e.target.value))}
                          className="h-8 text-right text-xs pr-5"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">주</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">평단가</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={item.purchasePrice}
                          onChange={(e) => handleUpdateItem(index, "purchasePrice", Number(e.target.value))}
                          className="h-8 text-right text-xs pr-5"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                          {item.currency === "KRW" ? "원" : "$"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="relative pt-2">
                <div className="relative">
                  <Input
                    placeholder="추가할 종목 검색 (티커/이름)"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="pl-9 h-11 text-sm"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  {keyword && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setKeyword("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {keyword.length >= 2 && autocomplete.data && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {autocomplete.data.pages[0].content.map((stock) => (
                      <button
                        key={stock.ticker}
                        type="button"
                        className="w-full flex items-center justify-between p-3 hover:bg-accent text-left border-b last:border-0"
                        onClick={() => handleAddItem(stock)}
                      >
                        <div>
                          <p className="text-sm font-bold">{stock.ticker}</p>
                          <p className="text-xs text-muted-foreground">{stock.name}</p>
                        </div>
                        <p className="text-[10px] px-1.5 py-0.5 rounded bg-muted uppercase font-medium">
                          {stock.marketType}
                        </p>
                      </button>
                    ))}
                    {autocomplete.data.pages[0].content.length === 0 && (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        검색 결과가 없습니다.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {!isWeightValid && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>비중의 합계가 100%가 되도록 조정해주세요. 현재 {totalWeight.toFixed(1)}%입니다.</p>
            </div>
          )}
        </div>

        <DrawerFooter className="border-t bg-background p-4">
          <Button 
            className="w-full h-12 text-base font-bold" 
            onClick={handleSave}
            disabled={!isWeightValid || updateMutation.isPending}
          >
            {updateMutation.isPending ? "저장 중..." : "변경 사항 저장"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
