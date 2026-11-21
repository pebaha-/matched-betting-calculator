<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  calculateFreebetHedge,
  calculateRiskfreeHedge,
  type FreebetMarketType,
  type FreebetOutcome,
} from "./calculator";

type CalculatorType = "freebet" | "riskfree";

const calculatorType = ref<CalculatorType>("freebet");
const marketType = ref<FreebetMarketType>("three");

const outcomes = computed<FreebetOutcome[]>(() =>
  marketType.value === "two" ? ["1", "2"] : ["1", "X", "2"],
);

const outcomeLabel = (outcome: FreebetOutcome) =>
  outcome === "X" ? "Draw (X)" : `Outcome ${outcome}`;

const freebetStake = ref(100);
const freebetOutcome = ref<FreebetOutcome>("X");
const freebetOdds = ref({
  "1": 2.5,
  X: 3.2,
  "2": 2.8,
});

const qualifyingStake = ref(100);
const qualifyingOutcome = ref<FreebetOutcome>("1");
const qualifyingOdds = ref({
  "1": 2.8,
  X: 3.0,
  "2": 2.85,
});
const freebetRtp = ref(70);

watch(marketType, (type) => {
  if (type === "two") {
    if (freebetOutcome.value === "X") freebetOutcome.value = "1";
    if (qualifyingOutcome.value === "X") qualifyingOutcome.value = "1";
  }
});

const freebetError = computed(() => {
  if (!Number.isFinite(freebetStake.value) || freebetStake.value <= 0) {
    return "Freebet size must be greater than 0.";
  }

  if (!outcomes.value.includes(freebetOutcome.value)) {
    return "Select a valid freebet outcome.";
  }

  const odds = outcomes.value.map((outcome) => freebetOdds.value[outcome]);

  if (!odds.every((value) => Number.isFinite(value) && value > 1)) {
    return "All market odds must be greater than 1.";
  }

  return "";
});

const freebetResult = computed(() => {
  if (freebetError.value) return null;

  return calculateFreebetHedge(
    freebetStake.value,
    freebetOutcome.value,
    freebetOdds.value,
    marketType.value,
  );
});

const riskfreeError = computed(() => {
  if (!Number.isFinite(qualifyingStake.value) || qualifyingStake.value <= 0) {
    return "Qualifying bet size must be greater than 0.";
  }

  if (!Number.isFinite(freebetRtp.value) || freebetRtp.value < 0 || freebetRtp.value > 100) {
    return "Free bet RTP must be between 0 and 100%.";
  }

  if (!outcomes.value.includes(qualifyingOutcome.value)) {
    return "Select a valid qualifying bet outcome.";
  }

  const odds = outcomes.value.map((outcome) => qualifyingOdds.value[outcome]);

  if (!odds.every((value) => Number.isFinite(value) && value > 1)) {
    return "All market odds must be greater than 1.";
  }

  return "";
});

const riskfreeResult = computed(() => {
  if (riskfreeError.value) return null;

  return calculateRiskfreeHedge(
    qualifyingStake.value,
    qualifyingOutcome.value,
    qualifyingOdds.value[qualifyingOutcome.value],
    qualifyingOdds.value,
    freebetRtp.value,
    marketType.value,
  );
});

const valueClass = (value: number): "positive" | "negative" =>
  value >= 0 ? "positive" : "negative";
</script>

