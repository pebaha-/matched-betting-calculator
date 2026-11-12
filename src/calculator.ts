export type BetType = "normal" | "free" | "riskfree";
export type FreebetOutcome = "1" | "X" | "2";

export interface CalculationResult {
    layStake: number;
    profitBackWins: number;
    profitLayWins: number;
    bookmakerBackWin: number;
    exchangeBackWin: number;
    bookmakerLayWin: number;
    exchangeLayWin: number;
    freebetLayWin: number;
}

export interface FreebetOdds {
    "1": number;
    X: number;
    "2": number;
}

export interface FreebetOutcomeResult {
    outcome: FreebetOutcome;
    net: number;
}

export interface FreebetHedgeResult {
    odds: FreebetOdds;
    hedges: Partial<Record<FreebetOutcome, number>>;
    totalHedge: number;
    conversion: number;
    guaranteedProfit: number;
    results: FreebetOutcomeResult[];
}

export function calculate(
    backStake: number,
    backOdds: number,
    layOdds: number,
    commission: number,
    betType: BetType,
    freebetRtp: number,
): CalculationResult {
    let layStake = 0;

    if (betType === "normal") {
        layStake = (backStake * backOdds) / (layOdds - commission);
    }

    if (betType === "free") {
        layStake = (backStake * (backOdds - 1)) / (layOdds - commission);
    }

    if (betType === "riskfree") {
        const rtp = freebetRtp / 100;
        layStake = (backStake * (backOdds - rtp)) / (layOdds - commission);
    }

    const profitBackWins =
        backStake * (backOdds - 1) -
        layStake * (layOdds - 1);

    let profitLayWins = 0;

    if (betType === "normal") {
        profitLayWins = layStake * (1 - commission) - backStake;
    }

    if (betType === "free") {
        profitLayWins = layStake * (1 - commission);
    }

    if (betType === "riskfree") {
        const freebetValue = backStake * (freebetRtp / 100);
        profitLayWins = layStake * (1 - commission) - backStake + freebetValue;
    }

    const bookmakerBackWin = backStake * (backOdds - 1);
    const exchangeBackWin = -layStake * (layOdds - 1);
    const bookmakerLayWin = betType === "free" ? 0 : -backStake;
    const exchangeLayWin = layStake * (1 - commission);
    const freebetLayWin = betType === "riskfree" ? backStake * (freebetRtp / 100) : 0;

    return {
        layStake,
        profitBackWins,
        profitLayWins,
        bookmakerBackWin,
        exchangeBackWin,
        bookmakerLayWin,
        exchangeLayWin,
        freebetLayWin,
    };
}

export function calculateFreebetHedge(
    stake: number,
    freebetOutcome: FreebetOutcome,
    odds: FreebetOdds,
): FreebetHedgeResult {
    if (!Number.isFinite(stake) || stake <= 0) {
        throw new Error("Freebet size must be greater than 0.");
    }

    for (const outcome of ["1", "X", "2"] as const) {
        if (!Number.isFinite(odds[outcome]) || odds[outcome] <= 1) {
            throw new Error("All odds must be greater than 1.");
        }
    }

    const freebetProfit = stake * (odds[freebetOutcome] - 1);
    const hedges: Partial<Record<FreebetOutcome, number>> = {};

    for (const outcome of ["1", "X", "2"] as const) {
        if (outcome !== freebetOutcome) {
            hedges[outcome] = roundCurrency(freebetProfit / odds[outcome]);
        }
    }

    const totalHedge = Object.values(hedges).reduce((sum, hedge) => sum + hedge, 0);
    const results: FreebetOutcomeResult[] = (["1", "X", "2"] as const).map((outcome) => {
        const net =
            outcome === freebetOutcome
                ? freebetProfit - totalHedge
                : (hedges[outcome] ?? 0) * odds[outcome] - totalHedge;

        return {
            outcome,
            net: roundCurrency(net),
        };
    });

    // Conversion is the hedged profit as a percentage of the freebet's face value.
    // With no outcome probabilities, report the minimum net result as guaranteed profit.
    const guaranteedProfit = Math.min(...results.map(({ net }) => net));
    const conversion = guaranteedProfit / stake;

    return {
        odds,
        hedges,
        totalHedge,
        conversion,
        guaranteedProfit,
        results,
    };
}

function roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
}
