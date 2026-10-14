/**
 * ============================================================================
 * 1. SINTETIZADOR DE SONIDO PROCEDURAL (0 Archivos Externos)
 * ============================================================================
 */
const SoundEngine = {
  ctx: null,
  muted: false,

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },

  toggleMute() {
    this.muted = !this.muted;
    document.getElementById('btn-mute').textContent = this.muted ? '🔇' : '🔊';
    if (!this.muted) this.click();
  },

  click() {
    if (this.muted) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  },

  key() {
    if (this.muted) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1100, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.03);
  },

  success() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    [523.25, 783.99].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.11);
      gain.gain.setValueAtTime(0.18, now + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 0.22);
    });
  },

  error() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.setValueAtTime(115, now + 0.12);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  },

  glitchTape(onEndedCallback) {
    if (this.muted) {
      setTimeout(onEndedCallback, 400);
      return;
    }
    this.init();
    const duration = 1.25;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.25;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1100;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.02, this.ctx.currentTime + duration);

    const cutoffBeep = this.ctx.createOscillator();
    cutoffBeep.type = 'square';
    cutoffBeep.frequency.setValueAtTime(380, this.ctx.currentTime + 0.85);
    cutoffBeep.frequency.setValueAtTime(140, this.ctx.currentTime + 1.05);

    const beepGain = this.ctx.createGain();
    beepGain.gain.setValueAtTime(0.15, this.ctx.currentTime + 0.85);
    beepGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    cutoffBeep.connect(beepGain);
    beepGain.connect(this.ctx.destination);

    noise.start();
    cutoffBeep.start(this.ctx.currentTime + 0.85);
    cutoffBeep.stop(this.ctx.currentTime + duration);

    setTimeout(() => {
      if (onEndedCallback) onEndedCallback();
    }, duration * 1000);
  }
};

/**
 * ============================================================================
 * 2. MOTOR PRINCIPAL DE CASOS (Carga Modular JSON + Autoguardado)
 * ============================================================================
 */
