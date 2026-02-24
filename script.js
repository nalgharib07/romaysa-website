/* ══════════════════════════════════════════
   Henna by Romaysa — script.js
══════════════════════════════════════════ */

// ── CREDENTIALS ────────────────────────────
const ADMIN_USER = 'Romaysa';
const ADMIN_PASS = 'Henna2026';

// ── DATA STORE (localStorage) ──────────────
const STORAGE_SLOTS = 'henna_slots';
const STORAGE_APPOINTMENTS = 'henna_appointments';

function getSlots() {
  return JSON.parse(localStorage.getItem(STORAGE_SLOTS) || '{}');
}
function saveSlots(data) {
  localStorage.setItem(STORAGE_SLOTS, JSON.stringify(data));
}
function getAppointments() {
  return JSON.parse(localStorage.getItem(STORAGE_APPOINTMENTS) || '[]');
}
function saveAppointments(data) {
  localStorage.setItem(STORAGE_APPOINTMENTS, JSON.stringify(data));
}

// ── STATE ──────────────────────────────────
let selectedSlot = null; // { date, time }

// ── SCROLL ANIMATIONS ──────────────────────
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

// ── FORMAT DATE NICELY ─────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ── RENDER SLOTS (public booking view) ─────
function renderSlots() {
  const display = document.getElementById('slotsDisplay');
  if (!display) return;

  const slots = getSlots();
  const appts = getAppointments();

  const bookedKeys = new Set(appts.map(a => `${a.date}__${a.time}`));

  const today = new Date().toISOString().slice(0, 10);
  const dates = Object.keys(slots).filter(d => d >= today).sort();

  if (dates.length === 0) {
    display.innerHTML = '<p class="no-slots">Er zijn momenteel geen beschikbare tijden. Kom binnenkort terug!</p>';
    return;
  }

  display.innerHTML = dates.map(date => {
    const times = slots[date];
    if (!times || times.length === 0) return '';

    const timeButtons = times.map(time => {
      const key = `${date}__${time}`;
      const isBooked = bookedKeys.has(key);
      return `<button
        class="slot-btn ${isBooked ? 'booked' : ''}"
        onclick="${isBooked ? '' : `selectSlot('${date}','${time}')`}"
        ${isBooked ? 'disabled title="Niet beschikbaar"' : ''}
      >${time}</button>`;
    }).join('');

    return `
      <div class="slot-day">
        <div class="slot-date">${formatDate(date)}</div>
        <div class="slot-times">${timeButtons}</div>
      </div>`;
  }).join('');
}

// ── SELECT A SLOT ──────────────────────────
function selectSlot(date, time) {
  selectedSlot = { date, time };

  document.querySelectorAll('.slot-btn').forEach(btn => btn.classList.remove('selected'));
  event.target.classList.add('selected');

  const display = document.getElementById('selectedSlotDisplay');
  if (display) {
    display.textContent = `✦ ${formatDate(date)} om ${time}`;
  }
}

// ── SUBMIT BOOKING ─────────────────────────
function submitBooking() {
  const name  = document.getElementById('bookName')?.value.trim();
  const email = document.getElementById('bookEmail')?.value.trim();
  const phone = document.getElementById('bookPhone')?.value.trim();
  const type  = document.getElementById('bookType')?.value;

  const successEl = document.getElementById('bookSuccess');
  const errorEl   = document.getElementById('bookError');

  if (successEl) successEl.style.display = 'none';
  if (errorEl)   errorEl.style.display   = 'none';

  if (!name || !email || !phone || !selectedSlot) {
    if (errorEl) errorEl.style.display = 'block';
    return;
  }

  const appts = getAppointments();
  appts.push({
    name, email, phone,
    type: type || '—',
    date: selectedSlot.date,
    time: selectedSlot.time,
    status: 'Nieuw',
    createdAt: new Date().toISOString()
  });
  saveAppointments(appts);

  renderSlots();

  selectedSlot = null;
  const slotDisplay = document.getElementById('selectedSlotDisplay');
  if (slotDisplay) slotDisplay.textContent = '← Selecteer eerst een tijd';
  ['bookName','bookEmail','bookPhone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const bookType = document.getElementById('bookType');
  if (bookType) bookType.value = '';

  if (successEl) successEl.style.display = 'block';
  renderAdminAppointments();
}

// ── ADMIN LOGIN MODAL ──────────────────────
document.getElementById('adminLoginBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('loginModal').classList.add('show');
});

