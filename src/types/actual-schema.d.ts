export interface paths {
    "/investment-accounts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** listActualAccounts — 기술 소유자 검토용 후보 */
        get: operations["listActualAccounts"];
        put?: never;
        /** createActualAccount — 기술 소유자 검토용 후보 */
        post: operations["createActualAccount"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/investment-accounts/{accountId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** getActualAccount — 기술 소유자 검토용 후보 */
        get: operations["getActualAccount"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** renameActualAccount — 기술 소유자 검토용 후보 */
        patch: operations["renameActualAccount"];
        trace?: never;
    };
    "/investment-accounts/{accountId}/ledger": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** listActualLedger — 기술 소유자 검토용 후보 */
        get: operations["listActualLedger"];
        put?: never;
        /** createActualLedgerEntry — 기술 소유자 검토용 후보 */
        post: operations["createActualLedgerEntry"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/investment-accounts/{accountId}/ledger/{entryId}/corrections": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** correctActualLedgerEntry — 기술 소유자 검토용 후보 */
        post: operations["correctActualLedgerEntry"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/investment-accounts/{accountId}/ledger/{entryId}/cancellations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** cancelActualLedgerEntry — 기술 소유자 검토용 후보 */
        post: operations["cancelActualLedgerEntry"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/investment-accounts/{accountId}/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** getActualSummary — 기술 소유자 검토용 후보 */
        get: operations["getActualSummary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/investment-accounts/{accountId}/holdings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** getActualHoldings — 기술 소유자 검토용 후보 */
        get: operations["getActualHoldings"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/comparison-targets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** listActualComparisonTargets — 기술 소유자 검토용 후보 */
        get: operations["listActualComparisonTargets"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/investment-accounts/{accountId}/comparisons": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** compareActualAccount — 기술 소유자 검토용 후보 */
        post: operations["compareActualAccount"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** @description 정수 원 입력 후보 상한 9,999,999,999,999. 비음수; 필드별 >0 조건 별도. */
        IntegerDecimal: string;
        QuantityDecimal: string;
        PositiveAmount: components["schemas"]["IntegerDecimal"] & unknown;
        PositiveQuantity: components["schemas"]["QuantityDecimal"] & unknown;
        /** @description 소수6 HALF_EVEN. 금액/비율/배수/성과지수. 정수부13자리 후보; 범위 초과 null+reason. */
        FixedDecimal: string;
        /** @enum {string} */
        Reason: "NO_HISTORY" | "ZERO_COST_BASIS" | "INSUFFICIENT_OBSERVATIONS" | "PERIOD_LESS_THAN_ONE_YEAR" | "ZERO_VARIANCE" | "NON_POSITIVE_FLOW_ADJUSTED_BASE" | "ZERO_NAV_SEGMENT_BREAK" | "MISSING_PRICE" | "MISSING_BENCHMARK" | "RECALCULATING" | "UNSUPPORTED_CORPORATE_ACTION" | "CORPORATE_ACTION_COVERAGE_UNVERIFIED" | "LEDGER_INVARIANT_VIOLATION" | "NUMERIC_RANGE_EXCEEDED" | "UNAVAILABLE_PERIOD";
        FinancialValue: {
            value: components["schemas"]["FixedDecimal"];
            reason: null;
        } | {
            value: null;
            reason: components["schemas"]["Reason"];
        };
        QuantityValue: {
            value: components["schemas"]["QuantityDecimal"];
            reason: null;
        } | {
            value: null;
            reason: components["schemas"]["Reason"];
        };
        Symbol: string;
        /** @enum {string} */
        LedgerStatus: "VALID" | "RECALCULATING" | "REVIEW_REQUIRED" | "INVALID";
        /** @enum {string} */
        ValuationStatus: "COMPLETE" | "PARTIAL" | "UNAVAILABLE";
        Issue: {
            reason: components["schemas"]["Reason"];
            symbol: components["schemas"]["Symbol"] | null;
            effectiveFrom: string | null;
            effectiveTo: string | null;
            affectedFields: string[];
        };
        ReadMeta: {
            accountId: number;
            accountVersion: number;
            ledgerVersion: number;
            calculationVersion: number | null;
            /** @constant */
            policyVersion: "ACTUAL_KRW_V1";
            /** @constant */
            currency: "KRW";
            ledgerStatus: components["schemas"]["LedgerStatus"];
            valuationStatus: components["schemas"]["ValuationStatus"];
            ledgerIssues: components["schemas"]["Issue"][];
            asOfDate: string | null;
            missingSymbols: components["schemas"]["Symbol"][];
            /** @description 시장 데이터 불변 snapshot 버전. 가격/기업행위 입력 정정 시 변경; 계산완료 요약/보유는 동일값. */
            marketDataVersion: string | null;
        };
        Account: {
            accountId: number;
            /** @constant */
            accountType: "ACTUAL";
            name: string;
            brokerLabel: string | null;
            /** @constant */
            baseCurrency: "KRW";
            accountVersion: number;
            ledgerVersion: number;
        };
        AccountCreate: {
            name: string;
            /** @constant */
            baseCurrency: "KRW";
            brokerLabel?: string | null;
        };
        AccountRename: {
            name: string;
        };
        BUYInput: {
            /** Format: date */
            occurredOn: string;
            sequence: number;
            /** @constant */
            currency: "KRW";
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "BUY";
            symbol: components["schemas"]["Symbol"];
            /** @description 동일 ticker가 여러 시장에 있을 때 필수; 유일 ticker는 생략 가능 */
            marketCode?: string;
            quantity: components["schemas"]["PositiveQuantity"];
            price: components["schemas"]["PositiveAmount"];
            fee: components["schemas"]["IntegerDecimal"];
            tax: components["schemas"]["IntegerDecimal"];
        };
        SELLInput: {
            /** Format: date */
            occurredOn: string;
            sequence: number;
            /** @constant */
            currency: "KRW";
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "SELL";
            symbol: components["schemas"]["Symbol"];
            /** @description 동일 ticker가 여러 시장에 있을 때 필수; 유일 ticker는 생략 가능 */
            marketCode?: string;
            quantity: components["schemas"]["PositiveQuantity"];
            price: components["schemas"]["PositiveAmount"];
            fee: components["schemas"]["IntegerDecimal"];
            tax: components["schemas"]["IntegerDecimal"];
        };
        DEPOSITInput: {
            /** Format: date */
            occurredOn: string;
            sequence: number;
            /** @constant */
            currency: "KRW";
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "DEPOSIT";
            amount: components["schemas"]["PositiveAmount"];
        };
        WITHDRAWInput: {
            /** Format: date */
            occurredOn: string;
            sequence: number;
            /** @constant */
            currency: "KRW";
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "WITHDRAW";
            amount: components["schemas"]["PositiveAmount"];
        };
        DIVIDENDInput: {
            /** Format: date */
            occurredOn: string;
            sequence: number;
            /** @constant */
            currency: "KRW";
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "DIVIDEND";
            symbol: components["schemas"]["Symbol"];
            /** @description 동일 ticker가 여러 시장에 있을 때 필수; 유일 ticker는 생략 가능 */
            marketCode?: string;
            grossAmount: components["schemas"]["PositiveAmount"];
            fee: components["schemas"]["IntegerDecimal"];
            tax: components["schemas"]["IntegerDecimal"];
        };
        LedgerInput: components["schemas"]["BUYInput"] | components["schemas"]["SELLInput"] | components["schemas"]["DEPOSITInput"] | components["schemas"]["WITHDRAWInput"] | components["schemas"]["DIVIDENDInput"];
        Correction: {
            reason: string;
            replacement: components["schemas"]["LedgerInput"];
        };
        Cancellation: {
            reason: string;
        };
        LedgerEntry: {
            entryId: number;
            /** @enum {string} */
            recordStatus: "ACTIVE" | "SUPERSEDED" | "CANCELLED";
            input: components["schemas"]["LedgerInput"];
            replacesEntryId: number | null;
            supersededByEntryId: number | null;
            changeReason: string | null;
            /** Format: date-time */
            createdAt: string;
            lastChangedAt: string | null;
            lastChangeType: ("CORRECTION" | "CANCELLATION") | null;
        };
        MutationReceipt: {
            accountId: number;
            accountVersion: number;
            ledgerVersion: number;
            entryId: number;
            replacementEntryId: number | null;
            ledgerStatus: components["schemas"]["LedgerStatus"];
            /** @constant */
            policyVersion: "ACTUAL_KRW_V1";
        };
        LedgerPage: {
            accountId: number;
            accountVersion: number;
            ledgerVersion: number;
            content: components["schemas"]["LedgerEntry"][];
            page: number;
            size: number;
            hasNext: boolean;
        };
        Summary: {
            meta: components["schemas"]["ReadMeta"];
            cashBalance: components["schemas"]["FinancialValue"];
            netDeposits: components["schemas"]["FinancialValue"];
            cumulativeBuyAmount: components["schemas"]["FinancialValue"];
            remainingCostBasis: components["schemas"]["FinancialValue"];
            stockMarketValue: components["schemas"]["FinancialValue"];
            netAssetValue: components["schemas"]["FinancialValue"];
            realizedPnl: components["schemas"]["FinancialValue"];
            unrealizedPnl: components["schemas"]["FinancialValue"];
            netDividendIncome: components["schemas"]["FinancialValue"];
            totalPnl: components["schemas"]["FinancialValue"];
            holdingReturnRatePct: components["schemas"]["FinancialValue"];
        };
        Holding: {
            symbol: components["schemas"]["Symbol"];
            name: string;
            quantity: components["schemas"]["QuantityValue"];
            averagePrice: components["schemas"]["FinancialValue"];
            costBasis: components["schemas"]["FinancialValue"];
            closePrice: components["schemas"]["FinancialValue"];
            marketValue: components["schemas"]["FinancialValue"];
            unrealizedPnl: components["schemas"]["FinancialValue"];
            holdingReturnRatePct: components["schemas"]["FinancialValue"];
            allocationRatePct: components["schemas"]["FinancialValue"];
            priceAsOfDate: string | null;
            /** @enum {string} */
            priceStatus: "AVAILABLE" | "MISSING" | "NOT_REQUIRED";
        };
        Holdings: {
            meta: components["schemas"]["ReadMeta"];
            cashBalance: components["schemas"]["FinancialValue"];
            cashAllocationRatePct: components["schemas"]["FinancialValue"];
            items: components["schemas"]["Holding"][];
        };
        Target: {
            /** @enum {string} */
            code: "KOSPI" | "KOSDAQ";
            name: string;
            /** @constant */
            kind: "INDEX";
            /** @constant */
            unit: "POINTS";
            /** @constant */
            comparisonCurrency: "KRW";
            /** @constant */
            returnBasis: "TOTAL_RETURN";
            /** @constant */
            costBasis: "GROSS_NO_FEES_OR_TAXES";
            /** @constant */
            dividendPolicy: "REINVESTED";
            provider: string | null;
            seriesId: string | null;
            availableFrom: string | null;
            availableTo: string | null;
            /** @enum {string} */
            status: "AVAILABLE" | "BLOCKED";
            unavailableReason: ("DATA_RIGHTS_UNVERIFIED" | "TR_DATA_UNVERIFIED" | "NO_DATA") | null;
        };
        Catalog: {
            /** @constant */
            policyVersion: "ACTUAL_KRW_V1";
            targets: components["schemas"]["Target"][];
        };
        ComparisonRequest: {
            /** @enum {string} */
            period: "1M" | "3M" | "6M" | "1Y" | "ALL";
            targets: ("KOSPI" | "KOSDAQ")[];
        };
        Range: {
            /** Format: date */
            from: string;
            /** Format: date */
            to: string;
        };
        ComparisonMetadata: {
            /** @constant */
            policyVersion: "ACTUAL_KRW_V1";
            requestedRange: components["schemas"]["Range"] | null;
            effectiveRange: components["schemas"]["Range"] | null;
            rangeAdjustmentReasons: ("ACCOUNT_HISTORY_START" | "BENCHMARK_HISTORY_START" | "SEGMENT_START" | "NO_COMMON_PERIOD")[];
            /** @constant */
            comparisonCurrency: "KRW";
            /** @constant */
            returnBasis: "TOTAL_RETURN";
            /** @constant */
            flowTimingAssumption: "BEGINNING_OF_DAY";
            /** @constant */
            annualizationTradingDays: 252;
            /** @constant */
            cagrCalendarDaysPerYear: 365;
            riskFreeRateAnnualPct: components["schemas"]["FixedDecimal"];
            /** @constant */
            accountCostBasis: "NET_OF_RECORDED_FEES_AND_TAXES";
            /** @constant */
            accountDividendPolicy: "NET_CASH_NO_AUTOMATIC_REINVESTMENT";
            /** @constant */
            benchmarkCostBasis: "GROSS_NO_FEES_OR_TAXES";
            /** @constant */
            benchmarkDividendPolicy: "REINVESTED";
            /** @constant */
            returnMethod: "ESTIMATED_DAILY_TWR";
        };
        Metrics: {
            returnRatePct: components["schemas"]["FinancialValue"];
            cagrPct: components["schemas"]["FinancialValue"];
            volatilityPct: components["schemas"]["FinancialValue"];
            mddPct: components["schemas"]["FinancialValue"];
            sharpeRatio: components["schemas"]["FinancialValue"];
        };
        Point: {
            /** Format: date */
            date: string;
            cumulativeReturnRatePct: components["schemas"]["FixedDecimal"];
        };
        Series: {
            /** @enum {string} */
            code: "ACCOUNT" | "KOSPI" | "KOSDAQ";
            /** @enum {string} */
            status: "AVAILABLE" | "UNAVAILABLE";
            reason: components["schemas"]["Reason"] | null;
            points: components["schemas"]["Point"][];
            metrics: components["schemas"]["Metrics"];
        };
        Comparison: {
            meta: components["schemas"]["ReadMeta"];
            metadata: components["schemas"]["ComparisonMetadata"];
            account: components["schemas"]["Series"];
            benchmarks: components["schemas"]["Series"][];
        };
        FieldError: {
            field: string;
            value: string;
            reason: string;
        };
        AccountEnvelope: {
            /** @constant */
            success: true;
            /** @enum {integer} */
            status: 200 | 201;
            /** @enum {string} */
            code: "S000" | "S001";
            message: string;
            data: components["schemas"]["Account"];
            timestamp: string;
            traceId?: string | null;
            errors: components["schemas"]["FieldError"][];
        };
        LedgerPageEnvelope: {
            /** @constant */
            success: true;
            /** @enum {integer} */
            status: 200 | 201;
            /** @enum {string} */
            code: "S000" | "S001";
            message: string;
            data: components["schemas"]["LedgerPage"];
            timestamp: string;
            traceId?: string | null;
            errors: components["schemas"]["FieldError"][];
        };
        MutationReceiptEnvelope: {
            /** @constant */
            success: true;
            /** @enum {integer} */
            status: 200 | 201;
            /** @enum {string} */
            code: "S000" | "S001";
            message: string;
            data: components["schemas"]["MutationReceipt"];
            timestamp: string;
            traceId?: string | null;
            errors: components["schemas"]["FieldError"][];
        };
        SummaryEnvelope: {
            /** @constant */
            success: true;
            /** @enum {integer} */
            status: 200 | 201;
            /** @enum {string} */
            code: "S000" | "S001";
            message: string;
            data: components["schemas"]["Summary"];
            timestamp: string;
            traceId?: string | null;
            errors: components["schemas"]["FieldError"][];
        };
        HoldingsEnvelope: {
            /** @constant */
            success: true;
            /** @enum {integer} */
            status: 200 | 201;
            /** @enum {string} */
            code: "S000" | "S001";
            message: string;
            data: components["schemas"]["Holdings"];
            timestamp: string;
            traceId?: string | null;
            errors: components["schemas"]["FieldError"][];
        };
        CatalogEnvelope: {
            /** @constant */
            success: true;
            /** @enum {integer} */
            status: 200 | 201;
            /** @enum {string} */
            code: "S000" | "S001";
            message: string;
            data: components["schemas"]["Catalog"];
            timestamp: string;
            traceId?: string | null;
            errors: components["schemas"]["FieldError"][];
        };
        ComparisonEnvelope: {
            /** @constant */
            success: true;
            /** @enum {integer} */
            status: 200 | 201;
            /** @enum {string} */
            code: "S000" | "S001";
            message: string;
            data: components["schemas"]["Comparison"];
            timestamp: string;
            traceId?: string | null;
            errors: components["schemas"]["FieldError"][];
        };
        AccountListEnvelope: {
            /** @constant */
            success: true;
            /** @constant */
            status: 200;
            /** @constant */
            code: "S000";
            message: string;
            data: components["schemas"]["Account"][];
            timestamp: string;
            traceId?: string | null;
            errors: components["schemas"]["FieldError"][];
        };
        ErrorEnvelope: {
            /** @constant */
            success: false;
            /** @enum {integer} */
            status: 400 | 401 | 404 | 409 | 500;
            /** @enum {string} */
            code: "G001" | "G003" | "G004" | "A001" | "A003" | "A004" | "I001" | "I002" | "I003" | "I004" | "I005" | "I006" | "I007" | "I008" | "I009";
            message: string;
            timestamp: string;
            traceId?: string | null;
            errors: components["schemas"]["FieldError"][];
            data?: null;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    listActualAccounts: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    /** @description Personal account data must not be cached */
                    "Cache-Control"?: "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountListEnvelope"];
                };
            };
            /** @description Error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    createActualAccount: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AccountCreate"];
            };
        };
        responses: {
            /** @description Success */
            201: {
                headers: {
                    /** @description Personal account data must not be cached */
                    "Cache-Control"?: "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountEnvelope"];
                };
            };
            /** @description Error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    getActualAccount: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                accountId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    /** @description Personal account data must not be cached */
                    "Cache-Control"?: "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountEnvelope"];
                };
            };
            /** @description Error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    renameActualAccount: {
        parameters: {
            query?: never;
            header: {
                /** @description quoted accountVersion optimistic concurrency token; numeric value <= 9007199254740991; weak/wildcard/list/leading zero disallowed */
                "If-Match": string;
                "Idempotency-Key": string;
            };
            path: {
                accountId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AccountRename"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    /** @description Personal account data must not be cached */
                    "Cache-Control"?: "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountEnvelope"];
                };
            };
            /** @description Error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listActualLedger: {
        parameters: {
            query?: {
                page?: number;
                size?: number;
                view?: "ACTIVE" | "ALL";
            };
            header?: never;
            path: {
                accountId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    /** @description Personal account data must not be cached */
                    "Cache-Control"?: "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LedgerPageEnvelope"];
                };
            };
            /** @description Error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    createActualLedgerEntry: {
        parameters: {
            query?: never;
            header: {
                /** @description quoted accountVersion optimistic concurrency token; numeric value <= 9007199254740991; weak/wildcard/list/leading zero disallowed */
                "If-Match": string;
                "Idempotency-Key": string;
            };
            path: {
                accountId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LedgerInput"];
            };
        };
        responses: {
            /** @description Success */
            201: {
                headers: {
                    /** @description Personal account data must not be cached */
                    "Cache-Control"?: "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MutationReceiptEnvelope"];
                };
            };
            /** @description Error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    correctActualLedgerEntry: {
        parameters: {
            query?: never;
            header: {
                /** @description quoted accountVersion optimistic concurrency token; numeric value <= 9007199254740991; weak/wildcard/list/leading zero disallowed */
                "If-Match": string;
                "Idempotency-Key": string;
            };
            path: {
                accountId: number;
                entryId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Correction"];
            };
        };
        responses: {
            /** @description Success */
            201: {
                headers: {
                    /** @description Personal account data must not be cached */
                    "Cache-Control"?: "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MutationReceiptEnvelope"];
                };
            };
            /** @description Error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    cancelActualLedgerEntry: {
        parameters: {
            query?: never;
            header: {
                /** @description quoted accountVersion optimistic concurrency token; numeric value <= 9007199254740991; weak/wildcard/list/leading zero disallowed */
                "If-Match": string;
                "Idempotency-Key": string;
            };
            path: {
                accountId: number;
                entryId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Cancellation"];
            };
        };
        responses: {
            /** @description Success */
            201: {
                headers: {
                    /** @description Personal account data must not be cached */
                    "Cache-Control"?: "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MutationReceiptEnvelope"];
                };
            };
            /** @description Error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    getActualSummary: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                accountId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    /** @description Personal account data must not be cached */
                    "Cache-Control"?: "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SummaryEnvelope"];
                };
            };
            /** @description Error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    getActualHoldings: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                accountId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    /** @description Personal account data must not be cached */
                    "Cache-Control"?: "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HoldingsEnvelope"];
                };
            };
            /** @description Error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listActualComparisonTargets: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CatalogEnvelope"];
                };
            };
            /** @description Error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    compareActualAccount: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                accountId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ComparisonRequest"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    /** @description Personal account data must not be cached */
                    "Cache-Control"?: "no-store";
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ComparisonEnvelope"];
                };
            };
            /** @description Error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
}
