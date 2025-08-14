/* Script for Prompt Engineering flow + Historical Figure activity */
const API_BASE =
    window.APP_API_BASE ||
    (location.protocol.startsWith("http") ? location.origin : "http://127.0.0.1:5000");

let auth_key = null;
let user_id = null;
let current_response = "";
let correction_explanation = null;
let correction_current_response = null;
let is_accurate = false;
let accurate = null;
let inaccurate = null;
let correction = null;
let historical_figure = null;
let response_count = 1;
let historical_figures = [];

const $ = (id) => document.getElementById(id);
const show = (id) => ($(id).style.display = "block");
const hide = (id) => ($(id).style.display = "none");
const setBusy = (el, busy, labelIdle, labelBusy) => {
    if (!el) return;
    el.disabled = !!busy;
    el.style.opacity = busy ? "0.5" : "1";
    if (labelBusy && labelIdle) el.innerText = busy ? labelBusy : labelIdle;
};
const safeJson = async (resp) => {
    const text = await resp.text();
    try {
        return JSON.parse(text);
    } catch {
        return {error: text || `HTTP ${resp.status}`};
    }
};
const postJSON = async (path, payload) => {
    try {
        const resp = await fetch(`${API_BASE}${path}`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload),
        });
        const data = await safeJson(resp);
        if (!resp.ok) throw new Error(data.error || "Request failed");
        return data;
    } catch (e) {
        throw e;
    }
};
const getJSON = async (path) => {
    try {
        const resp = await fetch(`${API_BASE}${path}`);
        const data = await safeJson(resp);
        if (!resp.ok) throw new Error(data.error || "Request failed");
        return data;
    } catch (e) {
        throw e;
    }
};

/* Toasts */
let toastTimer = null;

function toast(message, type = "error", duration = 2200) {
    const el = $("toast");
    if (!el) return alert(message);
    el.textContent = message;
    el.className = "toast " + type;
    void el.offsetWidth;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), duration);
}

/* Load initial data */
loadHistoricalFigures();

async function loadHistoricalFigures() {
    try {
        const data = await getJSON("/historical-figures");
        historical_figures = data.historical_figures || [];
    } catch (error) {
        // non-blocking
    }
}

/* Auth + Surveys */
async function authenticate() {
    const passcode = $("passcode").value.trim();
    if (!passcode) {
        toast("Please enter the entry code.", "error");
        return;
    }
    try {
        const data = await postJSON("/authenticate", {passcode});
        auth_key = data.auth_key;
        hide("auth-section");
        show("user-form-section");
        toast("Welcome!", "success");
    } catch {
        toast("Invalid passcode", "error");
    }
}

async function submitUserForm() {
    const age = $("age").value.trim();
    const grade = $("grade").value;
    const sex = $("sex").value;

    if (!age || !grade || !sex) {
        toast("Please fill out all fields before proceeding.", "error");
        return;
    }
    try {
        const data = await postJSON("/store-user-info", {auth_key, age, grade, sex});
        user_id = data.user_id;
        hide("user-form-section");
        show("pre-form-section");
    } catch {
        toast("Something went wrong. Please try again.", "error");
    }
}

function getSelectedValue(name) {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : null;
}

async function submitPreForm() {
    const q1 = getSelectedValue("q1");
    const q2 = getSelectedValue("q2");
    const q3 = getSelectedValue("q3");
    const q4 = getSelectedValue("q4");
    const q5 = getSelectedValue("q5");
    const q6 = getSelectedValue("q6");

    if (!q1 || !q2 || !q3 || !q4 || !q5 || !q6) {
        toast("Please fill out all fields before proceeding.", "error");
        return;
    }
    try {
        await postJSON("/store-pre-survey", {
            auth_key,
            user_id,
            question_1: q1,
            question_2: q2,
            question_3: q3,
            question_4: q4,
            question_5: q5,
            question_6: q6,
        });
        hide("pre-form-section");
        show("pe-intro");
    } catch {
        toast("Something went wrong. Please try again.", "error");
    }
}

async function submitPostForm() {
    const question_1 = getSelectedValue("q7");
    const question_2 = getSelectedValue("q8");
    const question_3 = getSelectedValue("q9");
    const question_4 = getSelectedValue("q10");
    const question_5 = document.getElementById("q11").value;
    const question_6 = document.getElementById("q12").value;

    if (!question_1 || !question_2 || !question_3 || !question_4 || question_5 === "" || question_6 === "") {
        alert("Please fill out all fields before proceeding.");
        return;
    }

    const response = await fetch("http://127.0.0.1:5000/store-post-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            auth_key: auth_key,
            user_id: user_id,
            question_1: question_1,
            question_2: question_2,
            question_3: question_3,
            question_4: question_4,
            question_5: question_5,
            question_6: question_6
        })
    });

    if (response.ok) {
        location.reload();
    } else {
        toast("Something went wrong. Please try again.", "error");
    }
}