function closeLoginModal() {
  document.getElementById('loginModal').classList.remove('show');
  document.getElementById('loginError').style.display = 'none';
}

document.getElementById('loginModal')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('loginModal')) closeLoginModal();
});

function doLogin() {
  const user = document.getElementById('loginUser')?.value;
  const pass = document.getElementById('loginPass')?.value;

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    closeLoginModal();
    document.getElementById('admin').style.display = 'block';
    document.getElementById('admin').scrollIntoView({ behavior: 'smooth' });
    renderAdminSlots();
    renderAdminAppointments();
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
}

function logoutAdmin() {
  document.getElementById('admin').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── ADMIN: ADD TIME FIELD ──────────────────
function addTimeField() {
  const container = document.getElementById('timesContainer');
  const input = document.createElement('input');
  input.type = 'time';
  input.className = 'adminTime';
  input.style.marginBottom = '0.5rem';
  container.appendChild(input);
}

// ── ADMIN: SAVE AVAILABILITY ───────────────
function saveAvailability() {
  const date = document.getElementById('adminDate')?.value;
  if (!date) { alert('Selecteer een datum'); return; }

  const timeInputs = document.querySelectorAll('.adminTime');
  const times = Array.from(timeInputs).map(i => i.value).filter(Boolean).sort();
  if (times.length === 0) { alert('Voeg minstens één tijd toe'); return; }

  const slots = getSlots();
  const existing = slots[date] || [];
  slots[date] = [...new Set([...existing, ...times])].sort();
  saveSlots(slots);

  document.getElementById('adminDate').value = '';
  document.querySelectorAll('.adminTime').forEach((el, i) => {
    if (i === 0) el.value = '';
    else el.remove();
  });

  renderAdminSlots();
  renderSlots();
}

// ── ADMIN: RENDER SLOTS ────────────────────
function renderAdminSlots() {
  const list = document.getElementById('adminSlotList');
  if (!list) return;

  const slots = getSlots();
  const dates = Object.keys(slots).sort();

  if (dates.length === 0) {
    list.innerHTML = '<li style="color:rgba(250,246,240,0.3);font-style:italic">Geen slots opgeslagen</li>';
    return;
  }

  list.innerHTML = dates.map(date => `
    <li>
      <span><strong>${formatDate(date)}</strong><br>
      <span style="opacity:0.6;font-size:0.75rem">${slots[date].join(', ')}</span></span>
      <button class="btn-danger" onclick="deleteSlotDate('${date}')">✕ Verwijder</button>
    </li>`).join('');
}

function deleteSlotDate(date) {
  if (!confirm(`Verwijder alle tijden voor ${formatDate(date)}?`)) return;
  const slots = getSlots();
  delete slots[date];
  saveSlots(slots);
  renderAdminSlots();
  renderSlots();
}

// ── ADMIN: RENDER APPOINTMENTS ─────────────
function renderAdminAppointments() {
  const tbody = document.getElementById('adminAppointmentsTbody');
  if (!tbody) return;

  const appts = getAppointments();

  if (appts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:rgba(250,246,240,0.3);font-style:italic;text-align:center;padding:1.5rem">Nog geen afspraken</td></tr>';
    return;
  }

  const sorted = [...appts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  tbody.innerHTML = sorted.map(a => `
    <tr>
      <td>${a.name}</td>
      <td>${formatDate(a.date)}<br><span style="opacity:0.6">${a.time}</span></td>
      <td>${a.email}<br><span style="opacity:0.6">${a.phone}</span></td>
      <td>${a.type}</td>
      <td><span class="badge-status badge-new">${a.status}</span></td>
    </tr>`).join('');
}

// ── INIT ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  renderSlots();
});
