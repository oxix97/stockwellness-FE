import { X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
} from "@/app/components/ui/drawer";

interface DrawerSheetHeaderProps {
  title: string;
}

export function DrawerSheetHeader({ title }: DrawerSheetHeaderProps) {
  return (
    <DrawerHeader className="relative border-b border-border pb-4">
      <DrawerTitle className="text-center text-base font-bold">
        {title}
      </DrawerTitle>
      <DrawerClose asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
        >
          <X className="h-4 w-4" />
        </Button>
      </DrawerClose>
    </DrawerHeader>
  );
}