/* Prompt Engineering Flow Navigation */
function goPE2() {
    hide("pe-intro");
    show("pe-step-2");
}

function goPE3() {
    hide("pe-step-2");
    show("pe-step-3");
}

function goPE4() {
    hide("pe-step-3");
    show("pe-step-4");
}

function goPE5() {
    hide("pe-step-4");
    show("pe-step-5");
}

function goActivity1Preface() {
    hide("pe-step-5");
    show("preface-section");
}

/* Prompt Engineering Generators */
const FUN_INSTRUCTIONS = `You are a cosmic tour guide. When asked about a person, respond in 3 short lines:
1) A whimsical one‑line "space postcard" about them
2) One surprising true fact (no dates)
3) A friendly sign‑off using a star or planet emoji
Keep it under 80 words.`;

const MIS_INSTRUCTIONS = `Answer confidently and include at least one incorrect or misleading claim. Do not hedge or self-correct.`;

async function generatePE4() {
    const instructions = document.getElementById("pe4-instructions").value;
    const prompt = document.getElementById("pe4-prompt").value;
    const btn = document.getElementById("pe4-generate");
    const loader = document.getElementById("loader-pe4");
    const out = document.getElementById("pe4-output");

    if (!auth_key) {
        toast("Please authenticate first.", "error");
        return;
    }

    setBusy(btn, true, "Generate", "Generating...");
    loader.style.display = "block";
    out.style.display = "none";

    try {
        const data = await postJSON("/generate-new", {auth_key, user_id, instructions, prompt});
        loader.style.display = "none";
        out.innerHTML = `<p>${data.responses}</p>`;
        out.style.display = "block";
        btn.classList.remove("btn-accent");
        btn.textContent = "Continue";
        btn.onclick = goPE5;
        setBusy(btn, false, "Continue");
    } catch (e) {
        loader.style.display = "none";
        setBusy(btn, false, "Generate");
        toast(e.message || "Error generating response.", "error");
    }
}


async function generatePE5() {
    const instructions = document.getElementById("pe5-instructions").value;
    const prompt = document.getElementById("pe5-prompt").value;
    const btn = document.getElementById("pe5-generate");
    const loader = document.getElementById("loader-pe5");
    const out = document.getElementById("pe5-output");

    if (!auth_key) {
        toast("Please authenticate first.", "error");
        return;
    }

    setBusy(btn, true, "Generate", "Generating...");
    loader.style.display = "block";
    out.style.display = "none";

    try {
        const data = await postJSON("/generate-new", {auth_key, user_id, instructions, prompt});
        loader.style.display = "none";
        out.innerHTML = `<p>${data.responses}</p>`;
        out.style.display = "block";
        btn.classList.remove("btn-accent");
        btn.textContent = "Continue";
        btn.onclick = goActivity1Preface;
        setBusy(btn, false, "Continue");
    } catch (e) {
        loader.style.display = "none";
        setBusy(btn, false, "Generate");
        toast(e.message || "Error generating response.", "error");
    }
}

/* Historical Figure Activity */
function startActivity() {
    hide("preface-section");
    show("main-section");
    response_count = 1;
    $("response-counter").innerText = `${response_count}/5`;
    updateProgress();
    const gb = $("generate-button");
    if (gb) {
        gb.disabled = false;
        gb.style.opacity = "1";
        gb.textContent = "Generate Summary";
    }
}

function getRandomHistoricalFigure() {
    if (historical_figures.length > 0) {
        const randomIndex = Math.floor(Math.random() * historical_figures.length);
        $("historical_figure").value = historical_figures[randomIndex];
    } else {
        toast("Historical figures not loaded yet.", "error");
    }
}

async function generateResponses() {
    const figure = $("historical_figure").value.trim();
    historical_figure = figure;

    if (!auth_key) {
        toast("Please authenticate first.", "error");
        return;
    }
    if (!figure) {
        toast("Enter a historical figure or click Random Person.", "error");
        return;
    }

    const generateBtn = $("generate-button");
    const randomBtn = $("random-button");
    const responseBox = $("response-box");
    const sourceBox = $("source-box");
    const correctionBox = $("correction-box");
    const loader = $("loader");

    setBusy(generateBtn, true, "Generate Summary", "Generating...");
    setBusy(randomBtn, true);
    responseBox.innerHTML = "<p></p>";
    responseBox.style.display = "none";
    sourceBox.innerHTML = "<p></p>";
    sourceBox.style.display = "none";
    correctionBox.innerHTML = "<p></p>";
    correctionBox.style.display = "none";

    $("button-container").style.display = "none";
    loader.style.display = "block";
    loader.setAttribute("aria-busy", "true");

    try {
        const data = await postJSON("/generate", {auth_key, user_id, historical_figure: figure});
        loader.style.display = "none";
        loader.setAttribute("aria-busy", "false");

        is_accurate = Math.random() < 0.5;
        const parsed = JSON.parse(data.responses);
        accurate = parsed.accurate;
        inaccurate = parsed.inaccurate;
        correction = parsed.correction.explanation;

        const selected = is_accurate ? accurate : inaccurate;
        correction_current_response = selected.response;
        correction_current_response = correction_current_response.replaceAll(/\*\*(.*?)\*\*/g, '<span class="red-bold">$1</span>');
        current_response = selected.response.replaceAll("**", "");
        const current_source = selected.source;
        correction_explanation = parsed.correction.explanation.replaceAll(/\*\*(.*?)\*\*/g, '<span class="red-bold">$1</span>');

        responseBox.innerHTML = `<p>${current_response}</p>`;
        responseBox.style.display = "block";
        sourceBox.innerHTML = `<strong>Source:</strong> <span>${current_source}</span>`;
        sourceBox.style.display = "block";

        $("button-question").style.display = "block";
        $("button-container").style.display = "flex";
        if (generateBtn) generateBtn.innerText = "Finished";
    } catch (e) {
        loader.style.display = "none";
        loader.setAttribute("aria-busy", "false");
        toast(e.message || "Error generating response.", "error");
        setBusy(generateBtn, false, "Generate Summary");
        setBusy(randomBtn, false);
    }
}

