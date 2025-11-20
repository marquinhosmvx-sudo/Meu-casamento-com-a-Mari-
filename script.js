// ================= CONFIG =================
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxlt34Su4OU1k0bXsBBEJ4537jlTPqT-1pvGBfPD8L9HjuCAQVR9J8TGNWUtrz04DMqsA/exec";
// Change to a secure key you prefer:
const ADMIN_KEY = "minhachave123";

// Apply background to header using CSS var
function applyBackground(url) {
  if (!url) return;
  document.documentElement.style.setProperty('--hero-bg-url', `url("${url}")`);
  const header = document.querySelector('header');
  if (header) {
    header.style.backgroundImage = `linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.55)), url("${url}")`;
  }
}

// Load settings (background)
async function loadSettings() {
  try {
    const resp = await fetch(APPS_SCRIPT_URL + "?action=getSettings");
    const json = await resp.json();
    if (json && json.backgroundUrl) applyBackground(json.backgroundUrl);
  } catch (err) { console.warn("settings:", err); }
}
loadSettings();

// Admin icon open modal with key prompt (if adminIcon exists)
const adminIcon = document.getElementById('adminIcon');
if (adminIcon) {
  const adminModal = document.getElementById('adminModal');
  const closeAdmin = document.getElementById('closeAdmin');
  const adminMsg = document.getElementById('adminMsg');

  adminIcon.addEventListener('click', async () => {
    const key = prompt("Informe a chave de admin:");
    if (key === ADMIN_KEY) {
      adminModal.setAttribute('aria-hidden','false');
      adminMsg.textContent = "";
    } else {
      alert("Chave incorreta.");
    }
  });
  closeAdmin.addEventListener('click', ()=> adminModal.setAttribute('aria-hidden','true'));
}

// helper: file->base64
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = ()=> res(reader.result);
    reader.onerror = ()=> rej();
    reader.readAsDataURL(file);
  });
}

// Upload bg (if elements exist)
const uploadBtn = document.getElementById('uploadBgBtn');
if (uploadBtn) {
  uploadBtn.addEventListener('click', async () => {
    const fileInput = document.getElementById('bgFile');
    const adminMsg = document.getElementById('adminMsg');
    if (!fileInput.files.length) { adminMsg.textContent = "Selecione um arquivo."; adminMsg.style.color = "red"; return; }
    const file = fileInput.files[0];
    if (file.size > 10*1024*1024) { adminMsg.textContent = "Máx 10MB."; adminMsg.style.color="red"; return; }
    adminMsg.textContent = "Enviando...";
    try {
      const dataUrl = await fileToBase64(file);
      const payload = { action: "setBackground", photoBase64: dataUrl, photoMimeType: file.type, photoFilename: `background_${Date.now()}.${file.type.split('/')[1]}` };
      const r = await fetch(APPS_SCRIPT_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      const j = await r.json();
      if (j.status==="success") { applyBackground(j.fileUrl); adminMsg.textContent = "Fundo atualizado!"; adminMsg.style.color="green"; } else { adminMsg.textContent = "Erro: "+(j.message||""); adminMsg.style.color="red"; }
    } catch (err) { adminMsg.textContent="Erro no upload."; adminMsg.style.color="red"; console.error(err); }
  });
}

// Set Bg by URL (if element exists)
const setBgBtn = document.getElementById('setBgUrlBtn');
if (setBgBtn) {
  setBgBtn.addEventListener('click', async () => {
    const urlInput = document.getElementById('bgUrl');
    const adminMsg = document.getElementById('adminMsg');
    const url = urlInput.value.trim();
    if (!url) { adminMsg.textContent="Cole a URL."; adminMsg.style.color="red"; return; }
    try {
      const r = await fetch(APPS_SCRIPT_URL + "?action=setBackgroundUrl&url=" + encodeURIComponent(url));
      const j = await r.json();
      if (j.status==="success") { applyBackground(url); adminMsg.textContent = "Fundo salvo!"; adminMsg.style.color="green"; }
      else { applyBackground(url); adminMsg.textContent="Aplicado localmente."; adminMsg.style.color="orange"; }
    } catch(err){ applyBackground(url); adminMsg.textContent="Aplicado localmente."; adminMsg.style.color="orange"; }
  });
}

// RSVP handler (works on confirm.html or index if present)
const rsvpForm = document.getElementById('rsvpForm');
if (rsvpForm) {
  rsvpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('rsvpMessage');
    if (msg) msg.textContent = "Enviando...";
    try {
      const payload = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        willAttend: document.getElementById('willAttend').value,
        guests: document.getElementById('guests').value,
        notes: document.getElementById('messageToCouple') ? document.getElementById('messageToCouple').value : (document.getElementById('messageToCouple') ? document.getElementById('messageToCouple').value : "")
      };
      const res = await fetch(APPS_SCRIPT_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      const j = await res.json();
      if (j.status==="success") { if (msg) msg.textContent="Presença registrada! Obrigado 💙"; rsvpForm.reset(); } else { if (msg) msg.textContent="Erro: "+(j.message||""); }
    } catch(err){ console.error(err); if (msg) msg.textContent="Erro ao enviar."; }
  });
}

