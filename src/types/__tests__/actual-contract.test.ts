import { describe, expectTypeOf, it } from "vitest";
import type { operations, paths } from "@/types/actual-schema";
import type { Account, AccountCreate, AccountList, AccountRename } from "@/types/actual";
import type { PortfolioResponse } from "@/types/api";

describe("frozen actual account contract", () => {
  it("exposes all four account operations without replacing the simulation schema", () => {
    expectTypeOf<paths["/investment-accounts"]["get"]>().toMatchTypeOf<operations["listActualAccounts"]>();
    expectTypeOf<paths["/investment-accounts/{accountId}"]["get"]>().toMatchTypeOf<operations["getActualAccount"]>();
    expectTypeOf<paths["/investment-accounts"]["post"]>().toMatchTypeOf<operations["createActualAccount"]>();
    expectTypeOf<paths["/investment-accounts/{accountId}"]["patch"]>().toMatchTypeOf<operations["renameActualAccount"]>();
    expectTypeOf<PortfolioResponse>().toHaveProperty("items");
  });

  it("keeps account fields, KRW, and request shapes from the frozen contract", () => {
    expectTypeOf<Account>().toHaveProperty("accountType").toEqualTypeOf<"ACTUAL">();
    expectTypeOf<Account>().toHaveProperty("baseCurrency").toEqualTypeOf<"KRW">();
    expectTypeOf<Account>().toHaveProperty("brokerLabel").toEqualTypeOf<string | null>();
    expectTypeOf<AccountList>().toEqualTypeOf<Account[]>();
    expectTypeOf<AccountCreate>().toMatchTypeOf<{
      name: string;
      baseCurrency: "KRW";
      brokerLabel?: string | null;
    }>();
    expectTypeOf<AccountRename>().toEqualTypeOf<{ name: string }>();
  });
});
