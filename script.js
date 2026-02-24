/* ══════════════════════════════════════════
   Henna by Romaysa — script.js
   Database: Supabase | Emails: EmailJS
══════════════════════════════════════════ */

// ════════════════════════════════════════════
// ██  STEP 1 — SUPABASE SETUP
// ════════════════════════════════════════════
// 1. Go to https://supabase.com → Sign up (free)
// 2. Click "New Project" → give it a name like "henna-romaysa"
// 3. Wait for it to load, then go to: Settings → API
// 4. Copy your "Project URL" and "anon public" key below
// 5. Then go to: Table Editor → New Table
//    Create two tables:
//
//  TABLE 1 — "slots"
//    Columns:
//      id          (int8, primary key, auto-increment) ✓ default
//      date        (text, not null)
//      times       (text[], not null)   ← this is an array of times
//      created_at  (timestamptz)        ✓ default
//
//  TABLE 2 — "appointments"
//    Columns:
//      id          (int8, primary key, auto-increment) ✓ default
//      name        (text, not null)
//      email       (text, not null)
//      phone       (text, not null)
//      type        (text)
//      date        (text, not null)
//      time        (text, not null)
//      status      (text, default: 'Nieuw')
//      created_at  (timestamptz)        ✓ default
//
// 6. For both tables: go to Authentication → Policies
//    Click "Enable RLS" then add policy → "Allow all" for now
//    (or just disable RLS for simplicity during development)
// ═══════════════════════════════════════════

const SUPABASE_URL = 'https://tcwuqxpwrtnxewfnpwzn.supabase.co';        // ← vervang dit
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjd3VxeHB3cnRueGV3Zm5wd3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTgyNTMsImV4cCI6MjA4NzUzNDI1M30.6uSOTsSoODDQ24fRFbmfjYDMa5NbaPKMC28x5ABayEU'; // ← vervang dit

// Lightweight Supabase client (no npm needed)
const sb = {
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  },
  async get(table, query = '') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: this.headers
    });
    return res.json();
  },
  async post(table, body) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...this.headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(body)
    });
    return res.json();
  },
  async patch(table, id, body) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH',
      headers: { ...this.headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(body)
    });
    return res.json();
  },
  async delete(table, id) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: 'DELETE',
      headers: this.headers
    });
  }
};

// ════════════════════════════════════════════
// ██  STEP 2 — EMAILJS SETUP
// ════════════════════════════════════════════
// 1. Go to https://www.emailjs.com → Sign up (free)
// 2. Go to "Email Services" → Add Service → Gmail
//    Connect your romaysahamdaoui0@gmail.com
//    Copy the Service ID (e.g. "service_abc123") → paste below
//
// 3. Go to "Email Templates" → Create Template
//    Set "To Email" field to: {{to_email}}
//    Set "Subject" to: Bevestiging afspraak – Henna by Romaysa
//
//    In the body, paste this template:
//    ─────────────────────────────────────────
//    Hallo {{to_name}},
//
//    Bedankt voor je afspraak bij Henna by Romaysa! 🌿
//
//    Hier zijn je gegevens:
//    📅 Datum: {{appointment_date}}
//    🕐 Tijd: {{appointment_time}}
//    💅 Type: {{appointment_type}}
//
//    We kijken ernaar uit je te verwelkomen!
//    Mocht je vragen hebben, neem dan contact op via:
//    📱 +31 6 12 37 76 58
//    ✉ romaysahamdaoui0@gmail.com
//
//    Tot snel,
//    Romaysa 🌸
//    ─────────────────────────────────────────
//    Copy the Template ID (e.g. "template_xyz789") → paste below
//
// 4. Go to "Account" → copy your Public Key → paste below
// ════════════════════════════════════════════

const EMAILJS_SERVICE_ID  = 'service_ca3aat6';   // ← vervang dit
const EMAILJS_TEMPLATE_ID = 'template_dgmwras';  // ← vervang dit
const EMAILJS_PUBLIC_KEY  = 'OBXg9Iq7PHs9H2qi4';   // ← vervang dit

// ── CREDENTIALS ────────────────────────────
const ADMIN_USER = 'Romaysa';
const ADMIN_PASS = 'Henna2026';

// ── STATE ──────────────────────────────────
let selectedSlot = null; // { date, time }

// ── SCROLL ANIMATIONS ──────────────────────
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

// ── FORMAT DATE NICELY ─────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ════════════════════════════════════════════
// ██  PUBLIC BOOKING VIEW
// ════════════════════════════════════════════

