// Overlay panels: inventory / character sheet and quest log.
import GAME from "../state.js";
import QUESTS from "../quests.js";
import { ITEMS, useItem } from "../data/items.js";
import { el, getRoot, clear } from "./dom.js";

let overlay = null;
let currentPanel = null;
let selectedItem = null;

export function isPanelOpen() { return overlay !== null; }

export function closePanel() {
    if (overlay) { overlay.remove(); overlay = null; currentPanel = null; selectedItem = null; }
}

function openOverlay(builder) {
    closePanel();
    overlay = el("div", { class: "pg-overlay pg-click", onClick: (e) => { if (e.target === overlay) closePanel(); } });
    const panel = el("div", { class: "pg-panel pg-frame" });
    overlay.appendChild(panel);
    getRoot().appendChild(overlay);
    builder(panel);
}

// ---------------- Inventory / character ----------------
export function openInventory() {
    if (currentPanel === "inv") { closePanel(); return; }
    currentPanel = "inv";
    openOverlay(buildInventory);
}

function buildInventory(panel) {
    clear(panel);
    const d = GAME.data;
    panel.appendChild(header("🎒 Inventaire & Héros", () => closePanel()));

    // stats
    panel.appendChild(el("div", { class: "pg-stats" }, [
        el("div", { html: `Niveau <span>${d.level}</span>` }),
        el("div", { html: `PV <span>${d.hp}/${d.maxHp}</span>` }),
        el("div", { html: `PM <span>${d.mp}/${d.maxMp}</span>` }),
        el("div", { html: `ATQ <span>${GAME.totalAttack}</span>` }),
        el("div", { html: `DEF <span>${GAME.totalDefense}</span>` }),
        el("div", { html: `Or <span>${d.gold}</span>` }),
    ]));

    // equipment line
    const eq = d.equipment;
    panel.appendChild(el("div", { class: "pg-stats" }, [
        el("div", { html: `Arme: <span>${eq.weapon ? ITEMS[eq.weapon].icon + " " + ITEMS[eq.weapon].name : "—"}</span>` }),
        el("div", { html: `Armure: <span>${eq.armor ? ITEMS[eq.armor].icon + " " + ITEMS[eq.armor].name : "—"}</span>` }),
        el("div", { html: `Bijou: <span>${eq.trinket ? ITEMS[eq.trinket].icon + " " + ITEMS[eq.trinket].name : "—"}</span>` }),
    ]));

    // grid
    const grid = el("div", { class: "pg-grid" });
    const slots = Math.max(24, Math.ceil(d.inventory.length / 6) * 6);
    for (let i = 0; i < slots; i++) {
        const item = d.inventory[i];
        if (!item) { grid.appendChild(el("div", { class: "pg-slot" })); continue; }
        const def = ITEMS[item.id];
        const equipped = Object.values(eq).includes(item.id);
        const slot = el("div", {
            class: "pg-slot" + (equipped ? " equipped" : ""),
            title: def ? def.name : item.id,
            onClick: () => { selectedItem = item.id; buildInventory(panel); },
        }, [
            el("span", { text: def ? def.icon : "?" }),
            item.qty > 1 ? el("span", { class: "pg-qty", text: item.qty }) : null,
        ]);
        grid.appendChild(slot);
    }
    panel.appendChild(grid);

    // selected item detail + action
    const detail = el("div", { class: "pg-itemdesc" });
    if (selectedItem && ITEMS[selectedItem]) {
        const def = ITEMS[selectedItem];
        detail.innerHTML = `<b>${def.icon} ${def.name}</b><br>${def.desc}`;
        const actionLabel = def.type === "consumable" ? "Utiliser"
            : (def.type === "weapon" || def.type === "armor" || def.type === "trinket") ? "Équiper" : null;
        const row = el("div", { style: { marginTop: "10px", display: "flex", gap: "8px" } });
        if (actionLabel) {
            row.appendChild(el("div", {
                class: "pg-btn small", text: actionLabel,
                onClick: () => { useItem(selectedItem); buildInventory(panel); },
            }));
        }
        if (def.value > 0 && def.type !== "quest") {
            row.appendChild(el("div", {
                class: "pg-btn small", text: `Vendre (${Math.ceil(def.value / 2)} or)`,
                onClick: () => {
                    if (GAME.countItem(selectedItem) > 0) {
                        GAME.removeItem(selectedItem, 1);
                        GAME.addGold(Math.ceil(def.value / 2));
                        if (GAME.countItem(selectedItem) === 0) selectedItem = null;
                        buildInventory(panel);
                    }
                },
            }));
        }
        detail.appendChild(row);
    } else {
        detail.innerHTML = `<span style="color:var(--pg-dim)">Sélectionne un objet pour le détail.</span>`;
    }
    panel.appendChild(detail);
}

// ---------------- Quest log ----------------
export function openQuestLog() {
    if (currentPanel === "quest") { closePanel(); return; }
    currentPanel = "quest";
    openOverlay(buildQuestLog);
}

function buildQuestLog(panel) {
    clear(panel);
    panel.appendChild(header("📜 Journal de quêtes", () => closePanel()));
    const active = QUESTS.activeQuests();
    if (!active.length) {
        panel.appendChild(el("div", { class: "pg-itemdesc", text: "Aucune quête active. Explore le village et parle aux PNJ." }));
        return;
    }
    active.forEach(({ id, def }) => {
        const ready = QUESTS.isReady(id);
        const q = el("div", { class: "pg-quest" + (ready ? " ready" : "") });
        q.appendChild(el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, [
            el("h4", { text: def.title }),
            el("span", { class: "pg-tag" + (ready ? " ready" : ""), text: ready ? "PRÊTE" : "EN COURS" }),
        ]));
        q.appendChild(el("div", { class: "pg-sum", text: def.summary }));
        QUESTS.objectiveText(id).forEach(o =>
            q.appendChild(el("div", { class: "pg-obj" + (o.done ? " done" : ""), text: (o.done ? "✔ " : "• ") + o.text })));
        panel.appendChild(q);
    });
}

function header(title, onClose) {
    return el("div", { class: "pg-panel-head" }, [
        el("div", { class: "pg-title", text: title }),
        el("div", { class: "pg-close", text: "✕", onClick: onClose }),
    ]);
}

// Rebuild whichever panel is open when state changes (so counts stay live).
GAME.on("change", () => {
    if (!overlay) return;
    const panel = overlay.querySelector(".pg-panel");
    if (!panel) return;
    if (currentPanel === "inv") buildInventory(panel);
    else if (currentPanel === "quest") buildQuestLog(panel);
});
