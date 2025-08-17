/* ============================================================
   index.js
   Lógica para "Ingresar nuevo álbum".
   Objetivo: mandar el link a tu Web App de Apps Script.
   - Primer intento: fetch con application/x-www-form-urlencoded (sin preflight)
   - Plan B: enviar un <form> a un <iframe> oculto (0 problemas de CORS)
   ZONA FÁCIL DE EDITAR: API_URL
   ============================================================ */

/* ==== PEGÁ AQUÍ LA URL DE TU WEB APP (termina en /exec) ==== */
const API_URL = 'https://script.google.com/macros/s/AKfycbzFEegll0jVFEktgJRQzvM3d9DYjKZARsmOfnUZmU-zqszVHIqQp19-dCJ_GboyvuSs/exec';
/* ============================================================ */

// Tomas rápidas de elementos del DOM
const $ = (s) => document.querySelector(s);
const urlInput = $('#albumUrl');
const addBtn   = $('#addBtn');
const msg      = $('#msg');

// Fallback oculto (no tocar ids/clases en el HTML)
const formFallback = $('#fallbackForm');
const fUrl         = $('#f_url');
const hiddenFrame  = $('#hiddenFrame');

/* ------------------- Función: Envío por fetch -------------------
   Enviamos como application/x-www-form-urlencoded para evitar preflight.
   Aunque no podamos LEER la respuesta por CORS, si el servidor respondió, lo damos OK.
------------------------------------------------------------------*/
async function enviarPorFetch(url) {
  const body = new URLSearchParams({ url });

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
    // Ojo: no mandamos credenciales ni headers custom => no hay preflight
  });

  // Si el HTTP fue 200-299, asumimos éxito
  if (res.ok) {
    // Intento de parseo por si el server permite leer (no es necesario)
    try {
      const data = await res.json();
      if (data && data.ok) return true;
    } catch(_) { /* si no deja leer, igual nos alcanza con res.ok */ }
    return true;
  }
  return false;
}

/* ------------------ Función: Envío por iframe -------------------
   Plan B para saltar CORS 100%.
   Hacemos submit de un <form> oculto al iframe y esperamos el evento 'load'.
------------------------------------------------------------------*/
function enviarPorIframe(url) {
  return new Promise((resolve, reject) => {
    try {
      fUrl.value = url;
      formFallback.setAttribute('action', API_URL);

      const handler = () => {
        hiddenFrame.removeEventListener('load', handler);
        resolve(true); // se cargó => asumimos que llegó al server
      };

      hiddenFrame.addEventListener('load', handler, { once:true });
      formFallback.submit();
    } catch (e) {
      reject(e);
    }
  });
}

/* ------------------ Validación simple del link ------------------ */
function esLinkValidoGooglePhotos(u) {
  if (!u) return false;
  try {
    const url = new URL(u);
    // Permitimos photos.google.com y photos.app.goo.gl (enlaces compartidos)
    return /(photos\.google\.com|photos\.app\.goo\.gl)$/i.test(url.hostname);
  } catch {
    return false;
  }
}

/* -------------------- UX: Mensajes en pantalla ------------------ */
function setMsg(texto, tipo=''){
  msg.textContent = texto || '';
  msg.className = 'msg' + (tipo ? ' ' + tipo : '');
}

/* ---------------------- Click en "Agregar" ---------------------- */
addBtn.addEventListener('click', async () => {
  const url = (urlInput.value || '').trim();

  // 1) Validación mínima
  if (!esLinkValidoGooglePhotos(url)) {
    setMsg('Pegá un link válido de Google Photos.', 'err');
    urlInput.focus();
    return;
  }

  // 2) Estado de "enviando"
  addBtn.disabled = true;
  setMsg('Enviando…');

  // 3) Intento A: fetch "simple"
  try {
    const ok = await enviarPorFetch(url);
    if (ok) {
      setMsg('Álbum agregado ✅', 'ok');
      urlInput.value = '';
      addBtn.disabled = false;
      return;
    }
  } catch (_) { /* ignoramos y vamos al plan B */ }

  // 4) Intento B: iframe oculto
  try {
    await enviarPorIframe(url);
    setMsg('Álbum agregado ✅ (modo compatibilidad)', 'ok');
    urlInput.value = '';
  } catch (e) {
    console.error(e);
    setMsg('No se pudo agregar. Revisá el link o volvé a intentar.', 'err');
  } finally {
    addBtn.disabled = false;
  }
});

/* ---- Accesibilidad: enviar con Enter dentro del input ---- */
urlInput.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter') {
    ev.preventDefault();
    addBtn.click();
  }
});