async function renderSlots() {
  const display = document.getElementById('slotsDisplay');
  if (!display) return;

  display.innerHTML = '<p class="no-slots">Beschikbaarheid laden...</p>';

  try {
    const today = new Date().toISOString().slice(0, 10);

    const [slotsData, appts] = await Promise.all([
      sb.get('slots', `date=gte.${today}&order=date.asc`),
      sb.get('appointments', 'select=date,time')
    ]);

    const bookedKeys = new Set((appts || []).map(a => `${a.date}__${a.time}`));

    if (!slotsData || slotsData.length === 0) {
      display.innerHTML = '<p class="no-slots">Er zijn momenteel geen beschikbare tijden. Kom binnenkort terug!</p>';
      return;
    }

    display.innerHTML = slotsData.map(slot => {
      const times = slot.times || [];
      if (times.length === 0) return '';

      const timeButtons = times.map(time => {
        const key = `${slot.date}__${time}`;
        const isBooked = bookedKeys.has(key);
        return `<button
          class="slot-btn ${isBooked ? 'booked' : ''}"
          onclick="${isBooked ? '' : `selectSlot('${slot.date}','${time}')`}"
          ${isBooked ? 'disabled title="Niet beschikbaar"' : ''}
        >${time}</button>`;
      }).join('');

      return `
        <div class="slot-day">
          <div class="slot-date">${formatDate(slot.date)}</div>
          <div class="slot-times">${timeButtons}</div>
        </div>`;
    }).join('');

  } catch (err) {
    console.error('renderSlots error:', err);
    display.innerHTML = '<p class="no-slots">Kon beschikbaarheid niet laden. Probeer opnieuw.</p>';
  }
}

function selectSlot(date, time) {
  selectedSlot = { date, time };
  document.querySelectorAll('.slot-btn').forEach(btn => btn.classList.remove('selected'));
  event.target.classList.add('selected');
  const display = document.getElementById('selectedSlotDisplay');
  if (display) display.textContent = `✦ ${formatDate(date)} om ${time}`;
}

// ── SUBMIT BOOKING ─────────────────────────
async function submitBooking() {
  const name  = document.getElementById('bookName')?.value.trim();
  const email = document.getElementById('bookEmail')?.value.trim();
  const phone = document.getElementById('bookPhone')?.value.trim();
  const type  = document.getElementById('bookType')?.value;

  const successEl = document.getElementById('bookSuccess');
  const errorEl   = document.getElementById('bookError');
  const submitBtn = document.querySelector('#boeken .btn-primary');

  if (successEl) successEl.style.display = 'none';
  if (errorEl)   errorEl.style.display   = 'none';

  if (!name || !email || !phone || !selectedSlot) {
    if (errorEl) errorEl.style.display = 'block';
    return;
  }

  // Disable button during submit
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Bezig...'; }

  try {
    // 1. Save to Supabase
    await sb.post('appointments', {
      name,
      email,
      phone,
      type: type || '—',
      date: selectedSlot.date,
      time: selectedSlot.time,
      status: 'Nieuw'
    });

    // 2. Send confirmation email via EmailJS
    await sendConfirmationEmail({
      to_name: name,
      to_email: email,
      appointment_date: formatDate(selectedSlot.date),
      appointment_time: selectedSlot.time,
      appointment_type: type || 'Niet opgegeven'
    });

    // 3. Reset form
    selectedSlot = null;
    const slotDisplay = document.getElementById('selectedSlotDisplay');
    if (slotDisplay) slotDisplay.textContent = '← Selecteer eerst een tijd';
    ['bookName','bookEmail','bookPhone'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const bookType = document.getElementById('bookType');
    if (bookType) bookType.value = '';
    document.querySelectorAll('.slot-btn').forEach(btn => btn.classList.remove('selected'));

    if (successEl) successEl.style.display = 'block';
    await renderSlots();
    await renderAdminAppointments();

  } catch (err) {
    console.error('Booking error:', err);
    if (errorEl) {
      errorEl.textContent = 'Er ging iets mis. Probeer opnieuw of neem contact op.';
      errorEl.style.display = 'block';
    }
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Bevestig Afspraak'; }
  }
}

// ── SEND EMAIL VIA EMAILJS ─────────────────
function sendConfirmationEmail(params) {
  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params, EMAILJS_PUBLIC_KEY);
}

// ════════════════════════════════════════════
// ██  ADMIN PANEL
// ════════════════════════════════════════════

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

// ── ADD TIME FIELD ──────────────────────────
function addTimeField() {
  const container = document.getElementById('timesContainer');
  const input = document.createElement('input');
  input.type = 'time';
  input.className = 'adminTime';
  input.style.marginBottom = '0.5rem';
  container.appendChild(input);
}

