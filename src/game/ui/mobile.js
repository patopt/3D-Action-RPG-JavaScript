// Touch controls: a DOM movement joystick (left) + action buttons (right),
// plus an always-visible system bar (inventory / quests / pause) for all devices.
import { el, getRoot } from "./dom.js";

export function isTouchDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
}

// actions: { attack, roll, spell, interact }
// isActive: () => boolean   (movement disabled when a menu/dialogue is up)
export function createTouchControls(actions, isActive) {
    const root = getRoot();
    const touch = isTouchDevice();
    ON_MOBILE = touch;

    const layer = el("div", { id: "pg-mobile", class: touch ? "active" : "" });
    root.appendChild(layer);

    if (touch) {
        buildJoystick(layer, isActive);
        buildActionButtons(layer, actions, isActive);
    }
    return { layer };
}

function clearMoveKeys() {
    inputMap["w"] = inputMap["s"] = inputMap["q"] = inputMap["e"] = false;
}

function buildJoystick(layer, isActive) {
    const base = el("div", {
        style: {
            position: "absolute", left: "26px", bottom: "30px",
            width: "120px", height: "120px", borderRadius: "50%",
            border: "3px solid var(--pg-border)", background: "rgba(32,24,46,0.55)",
            boxShadow: "0 0 0 2px #000", pointerEvents: "auto", touchAction: "none",
        },
    });
    const knob = el("div", {
        style: {
            position: "absolute", left: "50%", top: "50%", width: "52px", height: "52px",
            marginLeft: "-26px", marginTop: "-26px", borderRadius: "50%",
            background: "var(--pg-border)", boxShadow: "0 0 0 2px #000",
            transition: "transform 0.05s linear",
        },
    });
    base.appendChild(knob);
    layer.appendChild(base);

    let active = false, pointerId = null;
    const radius = 50;

    function setFromDelta(dx, dy) {
        const len = Math.hypot(dx, dy);
        const clamped = Math.min(len, radius);
        const nx = len ? dx / len : 0;
        const ny = len ? dy / len : 0;
        knob.style.transform = `translate(${nx * clamped}px, ${ny * clamped}px)`;

        clearMoveKeys();
        const dead = 0.35;
        if (len / radius < dead) return;
        // screen y is inverted: up = forward
        if (-ny > dead) inputMap["w"] = true;
        if (-ny < -dead) inputMap["s"] = true;
        if (nx > dead) inputMap["e"] = true;
        if (nx < -dead) inputMap["q"] = true;
    }

    function start(e) {
        if (isActive && !isActive()) return;
        active = true;
        pointerId = e.pointerId;
        base.setPointerCapture && base.setPointerCapture(e.pointerId);
        move(e);
    }
    function move(e) {
        if (!active || (pointerId !== null && e.pointerId !== pointerId)) return;
        const rect = base.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        setFromDelta(e.clientX - cx, e.clientY - cy);
    }
    function end(e) {
        if (pointerId !== null && e.pointerId !== pointerId) return;
        active = false; pointerId = null;
        knob.style.transform = "translate(0,0)";
        clearMoveKeys();
    }

    base.addEventListener("pointerdown", start);
    base.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
}

function buildActionButtons(layer, actions, isActive) {
    const cluster = el("div", { class: "pg-action-cluster" });
    const mk = (cls, icon, fn) => el("div", {
        class: "pg-action " + cls, text: icon,
        onPointerdown: (e) => { e.preventDefault(); if (isActive && !isActive()) return; fn && fn(); },
    });
    cluster.appendChild(mk("attack", "⚔", actions.attack));
    cluster.appendChild(mk("spell", "🔥", actions.spell));
    cluster.appendChild(mk("roll", "↻", actions.roll));
    cluster.appendChild(mk("interact", "✋", actions.interact));
    layer.appendChild(cluster);
}

// Always-visible system buttons (work on desktop and mobile).
export function createSystemBar(handlers) {
    const root = getRoot();
    const bar = el("div", { id: "pg-sysbar" }, [
        el("div", { class: "pg-sysbtn", title: "Inventaire (I)", text: "🎒", onClick: handlers.openInventory }),
        el("div", { class: "pg-sysbtn", title: "Quêtes (J)", text: "📜", onClick: handlers.openQuests }),
        el("div", { class: "pg-sysbtn", title: "Pause (Échap)", text: "⏸", onClick: handlers.pause }),
    ]);
    root.appendChild(bar);
    return bar;
}
