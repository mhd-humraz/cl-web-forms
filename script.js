/* Student Registration Form – validation and behaviour (vanilla JS) */
(() => {
  'use strict';

  const form = document.getElementById('regForm');
  const successBox = document.getElementById('success');
  const submitBtn = document.getElementById('submitBtn');
  const touched = new Set(); // fields the user has already interacted with

  // ---------- Helpers ----------
  /** Read the current value of a field by its name. */
  function getValue(name) {
    const el = form.elements[name];
    if (el.type === 'checkbox') return el.checked;
    if (el.type === 'file') return el.files[0] || null;
    return (el.value || '').trim(); // text, select, radio group
  }

  const isOptionalEmpty = (v) => v === '' || v === null;

  // ---------- Validation rules ----------
  // Each rule returns an error message, or '' when the value is valid.
  // Keeping all rules in one object avoids duplicated validation logic.
  const rules = {
    fullName(v) {
      if (!v) return 'Please enter your full name.';
      if (v.length < 3) return 'Name must contain at least 3 characters.';
      if (!/^[A-Za-z][A-Za-z .'-]*$/.test(v)) return 'Name can only contain letters, spaces, . \' and -.';
      return '';
    },
    email(v) {
      if (!v) return 'Please enter your email address.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Please enter a valid email address.';
    },
    phone(v) {
      if (!v) return 'Please enter your phone number.';
      return /^\d{10}$/.test(v) ? '' : 'Phone number must contain exactly 10 digits.';
    },
    dob(v) {
      if (!v) return 'Please select your date of birth.';
      if (new Date(v) > new Date()) return 'Date of birth cannot be in the future.';
      return '';
    },
    gender: (v) => (v ? '' : 'Please select a gender option.'),
    photo(file) {
      if (!file) return '';
      if (!file.type.startsWith('image/')) return 'Please choose an image file (JPG, PNG, etc.).';
      if (file.size > 2 * 1024 * 1024) return 'Image must be smaller than 2 MB.';
      return '';
    },
    department: (v) => (v ? '' : 'Please select your department.'),
    semester: (v) => (v ? '' : 'Please select your semester.'),
    portfolio(v) {
      if (!v) return ''; // optional
      try {
        const u = new URL(v);
        return ['http:', 'https:'].includes(u.protocol) ? '' : 'URL must start with http:// or https://';
      } catch { return 'Please enter a valid URL, e.g. https://github.com/name'; }
    },
    password(v) {
      if (!v) return 'Please enter a password.';
      return v.length >= 8 ? '' : 'Password must contain at least 8 characters.';
    },
    confirmPassword(v) {
      if (!v) return 'Please confirm your password.';
      return v === getValue('password') ? '' : 'Passwords do not match.';
    },
    address(v) {
      if (!v) return 'Please enter your address.';
      return v.length >= 5 ? '' : 'Address must contain at least 5 characters.';
    },
    city: (v) => (v ? '' : 'Please enter your city.'),
    state: (v) => (v ? '' : 'Please enter your state.'),
    pin(v) {
      if (!v) return 'Please enter your PIN code.';
      return /^\d{6}$/.test(v) ? '' : 'PIN code must contain exactly 6 digits.';
    },
    terms: (v) => (v ? '' : 'Please accept the terms and conditions.')
  };

  // ---------- Show / clear feedback ----------
  function setState(name, message) {
    const wrap = form.querySelector(`[data-field="${name}"]`);
    const error = document.getElementById(`${name}-error`);
    const controls = wrap.querySelectorAll('input, select, textarea');
    const empty = isOptionalEmpty(getValue(name)) && !message && !['gender', 'terms'].includes(name);

    wrap.classList.toggle('is-invalid', Boolean(message));
    // Optional fields that are still empty stay neutral (no green tick)
    wrap.classList.toggle('is-valid', !message && !empty);
    error.textContent = message;
    controls.forEach((c) => c.setAttribute('aria-invalid', message ? 'true' : 'false'));
  }

  /** Validate one field and update the UI. Returns true when valid. */
  function validateField(name) {
    const message = rules[name](getValue(name));
    setState(name, message);
    return !message;
  }

  // ---------- Real-time validation ----------
  // Validate on blur first; after that, re-validate on every keystroke/change.
  form.addEventListener('focusout', (e) => {
    const name = e.target.name;
    if (rules[name]) { touched.add(name); validateField(name); }
  });

  form.addEventListener('input', (e) => {
    const name = e.target.name;
    if (!rules[name]) return;
    if (e.target.type === 'radio' || e.target.type === 'checkbox' || e.target.type === 'file' || e.target.tagName === 'SELECT') touched.add(name);
    if (touched.has(name)) validateField(name);
    if (name === 'password') {
      updateStrength(e.target.value);
      if (touched.has('confirmPassword')) validateField('confirmPassword'); // keep match status in sync
    }
  });

  // ---------- Password strength ----------
  function updateStrength(pw) {
    // One point for each: length >= 8, length >= 12, lowercase, uppercase, number, special character
    const score = [pw.length >= 8, pw.length >= 12, /[a-z]/.test(pw), /[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)]
      .filter(Boolean).length;
    const level = !pw ? '' : score <= 3 ? 'weak' : score <= 5 ? 'medium' : 'strong';
    const meter = document.querySelector('.strength');
    meter.className = 'strength ' + level;
    document.getElementById('strength-text').textContent =
      'Strength: ' + (level ? level[0].toUpperCase() + level.slice(1) : 'enter a password');
  }

  // ---------- Progress indicator (visual only) ----------
  const steps = document.querySelectorAll('.progress li');
  function setStep(n) {
    steps.forEach((li) => {
      const s = Number(li.dataset.step);
      li.classList.toggle('active', s === n);
      li.classList.toggle('done', s < n);
    });
  }
  form.addEventListener('focusin', (e) => {
    const section = e.target.closest('.section');
    if (section) setStep(Number(section.dataset.step));
  });

  // ---------- Submission ----------
  form.addEventListener('submit', (e) => {
    e.preventDefault(); // stop the page reload
    Object.keys(rules).forEach((n) => touched.add(n));
    const invalid = Object.keys(rules).filter((n) => !validateField(n));

    if (invalid.length) {
      // Move focus to the first invalid field so keyboard/screen-reader users find it
      const first = form.querySelector(`[data-field="${invalid[0]}"]`).querySelector('input, select, textarea');
      first.focus();
      return;
    }

    // Loading-style feedback, then show the result (no data is sent anywhere)
    submitBtn.classList.add('loading');
    submitBtn.querySelector('.btn-text').textContent = 'Submitting…';
    setTimeout(showSuccess, 900);
  });

  function showSuccess() {
    const skills = [...form.querySelectorAll('input[name="skills"]:checked')].map((c) => c.value);
    // The password is deliberately NOT included in the summary
    const rows = [
      ['Name', getValue('fullName')],
      ['Email', getValue('email')],
      ['Phone', getValue('phone')],
      ['Date of birth', getValue('dob')],
      ['Gender', getValue('gender')],
      ['Department', getValue('department')],
      ['Semester', getValue('semester')],
      ['Skills', skills.length ? skills.join(', ') : 'None selected'],
      ['Portfolio', getValue('portfolio') || 'Not provided'],
      ['City', getValue('city')],
      ['State', getValue('state')]
    ];
    const dl = document.getElementById('summary');
    dl.replaceChildren();
    rows.forEach(([label, value]) => {
      const dt = document.createElement('dt'); dt.textContent = label;
      const dd = document.createElement('dd'); dd.textContent = value; // textContent prevents HTML injection
      dl.append(dt, dd);
    });

    form.reset();
    resetUI();
    form.hidden = true;
    document.querySelector('.progress').hidden = true;
    successBox.hidden = false;
    successBox.focus();
    successBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetUI() {
    touched.clear();
    Object.keys(rules).forEach((n) => {
      const wrap = form.querySelector(`[data-field="${n}"]`);
      wrap.classList.remove('is-valid', 'is-invalid');
      document.getElementById(`${n}-error`).textContent = '';
    });
    updateStrength('');
    setStep(1);
    submitBtn.classList.remove('loading');
    submitBtn.querySelector('.btn-text').textContent = 'Register';
  }

  document.getElementById('againBtn').addEventListener('click', () => {
    successBox.hidden = true;
    form.hidden = false;
    document.querySelector('.progress').hidden = false;
    form.elements.fullName.focus();
  });
})();
