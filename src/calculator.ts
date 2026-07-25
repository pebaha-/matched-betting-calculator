export type BetType = "normal" | "free" | "riskfree";

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

export function calculate(
    backStake: number,
    backOdds: number,
    layOdds: number,
    commission: number,
    betType: BetType,
    freebetRtp: number
): CalculationResult {
    let layStake = 0;

    if (betType === "normal") {
        layStake =
            (backStake * backOdds) /
            (layOdds - commission);
    }

    if (betType === "free") {
        layStake =
            (backStake * (backOdds - 1)) /
            (layOdds - commission);
    }

    if (betType === "riskfree") {
        const rtp = freebetRtp / 100;

        layStake =
            (backStake * (backOdds - rtp)) /
            (layOdds - commission);
    }

    const profitBackWins =
        backStake * (backOdds - 1) -
        layStake * (layOdds - 1);

    let profitLayWins = 0;

    if (betType === "normal") {
        profitLayWins =
            layStake * (1 - commission) -
            backStake;
    }

    if (betType === "free") {
        profitLayWins =
            layStake * (1 - commission);
    }

    if (betType === "riskfree") {
        const freebetValue =
            backStake * (freebetRtp / 100);

        profitLayWins =
            layStake * (1 - commission) -
            backStake +
            freebetValue;
    }

    const bookmakerBackWin = backStake * (backOdds - 1);
    const exchangeBackWin = -layStake * (layOdds - 1);
    const bookmakerLayWin = betType === "free" ? 0 : -backStake;
    const exchangeLayWin = layStake * (1 - commission);

    const freebetLayWin =
    betType === "riskfree"
        ? backStake * (freebetRtp / 100)
        : 0;

    return {
        layStake,
        profitBackWins,
        profitLayWins,

        bookmakerBackWin,
        exchangeBackWin,

        bookmakerLayWin,
        exchangeLayWin,
        freebetLayWin
    };
}
