// PetVida Care - banner de consentimento de cookies (LGPD)
// Standalone: roda fora do bundle React, então não usa classes Tailwind
// (seriam removidas pelo purge do build). Estilos ficam isolados aqui.
(function () {
  var STORAGE_KEY = 'petvida_cookie_consent';

  function readConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveConsent(analyticsEnabled) {
    var consent = { essential: true, analytics: analyticsEnabled, updatedAt: new Date().toISOString() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch (e) {
      /* localStorage indisponível (modo privado restrito) - segue sem persistir */
    }
    window.dispatchEvent(new CustomEvent('petvida:cookie-consent', { detail: consent }));
  }

  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '.pv-cookie-banner{position:fixed;left:0;right:0;bottom:0;z-index:9999;',
      'background:#ffffff;border-top:1px solid #e2e8f0;box-shadow:0 -4px 16px rgba(15,23,42,.08);',
      'font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a}',
      '.pv-cookie-inner{max-width:960px;margin:0 auto;padding:16px 20px}',
      '.pv-cookie-text{font-size:.9rem;line-height:1.5;color:#334155;margin:0 0 12px}',
      '.pv-cookie-text a{color:#047857;text-decoration:underline}',
      '.pv-cookie-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
      '.pv-cookie-btn{border-radius:10px;padding:9px 16px;font-size:.85rem;font-weight:600;',
      'cursor:pointer;border:1px solid transparent}',
      '.pv-cookie-btn-primary{background:#10b981;color:#fff}',
      '.pv-cookie-btn-secondary{background:#fff;color:#0f172a;border-color:#cbd5e1}',
      '.pv-cookie-btn-link{background:transparent;color:#475569;text-decoration:underline;padding:9px 4px}',
      '.pv-cookie-options{display:none;margin-top:14px;padding-top:14px;border-top:1px solid #e2e8f0}',
      '.pv-cookie-options.pv-open{display:block}',
      '.pv-cookie-option{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;font-size:.85rem}',
      '.pv-cookie-option strong{display:block;font-size:.85rem}',
      '.pv-cookie-option span{color:#64748b}',
    ].join('');
    document.head.appendChild(style);
  }

  function render() {
    var banner = document.createElement('div');
    banner.className = 'pv-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Consentimento de cookies');

    banner.innerHTML = [
      '<div class="pv-cookie-inner">',
      '  <p class="pv-cookie-text">🐾 Usamos cookies essenciais para o funcionamento do PetVida Care e, com sua permissão, cookies analíticos para entender o uso do app. Veja nossa <a href="/privacidade">Política de Privacidade</a>.</p>',
      '  <div class="pv-cookie-actions">',
      '    <button type="button" class="pv-cookie-btn pv-cookie-btn-primary" data-action="accept-all">Aceitar todos</button>',
      '    <button type="button" class="pv-cookie-btn pv-cookie-btn-secondary" data-action="essential-only">Apenas essenciais</button>',
      '    <button type="button" class="pv-cookie-btn pv-cookie-btn-link" data-action="toggle-options" aria-expanded="false">Personalizar</button>',
      '  </div>',
      '  <div class="pv-cookie-options" data-options>',
      '    <div class="pv-cookie-option">',
      '      <input type="checkbox" checked disabled />',
      '      <div><strong>Essenciais</strong><span>Necessários para login e funcionamento do app. Sempre ativos.</span></div>',
      '    </div>',
      '    <div class="pv-cookie-option">',
      '      <input type="checkbox" data-analytics-toggle checked />',
      '      <div><strong>Analytics</strong><span>Nos ajuda a entender o uso do app (Google Analytics / Firebase).</span></div>',
      '    </div>',
      '    <button type="button" class="pv-cookie-btn pv-cookie-btn-primary" data-action="save-preferences">Salvar preferências</button>',
      '  </div>',
      '</div>',
    ].join('');

    document.body.appendChild(banner);

    function remove() {
      banner.remove();
    }

    banner.querySelector('[data-action="accept-all"]').addEventListener('click', function () {
      saveConsent(true);
      remove();
    });

    banner.querySelector('[data-action="essential-only"]').addEventListener('click', function () {
      saveConsent(false);
      remove();
    });

    banner.querySelector('[data-action="toggle-options"]').addEventListener('click', function (e) {
      var options = banner.querySelector('[data-options]');
      var open = options.classList.toggle('pv-open');
      e.target.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    banner.querySelector('[data-action="save-preferences"]').addEventListener('click', function () {
      var analyticsChecked = banner.querySelector('[data-analytics-toggle]').checked;
      saveConsent(analyticsChecked);
      remove();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (readConsent()) return; // já decidiu antes, não mostra de novo
    injectStyles();
    render();
  });
})();
