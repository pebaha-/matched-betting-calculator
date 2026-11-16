export type BetType = "normal" | "free" | "riskfree" | "multiway";
export type FreebetOutcome = "1" | "X" | "2";
export type FreebetMarketType = "two" | "three";

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
  results: FreebetOutcomeResult[];
}

export interface RiskfreeHedgeResult {
  hedges: Partial<Record<FreebetOutcome, number>>;
  totalHedge: number;
  freebetValue: number;
  guaranteedProfit: number;
  results: FreebetOutcomeResult[];
}

export function calculate(
  backStake: number,
  backOdds: number,
  layOdds: number,
  commission: number,
  betType: Exclude<BetType, "multiway">,
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

  const profitBackWins = backStake * (backOdds - 1) - layStake * (layOdds - 1);

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

/**
 * Calculates a no-exchange risk-free multiway hedge. The qualifying bet wins
 * on one outcome; if it loses, the free bet is valued at the configured RTP.
 * Back bets on every other outcome equalize the net profit across outcomes.
 */
export function calculateRiskfreeHedge(
  stake: number,
  qualifyingOutcome: FreebetOutcome,
  qualifyingOdds: number,
  marketOdds: FreebetOdds,
  freebetRtp: number,
  marketType: FreebetMarketType = "three",
): RiskfreeHedgeResult {
  if (!Number.isFinite(stake) || stake <= 0) {
    throw new Error("Qualifying bet size must be greater than 0.");
  }
  if (!Number.isFinite(qualifyingOdds) || qualifyingOdds <= 1) {
    throw new Error("Qualifying bet odds must be greater than 1.");
  }
  if (!Number.isFinite(freebetRtp) || freebetRtp < 0 || freebetRtp > 100) {
    throw new Error("Free bet RTP must be between 0 and 100%.");
  }

  const outcomes: FreebetOutcome[] = marketType === "two" ? ["1", "2"] : ["1", "X", "2"];
  if (!outcomes.includes(qualifyingOutcome)) {
    throw new Error("The qualifying bet selection must be one of the selected market outcomes.");
  }
  for (const outcome of outcomes) {
    if (
      outcome !== qualifyingOutcome &&
      (!Number.isFinite(marketOdds[outcome]) || marketOdds[outcome] <= 1)
    ) {
      throw new Error("Odds for every non-qualifying outcome must be greater than 1.");
    }
  }

  const freebetValue = roundCurrency((stake * freebetRtp) / 100);
  const hedgeReturnTarget = stake * qualifyingOdds - freebetValue;
  const hedges: Partial<Record<FreebetOutcome, number>> = {};
  for (const outcome of outcomes) {
    if (outcome !== qualifyingOutcome) {
      hedges[outcome] = roundCurrency(hedgeReturnTarget / marketOdds[outcome]);
    }
  }

  const totalHedge = roundCurrency(Object.values(hedges).reduce((sum, hedge) => sum + hedge, 0));
  const guaranteedProfit = roundCurrency(stake * (qualifyingOdds - 1) - totalHedge);
  const results = outcomes.map((outcome): FreebetOutcomeResult => {
    const winningHedgeReturn =
      outcome === qualifyingOutcome ? 0 : (hedges[outcome] ?? 0) * marketOdds[outcome];
    const netBeforeFreebet =
      outcome === qualifyingOutcome
        ? stake * (qualifyingOdds - 1) - totalHedge
        : -stake - totalHedge + winningHedgeReturn;
    const net = netBeforeFreebet + (outcome === qualifyingOutcome ? 0 : freebetValue);
    return { outcome, net: roundCurrency(net) };
  });

  return { hedges, totalHedge, freebetValue, guaranteedProfit, results };
}

export function calculateFreebetHedge(
  stake: number,
  freebetOutcome: FreebetOutcome,
  odds: FreebetOdds,
  marketType: FreebetMarketType = "three",
): FreebetHedgeResult {
  if (!Number.isFinite(stake) || stake <= 0) {
    throw new Error("Freebet size must be greater than 0.");
  }

  const marketOutcomes: FreebetOutcome[] = marketType === "two" ? ["1", "2"] : ["1", "X", "2"];
  if (!marketOutcomes.includes(freebetOutcome)) {
    throw new Error("The freebet selection must be one of the selected market outcomes.");
  }

  for (const outcome of marketOutcomes) {
    if (!Number.isFinite(odds[outcome]) || odds[outcome] <= 1) {
      throw new Error("All market odds must be greater than 1.");
    }
  }

  const freebetProfit = stake * (odds[freebetOutcome] - 1);
  const hedges: Partial<Record<FreebetOutcome, number>> = {};

  for (const outcome of marketOutcomes) {
    if (outcome !== freebetOutcome) {
      hedges[outcome] = roundCurrency(freebetProfit / odds[outcome]);
    }
  }

  const totalHedge = Object.values(hedges).reduce((sum, hedge) => sum + hedge, 0);
  const results: FreebetOutcomeResult[] = marketOutcomes.map((outcome) => {
    const net =
      outcome === freebetOutcome
        ? freebetProfit - totalHedge
        : (hedges[outcome] ?? 0) * odds[outcome] - totalHedge;

    return { outcome, net: roundCurrency(net) };
  });

  const guaranteedProfit = Math.min(...results.map(({ net }) => net));

  return {
    odds,
    hedges,
    totalHedge,
    conversion: guaranteedProfit / stake,
    results,
  };
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
