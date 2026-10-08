// AUTH PAGE INTERACTIVE LOGIC
document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) { location.href = '/dashboard.html'; return; }

  // ================= WELCOME TO SMART CAMPUS SPLASH ANIMATION =================
  const splash = document.getElementById('smart-campus-splash');
  if (splash) {
    const hideSplash = () => {
      splash.classList.add('hide-splash');
      setTimeout(() => { splash.style.display = 'none'; }, 700);
    };

    // Auto transition to login after 1.8s
    const splashTimer = setTimeout(hideSplash, 1800);

    // Skip button for instant entry
    document.getElementById('splash-skip-btn')?.addEventListener('click', () => {
      clearTimeout(splashTimer);
      hideSplash();
    });
  }

  const loginTab = document.getElementById('tab-login');
  const registerTab = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  // ================= TAB SWITCHING =================
  if (loginTab && registerTab) {
    loginTab.addEventListener('click', () => switchTab('login'));
    registerTab.addEventListener('click', () => switchTab('register'));
  }

  document.getElementById('switch-to-register')?.addEventListener('click', (e) => {
    e.preventDefault(); switchTab('register');
  });

  document.getElementById('switch-to-login')?.addEventListener('click', (e) => {
    e.preventDefault(); switchTab('login');
  });

  // Check URL parameter for ?tab=register
  const params = new URLSearchParams(location.search);
  if (params.get('tab') === 'register') switchTab('register');

  function switchTab(tab) {
    if (tab === 'login') {
      loginTab?.classList.add('active');
      registerTab?.classList.remove('active');
      loginForm?.classList.remove('hidden');
      registerForm?.classList.add('hidden');
    } else {
      registerTab?.classList.add('active');
      loginTab?.classList.remove('active');
      registerForm?.classList.remove('hidden');
      loginForm?.classList.add('hidden');
    }
  }

  // ================= 1-CLICK DEMO ACCOUNT CHIPS =================
  document.querySelectorAll('.demo-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const emailInput = document.getElementById('login-email');
      const passInput = document.getElementById('login-pass');
      if (emailInput && passInput) {
        emailInput.value = chip.dataset.email || '';
        passInput.value = chip.dataset.pass || '';
        
        // Visual pulse highlight
        emailInput.style.borderColor = 'var(--accent-found)';
        passInput.style.borderColor = 'var(--accent-found)';
        setTimeout(() => {
          emailInput.style.borderColor = '';
          passInput.style.borderColor = '';
        }, 800);

        toast('Demo Loaded! ⚡', `Filled: ${chip.dataset.email}`, 'info');
      }
    });
  });

  // ================= SHOW / HIDE PASSWORD TOGGLE =================
  const eyeOpenSvg = `<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  const eyeOffSvg = `<svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

  document.querySelectorAll('.pwd-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;

      if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = eyeOffSvg;
        btn.title = "Hide Password";
      } else {
        input.type = 'password';
        btn.innerHTML = eyeOpenSvg;
        btn.title = "Show Password";
      }
    });
  });

  // ================= STRICT 10-DIGIT PHONE FILTER =================
  const phoneInput = document.getElementById('reg-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      // Remove any non-digit character and cap strictly at 10 digits
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    });
  }

  // ================= FORGOT PASSWORD MODAL =================
  document.getElementById('forgot-pass-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    showModal({
      title: '🔐 Password Reset Assistance',
      body: 'As this is an official campus community portal, password resets can be requested by reaching out to your college IT admin or by logging into your student email. For demo purposes, you can use any of the 1-Click Demo accounts provided above!',
      confirmText: 'Got It!',
      onConfirm: () => {}
    });
  });

  // ================= REAL-TIME PASSWORD STRENGTH =================
  const regPass = document.getElementById('reg-pass');
  const regConfirm = document.getElementById('reg-confirm');
  const matchIndicator = document.getElementById('pwd-match-indicator');

  if (regPass) {
    regPass.addEventListener('input', () => {
      checkStrength(regPass.value);
      checkMatch();
    });
  }

  if (regConfirm) {
    regConfirm.addEventListener('input', checkMatch);
  }

  function checkStrength(pwd) {
    const bars = [
      document.getElementById('pbar-1'),
      document.getElementById('pbar-2'),
      document.getElementById('pbar-3'),
      document.getElementById('pbar-4')
    ];
    const label = document.getElementById('pwd-strength-text');
    if (!label || !bars[0]) return;

    if (!pwd) {
      bars.forEach(b => { if (b) b.style.background = 'rgba(255,255,255,0.1)'; });
      label.textContent = 'Password strength';
      label.style.color = 'var(--text-muted)';
      return;
    }

    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const colors = ['#ff4757', '#ffa502', '#2ed573', '#2ed573'];
    const texts = ['Weak (min. 6 characters)', 'Fair', 'Good', 'Strong & Secure 💪'];

    bars.forEach((b, idx) => {
      if (b) {
        b.style.background = idx < score ? colors[score - 1] : 'rgba(255,255,255,0.1)';
      }
    });

    label.textContent = texts[score - 1] || 'Too short';
    label.style.color = colors[score - 1] || '#ff4757';
  }

  function checkMatch() {
    if (!regConfirm || !matchIndicator) return;
    const p1 = regPass ? regPass.value : '';
    const p2 = regConfirm.value;

    if (!p2) {
      matchIndicator.className = 'pwd-match-indicator';
      matchIndicator.textContent = '';
      return;
    }

    if (p1 === p2) {
      matchIndicator.className = 'pwd-match-indicator match';
      matchIndicator.textContent = '✅ Passwords match perfectly';
    } else {
      matchIndicator.className = 'pwd-match-indicator no-match';
      matchIndicator.textContent = '⚠️ Passwords do not match';
    }
  }

  // ================= SUBMIT LOGIN =================
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('button[type=submit]');
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-pass').value;

    setLoading(btn, true);
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setAuth(data.token, data.user);
      toast('Welcome back! 👋', `Logged in as ${data.user.name}`, 'success');
      setTimeout(() => location.href = '/dashboard.html', 700);
    } catch (err) {
      toast('Login Failed', err.message, 'error');
    } finally {
      setLoading(btn, false);
    }
  });

  // ================= SUBMIT REGISTER =================
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = registerForm.querySelector('button[type=submit]');
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-pass').value;
    const confirm = document.getElementById('reg-confirm').value;
    const college_id = document.getElementById('reg-colid').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const department = document.getElementById('reg-dept').value;
    const year = document.getElementById('reg-year').value;

    if (!department) {
      toast('Course Required', 'Please select your Course / Department.', 'warning');
      document.getElementById('reg-dept').focus();
      return;
    }

    if (!year) {
      toast('Year Required', 'Please select your Year (1, 2, 3, 4).', 'warning');
      document.getElementById('reg-year').focus();
      return;
    }

    // Strict 10-digit phone validation
    if (phone && phone.length !== 10) {
      toast('Invalid Phone Number', 'Mobile number must be exactly 10 digits.', 'warning');
      document.getElementById('reg-phone').focus();
      return;
    }

    if (password !== confirm) {
      toast('Password Mismatch', 'Passwords do not match.', 'error');
      document.getElementById('reg-confirm').focus();
      return;
    }

    if (password.length < 6) {
      toast('Weak Password', 'Password must be at least 6 characters.', 'warning');
      document.getElementById('reg-pass').focus();
      return;
    }

    setLoading(btn, true);
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, college_id, phone, department, year })
      });
      setAuth(data.token, data.user);
      toast('Account Created! 🎉', `Welcome to Smart Campus, ${data.user.name}!`, 'success');
      setTimeout(() => location.href = '/dashboard.html', 700);
    } catch (err) {
      toast('Registration Failed', err.message, 'error');
    } finally {
      setLoading(btn, false);
    }
  });

  function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    btn.innerHTML = loading
      ? '<span class="loader"></span> Please wait...'
      : btn.dataset.text || btn.textContent;
    if (!loading && !btn.dataset.text) btn.dataset.text = btn.textContent;
  }
});
