import { create } from "zustand";
import { persist } from "zustand/middleware";

export type InvestmentSelection =
  | { type: "ACTUAL"; id: number }
  | { type: "SIMULATION"; id: string };

type SelectionState = {
  byMember: Record<string, InvestmentSelection | undefined>;
  select: (memberId: number, selection: InvestmentSelection | null) => void;
};

export const useInvestmentSelection = create<SelectionState>()(persist(
  (set) => ({
    byMember: {},
    select: (memberId, selection) => set((state) => {
      const byMember = { ...state.byMember };
      if (selection) byMember[String(memberId)] = selection;
      else delete byMember[String(memberId)];
      return { byMember };
    }),
  }),
  {
    name: "investment-selection-storage",
    partialize: (state) => ({ byMember: state.byMember }) as SelectionState,
  },
));
