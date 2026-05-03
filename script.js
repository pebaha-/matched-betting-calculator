function calculate(backStake, backOdds, layOdds, commission, betType) {
    let layStake;
    const commissionPct = commission / 100;

    if (betType === "free") {
        // Free bet (SNR)
        layStake = (backStake * (backOdds - 1)) / (layOdds - commissionPct);
    } else {
        // Normal bet
        layStake = (backStake * backOdds) / (layOdds - commissionPct);
    }

    const profitBackWins =
        (betType === "free"
            ? backStake * (backOdds - 1)
            : backStake * (backOdds - 1)) -
        (layStake * (layOdds - 1));

    const profitLayWins =
        (layStake * (1 - commissionPct)) -
        (betType === "free" ? 0 : backStake);

    return {
        layStake,
        profitBackWins,
        profitLayWins
    };
}

function getFloatFromElement(elementId) {
    return parseFloat(document.getElementById(elementId).value);
}

function update() {
    const backStake = getFloatFromElement("backStake");
    const backOdds = getFloatFromElement("backOdds");
    const layOdds = getFloatFromElement("layOdds");
    const commission = getFloatFromElement("commission");
    const betType = document.getElementById("betType").value;

    if ([backStake, backOdds, layOdds, commission].some(isNaN)) return;

    const result = calculate(backStake, backOdds, layOdds, commission, betType);

    document.getElementById("layStake").textContent =
        result.layStake.toFixed(2);

    document.getElementById("profitBack").textContent =
        result.profitBackWins.toFixed(2);

    setValue("profitLay", result.profitLayWins);
    setValue("profitBack", result.profitBackWins);
}

function setValue(id, value) {
    const el = document.getElementById(id);
    el.textContent = value.toFixed(2);
    el.className = "value " + (value < 0 ? "negative" : "positive");
}

document.addEventListener("input", update);
document.addEventListener("change", update);

update(); // kør ved load
