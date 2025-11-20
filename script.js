// ================= CONFIG =================
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxlt34Su4OU1k0bXsBBEJ4537jlTPqT-1pvGBfPD8L9HjuCAQVR9J8TGNWUtrz04DMqsA/exec";
// Altere para a chave que desejar (não compartilhe publicamente)
const ADMIN_KEY = "minhachave123";

// Aplica background no header
function applyBackground(url) {
  if (!url) return;
  document.documentElement.style.setProperty('--hero-bg-url', `url("${url}")`);
  const header = document.querySelector('header');
  if (header) {
    header.style.backgroundImage = `linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.55)), url("${url}")`;
    header.style.backgroundSize = 'cover';
    header.style.backgroundPosition = 'center';
  }
}

// Busca settings (backgroundUrl) do Apps Script
async function loadSettings() {
  try {
    const resp = await fetch(APPS_SCRIPT_URL + "?action=getSettings");
    const json = await resp.json();
    if (json && json.backgroundUrl) {
      applyBackground(json.backgroundUrl);
    }
  } catch (err) {
    console.warn("Não foi possível buscar settings:", err);
  }
}
loadSettings();

// helper: converte File para dataURL (base64)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
}

// ------- ADMIN PANEL -------
document.getElementById('adminUnlock').addEventListener('click', function(){
  const key = document.getElementById('adminKey').value;
  const panel = document.getElementById('adminPanel');
  const msg = document.getElementById('adminMsg');
  if (key === ADMIN_KEY) {
    panel.style.display = 'block';
    msg.textContent = "Painel desbloqueado";
    msg.style.color = "green";
  } else {
    msg.textContent = "Chave incorreta";
    msg.style.color = "red";
  }
});

// Upload background via Apps Script (base64 JSON)
document.getElementById('uploadBgBtn').addEventListener('click', async function(){
  const fileInput = document.getElementById('bgFile');
  const msg = document.getElementById('adminMsg');
  if (!fileInput.files || fileInput.files.length === 0) {
    msg.textContent = "Selecione um arquivo primeiro.";
    msg.style.color = "red";
    return;
  }
  const file = fileInput.files[0];
  if (file.size > 10 * 1024 * 1024) {
    msg.textContent = "Arquivo muito grande. Máx 10MB.";
    msg.style.color = "red";
    return;
  }

  msg.textContent = "Enviando imagem...";
  try {
    const dataUrl = await fileToBase64(file);
    const payload = {
      action: "setBackground",
      photoBase64: dataUrl,
      photoMimeType: file.type,
      photoFilename: `background_${Date.now()}.${file.type.split('/')[1]}`
    };

    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.status === "success") {
      msg.textContent = "Fundo atualizado com sucesso!";
      msg.style.color = "green";
      applyBackground(json.fileUrl);
    } else {
      msg.textContent = "Erro: " + (json.message || "não foi possível enviar");
      msg.style.color = "red";
    }
  } catch (err) {
    console.error(err);
    msg.textContent = "Erro no envio: veja console.";
    msg.style.color = "red";
  }
});

// Aplicar URL manualmente and save via Apps Script route
document.getElementById('setBgUrlBtn').addEventListener('click', async function(){
  const url = document.getElementById('bgUrl').value.trim();
  const msg = document.getElementById('adminMsg');
  if (!url) { msg.textContent = "Cole a URL da imagem."; msg.style.color = "red"; return; }

  try {
    const res = await fetch(APPS_SCRIPT_URL + "?action=setBackgroundUrl&url=" + encodeURIComponent(url));
    const json = await res.json();
    if (json.status === "success") {
      applyBackground(url);
      msg.textContent = "Fundo aplicado e salvo com sucesso!";
      msg.style.color = "green";
    } else {
      applyBackground(url);
      msg.textContent = "Fundo aplicado localmente (não foi possível salvar no servidor).";
      msg.style.color = "orange";
    }
  } catch (err) {
    console.error(err);
    applyBackground(url);
    msg.textContent = "Aplicado localmente (erro ao salvar no servidor).";
    msg.style.color = "orange";
  }
});