// Album buttons (set links)
const uploadPhotosBtn = document.getElementById('uploadPhotosBtn');
const viewAlbumBtn = document.getElementById('viewAlbumBtn');
if (uploadPhotosBtn) uploadPhotosBtn.href = "https://docs.google.com/forms/d/1CrVJH2dAqkIYxLiQpWXlu73ZV643OP-EdZIyc2PYHMw/viewform";
if (viewAlbumBtn) viewAlbumBtn.href = "https://drive.google.com/drive/folders/1RhcxrDQdNX6hF_qx4mPU6Ezk05UkVDgK";

// GIFTS: fetch, render and reservation actions
async function fetchGifts(){
  try {
    const resp = await fetch(APPS_SCRIPT_URL + "?action=getGifts");
    const json = await resp.json();
    if (json.status !== "success") { const gw = document.getElementById('giftsWrapper'); if (gw) gw.innerHTML='<p>Não foi possível carregar no momento.</p>'; return; }
    const wrapper = document.getElementById('giftsWrapper');
    if (!wrapper) return;
    wrapper.innerHTML = '<div class="gifts-container"></div>';
    const container = wrapper.querySelector('.gifts-container');
    json.items.forEach(item=>{
      const reserved = item.reservedBy && String(item.reservedBy).trim() !== "";
      const el = document.createElement('div'); el.className='gift-item';
      el.innerHTML = `<h3>${item.name}</h3><p>${item.description||''}</p><p><a href="${item.link}" target="_blank" rel="noopener">Ir para loja</a></p><p class="reserved">${ reserved ? "Reservado por: "+item.reservedBy : "Disponível" }</p><div class="gift-actions">${ reserved ? `<button class="unreserve-btn" data-id="${item.id}">Cancelar reserva</button>` : `<button class="reserve-btn" data-id="${item.id}">Reservar</button>` }</div>`;
      container.appendChild(el);
    });
    // attach events
    document.querySelectorAll('.reserve-btn').forEach(btn=>{
      btn.addEventListener('click', async function(){
        const id = this.dataset.id;
        const name = prompt("Seu nome para reserva (será mostrado na planilha):");
        const email = prompt("Seu e-mail (opcional):");
        if (!name) return alert("Nome necessário.");
        const payload = { action:"reserve", id:id, reserverName:name, reserverEmail: email||"" };
        const res = await fetch(APPS_SCRIPT_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload) });
        const j = await res.json();
        if (j.status==="success"){ alert("Item reservado!"); fetchGifts(); } else { alert("Erro: "+(j.message||"")); }
      });
    });
    document.querySelectorAll('.unreserve-btn').forEach(btn=>{
      btn.addEventListener('click', async function(){
        const id = this.dataset.id;
        if (!confirm("Cancelar reserva?")) return;
        const payload = { action:"unreserve", id:id };
        const res = await fetch(APPS_SCRIPT_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload) });
        const j = await res.json();
        if (j.status==="success"){ alert("Reserva cancelada."); fetchGifts(); } else { alert("Erro: "+(j.message||"")); }
      });
    });
  } catch(err){ console.error("Erro fetchGifts:", err); const gw = document.getElementById('giftsWrapper'); if (gw) gw.innerHTML='<p>Erro ao carregar presentes.</p>'; }
}
fetchGifts();
