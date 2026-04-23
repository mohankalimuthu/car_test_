let currentEditId = null;

window.onload = function() {
    const admin = localStorage.getItem('admin');
    if (!admin) {
        window.location.href = 'index.html';
        return;
    }

    loadUsers();
    loadQuestions();
};

function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tab + '-tab').classList.add('active');
}

function showMessage(text, type) {
    const msg = document.getElementById('message');
    msg.textContent = text;
    msg.className = `message ${type}`;
    msg.style.display = 'block';

    setTimeout(() => {
        msg.style.display = 'none';
    }, 5000);
}

async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/api/admin/users`);
        const data = await response.json();

        const tbody = document.getElementById('users-tbody');
        tbody.innerHTML = '';

        data.users.forEach(user => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.domain}</td>
                <td>${user.role}</td>
                <td>${user.aptitude_score}</td>
                <td>${user.technical_score}</td>
                <td><strong>${user.total_score}</strong></td>
                <td>
                    <span class="status-badge ${user.test_completed ? 'status-completed' : 'status-pending'}">
                        ${user.test_completed ? 'Completed' : 'Not Completed'}
                    </span>
                </td>
            `;
        });
    } catch (error) {
        showMessage('Failed to load users', 'error');
    }
}

async function loadQuestions() {
    try {
        const response = await fetch(`${API_URL}/api/admin/questions`);
        const data = await response.json();

        const aptitudeTbody = document.getElementById('aptitude-tbody');
        const technicalTbody = document.getElementById('technical-tbody');

        aptitudeTbody.innerHTML = '';
        technicalTbody.innerHTML = '';

        data.questions.forEach(q => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${q.question}</td>
                <td>
                    <ol>
                        ${q.options.map(opt => `<li>${opt}</li>`).join('')}
                    </ol>
                </td>
                <td>Option ${q.answer + 1}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick='editQuestion(${JSON.stringify(q)})'>Edit</button>
                        <button class="action-btn delete-btn" onclick="deleteQuestion('${q._id}')">Delete</button>
                    </div>
                </td>
            `;

            if (q.type === 'aptitude') {
                aptitudeTbody.appendChild(row);
            } else {
                technicalTbody.appendChild(row);
            }
        });
    } catch (error) {
        showMessage('Failed to load questions', 'error');
    }
}

function openAddQuestionModal(type) {
    currentEditId = null;
    document.getElementById('modal-title').textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)} Question`;
    document.getElementById('question-id').value = '';
    document.getElementById('question-type').value = type;
    document.getElementById('question-form').reset();
    document.getElementById('question-modal').classList.add('active');
}

function editQuestion(question) {
    currentEditId = question._id;
    document.getElementById('modal-title').textContent = 'Edit Question';
    document.getElementById('question-id').value = question._id;
    document.getElementById('question-type').value = question.type;
    document.getElementById('question-text').value = question.question;

    question.options.forEach((opt, i) => {
        document.getElementById(`option-${i}`).value = opt;
    });

    document.getElementById('correct-answer').value = question.answer;
    document.getElementById('question-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('question-modal').classList.remove('active');
}

async function handleQuestionSubmit(e) {
    e.preventDefault();

    const questionData = {
        question: document.getElementById('question-text').value,
        options: [
            document.getElementById('option-0').value,
            document.getElementById('option-1').value,
            document.getElementById('option-2').value,
            document.getElementById('option-3').value
        ],
        answer: parseInt(document.getElementById('correct-answer').value),
        type: document.getElementById('question-type').value
    };

    try {
        let response;
        if (currentEditId) {
            response = await fetch(`${API_URL}/api/admin/questions/${currentEditId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(questionData)
            });
        } else {
            response = await fetch(`${API_URL}/api/admin/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(questionData)
            });
        }

        const result = await response.json();

        if (response.ok) {
            showMessage(result.message, 'success');
            closeModal();
            loadQuestions();
        } else {
            showMessage(result.detail || 'Operation failed', 'error');
        }
    } catch (error) {
        showMessage('Network error', 'error');
    }
}

async function deleteQuestion(id) {
    if (!confirm('Are you sure you want to delete this question?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/admin/questions/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            showMessage(result.message, 'success');
            loadQuestions();
        } else {
            showMessage(result.detail || 'Delete failed', 'error');
        }
    } catch (error) {
        showMessage('Network error', 'error');
    }
}

function logout() {
    localStorage.removeItem('admin');
    window.location.href = 'index.html';
}