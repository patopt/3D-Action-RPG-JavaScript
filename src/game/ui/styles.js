// Injects the pixel/retro UI stylesheet. All game UI classes are prefixed `pg-`.
export function injectStyles() {
    if (document.getElementById("pg-styles")) return;
    const style = document.createElement("style");
    style.id = "pg-styles";
    style.textContent = CSS;
    document.head.appendChild(style);
}

const CSS = `
:root {
  --pg-bg: #1a1424;
  --pg-bg2: #2a2238;
  --pg-panel: #20182e;
  --pg-border: #f5ca56;
  --pg-border-dark: #7a5a1e;
  --pg-text: #f4f0e6;
  --pg-dim: #b8a98c;
  --pg-hp: #e0464b;
  --pg-mp: #4aa3e0;
  --pg-xp: #6fd66f;
  --pg-gold: #f5ca56;
}

#pg-root, #pg-root * {
  font-family: 'Courier New', 'Lucida Console', monospace;
  box-sizing: border-box;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

#pg-root {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 10;
  color: var(--pg-text);
  text-transform: none;
}
#pg-root .pg-click { pointer-events: auto; }

/* Chunky pixel border via layered box-shadow */
.pg-frame {
  background: var(--pg-panel);
  border: 3px solid var(--pg-border);
  box-shadow: 0 0 0 3px var(--pg-bg), 0 0 0 6px var(--pg-border-dark), 4px 4px 0 6px rgba(0,0,0,0.5);
  image-rendering: pixelated;
}

.pg-title {
  color: var(--pg-border);
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: bold;
  text-shadow: 2px 2px 0 #000;
}

/* ---------- HUD ---------- */
#pg-hud {
  position: absolute;
  top: 10px; left: 10px;
  width: 260px;
  padding: 10px 12px;
}
#pg-hud .pg-name { font-size: 13px; }
#pg-hud .pg-lvl { color: var(--pg-gold); }
.pg-bar {
  position: relative;
  height: 16px;
  margin-top: 6px;
  background: #000;
  border: 2px solid #000;
  box-shadow: inset 0 0 0 1px #444;
  overflow: hidden;
}
.pg-bar > .pg-fill { height: 100%; width: 100%; transition: width 0.25s steps(8); }
.pg-bar > .pg-lbl {
  position: absolute; inset: 0;
  font-size: 10px; line-height: 16px; text-align: center;
  text-shadow: 1px 1px 0 #000; color: #fff;
}
.pg-fill-hp { background: linear-gradient(var(--pg-hp), #8a2326); }
.pg-fill-mp { background: linear-gradient(var(--pg-mp), #245a8a); }
.pg-fill-xp { background: linear-gradient(var(--pg-xp), #2f8a2f); height: 8px; }
#pg-hud .pg-gold { margin-top: 8px; font-size: 12px; color: var(--pg-gold); text-shadow: 1px 1px 0 #000; }

/* ---------- Quest tracker ---------- */
#pg-tracker {
  position: absolute;
  top: 10px; right: 10px;
  width: 240px;
  padding: 8px 10px;
  font-size: 11px;
}
#pg-tracker .pg-qtitle { color: var(--pg-gold); font-size: 11px; margin-bottom: 4px; text-transform: uppercase; }
#pg-tracker .pg-obj { color: var(--pg-text); margin: 2px 0; }
#pg-tracker .pg-obj.done { color: var(--pg-xp); text-decoration: line-through; }

/* ---------- Toasts ---------- */
#pg-toasts {
  position: absolute;
  top: 90px; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  width: 80%;
}
.pg-toast {
  padding: 8px 14px;
  background: var(--pg-panel);
  border: 2px solid var(--pg-border);
  box-shadow: 3px 3px 0 #000;
  font-size: 12px;
  text-shadow: 1px 1px 0 #000;
  animation: pg-toast-in 0.25s steps(4), pg-toast-out 0.4s steps(4) 2.6s forwards;
  max-width: 90%;
  text-align: center;
}
.pg-toast.gold { border-color: var(--pg-gold); color: var(--pg-gold); }
.pg-toast.good { border-color: var(--pg-xp); }
.pg-toast.bad  { border-color: var(--pg-hp); color: #ffb0b2; }
@keyframes pg-toast-in { from { transform: translateY(-12px); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes pg-toast-out { to { opacity: 0; transform: translateY(-8px); } }

/* ---------- Buttons ---------- */
.pg-btn {
  pointer-events: auto;
  display: inline-block;
  padding: 10px 16px;
  background: var(--pg-bg2);
  color: var(--pg-text);
  border: 3px solid var(--pg-border);
  box-shadow: 3px 3px 0 #000;
  cursor: pointer;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 1px 1px 0 #000;
}
.pg-btn:hover { background: var(--pg-border); color: #1a1424; }
.pg-btn:active { transform: translate(2px,2px); box-shadow: 1px 1px 0 #000; }
.pg-btn.small { padding: 6px 10px; font-size: 11px; }
.pg-btn.danger { border-color: var(--pg-hp); }

/* ---------- Modal overlay panels ---------- */
.pg-overlay {
  position: absolute; inset: 0;
  background: rgba(8,4,16,0.72);
  display: flex; align-items: center; justify-content: center;
  pointer-events: auto;
}
.pg-panel {
  width: min(620px, 92vw);
  max-height: 88vh;
  overflow-y: auto;
  padding: 18px 20px;
}
.pg-panel-head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 14px; border-bottom: 2px solid var(--pg-border-dark); padding-bottom: 8px;
}
.pg-panel-head .pg-title { font-size: 18px; }
.pg-close {
  pointer-events: auto; cursor: pointer; color: var(--pg-hp);
  font-size: 20px; font-weight: bold; padding: 0 6px; text-shadow: 1px 1px 0 #000;
}

/* ---------- Inventory grid ---------- */
.pg-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
.pg-slot {
  pointer-events: auto;
  position: relative;
  aspect-ratio: 1 / 1;
  background: var(--pg-bg);
  border: 2px solid var(--pg-border-dark);
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; cursor: pointer;
}
.pg-slot:hover { border-color: var(--pg-border); background: var(--pg-bg2); }
.pg-slot.equipped { border-color: var(--pg-xp); box-shadow: inset 0 0 0 2px rgba(111,214,111,0.4); }
.pg-slot .pg-qty {
  position: absolute; bottom: 1px; right: 3px; font-size: 11px;
  color: #fff; text-shadow: 1px 1px 0 #000;
}
.pg-stats { display: flex; gap: 16px; flex-wrap: wrap; margin: 6px 0 14px; font-size: 12px; }
.pg-stats span { color: var(--pg-gold); }
.pg-itemdesc { min-height: 40px; margin-top: 12px; font-size: 12px; color: var(--pg-dim); }
.pg-itemdesc b { color: var(--pg-text); }

/* ---------- Quest log ---------- */
.pg-quest { border: 2px solid var(--pg-border-dark); padding: 10px; margin-bottom: 10px; }
.pg-quest h4 { margin: 0 0 4px; color: var(--pg-gold); font-size: 13px; text-transform: uppercase; }
.pg-quest .pg-sum { font-size: 11px; color: var(--pg-dim); margin-bottom: 6px; }
.pg-quest .pg-obj { font-size: 12px; margin: 2px 0; }
.pg-quest .pg-obj.done { color: var(--pg-xp); }
.pg-quest.ready { border-color: var(--pg-xp); }
.pg-tag { font-size: 10px; padding: 1px 5px; border: 1px solid var(--pg-border); color: var(--pg-border); }
.pg-tag.ready { border-color: var(--pg-xp); color: var(--pg-xp); }

/* ---------- Dialogue ---------- */
#pg-dialogue {
  position: absolute; left: 50%; bottom: 30px; transform: translateX(-50%);
  width: min(680px, 94vw); padding: 16px 18px; pointer-events: auto;
}
#pg-dialogue .pg-speaker { color: var(--pg-gold); font-size: 13px; text-transform: uppercase; margin-bottom: 6px; }
#pg-dialogue .pg-line { font-size: 14px; line-height: 1.5; min-height: 48px; }
#pg-dialogue .pg-choices { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; }
#pg-dialogue .pg-choice {
  pointer-events: auto; cursor: pointer; padding: 8px 12px;
  border: 2px solid var(--pg-border-dark); font-size: 13px;
}
#pg-dialogue .pg-choice:hover { border-color: var(--pg-border); background: var(--pg-bg2); }
#pg-dialogue .pg-cont { text-align: right; font-size: 11px; color: var(--pg-dim); margin-top: 8px; }

/* ---------- Main / pause menu ---------- */
#pg-menu {
  position: absolute; inset: 0;
  background: radial-gradient(circle at 50% 35%, #2a2238, #0c0814 80%);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  pointer-events: auto; gap: 14px; text-align: center;
}
#pg-menu .pg-game-title {
  font-size: clamp(28px, 7vw, 56px); color: var(--pg-border);
  text-shadow: 4px 4px 0 #000, 0 0 18px rgba(245,202,86,0.4);
  letter-spacing: 4px; text-transform: uppercase; margin-bottom: 4px;
}
#pg-menu .pg-sub { color: var(--pg-dim); font-size: 13px; margin-bottom: 18px; letter-spacing: 2px; }
#pg-menu .pg-btn { width: 240px; }
#pg-menu .pg-hint { color: var(--pg-dim); font-size: 11px; margin-top: 18px; max-width: 320px; line-height: 1.6; }

/* ---------- Mobile controls ---------- */
#pg-mobile { position: absolute; inset: 0; pointer-events: none; display: none; }
#pg-mobile.active { display: block; }
.pg-action-cluster {
  position: absolute; right: 18px; bottom: 26px;
  width: 180px; height: 180px;
}
.pg-action {
  position: absolute;
  width: 62px; height: 62px;
  border-radius: 50%;
  border: 3px solid var(--pg-border);
  background: rgba(32,24,46,0.75);
  color: var(--pg-text);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; pointer-events: auto;
  box-shadow: 0 0 0 2px #000, inset 0 0 10px rgba(0,0,0,0.5);
  text-shadow: 1px 1px 0 #000;
}
.pg-action:active { transform: scale(0.92); background: var(--pg-border); color: #1a1424; }
.pg-action.attack { right: 0; bottom: 40px; width: 78px; height: 78px; font-size: 30px; border-color: var(--pg-hp); }
.pg-action.roll   { right: 84px; bottom: 12px; }
.pg-action.spell  { right: 12px; bottom: 118px; border-color: var(--pg-mp); }
.pg-action.interact{ right: 96px; bottom: 96px; border-color: var(--pg-xp); }

.pg-top-buttons {
  position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 8px;
}
.pg-top-buttons .pg-tbtn {
  pointer-events: auto;
  width: 44px; height: 44px;
  border: 2px solid var(--pg-border);
  background: rgba(32,24,46,0.8);
  color: var(--pg-text); font-size: 18px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 2px 2px 0 #000;
}
.pg-top-buttons .pg-tbtn:active { background: var(--pg-border); color: #1a1424; }

/* Always-visible system buttons, left edge under the HUD (desktop + mobile) */
#pg-sysbar {
  position: absolute; top: 150px; left: 10px;
  display: flex; flex-direction: column; gap: 6px; pointer-events: none;
}
#pg-sysbar .pg-sysbtn {
  pointer-events: auto; cursor: pointer;
  min-width: 40px; height: 40px; padding: 0 8px;
  border: 2px solid var(--pg-border); background: rgba(32,24,46,0.8);
  color: var(--pg-text); font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 2px 2px 0 #000; text-shadow: 1px 1px 0 #000;
}
#pg-sysbar .pg-sysbtn:hover { background: var(--pg-border); color: #1a1424; }

/* Interaction prompt */
#pg-prompt {
  position: absolute; left: 50%; bottom: 140px; transform: translateX(-50%);
  padding: 6px 14px; font-size: 13px; display: none;
}
#pg-prompt.show { display: block; }
#pg-prompt .pg-key {
  display: inline-block; border: 2px solid var(--pg-border); padding: 0 6px;
  margin-right: 6px; color: var(--pg-border);
}

/* Death screen */
#pg-death {
  position: absolute; inset: 0; background: rgba(40,0,0,0.6);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  pointer-events: auto; gap: 18px;
}
#pg-death .pg-dead-title {
  font-size: clamp(32px, 9vw, 72px); color: var(--pg-hp);
  text-shadow: 4px 4px 0 #000; letter-spacing: 6px; text-transform: uppercase;
}

.pg-hidden { display: none !important; }

/* ---------- Responsive (phones) ---------- */
@media (max-width: 640px) {
  #pg-hud { width: 46vw; max-width: 240px; padding: 7px 9px; top: 8px; left: 8px; }
  #pg-hud .pg-name { font-size: 11px; }
  .pg-bar { height: 13px; }
  .pg-bar > .pg-lbl { font-size: 9px; line-height: 13px; }
  #pg-tracker { width: 44vw; max-width: 220px; top: 8px; right: 8px; font-size: 10px; padding: 6px 8px; }
  #pg-sysbar { top: 120px; }
  #pg-sysbar .pg-sysbtn { width: 38px; height: 38px; font-size: 15px; }
  .pg-grid { grid-template-columns: repeat(5, 1fr); gap: 6px; }
  .pg-panel { padding: 14px; }
  #pg-dialogue { bottom: 16px; }
}
`;
