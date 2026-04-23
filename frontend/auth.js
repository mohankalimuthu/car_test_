function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.form-section').forEach(f => f.classList.remove('active'));

    if (tab === 'admin') {
        document.getElementById('admin-form').classList.add('active');
    } else {
        if (tab === 'login') {
            document.querySelectorAll('.tab')[0].classList.add('active');
            document.getElementById('login-form').classList.add('active');
        } else {
            document.querySelectorAll('.tab')[1].classList.add('active');
            document.getElementById('register-form').classList.add('active');
        }
    }

    hideMessage();
}

function showMessage(text, type) {
    const msg = document.getElementById('message');
    msg.textContent = text;
    msg.className = `message ${type}`;
    msg.style.display = 'block';
}

function hideMessage() {
    document.getElementById('message').style.display = 'none';
}

async function handleRegister(e) {
    e.preventDefault();

    const data = {
        first_name: document.getElementById('reg-firstname').value,
        last_name: document.getElementById('reg-lastname').value,
        date_of_birth: document.getElementById('reg-dob').value,
        internship_domain: document.getElementById('reg-domain').value,
        internship_role: document.getElementById('reg-role').value,
        favorite_unique_name: document.getElementById('reg-favorite').value,
        email: document.getElementById('reg-email').value
    };

    try {
        const response = await fetch(`${API_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            showMessage(`Registration successful! Your password is: ${result.password}`, 'success');
            setTimeout(() => {
                switchTab('login');
                document.getElementById('login-email').value = result.email;
                document.getElementById('login-password').value = result.password;
            }, 3000);
        } else {
            showMessage(result.detail || 'Registration failed', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
}

async function handleLogin(e) {
    e.preventDefault();

    const data = {
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
    };

    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem('user', JSON.stringify(result.user));
            window.location.href = 'test.html';
        } else {
            showMessage(result.detail || 'Login failed', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
}

async function handleAdminLogin(e) {
    e.preventDefault();

    const data = {
        email: document.getElementById('admin-email').value,
        password: document.getElementById('admin-password').value
    };

    try {
        const response = await fetch(`${API_URL}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem('admin', 'true');
            window.location.href = 'admin.html';
        } else {
            showMessage(result.detail || 'Admin login failed', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
}