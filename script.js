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

// Aplicar URL manualmente e salvar via GET setBackgroundUrl (Apps Script suporta)
document.getElementById('setBgUrlBtn').addEventListener('click', async function(){
  const url = document.getElementById('bgUrl').value.trim();
  const msg = document.getElementById('adminMsg');
  if (!url) { msg.textContent = "Cole a URL da imagem."; msg.style.color = "red"; return; }

  try {
    // chama rota que grava a URL em Settings
    const res = await fetch(APPS_SCRIPT_URL + "?action=setBackgroundUrl&url=" + encodeURIComponent(url));
    const json = await res.json();
    if (json.status === "success") {
      applyBackground(url);
      msg.textContent = "Fundo aplicado e salvo com sucesso!";
      msg.style.color = "green";
    } else {
      // fallback: aplica localmente
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
