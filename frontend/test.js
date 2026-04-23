let currentUser = null;
let aptitudeQuestions = [];
let technicalQuestions = [];
let currentSection = 'aptitude';
let currentQuestionIndex = 0;
let aptitudeAnswers = [];
let technicalAnswers = [];
let questionTimer = null;
let timeLeft = 60;

// Check if user is logged in
window.onload = function() {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = JSON.parse(user);

    // Accept checkbox handler
    document.getElementById('accept-checkbox').addEventListener('change', function() {
        document.getElementById('start-btn').disabled = !this.checked;
    });

    // Start button handler
    document.getElementById('start-btn').addEventListener('click', startTest);
};

async function startTest() {
    try {
        // Load questions
        await loadQuestions();

        // Hide instructions, show test
        document.getElementById('instructions-overlay').classList.add('hidden');
        document.getElementById('test-interface').classList.remove('hidden');

        // Start camera
        startCamera();

        // Load first question
        loadQuestion();

        // Start timer
        startTimer();
    } catch (error) {
        alert('Failed to load test. Please try again.');
    }
}

async function loadQuestions() {
    // Load aptitude questions
    const aptResponse = await fetch(`${API_URL}/api/questions/aptitude`);
    const aptData = await aptResponse.json();
    aptitudeQuestions = aptData.questions;
    aptitudeAnswers = new Array(aptitudeQuestions.length).fill(null);

    // Load technical questions
    const techResponse = await fetch(`${API_URL}/api/questions/technical`);
    const techData = await techResponse.json();
    technicalQuestions = techData.questions;
    technicalAnswers = new Array(technicalQuestions.length).fill(null);

    // Build navigator
    buildNavigator();
}

function buildNavigator() {
    const grid = document.getElementById('question-grid');
    grid.innerHTML = '';

    const questions = currentSection === 'aptitude' ? aptitudeQuestions : technicalQuestions;

    questions.forEach((q, index) => {
        const btn = document.createElement('button');
        btn.className = 'q-nav-btn not-visited';
        btn.textContent = index + 1;
        btn.onclick = () => jumpToQuestion(index);
        grid.appendChild(btn);
    });

    updateNavigatorStatus();
}

function updateNavigatorStatus() {
    const buttons = document.querySelectorAll('.q-nav-btn');
    const answers = currentSection === 'aptitude' ? aptitudeAnswers : technicalAnswers;

    buttons.forEach((btn, index) => {
        btn.classList.remove('not-visited', 'answered', 'skipped', 'current');

        if (index === currentQuestionIndex) {
            btn.classList.add('current');
        }

        if (answers[index] !== null) {
            btn.classList.add('answered');
        } else if (index < currentQuestionIndex) {
            btn.classList.add('skipped');
        } else {
            btn.classList.add('not-visited');
        }
    });
}

function loadQuestion() {
    const questions = currentSection === 'aptitude' ? aptitudeQuestions : technicalQuestions;
    const answers = currentSection === 'aptitude' ? aptitudeAnswers : technicalAnswers;

    if (currentQuestionIndex >= questions.length) {
        if (currentSection === 'aptitude') {
            switchToTechnical();
        } else {
            submitTest();
        }
        return;
    }

    const question = questions[currentQuestionIndex];

    // Update section info
    document.getElementById('section-info').textContent =
        currentSection === 'aptitude' ? 'Aptitude Section' : 'Technical Section';

    // Update question number and text
    document.getElementById('question-number').textContent =
        `Question ${currentQuestionIndex + 1} of ${questions.length}`;
    document.getElementById('question-text').textContent = question.question;

    // Load options
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        if (answers[currentQuestionIndex] === index) {
            optionDiv.classList.add('selected');
        }

        optionDiv.innerHTML = `
            <input type="radio" name="answer" id="option-${index}" value="${index}" 
                ${answers[currentQuestionIndex] === index ? 'checked' : ''}>
            <label for="option-${index}">${option}</label>
        `;

        optionDiv.onclick = () => selectOption(index);
        optionsContainer.appendChild(optionDiv);
    });

    // Update buttons
    document.getElementById('prev-btn').disabled = currentQuestionIndex === 0;

    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const isLastSection = currentSection === 'technical';

    if (isLastQuestion && isLastSection) {
        document.getElementById('next-btn').classList.add('hidden');
        document.getElementById('submit-btn').classList.remove('hidden');
    } else {
        document.getElementById('next-btn').classList.remove('hidden');
        document.getElementById('submit-btn').classList.add('hidden');
    }

    updateNavigatorStatus();
    resetTimer();
}

function selectOption(index) {
    const answers = currentSection === 'aptitude' ? aptitudeAnswers : technicalAnswers;
    answers[currentQuestionIndex] = index;

    // Update UI
    document.querySelectorAll('.option').forEach((opt, i) => {
        opt.classList.toggle('selected', i === index);
        opt.querySelector('input').checked = i === index;
    });

    updateNavigatorStatus();
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
}

function nextQuestion() {
    const questions = currentSection === 'aptitude' ? aptitudeQuestions : technicalQuestions;

    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else {
        if (currentSection === 'aptitude') {
            switchToTechnical();
        }
    }
}

function jumpToQuestion(index) {
    currentQuestionIndex = index;
    loadQuestion();
}

function switchToTechnical() {
    currentSection = 'technical';
    currentQuestionIndex = 0;
    buildNavigator();
    loadQuestion();
}

function startTimer() {
    resetTimer();
}

function resetTimer() {
    timeLeft = 60;
    clearInterval(questionTimer);
    updateTimerDisplay();

    questionTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(questionTimer);
            nextQuestion();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer').textContent =
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

async function submitTest() {
    if (!confirm('Are you sure you want to submit the test? You cannot retake it later.')) {
        return;
    }

    clearInterval(questionTimer);

    try {
        const response = await fetch(`${API_URL}/api/submit-test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: currentUser.email,
                aptitude_answers: aptitudeAnswers,
                technical_answers: technicalAnswers
            })
        });

        const result = await response.json();

        if (response.ok) {
            showResult(result);
        } else {
            alert('Submission failed: ' + result.detail);
        }
    } catch (error) {
        alert('Network error during submission. Please try again.');
    }
}

function showResult(result) {
    document.body.innerHTML = `
        <div class="result-container">
            <h1>✅ Test Submitted Successfully!</h1>
            <div class="score-card">
                <div class="score-item">
                    <span>Aptitude Score:</span>
                    <span>${result.aptitude_score} / ${aptitudeQuestions.length}</span>
                </div>
                <div class="score-item">
                    <span>Technical Score:</span>
                    <span>${result.technical_score} / ${technicalQuestions.length}</span>
                </div>
                <div class="score-item">
                    <span>Total Score:</span>
                    <span>${result.total_score} / ${aptitudeQuestions.length + technicalQuestions.length}</span>
                </div>
            </div>
            <p style="margin-top: 30px; color: #666;">Thank you for taking the test! You can now close this window.Our HR team will contact you soon regarding the next steps. Please stay tuned.</p>
        </div>
    `;

    localStorage.removeItem('user');
}

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        document.getElementById('camera-video').srcObject = stream;
    } catch (error) {
        console.log('Camera not available:', error);
    }
}