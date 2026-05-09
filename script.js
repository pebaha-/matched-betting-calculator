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

    const bookmakerBackWin = backStake * (backOdds - 1);
    const exchangeBackWin = -layStake * (layOdds - 1);
    const bookmakerLayWin = -backStake;
    const exchangeLayWin = layStake * (1 - commission);

    let freebetLayWin = 0;

    if (betType === "riskfree") {
        freebetLayWin =
            backStake * (freebetRtp / 100);
    }
    else if (betType === "free") {
        freebetLayWin =
            backStake * (freebetRtp / 100);
    }

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

    // Main results
    document.getElementById("layStake").textContent = result.layStake.toFixed(2);

    // Breakdown — back wins
    setValue("bookmakerBackWin", result.bookmakerBackWin);
    setValue("exchangeBackWin", result.exchangeBackWin);

    setValue("totalBackWin", result.profitBackWins);

    // Breakdown — lay wins
    setValue("bookmakerLayWin", result.bookmakerLayWin);

    setValue("exchangeLayWin", result.exchangeLayWin);

    const showFreebet = betType === "riskfree";

    document.getElementById("freebetLayRow").style.display = showFreebet ? "flex" : "none";

    setValue("totalLayWin", result.profitLayWins);

    if (showFreebet) {
        setValue("freebetLayWin", result.freebetLayWin);
    }
}

function setValue(id, value) {
    const el = document.getElementById(id);
    el.textContent = value.toFixed(2);
    el.className = "value " + (value < 0 ? "negative" : "positive");
}

document.addEventListener("input", update);
document.addEventListener("change", update);

update(); // kør ved load
