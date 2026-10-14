/**
 * ============================================================================
 * 1. SINTETIZADOR DE SONIDO PROCEDURAL
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
    document.getElementById('btn-mute').textContent = this.muted ? '🔇 5G' : '🔊 5G';
    if (!this.muted) this.click();
  },

  click() {
    if (this.muted) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(820, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(340, this.ctx.currentTime + 0.035);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.035);
  },

  key() {
    if (this.muted) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1150, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.025);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.025);
  },

  success() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    [523.25, 783.99].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.16, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.22);
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
    osc.frequency.setValueAtTime(110, now + 0.12);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }
};

/**
 * ============================================================================
 * 2. ICONOS VECTORIALES SVG (Nítidos y Brillantes)
 * ============================================================================
 */
const ICONS = {
  suspects: `<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M9 16c.5-1.5 1.8-2.5 3-2.5s2.5 1 3 2.5"/></svg>`,
  chats: `<svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  maps: `<svg viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  bank: `<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/></svg>`,
  notes: `<svg viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1"/></svg>`,
  cases: `<svg viewBox="0 0 24 24"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`,
  solve: `<svg viewBox="0 0 24 24"><path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/></svg>`
};

/**
 * ============================================================================
 * 3. SISTEMA OPERATIVO DEL MÓVIL (MURAZO OS v3)
 * ============================================================================
 */