// ── SAVE AVAILABILITY ──────────────────────
async function saveAvailability() {
  const date = document.getElementById('adminDate')?.value;
  if (!date) { alert('Selecteer een datum'); return; }

  const timeInputs = document.querySelectorAll('.adminTime');
  const newTimes = Array.from(timeInputs).map(i => i.value).filter(Boolean).sort();
  if (newTimes.length === 0) { alert('Voeg minstens één tijd toe'); return; }

  try {
    // Check if date already exists
    const existing = await sb.get('slots', `date=eq.${date}`);

    if (existing && existing.length > 0) {
      // Merge times
      const merged = [...new Set([...(existing[0].times || []), ...newTimes])].sort();
      await sb.patch('slots', existing[0].id, { times: merged });
    } else {
      // New date
      await sb.post('slots', { date, times: newTimes });
    }

    // Reset inputs
    document.getElementById('adminDate').value = '';
    document.querySelectorAll('.adminTime').forEach((el, i) => {
      if (i === 0) el.value = '';
      else el.remove();
    });

    await renderAdminSlots();
    await renderSlots();

  } catch (err) {
    console.error('saveAvailability error:', err);
    alert('Kon niet opslaan. Controleer je Supabase instellingen.');
  }
}

// ── ADMIN: RENDER SLOTS ────────────────────
async function renderAdminSlots() {
  const list = document.getElementById('adminSlotList');
  if (!list) return;

  list.innerHTML = '<li style="opacity:0.5;font-style:italic">Laden...</li>';

  try {
    const slots = await sb.get('slots', 'order=date.asc');

    if (!slots || slots.length === 0) {
      list.innerHTML = '<li style="color:rgba(250,246,240,0.3);font-style:italic">Geen slots opgeslagen</li>';
      return;
    }

    list.innerHTML = slots.map(slot => `
      <li>
        <span>
          <strong>${formatDate(slot.date)}</strong><br>
          <span style="opacity:0.6;font-size:0.75rem">${(slot.times || []).join(', ')}</span>
        </span>
        <button class="btn-danger" onclick="deleteSlotDate(${slot.id}, '${slot.date}')">✕ Verwijder</button>
      </li>`).join('');

  } catch (err) {
    list.innerHTML = '<li style="color:red;">Fout bij laden slots.</li>';
  }
}

async function deleteSlotDate(id, date) {
  if (!confirm(`Verwijder alle tijden voor ${formatDate(date)}?`)) return;
  await sb.delete('slots', id);
  await renderAdminSlots();
  await renderSlots();
}

// ── ADMIN: RENDER APPOINTMENTS ─────────────
async function renderAdminAppointments() {
  const tbody = document.getElementById('adminAppointmentsTbody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" style="color:rgba(250,246,240,0.3);font-style:italic;text-align:center;padding:1.5rem">Laden...</td></tr>';

  try {
    const appts = await sb.get('appointments', 'order=created_at.desc');

    if (!appts || appts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="color:rgba(250,246,240,0.3);font-style:italic;text-align:center;padding:1.5rem">Nog geen afspraken</td></tr>';
      return;
    }

    tbody.innerHTML = appts.map(a => `
      <tr>
        <td>${a.name}</td>
        <td>${formatDate(a.date)}<br><span style="opacity:0.6">${a.time}</span></td>
        <td>${a.email}<br><span style="opacity:0.6">${a.phone}</span></td>
        <td>${a.type}</td>
        <td><span class="badge-status badge-new">${a.status}</span></td>
        <td>
          <button class="btn-danger" onclick="deleteAppointment(${a.id}, '${a.name}')" style="font-size:0.75rem;padding:0.3rem 0.6rem">
            ✕ Verwijder
          </button>
        </td>
      </tr>`).join('');

  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:red;text-align:center;padding:1rem">Fout bij laden afspraken.</td></tr>';
  }
}

async function deleteAppointment(id, name) {
  if (!confirm(`Weet je zeker dat je de afspraak van ${name} wilt verwijderen?`)) return;
  await sb.delete('appointments', id);
  await renderAdminAppointments();
  await renderSlots(); // refresh booked status
}

// ── INIT ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Load EmailJS SDK dynamically
  const emailjsScript = document.createElement('script');
  emailjsScript.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
  emailjsScript.onload = () => emailjs.init(EMAILJS_PUBLIC_KEY);
  document.head.appendChild(emailjsScript);

  initScrollAnimations();
  renderSlots();
});
