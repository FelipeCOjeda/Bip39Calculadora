(() => {
  const LANG_LABELS = {
    english: 'English', portuguese: 'Português', spanish: 'Español', french: 'Français',
    italian: 'Italiano', czech: 'Čeština', japanese: '日本語', korean: '한국어',
    chinese_simplified: '中文(简体)', chinese_traditional: '中文(繁體)'
  };
  const CARD_NAMES = (() => {
    const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const suits = ['♠','♥','♦','♣'];
    const out = [];
    for (const s of suits) for (const r of ranks) out.push(r + s);
    return out;
  })();

  let state = {
    method: 'dados',
    variation: null,
    lang: 'portuguese',
    seedSize: 12,
    collected: [],       // {index, word}
    pendingCoinBits: [],
    checksumCandidates: [],
    selectedFinal: null
  };

  const $ = id => document.getElementById(id);

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 1600);
  }

  function targetCount() { return state.seedSize === 12 ? 11 : 23; }

  // ---------- Setup selects ----------
  function populateStaticSelects() {
    const methodSel = $('methodSelect');
    methodSel.innerHTML = BIP39Methods.all().map(m => `<option value="${m.id}">${m.label}</option>`).join('');
    methodSel.value = state.method;

    const langOptions = Object.keys(window.BIP39_WORDLISTS).map(k =>
      `<option value="${k}">${LANG_LABELS[k] || k}</option>`).join('');
    $('langSelect').innerHTML = langOptions;
    $('langSelect').value = state.lang;
    $('validateLangSelect').innerHTML = langOptions;
    $('validateLangSelect').value = state.lang;

    populateVariationSelect();
  }

  function populateVariationSelect() {
    const method = BIP39Methods.get(state.method);
    const sel = $('variationSelect');
    sel.innerHTML = method.variations.map(v => `<option value="${v.id}">${v.label}</option>`).join('');
    state.variation = method.variations[0].id;
    sel.value = state.variation;
  }

  // ---------- Input rendering per method ----------
  function renderMethodInput() {
    const method = BIP39Methods.get(state.method);
    const box = $('methodInput');
    const full = state.collected.length >= targetCount();

    if (full) {
      box.innerHTML = `<p class="muted">Todas as ${targetCount()} palavras de entropia já foram coletadas. Vá para o checksum abaixo.</p>`;
      return;
    }

    if (method.id === 'dados') {
      if (!state.dice) state.dice = [1, 1, 1, 1, 1];
      let html = '<div class="die-row">';
      for (let i = 0; i < 5; i++) html += `<div class="die" data-i="${i}">${state.dice[i]}</div>`;
      html += '</div>';
      const r = method.pick(state.dice);
      html += renderResultBox(r);
      box.innerHTML = html;
      box.querySelectorAll('.die').forEach(el => el.onclick = () => {
        const i = +el.dataset.i;
        state.dice[i] = state.dice[i] % 6 + 1;
        renderMethodInput();
      });
      wireAddButton(r);
    }

    else if (method.id === 'baralho') {
      if (state.card1 === undefined) { state.card1 = ''; state.card2 = ''; }
      const opts = CARD_NAMES.map((c, i) => `<option value="${i}">${c}</option>`).join('');
      let html = `<div class="card-selects">
        <select id="card1Sel"><option value="">Carta 1</option>${opts}</select>
        <select id="card2Sel"><option value="">Carta 2</option>${opts}</select>
      </div>`;
      let r = null;
      if (state.card1 !== '' && state.card2 !== '') {
        r = method.pick([+state.card1, +state.card2]);
        html += renderResultBox(r);
      }
      box.innerHTML = html;
      $('card1Sel').value = state.card1;
      $('card2Sel').value = state.card2;
      $('card1Sel').onchange = e => { state.card1 = e.target.value; renderMethodInput(); };
      $('card2Sel').onchange = e => { state.card2 = e.target.value; renderMethodInput(); };
      if (r) wireAddButton(r);
    }

    else if (method.id === 'bingo') {
      if (state.b1 === undefined) { state.b1 = ''; state.b2 = ''; }
      let html = `<div class="card-selects">
        <input type="number" id="b1Input" min="1" max="60" placeholder="Bola 1 (1-60)" value="${state.b1}">
        <input type="number" id="b2Input" min="1" max="60" placeholder="Bola 2 (1-60)" value="${state.b2}">
      </div>`;
      let r = null;
      const v1 = +state.b1, v2 = +state.b2;
      if (state.b1 && state.b2 && v1 >= 1 && v1 <= 60 && v2 >= 1 && v2 <= 60) {
        r = method.pick([v1, v2]);
        html += renderResultBox(r);
      }
      box.innerHTML = html;
      $('b1Input').oninput = e => { state.b1 = e.target.value; renderMethodInput(); };
      $('b2Input').oninput = e => { state.b2 = e.target.value; renderMethodInput(); };
      if (r) wireAddButton(r);
    }

    else if (method.id === 'moedas') {
      const variation = method.variations.find(v => v.id === state.variation);
      if (!state.coinBits || state.coinBits.length !== 11) state.coinBits = new Array(11).fill(null);
      let html = '';
      let flat = 0;
      variation.groups.forEach((count, gi) => {
        html += `<div class="muted" style="margin:8px 0 4px">Lançamento ${gi + 1}:</div><div class="coin-row">`;
        for (let i = 0; i < count; i++) {
          const bit = state.coinBits[flat];
          const cls = bit === 0 ? 'heads' : bit === 1 ? 'tails' : '';
          html += `<div class="coin ${cls}" data-i="${flat}">${bit === 0 ? 'C' : bit === 1 ? 'K' : '?'}</div>`;
          flat++;
        }
        if (variation.discard && gi === variation.groups.length - 1) {
          html += `<div class="coin discard" title="não usada">—</div>`;
        }
        html += '</div>';
      });
      box.innerHTML = html;
      box.querySelectorAll('.coin[data-i]').forEach(el => el.onclick = () => {
        const i = +el.dataset.i;
        state.coinBits[i] = state.coinBits[i] === null ? 0 : state.coinBits[i] === 0 ? 1 : null;
        renderMethodInput();
      });
      const allSet = state.coinBits.every(b => b === 0 || b === 1);
      if (allSet) {
        const r = method.pick(state.coinBits);
        box.insertAdjacentHTML('beforeend', renderResultBox(r));
        wireAddButton(r);
      }
    }
  }

  function renderResultBox(r) {
    const list = BIP39Core.wordlistFor(state.lang);
    if (!r.valid) {
      return `<div class="result-box"><span class="discard">⚠ ${r.discardReason}</span></div>`;
    }
    const word = list[r.index];
    return `<div class="result-box">Índice BIP39 #${r.index + 1}<div class="word">${word}</div></div>
      <button class="btn-primary" id="addWordBtn">Adicionar à seed (${state.collected.length + 1}/${targetCount()})</button>`;
  }

  function wireAddButton(r) {
    const btn = $('addWordBtn');
    if (!btn || !r.valid) return;
    btn.onclick = () => {
      const list = BIP39Core.wordlistFor(state.lang);
      state.collected.push({ index: r.index, word: list[r.index] });
      // reset per-method transient input
      state.dice = [1, 1, 1, 1, 1];
      state.card1 = ''; state.card2 = '';
      state.b1 = ''; state.b2 = '';
      state.coinBits = new Array(11).fill(null);
      renderAll();
    };
  }

  // ---------- Collected words + quality ----------
  function renderCollected() {
    const panel = $('collectedPanel');
    $('filledCount').textContent = state.collected.length;
    $('targetCount').textContent = targetCount();
    if (state.collected.length === 0) { panel.hidden = true; return; }
    panel.hidden = false;
    $('collectedChips').innerHTML = state.collected.map((w, i) =>
      `<span class="chip"><span class="idx">${i + 1}.</span>${w.word}<span class="remove" data-i="${i}">✕</span></span>`
    ).join('');
    document.querySelectorAll('#collectedChips .remove').forEach(el => el.onclick = () => {
      state.collected.splice(+el.dataset.i, 1);
      renderAll();
    });

    const q = BIP39Core.analyzeQuality(state.collected);
    const color = q.score >= 7 ? 'var(--green)' : q.score >= 4 ? 'var(--yellow)' : 'var(--red)';
    let html = `<div class="score">Entropia: ${q.score.toFixed(1)}/10</div>
      <div class="bar"><div class="bar-fill" style="width:${q.score * 10}%;background:${color}"></div></div>
      <div>${q.effectiveEntropy} bits efetivos / ${q.maxEntropy} bits máx · ${q.unique}/${q.total} palavras únicas</div>`;
    q.warnings.forEach(w => { html += `<div class="w ${w.sev}">⚠ ${w.msg}</div>`; });
    $('qualityBox').innerHTML = html;
  }

  // ---------- Checksum step ----------
  async function renderChecksumStep() {
    const panel = $('checksumPanel');
    const resultPanel = $('resultPanel');
    if (state.collected.length !== targetCount()) {
      panel.hidden = true; resultPanel.hidden = true; return;
    }
    panel.hidden = false;
    const words = state.collected.map(w => w.word);
    const candidates = await BIP39Core.checksumCandidates(words, state.lang, state.seedSize);
    state.checksumCandidates = candidates;
    $('checksumList').innerHTML = candidates.map(c =>
      `<div class="checksum-word" data-idx="${c.idx}">${c.word}<b>#${c.idx + 1}</b></div>`
    ).join('');
    document.querySelectorAll('.checksum-word').forEach(el => el.onclick = () => {
      document.querySelectorAll('.checksum-word').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
      const idx = +el.dataset.idx;
      state.selectedFinal = candidates.find(c => c.idx === idx);
      renderResult();
    });
  }

  function renderResult() {
    const panel = $('resultPanel');
    if (!state.selectedFinal) { panel.hidden = true; return; }
    panel.hidden = false;
    const words = state.collected.map(w => w.word).concat(state.selectedFinal.word);
    $('seedDisplay').innerHTML = words.map((w, i) =>
      `<span class="seed-word-tag ${i === words.length - 1 ? 'cs' : ''}"><span class="n">${i + 1}.</span>${w}</span>`
    ).join('');
    $('copySeedBtn').onclick = () => {
      navigator.clipboard.writeText(words.join(' '));
      toast('Seed copiada — cole com cuidado, apague a área de transferência depois.');
    };
  }

  function renderAll() {
    renderMethodInput();
    renderCollected();
    renderChecksumStep();
    renderResult();
  }

  // ---------- Tabs ----------
  function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.panel-tab').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      $('tab-' + btn.dataset.tab).classList.add('active');
    });
  }

  // ---------- Validate tab ----------
  function setupValidateTab() {
    $('validateBtn').onclick = async () => {
      const raw = $('validateInput').value.trim().split(/\s+/).filter(Boolean);
      const lang = $('validateLangSelect').value;
      const out = $('validateResult');
      if (raw.length !== 12 && raw.length !== 24) {
        out.innerHTML = `<div class="result-box discard">Esperado 12 ou 24 palavras, recebido ${raw.length}.</div>`;
        return;
      }
      try {
        const r = await BIP39Core.validateMnemonic(raw, lang);
        out.innerHTML = r.valid
          ? `<div class="result-box">✅ Checksum válido.</div>`
          : `<div class="result-box discard">❌ Checksum inválido para essa combinação de palavras.</div>`;
      } catch (e) {
        out.innerHTML = `<div class="result-box discard">${e.message}</div>`;
      }
    };
  }

  // ---------- Apoie tab ----------
  function setupApoieTab() {
    $('copyDonationBtn').onclick = () => {
      navigator.clipboard.writeText($('donationAddress').textContent);
      toast('Endereço copiado.');
    };
    document.querySelectorAll('.link-btn').forEach(btn => btn.onclick = async () => {
      const url = btn.dataset.url;
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser) {
        await window.Capacitor.Plugins.Browser.open({ url });
      } else {
        window.open(url, '_blank');
      }
    });
  }

  // ---------- Top-level controls ----------
  function setupControls() {
    $('methodSelect').onchange = e => {
      state.method = e.target.value;
      populateVariationSelect();
      renderAll();
    };
    $('variationSelect').onchange = e => { state.variation = e.target.value; renderAll(); };
    $('langSelect').onchange = e => { state.lang = e.target.value; renderAll(); };
    $('seedSizeSelect').onchange = e => {
      state.seedSize = +e.target.value;
      state.collected = [];
      renderAll();
    };
    $('clearBtn').onclick = () => {
      state.collected = [];
      state.selectedFinal = null;
      renderAll();
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    populateStaticSelects();
    setupControls();
    setupTabs();
    setupValidateTab();
    setupApoieTab();
    renderAll();
  });
})();
