<script setup lang="ts">
import { computed, ref } from "vue";
import { calculate, type BetType } from "./calculator";

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
    freebetRtp.value
  )
);

function valueClass(value: number): "positive" | "negative" {
  return value >= 0 ? "positive" : "negative";
}
</script>

<template>
  <main>
    <div class="container">
      <div class="panel">
        <!-- LEFT COLUMN -->
        <div class="card">

          <h1>Matched Betting Calculator</h1>

          <label>
            Bet type

            <select v-model="betType">
              <option value="normal">Normal</option>
              <option value="free">Free Bet (SNR)</option>
              <option value="riskfree">Risk Free</option>
            </select>
          </label>

          <label>
            Back stake
            <input v-model.number="backStake" type="number" step="0.01">
          </label>

          <label>
            Back odds
            <input v-model.number="backOdds" type="number" step="0.01">
          </label>

          <label>
            Lay odds
            <input v-model.number="layOdds" type="number" step="0.01">
          </label>

          <label>
            Commission (%)
            <input v-model.number="commissionPercent" type="number" step="0.1">
          </label>

          <label v-if="betType === 'riskfree'">
            Free bet RTP (%)
            <input v-model.number="freebetRtp" type="number" step="1">
          </label>
        </div>
        <!-- RIGHT COLUMN -->
        <div class="card">
          <div class="result">
            <div class="row highlight">
              <span class="label">
                Lay stake
              </span>
              <span class="value"">
                {{ result.layStake.toFixed(2) }}
              </span>
            </div>
          </div>
          <div class="breakdown">
            <h2>Breakdown</h2>

            <div class="scenario">
              <h3>
                If Bookmaker (Back) bet wins
              </h3>

              <div class="row">
                <span class="label">
                  Bookmaker
                </span>

                <span class="value" :class="valueClass(result.bookmakerBackWin)">
                  {{ result.bookmakerBackWin.toFixed(2) }}
                </span>
              </div>

              <div class="row">
                <span class="label">
                  Exchange
                </span>

                <span class="value" :class="valueClass(result.exchangeBackWin)">
                  {{  result.exchangeBackWin.toFixed(2) }}
                </span>
              </div>

              <div class="row total">
                <span class="label">
                  Total
                </span>

                <span class="value" :class="valueClass(result.profitBackWins)">
                  {{ result.profitBackWins.toFixed(2) }}
                </span>
              </div>
            </div>

            <div class="scenario">
              <h3>
                If Exchange (Lay) bet wins
              </h3>

              <div class="row">
                <span class="label">
                  Bookmaker
                </span>

                <span class="value" :class="valueClass(result.bookmakerLayWin)">
                  {{ result.bookmakerLayWin.toFixed(2) }}
                </span>
              </div>

              <div class="row">
                <span class="label">
                  Exchange
                </span>

                <span class="value" :class="valueClass(result.exchangeLayWin)">
                  {{ result.exchangeLayWin.toFixed(2) }}
                </span>
              </div>

              <div v-if="betType === 'riskfree'" class="row">
                <span class="label">
                  Free Bet
                </span>

                <span class="value" :class="valueClass(result.freebetLayWin)">
                  {{ result.freebetLayWin.toFixed(2) }}
                </span>
              </div>

              <div class="row total">
                <span class="label">
                  Total
                </span>

                <span class="value" :class="valueClass(result.profitLayWins)">
                  {{ result.profitLayWins.toFixed(2) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
