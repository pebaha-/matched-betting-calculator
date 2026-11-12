<script setup lang="ts">
import { computed, ref } from "vue";
import { calculate, calculateFreebetHedge, type BetType, type FreebetOutcome } from "./calculator";

const betType = ref<BetType>("normal");
const backStake = ref(100);
const backOdds = ref(2.0);
const layOdds = ref(2.0);
const commissionPercent = ref(6.5);
const freebetRtp = ref(70);

const result = computed(() =>
  calculate(
    backStake.value,
    backOdds.value,
    layOdds.value,
    commissionPercent.value / 100,
    betType.value,
    freebetRtp.value,
  ),
);

const freebetStake = ref(100);
const freebetOutcome = ref<FreebetOutcome>("X");
const odds1 = ref(2.5);
const oddsX = ref(3.2);
const odds2 = ref(2.8);
const outcomes = ["1", "X", "2"] as const;

const freebetError = computed(() => {
  if (!Number.isFinite(freebetStake.value) || freebetStake.value <= 0) {
    return "Freebet size must be greater than 0.";
  }
  if (![odds1.value, oddsX.value, odds2.value].every((odds) => Number.isFinite(odds) && odds > 1)) {
    return "All odds must be greater than 1.";
  }
  return "";
});

const freebetResult = computed(() => {
  if (freebetError.value) return null;
  return calculateFreebetHedge(freebetStake.value, freebetOutcome.value, {
    "1": odds1.value,
    X: oddsX.value,
    "2": odds2.value,
  });
});

function valueClass(value: number): "positive" | "negative" {
  return value >= 0 ? "positive" : "negative";
}
</script>

