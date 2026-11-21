export type FreebetOutcome = "1" | "X" | "2";
export type FreebetMarketType = "two" | "three";

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

/**
 * Calculates a freebet SNR hedge across a two- or three-outcome market.
 * The freebet stake is not returned if the selected outcome loses.
 */
export function calculateFreebetHedge(
  stake: number,
  freebetOutcome: FreebetOutcome,
  odds: FreebetOdds,
  marketType: FreebetMarketType = "three",
): FreebetHedgeResult {
  if (!Number.isFinite(stake) || stake <= 0) {
    throw new Error("Freebet size must be greater than 0.");
  }

  const outcomes: FreebetOutcome[] = marketType === "two" ? ["1", "2"] : ["1", "X", "2"];

  if (!outcomes.includes(freebetOutcome)) {
    throw new Error("The freebet selection must be one of the selected market outcomes.");
  }

  for (const outcome of outcomes) {
    if (!Number.isFinite(odds[outcome]) || odds[outcome] <= 1) {
      throw new Error("All market odds must be greater than 1.");
    }
  }

  const freebetProfit = stake * (odds[freebetOutcome] - 1);
  const hedges: Partial<Record<FreebetOutcome, number>> = {};

  for (const outcome of outcomes) {
    if (outcome !== freebetOutcome) {
      hedges[outcome] = roundCurrency(freebetProfit / odds[outcome]);
    }
  }

  const totalHedge = roundCurrency(Object.values(hedges).reduce((sum, hedge) => sum + hedge, 0));

  const results = outcomes.map((outcome): FreebetOutcomeResult => {
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

/**
 * Calculates a risk-free hedge without an exchange.
 *
 * The qualifying bet wins on the selected outcome. If it loses,
 * a free bet is awarded, valued at the configured RTP.
 * Back bets on the other outcomes equalize the net result.
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

  const guaranteedProfit = Math.min(...results.map(({ net }) => net));

  return {
    hedges,
    totalHedge,
    freebetValue,
    guaranteedProfit,
    results,
  };
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