const Engine = {
  catalog: [],
  currentCaseMeta: null,
  freeData: null,
  vipData: null,
  state: {},

  async init() {
    try {
      const res = await fetch('cases/catalog.json');
      const data = await res.json();
      this.catalog = data.cases;
      this.renderCatalogSelector();

      const firstAvailable = this.catalog.find(c => c.available);
      if (firstAvailable) {
        await this.loadCase(firstAvailable.id);
      }
    } catch (err) {
      document.getElementById('view-board').innerHTML = `
        <div class="clue-card">
          <span class="clue-tag">AVISO TÉCNICO</span>
          <h3>Abre el proyecto con un Servidor Local</h3>
          <p>Para cargar los archivos JSON de <code>/cases/</code>, abre esta carpeta con <strong>Live Server</strong> en VS Code o súbela a Firebase/Vercel.</p>
        </div>`;
    }
  },

  renderCatalogSelector() {
    const sel = document.getElementById('case-selector');
    sel.innerHTML = this.catalog.map(c => `
      <option value="${c.id}" ${!c.available ? 'disabled' : ''}>
        ${c.title} (${c.difficulty}) ${!c.available ? '🔒 PRÓXIMAMENTE' : ''}
      </option>
    `).join('');
  },

  async changeCase(caseId) {
    SoundEngine.click();
    await this.loadCase(caseId);
  },

  async loadCase(caseId) {
    this.currentCaseMeta = this.catalog.find(c => c.id === caseId);
    const saved = localStorage.getItem(`elmurazo_save_${caseId}`);
    this.state = saved ? JSON.parse(saved) : {
      noteUnlocked: false,
      vipUnlocked: false,
      trashUnlocked: false,
      caseSolved: false,
      attempts: 0
    };

    // 1. Cargar el JSON gratuito del caso
    const resFree = await fetch(this.currentCaseMeta.freeFile);
    this.freeData = await resFree.json();
    this.vipData = null;

    // 2. Si ya tenía el VIP desbloqueado, cargar también el JSON VIP
    if (this.state.vipUnlocked) {
      await this.loadVipJson();
    }

    document.getElementById('btn-buy-link').onclick = () => {
      SoundEngine.click();
      window.open(this.freeData.stripeCheckoutUrl, '_blank');
    };

    this.renderBoard();
    this.renderPhoneHome(false);
  },

  async loadVipJson() {
    const resVip = await fetch(this.currentCaseMeta.vipFile);
    this.vipData = await resVip.json();
  },

  saveState() {
    localStorage.setItem(`elmurazo_save_${this.currentCaseMeta.id}`, JSON.stringify(this.state));
  },

  switchMainView(view) {
    SoundEngine.click();
    document.getElementById('view-board').style.display = view === 'board' ? 'grid' : 'none';
    document.getElementById('view-phone').style.display = view === 'phone' ? 'flex' : 'none';
    document.getElementById('tab-board').classList.toggle('active', view === 'board');
    document.getElementById('tab-phone').classList.toggle('active', view === 'phone');
  },

  renderBoard() {
    const board = document.getElementById('view-board');
    let clues = [...this.freeData.boardClues];
    if (this.vipData && this.vipData.vipBoardClues) {
      clues = clues.concat(this.vipData.vipBoardClues);
    }

    board.innerHTML = clues.map(clue => `
      <div class="clue-card ${clue.isVip ? 'vip-card' : ''}">
        <span class="clue-tag">${clue.tag}</span>
        <h3>${clue.title}</h3>
        ${clue.body ? `<p>${clue.body}</p>` : ''}
        ${clue.suspects ? clue.suspects.map(s => `
          <div class="suspect-item"><strong>${s.name}:</strong> <span style="color:#94a3b8">${s.alibi}</span></div>
        `).join('') : ''}
      </div>
    `).join('');
  },

  renderPhoneHome(playSound = true) {
    if (playSound) SoundEngine.click();
    const screen = document.getElementById('phone-screen-content');
    const totalChats = this.freeData.chats.length + (this.vipData ? this.vipData.extraChats.length : 0);

    screen.innerHTML = `
      <div style="text-align:center; margin: 10px 0 16px;">
        <h2 style="font-size:1.3rem; font-family:'JetBrains Mono',monospace;">${this.freeData.victimPhoneName}</h2>
        <small style="color:var(--text-muted);">${this.state.vipUnlocked ? '🔓 MODO FORENSE VIP ACTIVO' : 'Evidencia Policial #04'}</small>
      </div>
      <div class="app-grid">
        <div class="app-icon" onclick="Engine.openApp('chats')">
          <span>💬</span>
          <small>Mensajes (${totalChats})</small>
        </div>
        <div class="app-icon" onclick="Engine.openApp('photos')">
          <span>🖼️</span>
          <small>Galería (${this.freeData.photos.length})</small>
        </div>
        <div class="app-icon" onclick="Engine.openApp('notes')">
          <span>${this.state.noteUnlocked ? '🔓' : '🔒'}</span>
          <small>Notas (PIN)</small>
        </div>
        <div class="app-icon" onclick="Engine.openApp('audio')">
          <span>🎙️</span>
          <small>Grabadora VIP</small>
        </div>
        <div class="app-icon" onclick="Engine.openApp('trash')">
          <span>🗑️</span>
          <small>Papelera ${this.state.trashUnlocked ? '🔓' : '🔒'}</small>
        </div>
        <div class="app-icon" onclick="Engine.openApp('solve')">
          <span>⚖️</span>
          <small>Resolver Caso</small>
        </div>
      </div>
    `;
  },

  openApp(appName) {
    SoundEngine.click();
    const screen = document.getElementById('phone-screen-content');

    // 1. CHATS
    if (appName === 'chats') {
      const allChats = [...this.freeData.chats, ...(this.vipData ? this.vipData.extraChats : [])];
      screen.innerHTML = `
        <div class="app-header">
          <button class="btn-back" onclick="Engine.renderPhoneHome()">← Volver</button>
          <strong>Mensajes</strong>
        </div>
        ${allChats.map(c => `
          <div class="chat-bubble">
            <span class="chat-meta">${c.sender} • ${c.time}</span>${c.text}
          </div>
        `).join('')}
      `;
    }

    // 2. FOTOS
    if (appName === 'photos') {
      screen.innerHTML = `
        <div class="app-header">
          <button class="btn-back" onclick="Engine.renderPhoneHome()">← Volver</button>
          <strong>Galería</strong>
        </div>
        ${this.freeData.photos.map(p => `
          <div class="photo-item">
            <div class="photo-visual">${p.visualText}</div>
            <strong style="font-size:0.85rem; display:block; margin-bottom:4px;">${p.title}</strong>
            <p style="font-size:0.8rem; color:var(--text-muted);">${p.caption}</p>
          </div>
        `).join('')}
      `;
    }

    // 3. NOTAS (PUZLE 1 GRATIS)
    if (appName === 'notes') {
      if (!this.state.noteUnlocked) {
        screen.innerHTML = `
          <div class="app-header">
            <button class="btn-back" onclick="Engine.renderPhoneHome()">← Volver</button>
            <strong>Notas Protegidas</strong>
          </div>
          <p style="font-size:0.85rem; color:var(--text-muted); text-align:center; margin-top:15px;">
            ${this.freeData.pinHint}
          </p>
          <input type="text" maxlength="4" id="pin-attempt" class="pin-input" placeholder="••••" oninput="SoundEngine.key()">
          <button class="btn-action" onclick="Engine.checkPin()">Desbloquear Carpeta</button>
          <p id="pin-error" style="color:var(--accent); font-size:0.8rem; text-align:center; margin-top:10px;"></p>
        `;
      } else {
        screen.innerHTML = `
          <div class="app-header">
            <button class="btn-back" onclick="Engine.renderPhoneHome()">← Volver</button>
            <strong>Nota Desbloqueada</strong>
          </div>
          <div class="photo-item" style="border-color:var(--accent);">
            <span class="clue-tag">CLAVE CORRECTA</span>
            <h4 style="margin-bottom:8px;">${this.freeData.secretNoteUnlocked.title}</h4>
            <p style="font-size:0.88rem; line-height:1.5;">${this.freeData.secretNoteUnlocked.content}</p>
            <button class="btn-action" id="btn-play-tape" style="margin-top:15px;" onclick="Engine.triggerAudioClimax(this)">
              ▶ Escuchar AUDIO_PARKING_0210.MP3
            </button>
          </div>
        `;
      }
    }

    // 4. GRABADORA VIP
    if (appName === 'audio') {
      if (!this.state.vipUnlocked) {
        this.triggerAudioClimax();
        return;
      }
      screen.innerHTML = `
        <div class="app-header">
          <button class="btn-back" onclick="Engine.renderPhoneHome()">← Volver</button>
          <strong>Grabadora Forense</strong>
        </div>
        ${this.vipData.audios.map(a => `
          <div class="photo-item" style="border-color:var(--accent-green);">
            <span class="clue-tag" style="color:var(--accent-green);">${a.duration}</span>
            <h4 style="margin-bottom:6px;">${a.title}</h4>
            <p style="font-size:0.83rem; color:#e2e8f0; line-height:1.45;">${a.transcript}</p>
          </div>
        `).join('')}
      `;
    }

    // 5. PAPELERA OCULTA (PUZLE 2 VIP)
    if (appName === 'trash') {
      if (!this.state.vipUnlocked) {
        this.triggerAudioClimax();
        return;
      }
      if (!this.state.trashUnlocked) {
        screen.innerHTML = `
          <div class="app-header">
            <button class="btn-back" onclick="Engine.renderPhoneHome()">← Volver</button>
            <strong>Papelera Cifrada</strong>
          </div>
          <p style="font-size:0.85rem; color:var(--text-muted); text-align:center; margin-top:15px;">
            ${this.vipData.trashPuzzle.hint}
          </p>
          <input type="text" maxlength="4" id="trash-pin-attempt" class="pin-input" placeholder="••••" oninput="SoundEngine.key()">
          <button class="btn-action" onclick="Engine.checkTrashPin()">Recuperar Archivos Borrados</button>
          <p id="trash-error" style="color:var(--accent); font-size:0.8rem; text-align:center; margin-top:10px;"></p>
        `;
      } else {
        screen.innerHTML = `
          <div class="app-header">
            <button class="btn-back" onclick="Engine.renderPhoneHome()">← Volver</button>
            <strong>Archivos Recuperados</strong>
          </div>
          ${this.vipData.trashPhotos.map(p => `
            <div class="photo-item" style="border-color:var(--accent-amber);">
              <div class="photo-visual">${p.visualText}</div>
              <strong style="font-size:0.85rem; display:block; margin-bottom:4px;">${p.title}</strong>
              <p style="font-size:0.8rem; color:var(--text-muted);">${p.caption}</p>
            </div>
          `).join('')}
        `;
      }
    }

    // 6. RESOLVER CASO (SENTENCIA FINAL)
    if (appName === 'solve') {
      if (!this.state.vipUnlocked) {
        this.triggerAudioClimax();
        return;
      }
      const sol = this.vipData.solution;
      screen.innerHTML = `
        <div class="app-header">
          <button class="btn-back" onclick="Engine.renderPhoneHome()">← Volver</button>
          <strong>Informe de Arresto</strong>
        </div>
        <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:10px;">
          Selecciona las 3 conclusiones forenses para emitir la orden de detención:
        </p>
        <label style="font-size:0.75rem; color:var(--accent-amber);">1. ¿QUIÉN ATACÓ A ÁLEX?</label>
        <select id="sol-killer" class="select-input">
          ${sol.killerOptions.map(o => `<option value="${o}">${o}</option>`).join('')}
        </select>

        <label style="font-size:0.75rem; color:var(--accent-amber);">2. ¿QUIÉN FUE SU CÓMPLICE?</label>
        <select id="sol-accomplice" class="select-input">
          ${sol.accompliceOptions.map(o => `<option value="${o}">${o}</option>`).join('')}
        </select>

        <label style="font-size:0.75rem; color:var(--accent-amber);">3. PRUEBA DEFINITIVA:</label>
        <select id="sol-motive" class="select-input">
          ${sol.evidenceOptions.map(o => `<option value="${o}">${o}</option>`).join('')}
        </select>

        <button class="btn-action" style="background:var(--accent-green);" onclick="Engine.submitVerdict()">
          ⚖️ Firmar Orden de Arresto
        </button>
        <div id="verdict-feedback" style="margin-top:12px;"></div>
      `;
    }
  },

  checkPin() {
    const inputEl = document.getElementById('pin-attempt');
    if (inputEl.value.trim() === this.freeData.pinCode) {
      SoundEngine.success();
      this.state.noteUnlocked = true;
      this.saveState();
      this.openApp('notes');
    } else {
      this.state.attempts++;
      this.saveState();
      SoundEngine.error();
      inputEl.classList.remove('shake-anim');
      void inputEl.offsetWidth;
      inputEl.classList.add('shake-anim');
      document.getElementById('pin-error').textContent = "❌ PIN incorrecto. Cruza el chat de Marc con la Galería.";
    }
  },

  checkTrashPin() {
    const inputEl = document.getElementById('trash-pin-attempt');
    if (inputEl.value.trim() === this.vipData.trashPuzzle.pinCode) {
      SoundEngine.success();
      this.state.trashUnlocked = true;
      this.saveState();
      this.openApp('trash');
    } else {
      this.state.attempts++;
      this.saveState();
      SoundEngine.error();
      inputEl.classList.remove('shake-anim');
      void inputEl.offsetWidth;
      inputEl.classList.add('shake-anim');
      document.getElementById('trash-error').textContent = "❌ Código incorrecto. Escucha el Audio #02 y revisa el Tablón.";
    }
  },

  submitVerdict() {
    const k = document.getElementById('sol-killer').value;
    const a = document.getElementById('sol-accomplice').value;
    const m = document.getElementById('sol-motive').value;
    const sol = this.vipData.solution;
    const fb = document.getElementById('verdict-feedback');

    if (k === sol.correctKiller && a === sol.correctAccomplice && m === sol.correctEvidence) {
      SoundEngine.success();
      this.state.caseSolved = true;
      this.saveState();
      const rank = this.state.attempts === 0 ? "Inspector Jefe (0 Fallos)" : "Detective Analista";
      fb.innerHTML = `
        <div class="photo-item" style="border-color:var(--accent-green); background:#064e3b;">
          <span class="clue-tag" style="color:#a7f3d0;">CASO CERRADO CON ÉXITO</span>
          <h4 style="margin-bottom:6px;">Rango: ${rank}</h4>
          <p style="font-size:0.82rem; line-height:1.45;">${sol.epilogue}</p>
        </div>
      `;
    } else {
      this.state.attempts++;
      this.saveState();
      SoundEngine.error();
      fb.innerHTML = `<p style="color:var(--accent); font-size:0.82rem; text-align:center;">❌ Hipótesis rechazada por el fiscal. Revisa la Papelera de fotos y los Audios.</p>`;
    }
  },

  triggerAudioClimax(btnEl) {
    if (this.state.vipUnlocked) {
      this.openApp('audio');
      return;
    }
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.textContent = "🔊 Reproduciendo grabación (00:01)...";
    }
    const phoneFrame = document.getElementById('phone-frame-el');
    phoneFrame.classList.add('shake-anim');

    SoundEngine.glitchTape(() => {
      phoneFrame.classList.remove('shake-anim');
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.textContent = "▶ Escuchar AUDIO_PARKING_0210.MP3";
      }
      document.getElementById('paywall-modal').style.display = 'flex';
    });
  },

  closePaywall() {
    SoundEngine.click();
    document.getElementById('paywall-modal').style.display = 'none';
  },

  async verifyVipCode() {
    const code = document.getElementById('vip-code-input').value.trim().toUpperCase();
    if (code === this.freeData.vipAccessCode) {
      SoundEngine.success();
      this.state.vipUnlocked = true;
      this.saveState();
      await this.loadVipJson();
      this.renderBoard();
      document.getElementById('paywall-modal').style.display = 'none';
      this.openApp('audio');
    } else {
      SoundEngine.error();
      alert("Código VIP incorrecto. Usa el código de prueba: MURAZO99");
    }
  }
};

window.addEventListener('DOMContentLoaded', () => Engine.init());
