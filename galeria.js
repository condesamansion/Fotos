/* ==== URL de tu Web App (último deploy) ==== */
const API_URL = 'https://script.google.com/macros/s/AKfycbzFEegll0jVFEktgJRQzvM3d9DYjKZARsmOfnUZmU-zqszVHIqQp19-dCJ_GboyvuSs/exec';
/* ========================================== */

const grid  = document.getElementById('galleryGrid');
const empty = document.getElementById('emptyMsg');
let callbackRecibida = false;

/* --- Limpia el título para mostrar solo "Condesa - dd-mm-aa" --- */
function limpiarTitulo(t){
  return (t || '')
    .split('·')[0]
    .replace(/\s[|–—]\s.*$/, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]+$/gu, '')
    .trim();
}

/* ---------------- Render de tarjetas (sin fecha) -------------- */
function renderAlbums(albums){
  if (!Array.isArray(albums) || albums.length === 0) {
    empty.hidden = false;
    grid.innerHTML = '';
    return;
  }
  empty.hidden = true;

  grid.innerHTML = albums.map(a => {
    const title = limpiarTitulo(a.title) || 'Álbum';
    const link  = a.url || '#';
    const cover = a.cover
      ? `<img src="${esc(a.cover)}" alt="">`
      : `<span>Sin portada</span>`;
    return `
      <article class="card-album">
        <a href="${esc(link)}" target="_blank" rel="noopener">
          <div class="thumb">${cover}</div>
          <div class="meta"><h3 class="title">${esc(title)}</h3></div>
        </a>
      </article>
    `;
  }).join('');
}

/* -------------- JSONP: callback única + anticaché -------------- */
(function loadJSONP(){
  const cbName = 'handleAlbums_' + Date.now();
  window[cbName] = function(albums){
    callbackRecibida = true;
    try { renderAlbums(albums); }
    catch (e) {
      console.error('[Galería] Error renderizando:', e);
      empty.textContent = 'No se pudo mostrar la galería.';
      empty.hidden = false;
    } finally {
      delete window[cbName];
    }
  };

  const s = document.createElement('script');
  s.src = `${API_URL}?callback=${encodeURIComponent(cbName)}&nocache=${Date.now()}`;
  s.onerror = () => {
    empty.textContent = 'Error cargando la galería.';
    empty.hidden = false;
  };
  document.body.appendChild(s);

  setTimeout(() => {
    if (!callbackRecibida) {
      empty.textContent = 'No se pudo cargar la galería. Actualizá con Ctrl/Cmd+Shift+R.';
      empty.hidden = false;
    }
  }, 5000);
})();

/* ---------------- Helper: escapar HTML ---------------- */
function esc(s){
  return (s || '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[m]));
}
