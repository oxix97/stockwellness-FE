import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Edit2, Trash2, Check } from "lucide-react";
import { WatchlistGroup } from "@/types/api";
import { useViewportType } from "@/app/components/ui/use-mobile";

interface WatchlistBottomSheetProps {
  groups: WatchlistGroup[];
  activeGroupId: number | null;
  onSelect: (id: number) => void;
  onClose: () => void;
  onCreateGroup: (name: string) => void;
  onUpdateGroup: (id: number, name: string) => void;
  onDeleteGroup: (id: number) => void;
  isLoading?: boolean;
}

export function WatchlistBottomSheet({
  groups,
  activeGroupId,
  onSelect,
  onClose,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  isLoading,
}: WatchlistBottomSheetProps) {
  const viewport = useViewportType();
  const isDesktop = viewport === "desktop";
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = () => {
    if (newName.trim()) {
      onCreateGroup(newName.trim());
      setNewName("");
      setIsCreating(false);
    }
  };

  const handleUpdate = () => {
    if (editingId && editName.trim()) {
      onUpdateGroup(editingId, editName.trim());
      setEditingId(null);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
      />
      <motion.div
        initial={isDesktop ? { opacity: 0, scale: 0.96, y: 16 } : { y: "100%" }}
        animate={isDesktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
        exit={isDesktop ? { opacity: 0, scale: 0.96, y: 16 } : { y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`fixed bg-background shadow-xl z-50 flex flex-col ${
          isDesktop
            ? "left-1/2 top-1/2 max-h-[78vh] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-[32px] border border-border"
            : "bottom-0 left-0 right-0 max-h-[80vh] rounded-t-3xl"
        }`}
      >
        {!isDesktop && (
          <div className="flex justify-center pt-3 pb-2" onClick={onClose}>
            <div className="w-12 h-1.5 bg-muted rounded-full" />
          </div>
        )}

        <div className="px-6 pb-4 flex items-center justify-between border-b border-border">
          <h2 className="text-xl font-bold text-foreground">관심 그룹</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {isEditing ? "완료" : "편집"}
            </button>
            <button onClick={onClose} className="p-1 -mr-1 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {isLoading ? (
            <div className="py-4 text-center text-muted-foreground">로딩 중...</div>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                  activeGroupId === group.id && !isEditing
                    ? "bg-primary/10 border-primary/20"
                    : "bg-secondary hover:bg-secondary/80"
                } border border-transparent`}
                onClick={() => {
                  if (!isEditing) {
                    onSelect(group.id);
                    onClose();
                  }
                }}
              >
                {editingId === group.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 bg-background px-3 py-1.5 rounded-md text-sm outline-none border border-primary/50"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdate();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <button onClick={handleUpdate} className="p-1.5 text-primary bg-primary/10 rounded-md">
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col">
                      <span className={`font-semibold ${activeGroupId === group.id && !isEditing ? "text-primary" : "text-foreground"}`}>
                        {group.name}
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5">{group.itemCount} 종목</span>
                    </div>

                    {isEditing && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(group.id);
                            setEditName(group.name);
                          }}
                          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("그룹을 삭제하시겠습니까?")) {
                              onDeleteGroup(group.id);
                            }
                          }}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}

          <AnimatePresence>
            {isCreating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 p-4 rounded-xl bg-secondary border border-border mt-2">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="새 그룹 이름"
                    className="flex-1 bg-background px-3 py-2 rounded-md text-sm outline-none border border-transparent focus:border-primary/50"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreate();
                      if (e.key === "Escape") {
                        setIsCreating(false);
                        setNewName("");
                      }
                    }}
                  />
                  <button onClick={handleCreate} className="p-2 text-primary bg-primary/10 rounded-md font-medium text-sm whitespace-nowrap">
                    추가
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isCreating && (
          <div className="p-4 border-t border-border mt-auto">
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-transform active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" /> 새 그룹 만들기
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}
