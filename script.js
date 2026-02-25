// ── SUPABASE INIT ──
const { createClient } = supabase;
const db = createClient(
  'https://tcwuqxpwrtnxewfnpwzn.supabase.co',
  'sb_publishable_s9qgpelxpWq4YiISdjYbiw_1Vc_8Cu2'
);

// ── SELECTED SLOT ──
let selectedSlot = null;

// ── RENDER PUBLIC SLOTS ──
async function renderSlots() {
  const display = document.getElementById('slotsDisplay');
  if (!display) return;

  const { data: slots, error: slotsErr } = await db
    .from('slots')
    .select('*')
    .order('date', { ascending: true });

  const { data: appts } = await db
    .from('appointments')
    .select('date, time, status')
    .neq('status', 'cancelled');

  if (slotsErr || !slots || slots.length === 0) {
    display.innerHTML =
      '<p class="no-slots">Momenteel geen beschikbare tijden. Kom later terug of neem contact op.</p>';
    return;
  }

  const bookedSet = new Set(
    (appts || []).map(a => a.date + '_' + a.time)
  );

  display.innerHTML = slots.map(slot => {
    const { date, times } = slot;
    if (!times || times.length === 0) return '';

    const formattedDate = new Date(date + 'T00:00:00')
      .toLocaleDateString('nl-NL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

    const sortedTimes = [...times].sort();

    const timeButtons = sortedTimes.map(time => {
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
  if (display) display.textContent = `✓ ${formattedDate} om ${time}`;
}

// ── SUBMIT BOOKING ──
async function submitBooking() {
  const name  = document.getElementById('bookName').value.trim();
  const email = document.getElementById('bookEmail').value.trim();
  const phone = document.getElementById('bookPhone').value.trim();
  const type  = document.getElementById('bookType').value;

  const errEl = document.getElementById('bookError');
  const sucEl = document.getElementById('bookSuccess');

  errEl.style.display = 'none';
  sucEl.style.display = 'none';

  if (!name || !email || !phone || !selectedSlot) {
    errEl.textContent = 'Vul alle velden in en selecteer een tijd.';
    errEl.style.display = 'block';
    return;
  }

  // Check for double booking
  const { data: existing } = await db
    .from('appointments')
    .select('id')
    .eq('date', selectedSlot.date)
    .eq('time', selectedSlot.time)
    .neq('status', 'cancelled');

  if (existing && existing.length > 0) {
    errEl.textContent = 'Deze tijd is net geboekt. Kies een andere.';
    errEl.style.display = 'block';
    return;
  }

  const { error } = await db.from('appointments').insert([{
    name,
    email,
    phone,
    type,
    date: selectedSlot.date,
    time: selectedSlot.time,
    status: 'new',
    created_at: new Date().toISOString()
  }]);

  if (error) {
    errEl.textContent = 'Er ging iets mis. Probeer opnieuw.';
    errEl.style.display = 'block';
    console.error('Supabase insert error:', error);
    return;
  }

  // Send confirmation email
  const formattedDate = new Date(selectedSlot.date + 'T00:00:00')
    .toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

  if (typeof emailjs !== 'undefined') {
    emailjs.send("service_ca3aat6", "template_dgmwras", {
      to_name: name,
      email,
      appointment_date: formattedDate,
      appointment_time: selectedSlot.time,
      appointment_type: type || 'Niet opgegeven'
    }).catch(err => console.error('EmailJS fout:', err));
  }

  // Reset form
  sucEl.style.display = 'block';
  document.getElementById('bookName').value = '';
  document.getElementById('bookEmail').value = '';
  document.getElementById('bookPhone').value = '';
  document.getElementById('bookType').value = '';
  selectedSlot = null;

  const slotDisplay = document.getElementById('selectedSlotDisplay');
  if (slotDisplay) slotDisplay.textContent = '← Selecteer eerst een tijd';

  renderSlots();

  const adminEl = document.getElementById('admin');
  if (adminEl && adminEl.style.display !== 'none') {
    renderAdminSlots();
    renderAdminAppointments();
  }
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
async function saveAvailability() {
  const date = document.getElementById('adminDate').value;
  if (!date) { alert('Selecteer een datum.'); return; }

  const newTimes = Array.from(document.querySelectorAll('.adminTime'))
    .map(i => i.value)
    .filter(Boolean);

  if (newTimes.length === 0) { alert('Voeg minstens één tijd toe.'); return; }

  // Check if a row for this date already exists
  const { data: existing } = await db
    .from('slots')
    .select('id, times')
    .eq('date', date)
    .maybeSingle();

  if (existing) {
    // Merge times, avoid duplicates
    const merged = [...new Set([...existing.times, ...newTimes])].sort();
    const { error } = await db
      .from('slots')
      .update({ times: merged })
      .eq('id', existing.id);

    if (error) { alert('Fout bij opslaan.'); console.error(error); return; }
  } else {
    const { error } = await db
      .from('slots')
      .insert([{ date, times: newTimes.sort() }]);

    if (error) { alert('Fout bij opslaan.'); console.error(error); return; }
  }

  document.getElementById('adminDate').value = '';
  document.getElementById('timesContainer').innerHTML =
    '<input type="time" class="adminTime" style="margin-bottom:0.5rem">';

  renderAdminSlots();
  renderSlots();
}

// ── ADMIN: RENDER SLOTS ──
async function renderAdminSlots() {
  const list = document.getElementById('adminSlotList');
  if (!list) return;

  const { data: slots } = await db
    .from('slots')
    .select('*')
    .order('date', { ascending: true });

  if (!slots || slots.length === 0) {
    list.innerHTML =
      '<li style="color:rgba(250,246,240,0.3);font-style:italic">Nog geen slots opgeslagen.</li>';
    return;
  }

  list.innerHTML = slots.map(slot => {
    const formattedDate = new Date(slot.date + 'T00:00:00')
      .toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

    const sortedTimes = [...(slot.times || [])].sort();

    return `
      <li>
        <span>${formattedDate}: ${sortedTimes.join(', ')}</span>
        <button class="btn-danger" onclick="deleteSlotDay('${slot.id}')">Verwijder</button>
      </li>
    `;
  }).join('');
}

async function deleteSlotDay(id) {
  await db.from('slots').delete().eq('id', id);
  renderAdminSlots();
  renderSlots();
}

// ── ADMIN: RENDER APPOINTMENTS ──
async function renderAdminAppointments() {
  const tbody = document.getElementById('adminAppointmentsTbody');
  if (!tbody) return;

  const { data: appts } = await db
    .from('appointments')
    .select('*')
    .order('created_at', { ascending: false });

  if (!appts || appts.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align:center;padding:1.5rem;font-style:italic;color:rgba(250,246,240,0.3)">Nog geen afspraken</td></tr>';
    return;
  }

  tbody.innerHTML = appts.map(a => {
    const formattedDate = new Date(a.date + 'T00:00:00')
      .toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });

    return `
      <tr>
        <td>${a.name}</td>
        <td>${formattedDate}<br>${a.time}</td>
        <td style="font-size:0.7rem">${a.email}<br>${a.phone}</td>
        <td style="font-size:0.7rem">${a.type || '—'}</td>
        <td>${a.status}</td>
        <td>
          <button class="btn-danger" onclick="deleteAppointment(${a.id})">Verwijder</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function deleteAppointment(id) {
  await db.from('appointments').delete().eq('id', id);
  renderAdminAppointments();
  renderSlots();
}

// ── SCROLL ANIMATION ──
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// ── INIT ──
renderSlots();
