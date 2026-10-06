import type { operations } from "@/types/actual-schema";

type JsonContent<Content> = Content extends { "application/json": infer Body } ? Body : never;

type OperationRequest<Operation> = Operation extends {
  requestBody: { content: infer Content };
}
  ? JsonContent<Content>
  : never;

type OperationResponseData<Operation, Status extends number> = Operation extends {
  responses: infer Responses;
}
  ? Status extends keyof Responses
    ? Responses[Status] extends { content: infer Content }
      ? JsonContent<Content> extends { data: infer Data }
        ? Data
        : never
      : never
    : never
  : never;

export type Account = OperationResponseData<operations["getActualAccount"], 200>;
export type AccountList = OperationResponseData<operations["listActualAccounts"], 200>;
export type AccountCreate = OperationRequest<operations["createActualAccount"]>;
export type AccountRename = OperationRequest<operations["renameActualAccount"]>;
