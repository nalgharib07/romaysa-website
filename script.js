// ── STORAGE KEYS ──
const SLOTS_KEY = 'henna_slots';
const APPTS_KEY = 'henna_appointments';

// ── HELPERS ──
function getSlots() {
  return JSON.parse(localStorage.getItem(SLOTS_KEY) || '{}');
}
function saveSlots(data) {
  localStorage.setItem(SLOTS_KEY, JSON.stringify(data));
}
function getAppointments() {
  return JSON.parse(localStorage.getItem(APPTS_KEY) || '[]');
}
function saveAppointments(data) {
  localStorage.setItem(APPTS_KEY, JSON.stringify(data));
}

// ── SELECTED SLOT ──
let selectedSlot = null;

// ── RENDER PUBLIC SLOTS ──
function renderSlots() {
  const slots = getSlots();
  const appts = getAppointments();
  const display = document.getElementById('slotsDisplay');
  if (!display) return;

  const bookedSet = new Set(
    appts
      .filter(a => a.status !== 'cancelled')
      .map(a => a.date + '_' + a.time)
  );

  const sortedDates = Object.keys(slots).sort();

  if (sortedDates.length === 0) {
    display.innerHTML =
      '<p class="no-slots">Momenteel geen beschikbare tijden. Kom later terug of neem contact op.</p>';
    return;
  }

  display.innerHTML = sortedDates.map(date => {
    const times = slots[date];
    if (!times || times.length === 0) return '';

    const formattedDate = new Date(date + 'T00:00:00')
      .toLocaleDateString('nl-NL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

    const timeButtons = times.map(time => {
      const key = date + '_' + time;
      const isBooked = bookedSet.has(key);
      const isSelected =
        selectedSlot &&
        selectedSlot.date === date &&
        selectedSlot.time === time;

      return `<button
        class="slot-btn${isBooked ? ' booked' : ''}${isSelected ? ' selected' : ''}"
        ${isBooked ? 'disabled' : ''}
        onclick="selectSlot('${date}', '${time}', this)">
        ${time}
      </button>`;
    }).join('');

    return `
      <div class="slot-day">
        <div class="slot-date">${formattedDate}</div>
        <div class="slot-times">${timeButtons}</div>
      </div>
    `;
  }).join('');
}

function selectSlot(date, time, btn) {
  document.querySelectorAll('.slot-btn.selected')
    .forEach(b => b.classList.remove('selected'));

  btn.classList.add('selected');
  selectedSlot = { date, time };

  const formattedDate = new Date(date + 'T00:00:00')
    .toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

  const display = document.getElementById('selectedSlotDisplay');
  if (display) {
    display.textContent = `✓ ${formattedDate} om ${time}`;
  }
}

// ── SUBMIT BOOKING ──
function submitBooking() {
  const name  = document.getElementById('bookName').value.trim();
  const email = document.getElementById('bookEmail').value.trim();
  const phone = document.getElementById('bookPhone').value.trim();
  const type  = document.getElementById('bookType').value;

  const errEl = document.getElementById('bookError');
  const sucEl = document.getElementById('bookSuccess');

  errEl.style.display = 'none';
  sucEl.style.display = 'none';

  if (!name || !email || !phone || !selectedSlot) {
    errEl.style.display = 'block';
    return;
  }

  const appts = getAppointments();

  // Prevent double booking
  const alreadyBooked = appts.some(a =>
    a.date === selectedSlot.date &&
    a.time === selectedSlot.time &&
    a.status !== 'cancelled'
  );

  if (alreadyBooked) {
    errEl.textContent = 'Deze tijd is net geboekt. Kies een andere.';
    errEl.style.display = 'block';
    return;
  }

  const newAppointment = {
    id: Date.now(),
    name,
    email,
    phone,
    type,
    date: selectedSlot.date,
    time: selectedSlot.time,
    status: 'new',
    createdAt: new Date().toISOString()
  };

  appts.push(newAppointment);
  saveAppointments(appts);

  // Format date for email — capture before resetting selectedSlot
  const formattedDate = new Date(selectedSlot.date + 'T00:00:00')
    .toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

  // Capture time before resetting selectedSlot
  const bookedTime = selectedSlot.time;

  // Send confirmation email via Brevo
  const BREVO_API_KEY = 'PASTE_YOUR_NEW_API_KEY_HERE';

  fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'Henna by Romaysa', email: 'romaysaautomatic@gmail.com' },
      to: [{ email: email, name: name }],
      subject: 'Bevestiging afspraak – Henna by Romaysa 🌿',
      htmlContent: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:auto;color:#2c1a0e;padding:2rem">
          <h2 style="color:#b8933a;font-weight:normal">Henna by Romaysa</h2>
          <p>Hallo <strong>${name}</strong>,</p>
          <p>Bedankt voor je afspraak bij Henna by Romaysa! 🌿</p>
          <p>Hier zijn je gegevens:</p>
          <div style="background:#fdf6ee;border-left:3px solid #b8933a;padding:1rem 1.5rem;margin:1rem 0;border-radius:4px">
            <p style="margin:0.4rem 0">📅 <strong>Datum:</strong> ${formattedDate}</p>
            <p style="margin:0.4rem 0">🕐 <strong>Tijd:</strong> ${bookedTime}</p>
            <p style="margin:0.4rem 0">💅 <strong>Type:</strong> ${type || 'Niet opgegeven'}</p>
          </div>
          <p>We kijken ernaar uit je te verwelkomen!</p>
          <p>Mocht je vragen hebben, neem dan contact op via:<br>
            📱 +31 6 12 37 76 58<br>
            ✉ romaysahamdaoui0@gmail.com
          </p>
          <p style="margin-top:2rem">Tot snel,<br><em>Romaysa 🌸</em></p>
        </div>
      `
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log('Mail verzonden:', data);

    // Reset form after successful send
    sucEl.style.display = 'block';

    document.getElementById('bookName').value = '';
    document.getElementById('bookEmail').value = '';
    document.getElementById('bookPhone').value = '';
    document.getElementById('bookType').value = '';

    selectedSlot = null;

    const slotDisplay = document.getElementById('selectedSlotDisplay');
    if (slotDisplay) {
      slotDisplay.textContent = '← Selecteer eerst een tijd';
    }

    renderSlots();

    const adminEl = document.getElementById('admin');
    if (adminEl && adminEl.style.display !== 'none') {
      renderAdminSlots();
      renderAdminAppointments();
    }
  })
  .catch(err => {
    console.error('Mail fout:', err);

    // Still reset form even if email fails
    sucEl.style.display = 'block';

    document.getElementById('bookName').value = '';
    document.getElementById('bookEmail').value = '';
    document.getElementById('bookPhone').value = '';
    document.getElementById('bookType').value = '';

    selectedSlot = null;

    const slotDisplay = document.getElementById('selectedSlotDisplay');
    if (slotDisplay) {
      slotDisplay.textContent = '← Selecteer eerst een tijd';
    }

    renderSlots();

    const adminEl = document.getElementById('admin');
    if (adminEl && adminEl.style.display !== 'none') {
      renderAdminSlots();
      renderAdminAppointments();
    }
  });
}

// ── ADMIN LOGIN ──
const ADMIN_USER = 'Romaysa';
const ADMIN_PASS = 'Henna2026';

function doLogin() {
  const user = document.getElementById('loginUser').value;
  const pass = document.getElementById('loginPass').value;
  const err  = document.getElementById('loginError');

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    err.style.display = 'none';
    closeLoginModal();

    const adminSection = document.getElementById('admin');
    adminSection.style.display = 'block';

    renderAdminSlots();
    renderAdminAppointments();

    adminSection.scrollIntoView({ behavior: 'smooth' });
  } else {
    err.style.display = 'block';
  }
}

function logoutAdmin() {
  const adminEl = document.getElementById('admin');
  if (adminEl) adminEl.style.display = 'none';
}

function openLoginModal() {
  document.getElementById('loginModal').classList.add('show');
}

function closeLoginModal() {
  document.getElementById('loginModal').classList.remove('show');
}

const loginBtn = document.getElementById('adminLoginBtn');
if (loginBtn) {
  loginBtn.addEventListener('click', function(e) {
    e.preventDefault();
    openLoginModal();
  });
}

const loginModal = document.getElementById('loginModal');
if (loginModal) {
  loginModal.addEventListener('click', function(e) {
    if (e.target === this) closeLoginModal();
  });
}

// ── ADMIN: ADD TIME FIELD ──
function addTimeField() {
  const container = document.getElementById('timesContainer');
  const input = document.createElement('input');
  input.type = 'time';
  input.className = 'adminTime';
  input.style.marginBottom = '0.5rem';
  container.appendChild(input);
}

// ── ADMIN: SAVE AVAILABILITY ──
function saveAvailability() {
  const date = document.getElementById('adminDate').value;
  if (!date) {
    alert('Selecteer een datum.');
    return;
  }

  const times = Array.from(document.querySelectorAll('.adminTime'))
    .map(i => i.value)
    .filter(Boolean);

  if (times.length === 0) {
    alert('Voeg minstens één tijd toe.');
    return;
  }

  const slots = getSlots();
  if (!slots[date]) slots[date] = [];

  times.forEach(t => {
    if (!slots[date].includes(t)) {
      slots[date].push(t);
    }
  });

  slots[date].sort();
  saveSlots(slots);

  document.getElementById('adminDate').value = '';
  document.getElementById('timesContainer').innerHTML =
    '<input type="time" class="adminTime" style="margin-bottom:0.5rem">';

  renderAdminSlots();
  renderSlots();
}

// ── ADMIN: RENDER SLOTS ──
function renderAdminSlots() {
  const slots = getSlots();
  const list = document.getElementById('adminSlotList');
  if (!list) return;

  const sorted = Object.keys(slots).sort();

  if (sorted.length === 0) {
    list.innerHTML =
      '<li style="color:rgba(250,246,240,0.3);font-style:italic">Nog geen slots opgeslagen.</li>';
    return;
  }

  list.innerHTML = sorted.map(date => {
    const formattedDate = new Date(date + 'T00:00:00')
      .toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

    return `
      <li>
        <span>${formattedDate}: ${slots[date].join(', ')}</span>
        <button class="btn-danger" onclick="deleteSlotDay('${date}')">
          Verwijder
        </button>
      </li>
    `;
  }).join('');
}

function deleteSlotDay(date) {
  const slots = getSlots();
  delete slots[date];
  saveSlots(slots);
  renderAdminSlots();
  renderSlots();
}

// ── ADMIN: RENDER APPOINTMENTS ──
function renderAdminAppointments() {
  const appts = getAppointments();
  const tbody = document.getElementById('adminAppointmentsTbody');
  if (!tbody) return;

  if (appts.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align:center;padding:1.5rem;font-style:italic;color:rgba(250,246,240,0.3)">Nog geen afspraken</td></tr>';
    return;
  }

  tbody.innerHTML = [...appts].reverse().map((a, i) => {
    const realIndex = appts.length - 1 - i;

    const formattedDate = new Date(a.date + 'T00:00:00')
      .toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'short'
      });

    return `
      <tr>
        <td>${a.name}</td>
        <td>${formattedDate}<br>${a.time}</td>
        <td style="font-size:0.7rem">${a.email}<br>${a.phone}</td>
        <td style="font-size:0.7rem">${a.type || '—'}</td>
        <td>${a.status}</td>
        <td>
          <button class="btn-danger" onclick="deleteAppointment(${realIndex})">
            Verwijder
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function deleteAppointment(index) {
  const appts = getAppointments();
  appts.splice(index, 1);
  saveAppointments(appts);
  renderAdminAppointments();
  renderSlots();
}

// ── SCROLL ANIMATION ──
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-up')
  .forEach(el => observer.observe(el));

// ── INIT ──
renderSlots();