// ------- RSVP handler (envia base64 para Apps Script) -------
document.getElementById("rsvpForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const msg = document.getElementById("rsvpMessage");
  msg.textContent = "Enviando...";

  try {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const willAttend = document.getElementById("willAttend").value;
    const guests = document.getElementById("guests").value;
    const notes = document.getElementById("notes").value;

    const fileInput = document.getElementById("photo");
    if (!fileInput.files || fileInput.files.length === 0) {
      msg.textContent = "Por favor, selecione uma foto para enviar.";
      return;
    }
    const file = fileInput.files[0];
    const maxSize = 8 * 1024 * 1024; // 8 MB
    if (file.size > maxSize) {
      msg.textContent = "Arquivo muito grande (máx 8 MB).";
      return;
    }

    const base64 = await fileToBase64(file);

    const payload = {
      name,
      email,
      phone,
      willAttend,
      guests,
      notes,
      photoBase64: base64,
      photoMimeType: file.type,
      photoFilename: `${name.replace(/\s+/g, "_")}_${Date.now()}.${file.type.split("/")[1]}`
    };

    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (result.status === "success") {
      msg.textContent = "Confirmação enviada com sucesso! 💙";
      document.getElementById("rsvpForm").reset();
    } else {
      msg.textContent = "Erro ao enviar: " + (result.message || "Tente novamente.");
    }
  } catch (error) {
    console.error(error);
    msg.textContent = "Erro no envio. Verifique sua conexão e tente novamente.";
  }
});

// ------- GIFTS: fetch, render e ações de reserva -------
async function fetchGifts() {
  try {
    const resp = await fetch(APPS_SCRIPT_URL + "?action=getGifts");
    const json = await resp.json();
    if (json.status !== "success") {
      document.getElementById('presentes').innerHTML = '<h2>Lista de Presentes</h2><p>Não foi possível carregar a lista no momento.</p>';
      return;
    }
    const presentSection = document.getElementById('presentes');
    presentSection.innerHTML = '<h2>Lista de Presentes</h2><p>Escolha um item e reserve para que outras pessoas não comprem o mesmo.</p>';
    const container = document.createElement('div');
    container.className = 'gifts-container';

    json.items.forEach(item => {
      const reserved = item.reservedBy && String(item.reservedBy).trim() !== "";
      const el = document.createElement('div');
      el.className = 'gift-item';
      el.innerHTML = `
        <h3>${item.name}</h3>
        <p>${item.description || ""}</p>
        <p><a href="${item.link}" target="_blank" rel="noopener">Ir para loja</a></p>
        <p class="reserved">${ reserved ? "Reservado por: " + item.reservedBy : "Disponível" }</p>
        <div class="gift-actions">
          ${ reserved ? `<button class="unreserve-btn" data-id="${item.id}">Cancelar reserva</button>` : `<button class="reserve-btn" data-id="${item.id}">Reservar</button>` }
        </div>
      `;
      container.appendChild(el);
    });

    presentSection.appendChild(container);

    // attach events
    document.querySelectorAll('.reserve-btn').forEach(btn=>{
      btn.addEventListener('click', async function(){
        const id = this.dataset.id;
        const name = prompt("Seu nome para reserva (será mostrado na planilha):");
        const email = prompt("Seu e-mail (opcional):");
        if (!name) return alert("Nome é necessário para reservar.");
        const payload = { action: "reserve", id: id, reserverName: name, reserverEmail: email || "" };
        const res = await fetch(APPS_SCRIPT_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload) });
        const j = await res.json();
        if (j.status === "success") {
          alert("Item reservado com sucesso!");
          fetchGifts();
        } else {
          alert("Erro: " + (j.message || "Não foi possível reservar"));
        }
      });
    });

    document.querySelectorAll('.unreserve-btn').forEach(btn=>{
      btn.addEventListener('click', async function(){
        const id = this.dataset.id;
        if (!confirm("Cancelar reserva deste item?")) return;
        const payload = { action: "unreserve", id: id };
        const res = await fetch(APPS_SCRIPT_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload) });
        const j = await res.json();
        if (j.status === "success") {
          alert("Reserva removida.");
          fetchGifts();
        } else {
          alert("Erro: " + (j.message || "Não foi possível cancelar"));
        }
      });
    });

  } catch (err) {
    console.error("Erro fetchGifts:", err);
    document.getElementById('presentes').innerHTML = '<h2>Lista de Presentes</h2><p>Erro ao carregar os presentes.</p>';
  }
}

fetchGifts();