const OS = {
  catalog: [],
  caseData: null,
  state: {},

  async init() {
    try {
      const res = await fetch('cases/catalog.json');
      const data = await res.json();
      this.catalog = data.cases;
      await this.loadCase(this.catalog[0].id, false);
    } catch (e) {
      document.getElementById('screen').innerHTML = `
        <div class="glass-card" style="margin-top:40px; border-color:var(--accent-red);">
          <span class="meta-line">AVISO DE SERVIDOR LOCAL</span>
          <h3 style="margin:8px 0;">Abre con Live Server</h3>
          <p style="font-size:0.85rem; color:var(--text-muted);">
            Abre esta carpeta con <strong>Live Server</strong> en VS Code para cargar los archivos JSON.
          </p>
        </div>`;
    }
  },

  async loadCase(caseId, playSound = true) {
    if (playSound) SoundEngine.click();
    const meta = this.catalog.find(c => c.id === caseId);

    const saved = localStorage.getItem(`elmurazo_v3_${caseId}`);
    this.state = saved ? JSON.parse(saved) : {
      notesUnlocked: false,
      bankUnlocked: false,
      solved: false,
      attempts: 0
    };

    const res = await fetch(meta.file);
    this.caseData = await res.json();
    document.getElementById('os-clock').textContent = this.caseData.phoneClock || "02:15";
    this.goHome(false);
  },

  save() {
    localStorage.setItem(`elmurazo_v3_${this.caseData.id}`, JSON.stringify(this.state));
  },

  // Limpia tildes, mayúsculas y espacios para validar respuestas escritas
  normalize(str) {
    return (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();
  },

  goHome(playSound = true) {
    if (playSound) SoundEngine.click();
    const screen = document.getElementById('screen');
    const c = this.caseData;

    screen.innerHTML = `
      <div class="forensic-widget" onclick="OS.openApp('cases')" style="cursor:pointer;">
        <div class="widget-tag">
          <span>📱 CLONACIÓN: ${c.owner}</span>
          <span>EXPEDIENTES ▾</span>
        </div>
        <h1>${c.title}</h1>
        <p>${c.summary}</p>
      </div>

      <div class="ios-grid">
        <div class="app-Launcher" onclick="OS.openApp('suspects')">
          <div class="app-squircle bg-suspects">
            ${ICONS.suspects}
            <span class="app-badge">${c.suspects.length}</span>
          </div>
          <span class="app-label">Pol-Dossier</span>
        </div>

        <div class="app-Launcher" onclick="OS.openApp('chats')">
          <div class="app-squircle bg-chat">
            ${ICONS.chats}
            <span class="app-badge">${c.chats.length}</span>
          </div>
          <span class="app-label">Mensajes</span>
        </div>

        <div class="app-Launcher" onclick="OS.openApp('mail')">
          <div class="app-squircle bg-mail">
            ${ICONS.mail}
            <span class="app-badge">${c.emails.length}</span>
          </div>
          <span class="app-label">M-Mail</span>
        </div>

        <div class="app-Launcher" onclick="OS.openApp('maps')">
          <div class="app-squircle bg-maps">
            ${ICONS.maps}
          </div>
          <span class="app-label">GeoTrack</span>
        </div>

        <div class="app-Launcher" onclick="OS.openApp('bank')">
          <div class="app-squircle bg-bank">
            ${ICONS.bank}
            <span class="app-badge">${this.state.bankUnlocked ? '✓' : '🔒'}</span>
          </div>
          <span class="app-label">NeoBank</span>
        </div>

        <div class="app-Launcher" onclick="OS.openApp('notes')">
          <div class="app-squircle bg-notes">
            ${ICONS.notes}
            <span class="app-badge">${this.state.notesUnlocked ? '✓' : '🔒'}</span>
          </div>
          <span class="app-label">Notas VIP</span>
        </div>

        <div class="app-Launcher" onclick="OS.openApp('cases')">
          <div class="app-squircle bg-cases">
            ${ICONS.cases}
          </div>
          <span class="app-label">Expedientes</span>
        </div>

        <div class="app-Launcher" onclick="OS.openApp('solve')">
          <div class="app-squircle bg-solve">
            ${ICONS.solve}
          </div>
          <span class="app-label">Acusar</span>
        </div>
      </div>
    `;
  },

  openApp(app) {
    SoundEngine.click();
    const screen = document.getElementById('screen');
    const c = this.caseData;

    // 1. EXPEDIENTES
    if (app === 'cases') {
      screen.innerHTML = `
        <div class="app-topbar">
          <button class="btn-back-ios" onclick="OS.goHome()">‹ Inicio</button>
          <span class="app-title-header">Archivo de Casos</span>
          <span style="width:55px;"></span>
        </div>
        ${this.catalog.map(item => `
          <div class="glass-card" style="border-left: 3px solid ${item.isFree ? 'var(--accent-green)' : 'var(--accent-amber)'}">
            <div class="meta-line">
              <span>DIFICULTAD: ${item.difficulty}</span>
              <span style="color:${item.isFree ? 'var(--accent-green)' : 'var(--accent-amber)'}">
                ${item.isFree ? '● GRATUITO' : '🔒 VIP (4,99 €)'}
              </span>
            </div>
            <h3 style="font-size:1rem; margin:6px 0;">${item.title}</h3>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:12px;">${item.teaser}</p>${item.isFree 
              ? `<button class="btn-primary" style="background:var(--accent-green); padding:11px;" onclick="OS.loadCase('${item.id}')">Cargar Expediente</button>`
              : `<button class="btn-primary" style="padding:11px;" onclick="window.open('${item.checkoutUrl}', '_blank')">🔓 Desbloquear Caso (4,99 €)</button>`
            }
          </div>
        `).join('')}
      `;
    }

    // 2. POL-DOSSIER
    if (app === 'suspects') {
      screen.innerHTML = `
        <div class="app-topbar">
          <button class="btn-back-ios" onclick="OS.goHome()">‹ Inicio</button>
          <span class="app-title-header">Pol-Dossier</span>
          <span style="width:55px;"></span>
        </div>
        <div class="glass-card" style="border-left:3px solid var(--accent-blue);">
          <div class="meta-line">INFORME PRELIMINAR</div>
          <p style="font-size:0.82rem; line-height:1.45; color:#e2e8f0;">${c.briefing}</p>
        </div>
        ${c.suspects.map(s => `
          <div class="glass-card">
            <div class="meta-line"><span>SOSPECHOSO INTERROGADO</span><span>DECLARACIÓN</span></div>
            <h4 style="font-size:0.96rem; margin-bottom:4px; color:#fff;">${s.name}</h4>
            <p style="font-size:0.81rem; color:var(--text-muted); line-height:1.45;">"${s.alibi}"</p>
          </div>
        `).join('')}
      `;
    }

    // 3. MENSAJES
    if (app === 'chats') {
      screen.innerHTML = `
        <div class="app-topbar">
          <button class="btn-back-ios" onclick="OS.goHome()">‹ Inicio</button>
          <span class="app-title-header">Mensajes</span>
          <span style="width:55px;"></span>
        </div>
        ${c.chats.map((thread, idx) => `
          <button class="chat-contact-btn" onclick="OS.openChatThread(${idx})">
            <div>
              <strong style="font-size:0.92rem; display:block; margin-bottom:4px;">${thread.contact}</strong>
              <span style="font-size:0.78rem; color:var(--text-muted);">${thread.messages[thread.messages.length - 1].text.substring(0, 36)}...</span>
            </div>
            <span style="font-family:'JetBrains Mono',monospace; font-size:0.72rem; color:var(--accent-green);">Abrir ›</span>
          </button>
        `).join('')}
      `;
    }

    // 4. M-MAIL
    if (app === 'mail') {
      screen.innerHTML = `
        <div class="app-topbar">
          <button class="btn-back-ios" onclick="OS.goHome()">‹ Inicio</button>
          <span class="app-title-header">Bandeja M-Mail</span>
          <span style="width:55px;"></span>
        </div>
        ${c.emails.map(m => `
          <div class="glass-card">
            <div class="meta-line">
              <span>DE: ${m.from}</span>
              <span>${m.time}</span>
            </div>
            <h4 style="font-size:0.9rem; margin:5px 0 8px; color:#fde047;">${m.subject}</h4>
            <p style="font-size:0.81rem; color:#cbd5e1; line-height:1.48; white-space:pre-line;">${m.body}</p>
          </div>
        `).join('')}
      `;
    }

    // 5. GEOTRACK GPS
    if (app === 'maps') {
      screen.innerHTML = `
        <div class="app-topbar">
          <button class="btn-back-ios" onclick="OS.goHome()">‹ Inicio</button>
          <span class="app-title-header">GeoTrack Satelital</span>
          <span style="width:55px;"></span>
        </div>
        ${c.locations.map(loc => `
          <div class="timeline-node">
            <div class="glass-card" style="margin-bottom:0;">
              <div class="meta-line">
                <span>${loc.time}</span>
                <span>${loc.coords}</span>
              </div>
              <h4 style="font-size:0.92rem; margin:4px 0;">${loc.place}</h4>
              <p style="font-size:0.8rem; color:var(--text-muted); line-height:1.4;">${loc.detail}</p>
            </div>
          </div>
        `).join('')}
      `;
    }

    // 6. NEOBANK
    if (app === 'bank') {
      if (!this.state.bankUnlocked) {
        screen.innerHTML = `
          <div class="app-topbar">
            <button class="btn-back-ios" onclick="OS.goHome()">‹ Inicio</button>
            <span class="app-title-header">NeoBank Empresas</span>
            <span style="width:55px;"></span>
          </div>
          <div class="glass-card" style="text-align:center;">
            <h3 style="margin:6px 0 8px;">Clave de Acceso Requerida</h3>
            <p style="font-size:0.81rem; color:var(--text-muted); line-height:1.45;">
              <strong>Pregunta de seguridad configurada por Álex:</strong><br>"${c.bankPuzzle.hint}"
            </p>
            <input type="tel" maxlength="4" id="bank-pin" class="pin-box" placeholder="••••" oninput="SoundEngine.key()">
            <button class="btn-primary" onclick="OS.verifyPin('bank')">Desbloquear Cuenta</button>
            <p id="pin-err" style="color:var(--accent-red); font-size:0.78rem; margin-top:10px;"></p>
          </div>
        `;
      } else {
        screen.innerHTML = `
          <div class="app-topbar">
            <button class="btn-back-ios" onclick="OS.goHome()">‹ Inicio</button>
            <span class="app-title-header">Extracto NeoBank</span>
            <span style="width:55px;"></span>
          </div>
          <div class="glass-card" style="background:linear-gradient(135deg,#581c87,#1e1b4b);">
            <div class="meta-line" style="color:#e9d5ff;">SALDO CUENTA PRODUCCIONES</div>
            <h2 style="font-family:'JetBrains Mono',monospace; font-size:1.55rem; margin-top:4px;">${c.bankPuzzle.balance}</h2>
          </div>
          <div class="glass-card">
            <div class="meta-line">REGISTRO DE OPERACIONES RECIENTES</div>
            ${c.bankPuzzle.transactions.map(t => `
              <div class="bank-row">
                <div style="padding-right:10px;">
                  <strong style="font-size:0.84rem; display:block;">${t.concept}</strong>
                  <small style="color:var(--text-muted); font-size:0.74rem; line-height:1.3; display:block; margin-top:2px;">${t.time} •${t.detail}</small>
                </div>
                <span class="amount-neg" style="white-space:nowrap;">${t.amount}</span>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    // 7. NOTAS VIP
    if (app === 'notes') {
      if (!this.state.notesUnlocked) {
        screen.innerHTML = `
          <div class="app-topbar">
            <button class="btn-back-ios" onclick="OS.goHome()">‹ Inicio</button>
            <span class="app-title-header">Notas Cifradas</span>
            <span style="width:55px;"></span>
          </div>
          <div class="glass-card" style="text-align:center;">
            <h3 style="margin:6px 0 8px;">Carpeta Privada de Álex</h3>
            <p style="font-size:0.81rem; color:var(--text-muted); line-height:1.45;">
              <strong>Recordatorio de PIN:</strong><br>"${c.notesPuzzle.hint}"
            </p>
            <input type="tel" maxlength="4" id="notes-pin" class="pin-box" placeholder="••••" oninput="SoundEngine.key()">
            <button class="btn-primary" onclick="OS.verifyPin('notes')">Abrir Nota</button>
            <p id="pin-err" style="color:var(--accent-red); font-size:0.78rem; margin-top:10px;"></p>
          </div>
        `;
      } else {
        screen.innerHTML = `
          <div class="app-topbar">
            <button class="btn-back-ios" onclick="OS.goHome()">‹ Inicio</button>
            <span class="app-title-header">Nota Desbloqueada</span>
            <span style="width:55px;"></span>
          </div>
          <div class="glass-card" style="border-color:var(--accent-amber);">
            <div class="meta-line" style="color:var(--accent-amber);">ÚLTIMA MODIFICACIÓN: 02:09 AM</div>
            <h3 style="margin:6px 0 10px; font-size:1rem;">${c.notesPuzzle.title}</h3>
            <p style="font-size:0.84rem; line-height:1.55; color:#f1f5f9; white-space:pre-line;">${c.notesPuzzle.content}</p>
          </div>
        `;
      }
    }

    // 8. ACUSACIÓN ESCRITA (SIN DESPLEGABLES)
    if (app === 'solve') {
      const sol = c.solution;
      screen.innerHTML = `
        <div class="app-topbar">
          <button class="btn-back-ios" onclick="OS.goHome()">‹ Inicio</button>
          <span class="app-title-header">Orden de Arresto</span>
          <span style="width:55px;"></span>
        </div>
        <div class="glass-card">
          <div class="meta-line" style="margin-bottom:12px;">SISTEMA DE VALIDACIÓN JUDICIAL (ESCRITURA DIRECTA)</div>

          <label style="font-size:0.76rem; color:var(--accent-blue); font-weight:700;">1. ${sol.q1Label}</label>
          <input type="text" id="ans-1" class="text-input-forensic" placeholder="${sol.q1Placeholder}" oninput="SoundEngine.key()">
          <span class="input-hint">${sol.q1Hint}</span>

          <label style="font-size:0.76rem; color:var(--accent-blue); font-weight:700;">2. ${sol.q2Label}</label>
          <input type="text" id="ans-2" class="text-input-forensic" placeholder="${sol.q2Placeholder}" oninput="SoundEngine.key()">
          <span class="input-hint">${sol.q2Hint}</span>

          <label style="font-size:0.76rem; color:var(--accent-blue); font-weight:700;">3. ${sol.q3Label}</label>
          <input type="text" id="ans-3" class="text-input-forensic" placeholder="${sol.q3Placeholder}" oninput="SoundEngine.key()">
          <span class="input-hint">${sol.q3Hint}</span>

          <button class="btn-primary" style="background:linear-gradient(135deg, #10b981, #059669);" onclick="OS.submitVerdict()">
            ⚖️ Emitir Orden de Detención
          </button>
          <div id="verdict-box" style="margin-top:14px;"></div>
        </div>
      `;
    }
  },

  openChatThread(index) {
    SoundEngine.click();
    const thread = this.caseData.chats[index];
    const screen = document.getElementById('screen');

    screen.innerHTML = `
      <div class="app-topbar">
        <button class="btn-back-ios" onclick="OS.openApp('chats')">‹ Mensajes</button>
        <span class="app-title-header">${thread.contact}</span>
        <span style="width:55px;"></span>
      </div>
      <div style="display:flex; flex-direction:column;">
        ${thread.messages.map(m => `
          <div class="bubble ${m.fromMe ? 'sent' : ''}">
            <div class="meta-line" style="color:${m.fromMe ? '#a7f3d0' : 'var(--accent-blue)'}">
              <span>${m.fromMe ? 'Álex' : thread.contact}</span>
              <span>${m.time}</span>
            </div>
            ${m.text}
          </div>
        `).join('')}
      </div>
    `;
  },

  verifyPin(type) {
    const isBank = type === 'bank';
    const input = document.getElementById(isBank ? 'bank-pin' : 'notes-pin');
    const expected = isBank ? this.caseData.bankPuzzle.pin : this.caseData.notesPuzzle.pin;

    if (input.value.trim() === expected) {
      SoundEngine.success();
      if (isBank) this.state.bankUnlocked = true;
      else this.state.notesUnlocked = true;
      this.save();
      this.openApp(type);
    } else {
      this.state.attempts++;
      this.save();
      SoundEngine.error();
      input.classList.remove('shake-anim');
      void input.offsetWidth;
      input.classList.add('shake-anim');
      document.getElementById('pin-err').textContent = "❌ Clave denegada. Investiga a fondo las demás apps.";
    }
  },

  submitVerdict() {
    const u1 = this.normalize(document.getElementById('ans-1').value);
    const u2 = this.normalize(document.getElementById('ans-2').value);
    const u3 = this.normalize(document.getElementById('ans-3').value);

    const sol = this.caseData.solution;
    const ok1 = sol.a1Accepted.some(ans => this.normalize(ans) === u1);
    const ok2 = sol.a2Accepted.some(ans => this.normalize(ans) === u2);
    const ok3 = sol.a3Accepted.some(ans => this.normalize(ans) === u3);

    const box = document.getElementById('verdict-box');

    if (ok1 && ok2 && ok3) {
      SoundEngine.success();
      this.state.solved = true;
      this.save();
      box.innerHTML = `
        <div class="glass-card" style="border-color:var(--accent-green); background:rgba(16, 185, 129, 0.15);">
          <div class="meta-line" style="color:var(--accent-green);">¡EXPEDIENTE RESUELTO! (${this.state.attempts} FALLOS)</div>
          <h4 style="margin:6px 0;">Orden Judicial Autorizada</h4>
          <p style="font-size:0.82rem; line-height:1.48; margin-bottom:12px;">${sol.epilogue}</p>
          <button class="btn-primary" onclick="OS.openApp('cases')">📁 Ver Siguiente Expediente</button>
        </div>
      `;
    } else {
      this.state.attempts++;
      this.save();
      SoundEngine.error();
      let clues = [];
      if (!ok1) clues.push("El apartado 1 es incorrecto");
      if (!ok2) clues.push("El apartado 2 no coincide");
      if (!ok3) clues.push("El dato numérico del apartado 3 es erróneo");

      box.innerHTML = `
        <div class="glass-card" style="border-color:var(--accent-red); background:rgba(244, 63, 94, 0.12);">
          <p style="color:var(--accent-red); font-size:0.8rem; font-weight:700;">❌ Orden rechazada por el juez:</p>
          <p style="color:#cbd5e1; font-size:0.78rem; margin-top:4px;">• ${clues.join("<br>• ")}.</p>
        </div>
      `;
    }
  }
};

window.addEventListener('DOMContentLoaded', () => OS.init());
