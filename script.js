function calculate(backStake, backOdds, layOdds, commission, betType, freebetRtp) {
    let layStake;

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

    let profitLayWins;

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
    const backStake = getFloatFromElement("backStake") || 0;
    const backOdds = getFloatFromElement("backOdds") || 0;
    const layOdds = getFloatFromElement("layOdds") || 0;
    const freebetRtp = getFloatFromElement("freebetRtp") || 0;
    const commission = (getFloatFromElement("commission") || 0) / 100;
    const betType = document.getElementById("betType").value;

    // Show / hide RTP input
    const rtpContainer = document.getElementById("rtpContainer");

    rtpContainer.style.display = betType === "riskfree" ? "block" : "none";

    // Calculate
    const result = calculate(
        backStake,
        backOdds,
        layOdds,
        commission,
        betType,
        freebetRtp
    );

    // Lay stake
    document.getElementById("layStake").textContent = result.layStake.toFixed(2);

    // Back wins
    setValue("profitBack", result.profitBackWins);

    // Lay wins
    setValue("profitLay", result.profitLayWins);
}

function setValue(id, value) {
    const el = document.getElementById(id);
    el.textContent = value.toFixed(2);
    el.className = "value " + (value < 0 ? "negative" : "positive");
}

document.addEventListener("input", update);
document.addEventListener("change", update);

update(); // kør ved load
