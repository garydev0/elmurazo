/**
 * ============================================================================
 * 1. SINTETIZADOR DE SONIDO (0 Archivos Externos)
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
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.035);
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
    gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
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
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.2);
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
 * 2. SISTEMA OPERATIVO DEL MÓVIL (MURAZO OS)
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
          <span class="meta-line">ERROR DE SERVIDOR LOCAL</span>
          <h3 style="margin:8px 0;">Abre con Live Server</h3>
          <p style="font-size:0.85rem; color:var(--text-muted);">
            Para que el navegador lea los archivos de la carpeta <code>/cases/</code>, abre el proyecto con la extensión <strong>Live Server</strong> de VS Code.
          </p>
        </div>`;
    }
  },

  async loadCase(caseId, playSound = true) {
    if (playSound) SoundEngine.click();
    const meta = this.catalog.find(c => c.id === caseId);

    const saved = localStorage.getItem(`elmurazo_v2_${caseId}`);
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
    localStorage.setItem(`elmurazo_v2_${this.caseData.id}`, JSON.stringify(this.state));
  },

  // PANTALLA DE INICIO (HOME DEL MÓVIL)
  goHome(playSound = true) {
    if (playSound) SoundEngine.click();
    const screen = document.getElementById('screen');
    const c = this.caseData;

    screen.innerHTML = `
      <!-- WIDGET DEL CASO ACTIVO -->
      <div class="forensic-widget" onclick="OS.openApp('cases')" style="cursor:pointer;">
        <div class="widget-tag">
          <span>📱 DISPOSITIVO CLONADO: ${c.owner}</span>
          <span>CAMBIAR ▾</span>
        </div>
        <h1>${c.title}</h1>
        <p>${c.summary}</p>
      </div>

      <!-- ICONOS DE APLICACIONES -->
      <div class="ios-grid">
        <div class="app-Launcher" onclick="OS.openApp('suspects')">
          <div class="app-squircle bg-Suspects">
            📋
            <span class="app-badge">${c.suspects.length}</span>
          </div>
          <span class="app-label">Pol-Dossier</span>
        </div>

        <div class="app-Launcher" onclick="OS.openApp('chats')">
          <div class="app-squircle bg-chat">
            💬
            <span class="app-badge">${c.chats.length}</span>
          </div>
          <span class="app-label">Mensajes</span>
        </div>

        <div class="app-Launcher" onclick="OS.openApp('mail')">
          <div class="app-squircle bg-mail">
            ✉️
            <span class="app-badge">${c.emails.length}</span>
          </div>
          <span class="app-label">M-Mail</span>
        </div>

        <div class="app-Launcher" onclick="OS.openApp('maps')">
          <div class="app-squircle bg-maps">📍</div>
          <span class="app-label">GeoTrack</span>
        </div>

        <div class="app-Launcher" onclick="OS.openApp('bank')">
          <div class="app-squircle bg-bank">
            💳
            <span class="app-badge">${this.state.bankUnlocked ? '✓' : '🔒'}</span>
          </div>
          <span class="app-label">NeoBank</span>
        </div>

        <div class="app-Launcher" onclick="OS.openApp('notes')">
          <div class="app-squircle bg-notes">
            🔐
            <span class="app-badge">${this.state.notesUnlocked ? '✓' : '🔒'}</span>
          </div>
          <span class="app-label">Notas VIP</span>
        </div>

        <div class="app-Launcher" onclick="OS.openApp('cases')">
          <div class="app-squircle bg-cases">📁</div>
          <span class="app-label">Expedientes</span>
        </div>

        <div class="app-Launcher" onclick="OS.openApp('solve')">
          <div class="app-squircle bg-solve">⚖️</div>
          <span class="app-label">Acusar</span>
        </div>
      </div>
    `;
  },

  openApp(app) {
    SoundEngine.click();
    const screen = document.getElementById('screen');
    const c = this.caseData;

    // 1. SELECTOR DE CASOS (CASO 1 GRATIS, CASO 2 DE PAGO)
    if (app === 'cases') {
      screen.innerHTML = `
        <div class="app-topbar">
          <button class="btn-back-ios" onclick="OS.goHome()">‹ Inicio</button>
          <span class="app-title-header">Archivo de Casos</span>
          <span style="width:45px;"></span>
        </div>
        ${this.catalog.map(item => `
          <div class="glass-card" style="border-left: 3px solid ${item.isFree ? 'var(--accent-green)' : 'var(--accent-amber)'}">
            <div class="meta-line">
              <span>DIFICULTAD: ${item.difficulty}</span>
              <span style="color:${item.isFree ? 'var(--accent-green)' : 'var(--accent-amber)'}">
                ${item.isFree ? '● ACCESO GRATUITO' : '🔒 EXPEDIENTE VIP (4,99 €)'}
              </span>
            </div>
            <h3 style="font-size:1rem; margin:6px 0;">${item.title}</h3>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:12px;">${item.teaser}</p>${item.isFree 
              ? `<button class="btn-primary" style="background:var(--accent-green); padding:10px;" onclick="OS.loadCase('${item.id}')">Jugar este Caso</button>`
              : `<button class="btn-primary" style="padding:10px;" onclick="window.open('${item.checkoutUrl}', '_blank')">🔓 Comprar Acceso (4,99 €)</button>`
            }
          </div>
        `).join('')}
      `;
    }

    // 2. DOSSIER DE SOSPECHOSOS E INSTRUCCIONES
    if (app === 'suspects') {
      screen.innerHTML = `
        <div class="app-topbar">
          <button class="btn-back-ios" onclick="OS.goHome()">‹ Inicio</button>
          <span class="app-title-header">Ficha Policial</span>
          <span style="width:45px;"></span>
        </div>
        <div class="glass-card" style="border-left:3px solid var(--accent-blue);">
          <div class="meta-line">OBJETIVO DE LA INVESTIGACIÓN</div>
          <p style="font-size:0.83rem; line-height:1.45; color:#e2e8f0;">${c.briefing}</p>
        </div>
        ${c.suspects.map(s => `
          <div class="glass-card">
            <div class="meta-line"><span>SOSPECHOSO</span><span>COARTADA OFICIAL</span></div>
            <h4 style="font-size:0.98rem; margin-bottom:4px;">${s.name}</h4>
            <p style="font-size:0.82rem; color:var(--text-muted); line-height:1.4;">"${s.alibi}"</p>
          </div>
        `).join('')}
      `;
    }

    // 3. MENSAJES (LISTA DE CONTACTOS)
    if (app === 'chats') {
      screen.innerHTML = `
        <div class="app-topbar">
          <button class="btn-back-ios" onclick="OS.goHome()">‹ Inicio</button>
          <span class="app-title-header">Mensajes</span>
          <span style="width:45px;"></span>
        </div>
        ${c.chats.map((thread, idx) => `
          <button class="chat-contact-btn" onclick="OS.openChatThread(${idx})">
            <div>
              <strong style="font-size:0.92rem; display:block; margin-bottom:3px;">${thread.contact}</strong>
              <span style="font-size:0.78rem; color:var(--text-muted);">${thread.messages[thread.messages.length - 1].text.substring(0, 38)}...</span>
            </div>
            <span style="font-family:'JetBrains Mono',monospace; font-size:0.72rem; color:var(--accent-green);">Ver ›</span>
          </button>
        `).join('')}
      `;
    }

    // 4. M-MAIL (CORREO ELECTRÓNICO)
    if (app === 'mail') {
      screen.innerHTML = `
        <div class="app-topbar">
          <button class="btn-back-ios" onclick="OS.goHome()">‹ Inicio</button>
          <span class="app-title-header">Bandeja M-Mail</span>
          <span style="width:45px;"></span>
        </div>
        ${c.emails.map(m => `
          <div class="glass-card">
            <div class="meta-line">
              <span>DE: ${m.from}</span>
              <span>${m.time}</span>
            </div>
            <h4 style="font-size:0.9rem; margin:5px 0 8px; color:#fde047;">${m.subject}</h4>
            <p style="font-size:0.82rem; color:#cbd5e1; line-height:1.45; white-space:pre-line;">${m.body}</p>
          </div>
        `).join('')}
      `;
    }

    // 5. GEOTRACK (HISTORIAL DE UBICACIONES ESTILO GOOGLE MAPS)
    if (app === 'maps') {
      screen.innerHTML = `
        <div class="app-topbar">
          <button class="btn-back-ios" onclick="OS.goHome()">‹ Inicio</button>
          <span class="app-title-header">GeoTrack GPS</span>
          <span style="width:45px;"></span>
        </div>
        <div class="glass-card" style="margin-bottom:16px;">
          <div class="meta-line">HISTORIAL DE POSICIÓN DEL DISPOSITIVO</div>
          <p style="font-size:0.78rem; color:var(--text-muted);">Rastreo satelital registrado antes de perder la señal.</p>
        </div>
        ${c.locations.map(loc => `
          <div class="timeline-node">
            <div class="glass-card" style="margin-bottom:0;">
              <div class="meta-line">
                <span>${loc.time}</span>
                <span>${loc.coords}</span>
              </div>
              <h4 style="font-size:0.92rem; margin:4px 0;">${loc.place}</h4>
              <p style="font-size:0.8rem; color:var(--text-muted);">${loc.detail}</p>
            </div>
          </div>
        `).join('')}
      `;
    }

    // 6. NEOBANK (EXTRACTO BANCARIO PROTEGIDO CON PUZLE 1)
    if (app === 'bank') {
      if (!this.state.bankUnlocked) {
        screen.innerHTML = `
          <div class="app-topbar">
            <button class="btn-back-ios" onclick="OS.goHome()">‹ Inicio</button>
            <span class="app-title-header">NeoBank Seguridad</span>
            <span style="width:45px;"></span>
          </div>
          <div class="glass-card" style="text-align:center;">
            <span style="font-size:2rem;">💳</span>
            <h3 style="margin:8px 0;">Acceso Biométrico Fallido</h3>
            <p style="font-size:0.82rem; color:var(--text-muted); line-height:1.4;">${c.bankPuzzle.hint}</p>
            <input type="text" maxlength="4" id="bank-pin" class="pin-box" placeholder="••••" oninput="SoundEngine.key()">
            <button class="btn-primary" onclick="OS.verifyPin('bank')">Entrar a NeoBank</button>
            <p id="pin-err" style="color:var(--accent-red); font-size:0.78rem; margin-top:10px;"></p>
          </div>
        `;
      } else {
        screen.innerHTML = `
          <div class="app-topbar">
            <button class="btn-back-ios" onclick="OS.goHome()">‹ Inicio</button>
            <span class="app-title-header">Movimientos NeoBank</span>
            <span style="width:45px;"></span>
          </div>
          <div class="glass-card" style="background:linear-gradient(135deg,#4c1d95,#1e1b4b);">
            <div class="meta-line" style="color:#ddd6fe;">SALDO DISPONIBLE</div>
            <h2 style="font-family:'JetBrains Mono',monospace; font-size:1.6rem; margin-top:4px;">${c.bankPuzzle.balance}</h2>
          </div>
          <div class="glass-card">
            <div class="meta-line">ÚLTIMOS CARGOS CON TARJETA</div>
            ${c.bankPuzzle.transactions.map(t => `
              <div class="bank-row">
                <div>
                  <strong style="font-size:0.85rem; display:block;">${t.concept}</strong>
                  <small style="color:var(--text-muted); font-size:0.74rem;">${t.time} •${t.detail}</small>
                </div>
                <span class="amount-neg">${t.amount}</span>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    // 7. NOTAS SECRETAS (PROTEGIDA CON PUZLE 2)
    if (app === 'notes') {
      if (!this.state.notesUnlocked) {
        screen.innerHTML = `
          <div class="app-topbar">
            <button class="btn-back-ios" onclick="OS.goHome()">‹ Inicio</button>
            <span class="app-title-header">Carpeta Cifrada</span>
            <span style="width:45px;"></span>
          </div>
          <div class="glass-card" style="text-align:center;">
            <span style="font-size:2rem;">🔐</span>
            <h3 style="margin:8px 0;">Nota bloqueada con PIN</h3>
            <p style="font-size:0.82rem; color:var(--text-muted); line-height:1.4;">${c.notesPuzzle.hint}</p>
            <input type="text" maxlength="4" id="notes-pin" class="pin-box" placeholder="••••" oninput="SoundEngine.key()">
            <button class="btn-primary" onclick="OS.verifyPin('notes')">Desbloquear Nota</button>
            <p id="pin-err" style="color:var(--accent-red); font-size:0.78rem; margin-top:10px;"></p>
          </div>
        `;
      } else {
        screen.innerHTML = `
          <div class="app-topbar">
            <button class="btn-back-ios" onclick="OS.goHome()">‹ Inicio</button>
            <span class="app-title-header">Nota Confidencial</span>
            <span style="width:45px;"></span>
          </div>
          <div class="glass-card" style="border-color:var(--accent-amber);">
            <div class="meta-line" style="color:var(--accent-amber);">BORRADOR GUARDADO A LAS 02:08 AM</div>
            <h3 style="margin:6px 0 10px;">${c.notesPuzzle.title}</h3>
            <p style="font-size:0.86rem; line-height:1.55; color:#f1f5f9; white-space:pre-line;">${c.notesPuzzle.content}</p>
          </div>
        `;
      }
    }

    // 8. FORMULARIO FINAL DE ACUSACIÓN (100% GRATIS EN EL CASO 1)
    if (app === 'solve') {
      const sol = c.solution;
      screen.innerHTML = `
        <div class="app-topbar">
          <button class="btn-back-ios" onclick="OS.goHome()">‹ Inicio</button>
          <span class="app-title-header">Emitir Orden Policial</span>
          <span style="width:45px;"></span>
        </div>
        <div class="glass-card">
          <label style="font-size:0.75rem; color:var(--accent-blue); font-weight:700;">1. ¿QUIÉN SECUESTRÓ A ÁLEX?</label>
          <select id="ans-1" class="select-modern">
            ${sol.q1Options.map(o => `<option value="${o}">${o}</option>`).join('')}
          </select>

          <label style="font-size:0.75rem; color:var(--accent-blue); font-weight:700;">2. ¿QUIÉN FUE SU CÓMPLICE?</label>
          <select id="ans-2" class="select-modern">
            ${sol.q2Options.map(o => `<option value="${o}">${o}</option>`).join('')}
          </select>

          <label style="font-size:0.75rem; color:var(--accent-blue); font-weight:700;">3. ¿QUÉ PRUEBA DESTROZA SU COARTADA?</label>
          <select id="ans-3" class="select-modern">
            ${sol.q3Options.map(o => `<option value="${o}">${o}</option>`).join('')}
          </select>

          <button class="btn-primary" style="background:var(--accent-green);" onclick="OS.submitVerdict()">
            ⚖️ Confirmar Acusación Oficial
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
        <button class="btn-back-ios" onclick="OS.openApp('chats')">‹ Chats</button>
        <span class="app-title-header">${thread.contact}</span>
        <span style="width:45px;"></span>
      </div>
      <div style="display:flex; flex-direction:column;">
        ${thread.messages.map(m => `
          <div class="bubble ${m.fromMe ? 'sent' : ''}">
            <div class="meta-line" style="color:${m.fromMe ? '#a7f3d0' : 'var(--accent-blue)'}">
              <span>${m.fromMe ? 'Álex (Yo)' : thread.contact}</span>
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
      document.getElementById('pin-err').textContent = "❌ Código incorrecto. Revisa los correos, chats y ubicaciones GPS.";
    }
  },

  submitVerdict() {
    const a1 = document.getElementById('ans-1').value;
    const a2 = document.getElementById('ans-2').value;
    const a3 = document.getElementById('ans-3').value;
    const sol = this.caseData.solution;
    const box = document.getElementById('verdict-box');

    if (a1 === sol.a1 && a2 === sol.a2 && a3 === sol.a3) {
      SoundEngine.success();
      this.state.solved = true;
      this.save();
      box.innerHTML = `
        <div class="glass-card" style="border-color:var(--accent-green); background:rgba(16, 185, 129, 0.15);">
          <div class="meta-line" style="color:var(--accent-green);">¡CASO #01 RESUELTO! (${this.state.attempts} FALLOS)</div>
          <h4 style="margin:6px 0;">Orden de arresto validada</h4>
          <p style="font-size:0.82rem; line-height:1.45; margin-bottom:12px;">${sol.epilogue}</p>
          <button class="btn-primary" onclick="OS.openApp('cases')">📁 Ir al Caso #02 (VIP)</button>
        </div>
      `;
    } else {
      this.state.attempts++;
      this.save();
      SoundEngine.error();
      box.innerHTML = `<p style="color:var(--accent-red); font-size:0.82rem; text-align:center;">❌ Pruebas insuficientes o incorrectas. Desbloquea NeoBank y Notas VIP antes de acusar.</p>`;
    }
  }
};

window.addEventListener('DOMContentLoaded', () => OS.init());
