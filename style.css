<script>
// ── DATA STORE (in-memory, replace with backend/localStorage for persistence) ──
const ADMIN_USER = 'Romaysa';
const ADMIN_PASS = 'Henna2026';

let availability = {}; 
let appointments = []; 
let selectedSlot = null; 
let isAdmin = false;

// ── SLOTS DISPLAY ──
function renderSlots() {
  const el = document.getElementById('slotsDisplay');
  const keys = Object.keys(availability).sort();
  if (keys.length === 0) {
    el.innerHTML = '<p class="no-slots">Momenteel geen beschikbaarheid gepland. Neem contact op voor persoonlijke afspraak.</p>';
    return;
  }
  el.innerHTML = keys.map(date => {
    const times = availability[date];
    const dateObj = new Date(date + 'T12:00:00');
    const dayStr = dateObj.toLocaleDateString('nl-NL', { weekday:'long', day:'numeric', month:'long' });
    const timeButtons = times.map(t => {
      const booked = appointments.some(a => a.date === date && a.time === t);
      const sel = selectedSlot && selectedSlot.date === date && selectedSlot.time === t;
      return `<button class="slot-btn${booked?' booked':''}${sel?' selected':''}"
        ${booked ? 'disabled' : `onclick="selectSlot('${date}','${t}')"`}>
        ${t}${booked ? ' (vol)' : ''}
      </button>`;
    }).join('');
    return `<div class="slot-day">
      <div class="slot-date">${dayStr}</div>
      <div class="slot-times">${timeButtons}</div>
    </div>`;
  }).join('');
}

function selectSlot(date, time) {
  selectedSlot = { date, time };
  const dateObj = new Date(date + 'T12:00:00');
  const dayStr = dateObj.toLocaleDateString('nl-NL', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  document.getElementById('selectedSlotDisplay').textContent = `✓  ${dayStr} om ${time}`;
  renderSlots();
}

// ── BOOKING ──
function submitBooking() {
  const name = document.getElementById('bookName').value.trim();
  const email = document.getElementById('bookEmail').value.trim();
  const phone = document.getElementById('bookPhone').value.trim();
  const type = document.getElementById('bookType').value;
  const errEl = document.getElementById('bookError');
  const sucEl = document.getElementById('bookSuccess');
  errEl.style.display = 'none';
  sucEl.style.display = 'none';

  if (!name || !email || !phone || !selectedSlot) {
    errEl.style.display = 'block';
    return;
  }
  appointments.push({ name, email, phone, type: type || 'Niet opgegeven', date: selectedSlot.date, time: selectedSlot.time });
  sucEl.style.display = 'block';
  document.getElementById('bookName').value = '';
  document.getElementById('bookEmail').value = '';
  document.getElementById('bookPhone').value = '';
  document.getElementById('bookType').value = '';
  document.getElementById('selectedSlotDisplay').textContent = '← Selecteer eerst een tijd';
  selectedSlot = null;
  renderSlots();
  if (isAdmin) renderAdminAppointments();
}

// ── ADMIN LOGIN ──
document.getElementById('adminLoginBtn').onclick = (e) => {
  e.preventDefault();
  if (isAdmin) { scrollToAdmin(); return; }
  document.getElementById('loginModal').classList.add('show');
  setTimeout(() => document.getElementById('loginUser').focus(), 100);
};

function closeLoginModal() {
  document.getElementById('loginModal').classList.remove('show');
  document.getElementById('loginError').style.display = 'none';
}

function doLogin() {
  const u = document.getElementById('loginUser').value;
  const p = document.getElementById('loginPass').value;
  if (u === ADMIN_USER && p === ADMIN_PASS) {
    isAdmin = true;
    closeLoginModal();
    document.getElementById('admin').style.display = 'block';
    renderAdminSlots();
    renderAdminAppointments();
    scrollToAdmin();
    document.getElementById('adminLoginBtn').textContent = 'Admin ✓';
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
}

function logoutAdmin() {
  isAdmin = false;
  document.getElementById('admin').style.display = 'none';
  document.getElementById('adminLoginBtn').textContent = 'Admin';
}

function scrollToAdmin() {
  document.getElementById('admin').scrollIntoView({ behavior: 'smooth' });
}

// ── ADMIN AVAILABILITY ──
function addTimeField() {
  const c = document.getElementById('timesContainer');
  const inp = document.createElement('input');
  inp.type = 'time';
  inp.className = 'adminTime';
  inp.style.marginBottom = '0.5rem';
  c.appendChild(inp);
}

function saveAvailability() {
  const date = document.getElementById('adminDate').value;
  if (!date) { alert('Selecteer een datum.'); return; }
  const times = [...document.querySelectorAll('.adminTime')]
    .map(i => i.value).filter(v => v);
  if (times.length === 0) { alert('Voeg minimaal één tijd toe.'); return; }
  availability[date] = [...new Set([...(availability[date] || []), ...times])].sort();
  renderSlots();
  renderAdminSlots();
  document.getElementById('adminDate').value = '';
  document.querySelectorAll('.adminTime').forEach((el, i) => { if (i > 0) el.remove(); else el.value = ''; });
}

function renderAdminSlots() {
  const list = document.getElementById('adminSlotList');
  const keys = Object.keys(availability).sort();
  if (keys.length === 0) { list.innerHTML = '<li style="color:rgba(250,246,240,0.3);font-style:italic">Geen slots</li>'; return; }
  list.innerHTML = keys.map(date => {
    const dateObj = new Date(date + 'T12:00:00');
    const dayStr = dateObj.toLocaleDateString('nl-NL', { day:'numeric', month:'short' });
    return `<li>
      <span>${dayStr}: ${availability[date].join(', ')}</span>
      <button class="btn-danger" onclick="deleteDay('${date}')">✕</button>
    </li>`;
  }).join('');
}

function deleteDay(date) {
  if (confirm(`Verwijder alle slots op ${date}?`)) {
    delete availability[date];
    renderSlots();
    renderAdminSlots();
  }
}

// ── ADMIN APPOINTMENTS ──
function renderAdminAppointments() {
  const tbody = document.getElementById('adminAppointmentsTbody');
  if (appointments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:rgba(250,246,240,0.3);font-style:italic;text-align:center;padding:1.5rem">Nog geen afspraken</td></tr>';
    return;
  }
  tbody.innerHTML = appointments.map(a => {
    const dateObj = new Date(a.date + 'T12:00:00');
    const dayStr = dateObj.toLocaleDateString('nl-NL', { day:'numeric', month:'short', year:'numeric' });
    return `<tr>
      <td><strong>${a.name}</strong></td>
      <td>${dayStr}<br>${a.time}</td>
      <td style="font-size:0.72rem">${a.email}<br>${a.phone}</td>
      <td style="font-size:0.72rem">${a.type}</td>
      <td><span class="badge-status badge-new">Nieuw</span></td>
    </tr>`;
  }).join('');
}

// ── SCROLL ANIMATION ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// ── INIT ──
renderSlots();

</script>