<template>
  <main class="container">
    <div class="panel">
      <section class="card">
        <h1>Matched Betting Calculator</h1>

        <label>
          Calculator type
          <select v-model="calculatorType">
            <option value="freebet">Freebet Hedge (SNR)</option>
            <option value="riskfree">Risk Free Hedge</option>
          </select>
        </label>

        <label>
          Market outcomes
          <select v-model="marketType">
            <option value="two">Two outcomes (1, 2)</option>
            <option value="three">Three outcomes (1, X, 2)</option>
          </select>
        </label>

        <template v-if="calculatorType === 'freebet'">
          <label>
            Freebet size (kr.)
            <input v-model.number="freebetStake" type="number" min="0.01" step="0.01" />
          </label>

          <label>
            Freebet outcome
            <select v-model="freebetOutcome">
              <option v-for="outcome in outcomes" :key="outcome" :value="outcome">
                {{ outcomeLabel(outcome) }}
              </option>
            </select>
          </label>

          <label>
            Odds — 1
            <input v-model.number="freebetOdds['1']" type="number" min="1.01" step="0.01" />
          </label>

          <label v-if="marketType === 'three'">
            Odds — X
            <input v-model.number="freebetOdds.X" type="number" min="1.01" step="0.01" />
          </label>

          <label>
            Odds — 2
            <input v-model.number="freebetOdds['2']" type="number" min="1.01" step="0.01" />
          </label>
        </template>

        <template v-else>
          <label>
            Qualifying bet outcome
            <select v-model="qualifyingOutcome">
              <option v-for="outcome in outcomes" :key="outcome" :value="outcome">
                {{ outcomeLabel(outcome) }}
              </option>
            </select>
          </label>

          <label>
            Qualifying bet stake (kr.)
            <input v-model.number="qualifyingStake" type="number" min="0.01" step="0.01" />
          </label>

          <label>
            Odds — 1
            <input v-model.number="qualifyingOdds['1']" type="number" min="1.01" step="0.01" />
          </label>

          <label v-if="marketType === 'three'">
            Odds — X
            <input v-model.number="qualifyingOdds.X" type="number" min="1.01" step="0.01" />
          </label>

          <label>
            Odds — 2
            <input v-model.number="qualifyingOdds['2']" type="number" min="1.01" step="0.01" />
          </label>

          <label>
            Freebet value returned (%)
            <input v-model.number="freebetRtp" type="number" min="0" max="100" step="1" />
          </label>
        </template>
      </section>

      <section class="card">
        <template v-if="calculatorType === 'freebet'">
          <p v-if="freebetError" class="error-message" role="alert">
            {{ freebetError }}
          </p>

          <template v-else-if="freebetResult">
            <section class="summary" aria-label="Freebet hedge summary">
              <h2>Hedge summary</h2>

              <div class="row highlight">
                <span class="label">Total hedge</span>
                <span class="value"> {{ freebetResult.totalHedge.toFixed(2) }} kr. </span>
              </div>

              <div class="row highlight">
                <span class="label">Conversion</span>
                <span class="value" :class="valueClass(freebetResult.conversion)">
                  {{ (freebetResult.conversion * 100).toFixed(2) }}%
                </span>
              </div>
            </section>

            <section class="breakdown">
              <h2>Hedge stakes</h2>

              <div v-for="outcome in outcomes" :key="outcome" class="row">
                <span class="label">
                  {{ outcomeLabel(outcome) }}
                  (odds {{ freebetResult.odds[outcome].toFixed(2) }})
                </span>

                <span v-if="outcome === freebetOutcome" class="value muted">
                  Freebet selection
                </span>

                <span v-else class="value">
                  {{ freebetResult.hedges[outcome]!.toFixed(2) }} kr.
                </span>
              </div>
            </section>

            <section class="breakdown">
              <h2>Net result by outcome</h2>

              <div v-for="item in freebetResult.results" :key="item.outcome" class="row">
                <span class="label">
                  {{ outcomeLabel(item.outcome) }}
                </span>

                <span class="value" :class="valueClass(item.net)">
                  {{ item.net.toFixed(2) }} kr.
                </span>
              </div>
            </section>

            <p v-if="freebetResult.conversion < 0" class="warning-message" role="status">
              Negative conversion — this combination is not attractive.
            </p>
          </template>
        </template>

        <template v-else>
          <p v-if="riskfreeError" class="error-message" role="alert">
            {{ riskfreeError }}
          </p>

          <template v-else-if="riskfreeResult">
            <section class="summary" aria-label="Risk-free hedge summary">
              <h2>Hedge summary</h2>

              <div class="row highlight">
                <span class="label">Guaranteed profit</span>
                <span class="value" :class="valueClass(riskfreeResult.guaranteedProfit)">
                  {{ riskfreeResult.guaranteedProfit.toFixed(2) }} kr.
                </span>
              </div>

              <div class="row">
                <span class="label">Total hedge</span>
                <span class="value"> {{ riskfreeResult.totalHedge.toFixed(2) }} kr. </span>
              </div>

              <div class="row">
                <span class="label">Freebet value if unlocked</span>
                <span class="value"> {{ riskfreeResult.freebetValue.toFixed(2) }} kr. </span>
              </div>
            </section>

            <section class="breakdown">
              <h2>Hedge stakes</h2>

              <div v-for="outcome in outcomes" :key="outcome" class="row">
                <span class="label">
                  {{ outcomeLabel(outcome) }}
                  (odds {{ qualifyingOdds[outcome].toFixed(2) }})
                </span>

                <span v-if="outcome === qualifyingOutcome" class="value muted">
                  Qualifying bet
                </span>

                <span v-else class="value">
                  {{ riskfreeResult.hedges[outcome]!.toFixed(2) }} kr.
                </span>
              </div>
            </section>

            <section class="breakdown">
              <h2>Net result by outcome</h2>

              <div v-for="item in riskfreeResult.results" :key="item.outcome" class="row">
                <span class="label">
                  {{ outcomeLabel(item.outcome) }}
                  {{
                    item.outcome === qualifyingOutcome
                      ? "(qualifying bet wins)"
                      : "(free bet unlocked)"
                  }}
                </span>

                <span class="value" :class="valueClass(item.net)">
                  {{ item.net.toFixed(2) }} kr.
                </span>
              </div>
            </section>
          </template>
        </template>
      </section>
    </div>
  </main>
</template>
