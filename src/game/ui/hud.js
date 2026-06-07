// Heads-up display: vitals (HP/MP/XP), level, gold, quest tracker, toasts.
import GAME from "../state.js";
import QUESTS from "../quests.js";
import { QUESTS as QUEST_DB } from "../data/quests.js";
import { el, getRoot } from "./dom.js";

let refs = {};

export function createHUD() {
    const root = getRoot();

    // --- vitals panel ---
    const hud = el("div", { id: "pg-hud", class: "pg-frame" }, [
        el("div", { class: "pg-name" }, [
            el("span", { text: GAME.data.name }),
            el("span", { class: "pg-lvl", html: ` &nbsp;Nv.<span id="pg-level">${GAME.data.level}</span>` }),
        ]),
        bar("hp", "pg-fill-hp"),
        bar("mp", "pg-fill-mp"),
        bar("xp", "pg-fill-xp", true),
        el("div", { class: "pg-gold" }, [el("span", { id: "pg-gold", text: `🪙 ${GAME.data.gold}` })]),
    ]);
    root.appendChild(hud);

    // --- quest tracker ---
    const tracker = el("div", { id: "pg-tracker", class: "pg-frame" });
    root.appendChild(tracker);
    refs.tracker = tracker;

    // --- toasts container ---
    const toasts = el("div", { id: "pg-toasts" });
    root.appendChild(toasts);
    refs.toasts = toasts;

    refresh();
    updateTracker();

    // React to state changes.
    GAME.on("hp", refresh);
    GAME.on("mp", refresh);
    GAME.on("xp", refresh);
    GAME.on("gold", refresh);
    GAME.on("level", () => { refresh(); toast(`Niveau ${GAME.data.level} !`, "gold"); });
    GAME.on("quest", onQuest);
    GAME.on("change", () => { refresh(); updateTracker(); });

    return { refresh, updateTracker, toast };
}

function bar(kind, fillClass, noLabel) {
    const fill = el("div", { class: `pg-fill ${fillClass}`, id: `pg-${kind}-fill` });
    const children = [fill];
    if (!noLabel) children.push(el("div", { class: "pg-lbl", id: `pg-${kind}-lbl` }));
    refs[kind + "Fill"] = fill;
    return el("div", { class: "pg-bar" + (noLabel ? " xp" : "") }, children);
}

function refresh() {
    const d = GAME.data;
    setBar("hp", d.hp, d.maxHp);
    setBar("mp", d.mp, d.maxMp);
    const xpFill = document.getElementById("pg-xp-fill");
    if (xpFill) xpFill.style.width = `${Math.min(100, (d.xp / d.xpToNext) * 100)}%`;
    setText("pg-level", d.level);
    setText("pg-gold", `🪙 ${d.gold}`);
    setText("pg-hp-lbl", `${d.hp}/${d.maxHp}`);
    setText("pg-mp-lbl", `${d.mp}/${d.maxMp}`);
}

function setBar(kind, cur, max) {
    const fill = document.getElementById(`pg-${kind}-fill`);
    if (fill) fill.style.width = `${Math.max(0, Math.min(100, (cur / max) * 100))}%`;
}

function setText(id, txt) {
    const node = document.getElementById(id);
    if (node) node.textContent = txt;
}

function updateTracker() {
    const tracked = QUESTS.trackedQuest();
    const t = refs.tracker;
    if (!t) return;
    if (!tracked) { t.style.display = "none"; return; }
    t.style.display = "block";
    const objs = QUESTS.objectiveText(tracked.id);
    t.innerHTML = "";
    t.appendChild(el("div", { class: "pg-qtitle", text: "📜 " + tracked.def.title }));
    objs.forEach(o => t.appendChild(el("div", { class: "pg-obj" + (o.done ? " done" : ""), text: (o.done ? "✔ " : "• ") + o.text })));
    if (QUESTS.isReady(tracked.id)) {
        t.appendChild(el("div", { class: "pg-obj done", text: "→ Retourne voir le donneur de quête" }));
    }
}

function onQuest(ev) {
    if (!ev) return;
    if (ev.type === "start" && ev.id) toast("Nouvelle quête : " + questTitle(ev.id), "good");
    if (ev.type === "ready" && ev.id) toast("Quête prête : " + questTitle(ev.id), "good");
    if (ev.type === "complete" && ev.id) {
        toast("Quête terminée : " + questTitle(ev.id), "gold");
    }
    updateTracker();
}

function questTitle(id) {
    return (QUEST_DB[id] && QUEST_DB[id].title) || "";
}

let toastTimers = [];
export function toast(message, kind = "") {
    if (!refs.toasts) return;
    const node = el("div", { class: "pg-toast " + kind, text: message });
    refs.toasts.appendChild(node);
    const timer = setTimeout(() => { node.remove(); }, 3200);
    toastTimers.push(timer);
}