<template>
  <main>
    <div class="container">
      <div class="panel">
        <div class="card">
          <h1>Matched Betting Calculator</h1>
          <label>
            Bet type
            <select v-model="betType">
              <option value="normal">Normal</option>
              <option value="free">Free Bet (SNR)</option>
              <option value="riskfree">Risk Free</option>
              <option value="threeway">Three-way Hedge</option>
            </select>
          </label>

          <template v-if="betType === 'threeway'">
            <label>
              Freebet size (kr.)
              <input v-model.number="freebetStake" type="number" min="0.01" step="0.01" />
            </label>

            <label>
              Freebet outcome
              <select v-model="freebetOutcome">
                <option value="1">1 — Home win</option>
                <option value="X">X — Draw</option>
                <option value="2">2 — Away win</option>
              </select>
            </label>

            <label>
              Odds — 1
              <input v-model.number="odds1" type="number" min="1.01" step="0.01" />
            </label>

            <label>
              Odds — X
              <input v-model.number="oddsX" type="number" min="1.01" step="0.01" />
            </label>

            <label>
              Odds — 2
              <input v-model.number="odds2" type="number" min="1.01" step="0.01" />
            </label>
          </template>

          <template v-else>
            <label>
              Back stake
              <input v-model.number="backStake" type="number" step="0.01" />
            </label>

            <label>
              Back odds
              <input v-model.number="backOdds" type="number" step="0.01" />
            </label>

            <label>
              Lay odds
              <input v-model.number="layOdds" type="number" step="0.01" />
            </label>

            <label>
              Commission (%)
              <input v-model.number="commissionPercent" type="number" step="0.1" />
            </label>

            <label v-if="betType === 'riskfree'">
              Free bet RTP (%)
              <input v-model.number="freebetRtp" type="number" step="1" />
            </label>
          </template>
        </div>

        <div class="card">
          <template v-if="betType === 'threeway'">
            <p v-if="freebetError" class="error-message" role="alert">{{ freebetError }}</p>
            <template v-else-if="freebetResult">
              <section class="freebet-summary" aria-label="Freebet conversion summary">
                <h2>Hedge summary</h2>
                <div class="row highlight">
                  <span class="label">Total hedge</span>
                  <span class="value">{{ freebetResult.totalHedge.toFixed(2) }} kr.</span>
                </div>
                <div class="row highlight">
                  <span class="label">Conversion</span>
                  <span class="value" :class="valueClass(freebetResult.conversion)">
                    {{ (freebetResult.conversion * 100).toFixed(2) }}%
                  </span>
                </div>
              </section>

              <section class="breakdown freebet-breakdown">
                <h2>Hedge stakes</h2>
                <div v-for="outcome in outcomes" :key="outcome" class="row">
                  <span class="label">Outcome {{ outcome }} (odds {{ freebetResult.odds[outcome].toFixed(2) }})</span>
                  <span v-if="outcome === freebetOutcome" class="value muted">Freebet selection</span>
                  <span v-else class="value">{{ freebetResult.hedges[outcome]!.toFixed(2) }} kr.</span>
                </div>
              </section>

              <section class="breakdown freebet-breakdown">
                <h2>Net result by outcome</h2>
                <div v-for="outcomeResult in freebetResult.results" :key="outcomeResult.outcome" class="row">
                  <span class="label">Outcome {{ outcomeResult.outcome }}</span>
                  <span class="value" :class="valueClass(outcomeResult.net)">
                    {{ outcomeResult.net.toFixed(2) }} kr.
                  </span>
                </div>
              </section>

              <p v-if="freebetResult.conversion < 0" class="warning-message" role="status">
                Negative conversion — this combination is not attractive.
              </p>
            </template>
          </template>

          <template v-else>
            <div class="result">
              <div class="row highlight">
                <span class="label">Lay stake</span>
                <span class="value">{{ result.layStake.toFixed(2) }}</span>
              </div>
            </div>
            <div class="breakdown">
              <h2>Breakdown</h2>

              <div class="scenario">
                <h3>If Bookmaker (Back) bet wins</h3>
                <div class="row">
                  <span class="label">Bookmaker</span>
                  <span class="value" :class="valueClass(result.bookmakerBackWin)">{{ result.bookmakerBackWin.toFixed(2) }}</span>
                </div>
                <div class="row">
                  <span class="label">Exchange</span>
                  <span class="value" :class="valueClass(result.exchangeBackWin)">{{ result.exchangeBackWin.toFixed(2) }}</span>
                </div>
                <div class="row total">
                  <span class="label">Total</span>
                  <span class="value" :class="valueClass(result.profitBackWins)">{{ result.profitBackWins.toFixed(2) }}</span>
                </div>
              </div>

              <div class="scenario">
                <h3>If Exchange (Lay) bet wins</h3>
                <div class="row">
                  <span class="label">Bookmaker</span>
                  <span class="value" :class="valueClass(result.bookmakerLayWin)">{{ result.bookmakerLayWin.toFixed(2) }}</span>
                </div>
                <div class="row">
                  <span class="label">Exchange</span>
                  <span class="value" :class="valueClass(result.exchangeLayWin)">{{ result.exchangeLayWin.toFixed(2) }}</span>
                </div>
                <div v-if="betType === 'riskfree'" class="row">
                  <span class="label">Free Bet</span>
                  <span class="value" :class="valueClass(result.freebetLayWin)">{{ result.freebetLayWin.toFixed(2) }}</span>
                </div>
                <div class="row total">
                  <span class="label">Total</span>
                  <span class="value" :class="valueClass(result.profitLayWins)">{{ result.profitLayWins.toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.container { max-width: 1100px; margin: auto; }
.panel { display: grid; grid-template-columns: 375px 1fr; gap: 24px; align-items: stretch; }
.card { background: white; padding: 24px; border-radius: 14px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06); }
@media (min-width: 1000px) { .card:first-child { position: sticky; top: 24px; align-self: start; } }
h1 { margin-top: 0; margin-bottom: 20px; font-size: 24px; }
h2 { margin-top: 0; margin-bottom: 16px; font-size: 18px; }
h3 { margin-top: 0; margin-bottom: 12px; font-size: 15px; color: #444; }
label { display: block; margin-top: 16px; font-size: 14px; color: #555; }
input, select { width: 100%; margin-top: 6px; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
input:focus, select:focus { outline: none; border-color: #4f8cff; box-shadow: 0 0 0 3px rgba(79, 140, 255, 0.15); }
.result { margin-bottom: 24px; }
.highlight { font-size: 18px; font-weight: 600; }
.breakdown { border-top: 1px solid #eee; padding-top: 20px; }
.scenario + .scenario { margin-top: 28px; }
.freebet-summary h2 { margin-bottom: 10px; }
.freebet-breakdown { margin-top: 20px; }
.row { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 6px 0; }
.total { margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; font-weight: 600; }
.label { color: #666; }
.value { font-weight: 600; text-align: right; }
.muted { color: #777; font-size: 13px; }
.positive { color: #16a34a; }
.negative { color: #dc2626; }
.error-message, .warning-message { border-radius: 8px; padding: 12px 14px; font-size: 14px; }
.error-message { background: #fef2f2; color: #b91c1c; }
.warning-message { margin-bottom: 0; background: #fffbeb; color: #92400e; }
@media (max-width: 800px) { .panel { grid-template-columns: 1fr; } .card:first-child { position: static; } }
</style>