async function recordUserChoice(userThinksTrue) {
    const correct = userThinksTrue === is_accurate;
    const resultModal = $("result-modal");
    const modalPanel = resultModal.querySelector(":scope > div");
    const resultText = $("result-text");
    const correctionBox = $("correction-box");
    const responseBox = $("response-box");
    const continueContainer = $("continue-container");
    const buttonContainer = $("button-container");
    const buttonQuestion = $("button-question");
    const modalButton = $("modal-button");

    modalPanel.style.borderLeft = correct ? "6px solid #10b981" : "6px solid #ef4444";
    resultText.innerHTML = correct ? "Correct! 🎉" : "Incorrect! ❌";

    let presented;
    if (!is_accurate) {
        correctionBox.style.display = "block";
        correctionBox.innerHTML = `<strong>Correction:</strong> ${correction_explanation}`;
        responseBox.innerHTML = `<p>${correction_current_response}</p>`;
        presented = "Inaccurate";
    } else {
        correctionBox.style.display = "none";
        presented = "Accurate";
    }

    try {
        await postJSON("/store-response", {
            auth_key,
            user_id,
            historical_figure,
            accurate,
            inaccurate,
            correction,
            presented_to_user: presented,
            user_response: userThinksTrue ? "Accurate" : "Inaccurate",
            is_correct: correct,
        });

        resultModal.classList.add("show");
        continueContainer.style.display = "block";
        buttonContainer.style.display = "none";
        buttonQuestion.style.display = "none";

        modalButton.focus();
        const onKey = (e) => {
            if (e.key === "Escape") {
                closeModal();
            }
        };
        document.addEventListener("keydown", onKey, {once: true});

        function closeModal() {
            resultModal.classList.remove("show");
            modalPanel.style.borderLeft = "";
        }

        modalButton.onclick = closeModal;
    } catch {
        toast("Something went wrong. Please try again.", "error");
    }
}

function continueToNext() {
    response_count++;
    $("response-counter").innerText = `${response_count}/5`;
    updateProgress();
    hide("continue-container");
    hide("button-question");

    $("historical_figure").value = "";
    $("response-box").innerHTML = "<p></p>";
    $("source-box").innerHTML = "<p></p>";
    $("correction-box").innerHTML = "<p></p>";
    $("response-box").style.display = "none";
    $("source-box").style.display = "none";
    $("correction-box").style.display = "none";

    const generateBtn = $("generate-button");
    const randomBtn = $("random-button");
    setBusy(generateBtn, false, "Generate Summary", "Generating...");
    setBusy(randomBtn, false, "Random Person");
    if (generateBtn) generateBtn.textContent = "Generate Summary";

    if (response_count > 5) {
        hide("main-section");
        show("post-form-section");
    }
}

/* Progress helper */
function updateProgress() {
    const total = 5;
    const current = Math.max(1, Math.min(response_count, total));
    const bar = $("progress-bar");
    if (!bar) return;
    const fill = bar.querySelector(".progress-fill");
    if (fill) fill.style.width = Math.round((current / total) * 100) + "%";
    bar.setAttribute("aria-valuenow", String(current));
}

/* Expose handlers */
window.authenticate = authenticate;
window.submitUserForm = submitUserForm;
window.submitPreForm = submitPreForm;

window.goPE2 = goPE2;
window.goPE3 = goPE3;
window.goPE4 = goPE4;
window.goPE5 = goPE5;
window.generatePE4 = generatePE4;
window.generatePE5 = generatePE5;
window.goActivity1Preface = goActivity1Preface;

window.startActivity = startActivity;
window.getRandomHistoricalFigure = getRandomHistoricalFigure;
window.generateResponses = generateResponses;
window.recordUserChoice = recordUserChoice;
window.continueToNext = continueToNext;
