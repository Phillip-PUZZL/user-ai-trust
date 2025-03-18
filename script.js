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
let activity_two_data = null;
let response_count = 1;
let historical_figures = [];

loadHistoricalFigures();
loadActivityTwoData();

async function authenticate() {
    const passcode = "research123";
    const response = await fetch("http://127.0.0.1:5000/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            passcode: passcode
        })
    });
    const data = await response.json();

    if (response.ok) {
        auth_key = data.auth_key;
        document.getElementById("auth-section").style.display = "none";
        document.getElementById("user-form-section").style.display = "block";
    } else {
        alert("Invalid passcode");
    }
}

async function submitUserForm() {
    const age = document.getElementById("age").value;
    const grade = document.getElementById("grade").value;
    const sex = document.getElementById("sex").value;

    if (!age || !grade || !sex) {
        alert("Please fill out all fields before proceeding.");
        return;
    }

    const response = await fetch("http://127.0.0.1:5000/store-user-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            auth_key: auth_key,
            age: age,
            grade: grade,
            sex: sex
        })
    });
    const data = await response.json();

    if (response.ok) {
        user_id = data.user_id;
        document.getElementById("user-form-section").style.display = "none";
        document.getElementById("pre-form-section").style.display = "block";
    } else {
        alert("Bad data!");
    }
}

function getSelectedValue(questionName) {
    const selectedOption = document.querySelector(`input[name="${questionName}"]:checked`);
    return selectedOption ? selectedOption.value : null;
}

async function submitPreForm() {
    const question_1 = getSelectedValue("q1");
    const question_2 = getSelectedValue("q2");
    const question_3 = getSelectedValue("q3");
    const question_4 = getSelectedValue("q4");
    const question_5 = getSelectedValue("q5");

    if (!question_1 || !question_2 || !question_3 || !question_4 || !question_5) {
        alert("Please fill out all fields before proceeding.");
        return;
    }

    const response = await fetch("http://127.0.0.1:5000/store-pre-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            auth_key: auth_key,
            user_id: user_id,
            question_1: question_1,
            question_2: question_2,
            question_3: question_3,
            question_4: question_4,
            question_5: question_5
        })
    });

    if (response.ok) {
        document.getElementById("pre-form-section").style.display = "none";
        document.getElementById("preface-section").style.display = "block";
    } else {
        alert("Bad data!");
    }
}

async function submitPostForm() {
    const question_1 = getSelectedValue("q6");
    const question_2 = getSelectedValue("q7");
    const question_3 = getSelectedValue("q8");
    const question_4 = document.getElementById("q9").value;
    const question_5 = document.getElementById("q10").value;

    if (!question_1 || !question_2 || !question_3 || question_4 === "" || question_5 === "") {
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
            question_5: question_5
        })
    });

    if (response.ok) {
        location.reload();
    } else {
        alert("Bad data!");
    }
}

function startActivity() {
    document.getElementById("preface-section").style.display = "none";
    document.getElementById("main-section").style.display = "block";
}

function startActivity2() {
    document.getElementById("preface-section-2").style.display = "none";
    document.getElementById("second-activity").style.display = "block";
}

async function loadHistoricalFigures() {
    try {
        const response = await fetch("http://127.0.0.1:5000/historical-figures");
        const data = await response.json();
        historical_figures = data.historical_figures;
    } catch (error) {
        console.error("Error loading historical figures:", error);
    }
}

async function loadActivityTwoData() {
    try {
        const response = await fetch("http://127.0.0.1:5000/get-instructions");
        activity_two_data = await response.json();
    } catch (error) {
        console.error("Error loading activity two instructions and prompts:", error);
    }
}

function getRandomHistoricalFigure() {
    if (historical_figures.length > 0) {
        const randomIndex = Math.floor(Math.random() * historical_figures.length);
        document.getElementById("historical_figure").value = historical_figures[randomIndex];
    } else {
        alert("Error: Historical figures not loaded yet.");
    }
}

async function generateResponses() {
    const historicalFigure = document.getElementById("historical_figure").value;
    historical_figure = historicalFigure;
    if (!auth_key) {
        alert("You must authenticate first!");
        return;
    }

    const generateButton = document.querySelector("button[onclick='generateResponses()']");
    generateButton.disabled = true;
    generateButton.style.opacity = "0.5";
    generateButton.innerText = "Generating...";
    const randomButton = document.querySelector("button[onclick='getRandomHistoricalFigure()']");
    randomButton.disabled = true;
    randomButton.style.opacity = "0.5";

    const responseBox = document.getElementById("response-box");
    const sourceBox = document.getElementById("source-box");
    const correctionBox = document.getElementById("correction-box");
    responseBox.innerHTML = `<p></p>`;
    sourceBox.innerHTML = `<p></p>`;
    correctionBox.innerHTML = `<p></p>`;
    correctionBox.style.display = "none";

    document.getElementById("button-container").style.display = "none";
    document.getElementById("loader").style.display = "block";

    const response = await fetch("http://127.0.0.1:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth_key: auth_key, user_id: user_id, historical_figure: historicalFigure })
    });

    const data = await response.json();
    document.getElementById("loader").style.display = "none";

    if (response.ok) {
        is_accurate = Math.random() < 0.5;
        let selected_response = is_accurate ? JSON.parse(data.responses).accurate : JSON.parse(data.responses).inaccurate;
        accurate = JSON.parse(data.responses).accurate;
        inaccurate = JSON.parse(data.responses).inaccurate;
        correction = JSON.parse(data.responses).correction.explanation;
        correction_current_response = selected_response.response;
        correction_current_response = correction_current_response.replaceAll(/\*\*(.*?)\*\*/g, '<span class="red-bold">$1</span>');
        current_response = selected_response.response.replaceAll("**", "");
        let current_source = selected_response.source;
        correction_explanation = JSON.parse(data.responses).correction.explanation.replaceAll(/\*\*(.*?)\*\*/g, '<span class="red-bold">$1</span>');

        responseBox.innerHTML = `<p>${current_response}</p>`;
        sourceBox.innerHTML = `<strong>Source:</strong> <span>${current_source}</span>`;
        sourceBox.style.display = "block";

        document.getElementById("button-question").style.display = "block";
        document.getElementById("button-container").style.display = "flex";
        generateButton.innerText = "Finished";
    } else {
        alert(data.error);
        generateButton.disabled = false;
        generateButton.style.opacity = "1";
        generateButton.innerText = "Generate Summary";
        randomButton.disabled = false;
        randomButton.style.opacity = "1";
    }
}

function continueToNext() {
    response_count++;
    document.getElementById("response-counter").innerText = `${response_count}/5`;
    document.getElementById("continue-container").style.display = "none";

    const responseBox = document.getElementById("response-box");
    const sourceBox = document.getElementById("source-box");
    const correctionBox = document.getElementById("correction-box");
    document.getElementById("historical_figure").value = "";
    responseBox.innerHTML = `<p></p>`;
    sourceBox.innerHTML = `<p></p>`;
    correctionBox.innerHTML = `<p></p>`;
    correctionBox.style.display = "none";

    const generateButton = document.querySelector("button[onclick='generateResponses()']");
    generateButton.disabled = false;
    generateButton.style.opacity = "1";
    generateButton.innerText = "Generate Summary";
    const randomButton = document.querySelector("button[onclick='getRandomHistoricalFigure()']");
    randomButton.disabled = false;
    randomButton.style.opacity = "1";

    if (response_count > 5) {
        document.getElementById("main-section").style.display = "none";
        document.getElementById("preface-section-2").style.display = "block";
    }
}

function continueToPostSurvey() {
    document.getElementById("second-activity").style.display = "none";
    document.getElementById("post-form-section").style.display = "block";
}

async function recordUserChoice(userThinksTrue) {
    const correct = (userThinksTrue === is_accurate);
    const resultModal = document.getElementById("result-modal");
    const resultText = document.getElementById("result-text");
    const correctionBox = document.getElementById("correction-box");
    const modalButton = document.getElementById("modal-button");
    const responseBox = document.getElementById("response-box");

    if (correct) {
        resultModal.style.backgroundColor = "#2ecc71";
        resultText.innerHTML = "Correct! 🎉";
    } else {
        resultModal.style.backgroundColor = "#e74c3c";
        resultText.innerHTML = "Incorrect! ❌";
    }

    let user_response;
    if (userThinksTrue) {
        user_response = "Accurate";
    } else {
        user_response = "Inaccurate";
    }

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

    const response = await fetch("http://127.0.0.1:5000/store-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            auth_key: auth_key,
            user_id: user_id,
            historical_figure: historical_figure,
            accurate: accurate,
            inaccurate: inaccurate,
            correction: correction,
            presented_to_user: presented,
            user_response: user_response,
            is_correct: correct
        })
    });

    if (response.ok) {
        resultModal.style.display = "block";
        resultModal.style.opacity = "1";
        document.getElementById("continue-container").style.display = "block";
        document.getElementById("button-container").style.display = "none";
        document.getElementById("button-question").style.display = "none";

        modalButton.onclick = function () {
            resultModal.style.opacity = "0";
            setTimeout(() => {
                resultModal.style.display = "none";
            }, 500);
        };

        if (response_count > 5) {
            document.getElementById("continue-container").innerHTML = "<p>All responses completed.</p>";
        }
    } else {
        alert("Bad data!");
    }
}

function toggleInstructions() {
    const checkbox = document.getElementById("custom-checkbox");
    const instructions = document.getElementById("instructions");
    instructions.readOnly = !checkbox.checked;
}

function setInstructions() {
    const selectedOption = document.querySelector('input[name="instruction-option"]:checked').value;

    if (!activity_two_data) {
        alert("Error: Activity 2 data not loaded.");
        return;
    }

    if (selectedOption === "misleading") {
        document.getElementById("instructions").value = activity_two_data.misleading;
        document.getElementById("prompt").value = activity_two_data.misleading_prompt;
    } else if (selectedOption === "time_traveler") {
        document.getElementById("instructions").value = activity_two_data.time_traveler;
        document.getElementById("prompt").value = activity_two_data.time_traveler_prompt;
    } else if (selectedOption === "alien") {
        document.getElementById("instructions").value = activity_two_data.alien;
        document.getElementById("prompt").value = activity_two_data.alien_prompt;
    }
}

async function generateNewResponse() {
    const instructions = document.getElementById("instructions").value;
    const prompt = document.getElementById("prompt").value;

    if (!auth_key) {
        alert("You must authenticate first!");
        return;
    }

    if (!prompt.trim()) {
        alert("Please enter a prompt.");
        return;
    }

    const generateButton = document.getElementById("generate-new-button");
    generateButton.disabled = true;
    generateButton.style.opacity = "0.5";
    generateButton.innerText = "Generating...";

    document.getElementById("loader-new").style.display = "block";

    const response = await fetch("http://127.0.0.1:5000/generate-new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            auth_key: auth_key,
            user_id: user_id,
            instructions: instructions,
            prompt: prompt
        })
    });

    const data = await response.json();
    document.getElementById("loader-new").style.display = "none";

    if (response.ok) {
        document.getElementById("new-response-box").innerHTML = `<p>${data.responses}</p>`;
        document.getElementById("continue-container-2").style.display = "block";
    } else {
        alert("Error generating response.");
    }

    generateButton.disabled = false;
    generateButton.style.opacity = "1";
    generateButton.innerText = "Generate";
}