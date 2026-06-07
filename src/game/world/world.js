// Builds the living world: a small village of quest-giving NPCs, scattered
// trees / rocks / bushes / critters, harvest nodes, chests and the quest crystal.
// Also owns the interaction system (nearest interactable + on-screen prompt).

import GAME from "../state.js";
import QUESTS from "../quests.js";
import { QUESTS as QUEST_DB } from "../data/quests.js";
import { ITEMS } from "../data/items.js";
import { openDialogue } from "../ui/dialogue.js";
import { toast } from "../ui/hud.js";
import { el, getRoot } from "../ui/dom.js";
import { createNPC } from "./npc.js";
import { createTree, createRock, createBush, createChest, openChestAnim, createCrystal, createCritter } from "./props.js";

const NPC_DEFS = [
    { id: "elder", name: "Doyen Aldric", color: "#7a5cc0", hair: "#cfcfcf", quests: ["q_intro", "q_slimes", "q_crystal"] },
    { id: "merchant", name: "Marchande Lys", color: "#c05c8a", hair: "#5a2a1a", quests: ["q_gel"], shop: true },
    { id: "guard", name: "Garde Brom", color: "#5c7ac0", hair: "#2a2a2a", quests: ["q_wood"] },
    { id: "villager", name: "Villageoise Mira", color: "#5cc08a", hair: "#6a4a2a", quests: [] },
];

export function buildWorld(ctx) {
    const { scene, terrain, character, shadowGen, enemies } = ctx;

    const center = character.position.clone();
    const snap = (x, z, oy = 0) => {
        let y = 0;
        if (terrain && terrain.getHeightAtCoordinates) {
            const h = terrain.getHeightAtCoordinates(x, z);
            if (!isNaN(h)) y = h;
        }
        return new BABYLON.Vector3(x, y + oy, z);
    };

    const world = {
        interactables: [],
        npcs: {},
        current: null,
        addInteractable(i) { this.interactables.push(i); return i; },
        interactNearest() {
            if (this.current && this.current.enabled !== false) this.current.interact();
        },
    };

    // ---------- prompt UI ----------
    const prompt = el("div", { id: "pg-prompt", class: "pg-frame" });
    getRoot().appendChild(prompt);

    // ---------- helper: items that count toward collect quests ----------
    function giveItem(id, qty = 1) {
        GAME.addItem(id, qty);
        QUESTS.advance("collect", id, qty);
        const def = ITEMS[id];
        toast(`+${qty} ${def ? def.icon + " " + def.name : id}`, "good");
    }
    world.giveItem = giveItem;

    // ---------- NPCs ----------
    const npcSpots = [
        [center.x + 18, center.z + 10],
        [center.x - 16, center.z + 16],
        [center.x + 4, center.z - 20],
        [center.x - 22, center.z - 6],
    ];
    NPC_DEFS.forEach((def, i) => {
        const [x, z] = npcSpots[i] || [center.x, center.z];
        const npc = createNPC(scene, def, snap(x, z, 0), shadowGen);
        world.npcs[def.id] = npc;
        world.addInteractable({
            npc,
            get position() { return npc.position; },
            range: 16,
            prompt: () => `Parler à ${def.name}`,
            interact: () => talkToNPC(world, npc, giveItem),
        });
    });

    // ---------- scatter vegetation ----------
    const propCount = isLowEnd() ? 45 : 95;
    for (let i = 0; i < propCount; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 320;
        const x = center.x + Math.cos(ang) * dist;
        const z = center.z + Math.sin(ang) * dist;
        const p = snap(x, z, 0);
        const r = Math.random();
        if (r < 0.5) {
            const tree = createTree(scene, p, shadowGen);
            makeHarvestNode(world, tree, p, giveItem);
        } else if (r < 0.7) {
            createRock(scene, p);
        } else if (r < 0.9) {
            createBush(scene, p);
        } else {
            createCritter(scene, p, terrain);
        }
    }

    // ---------- treasure chests ----------
    for (let i = 0; i < 3; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 90 + Math.random() * 200;
        const p = snap(center.x + Math.cos(ang) * dist, center.z + Math.sin(ang) * dist, 0);
        const chest = createChest(scene, p);
        if (shadowGen) chest.getChildMeshes().forEach(m => shadowGen.addShadowCaster(m));
        const loot = i === 0
            ? { gold: 30, items: [{ id: "potion_health", qty: 2 }] }
            : i === 1
                ? { gold: 50, items: [{ id: "potion_mana", qty: 2 }, { id: "bread", qty: 2 }] }
                : { gold: 80, items: [{ id: "amulet_power", qty: 1 }] };
        world.addInteractable({
            mesh: chest,
            opened: false,
            get position() { return chest.position; },
            range: 14,
            prompt() { return this.opened ? "Coffre (vide)" : "Ouvrir le coffre"; },
            interact() {
                if (this.opened) return;
                this.opened = true;
                openChestAnim(chest);
                GAME.addGold(loot.gold);
                loot.items.forEach(it => GAME.addItem(it.id, it.qty));
                toast(`Coffre ! +${loot.gold} or` + loot.items.map(it => `, ${ITEMS[it.id].icon}x${it.qty}`).join(""), "gold");
                this.enabled = false;
            },
        });
    }

    // ---------- the quest crystal ----------
    {
        const ang = Math.random() * Math.PI * 2;
        const p = snap(center.x + Math.cos(ang) * 260, center.z + Math.sin(ang) * 260, 0);
        const crystal = createCrystal(scene, p);
        world.addInteractable({
            mesh: crystal,
            get position() { return crystal.position; },
            range: 16,
            prompt: () => "Récupérer le cristal ancien",
            interact() {
                giveItem("crystal", 1);
                toast("Tu as trouvé le Cristal Ancien !", "gold");
                crystal.dispose();
                this.enabled = false;
            },
        });
    }

    // ---------- interaction update loop ----------
    scene.onBeforeRenderObservable.add(() => {
        if (!character || !character.position) return;
        let best = null, bestD = Infinity;
        for (const it of world.interactables) {
            if (it.enabled === false) continue;
            const d = BABYLON.Vector3.Distance(character.position, it.position);
            if (d < it.range && d < bestD) { bestD = d; best = it; }
        }
        world.current = best;
        if (best) {
            prompt.classList.add("show");
            prompt.innerHTML = "";
            prompt.appendChild(el("span", { class: "pg-key", text: "G" }));
            prompt.appendChild(document.createTextNode(typeof best.prompt === "function" ? best.prompt() : best.prompt));
        } else {
            prompt.classList.remove("show");
        }
        updateNPCIndicators(world);
    });

    // ---------- scatter enemies around the village (they spawn near origin) ----------
    if (enemies && enemies.length) {
        enemies.forEach(en => {
            if (!en) return;
            const ang = Math.random() * Math.PI * 2;
            const dist = 70 + Math.random() * 170;
            const p = snap(center.x + Math.cos(ang) * dist, center.z + Math.sin(ang) * dist, 2);
            en.position.copyFrom(p);
        });
    }

    // ---------- enemy death rewards ----------
    if (enemies && enemies.length) trackEnemyDeaths(world, enemies, giveItem);

    updateNPCIndicators(world);
    return world;
}

// Trees give wood a few times before they're tapped out.
function makeHarvestNode(world, tree, pos, giveItem) {
    let charges = 2;
    world.addInteractable({
        get position() { return pos; },
        range: 12,
        prompt: () => charges > 0 ? "Récolter du bois" : "Arbre épuisé",
        interact() {
            if (charges <= 0) return;
            charges--;
            giveItem("wood", 1);
            // little shake
            const s = tree.getScene();
            const start = tree.rotation.z;
            let t = 0;
            const obs = s.onBeforeRenderObservable.add(() => {
                t += 1;
                tree.rotation.z = start + Math.sin(t) * 0.04;
                if (t > 18) { tree.rotation.z = start; s.onBeforeRenderObservable.remove(obs); }
            });
            if (charges <= 0) { tree.scaling.scaleInPlace(0.85); this.enabled = false; }
        },
    });
}

// Award XP / gold / loot when a slime dies.
function trackEnemyDeaths(world, enemies, giveItem) {
    const seen = new WeakSet();
    enemies.forEach(e => { if (e && e.health) e.health._wasAlive = true; });
    const scene = enemies[0] && enemies[0].getScene && enemies[0].getScene();
    if (!scene) return;
    scene.onBeforeRenderObservable.add(() => {
        enemies.forEach(e => {
            if (!e || !e.health) return;
            if (e.health._wasAlive && !e.health.isAlive && !seen.has(e)) {
                seen.add(e);
                GAME.addXp(15);
                GAME.addGold(3 + Math.floor(Math.random() * 5));
                QUESTS.advance("kill", "slime", 1);
                if (Math.random() < 0.85) giveItem("slime_gel", 1);
                toast("Slime vaincu ! +15 XP", "good");
            }
            e.health._wasAlive = e.health.isAlive;
        });
    });
}

function updateNPCIndicators(world) {
    for (const id in world.npcs) {
        const npc = world.npcs[id];
        const role = npcRole(npc);
        // ? if a quest from this NPC is ready to hand in
        const ready = role.quests.find(q => QUESTS.isReady(q));
        if (ready) { npc.setIndicator("?"); continue; }
        // ! if a quest is available to start
        const available = role.quests.find(q => canStart(q));
        npc.setIndicator(available ? "!" : null);
    }
}

function npcRole(npc) { return NPC_DEFS.find(d => d.id === npc.id) || { quests: [] }; }

function canStart(questId) {
    if (QUESTS.isStarted(questId)) return false;
    // A quest is startable if it has no chain-parent, or its parent is done.
    const parent = Object.keys(QUEST_DB).find(k => QUEST_DB[k].next === questId);
    if (!parent) return true;
    return QUESTS.isDone(parent);
}

// ----------------- NPC dialogue -----------------
function talkToNPC(world, npc, giveItem) {
    const role = npcRole(npc);
    const name = npc.def.name;

    // Complete any "talk to this NPC" objective up front, so a quest that only
    // needed a chat becomes ready and can be handed in within this conversation.
    QUESTS.advance("talk", npc.id, 1);

    // 1) hand in a ready quest
    const ready = role.quests.find(q => QUESTS.isReady(q));
    if (ready) {
        const def = QUEST_DB[ready];
        const rewardTxt = rewardText(def.reward);
        const intro = ready === "q_intro";
        const lines = intro
            ? [greeting(npc.id), "Bienvenue parmi nous ! Prends ceci pour bien commencer.", `Récompense : ${rewardTxt}.`]
            : ["Tu as réussi ! Le village te remercie du fond du cœur.", `Voici ta récompense : ${rewardTxt}.`];
        openDialogue(name, lines, [{ label: intro ? "Merci !" : "Recevoir la récompense", action: () => { QUESTS.turnIn(ready); } }]);
        return;
    }

    // 2) offer an available quest
    const available = role.quests.find(q => canStart(q));
    if (available) {
        const def = QUEST_DB[available];
        // talk objective for the intro quest
        openDialogue(name, [greeting(npc.id), def.summary], [
            { label: "Accepter la quête", action: () => { QUESTS.start(available); QUESTS.advance("talk", npc.id, 1); } },
            { label: "Plus tard", action: () => { } },
        ]);
        return;
    }

    // 3) active quest reminder
    const active = role.quests.find(q => QUESTS.isStarted(q) && !QUESTS.isDone(q));
    if (active) {
        const objs = QUESTS.objectiveText(active).map(o => "• " + o.text).join("  ");
        openDialogue(name, [QUEST_DB[active].summary, "Reviens me voir quand ce sera fait. " + objs],
            role.shop ? shopChoice(world) : []);
        return;
    }

    // 4) merchant shop / idle flavor
    if (role.shop) {
        openDialogue(name, ["Bienvenue à mon échoppe, aventurier !"], shopChoice(world));
        return;
    }
    openDialogue(name, [idleLine(npc.id)]);
}

function shopChoice(world) {
    return [
        { label: "Acheter (boutique)", action: () => openShop() },
        { label: "Au revoir", action: () => { } },
    ];
}

function openShop() {
    const stock = [
        { id: "potion_health", price: 12 },
        { id: "potion_mana", price: 12 },
        { id: "bread", price: 4 },
        { id: "sword_steel", price: 120 },
        { id: "armor_leather", price: 50 },
    ];
    const choices = stock.map(s => ({
        label: `${ITEMS[s.id].icon} ${ITEMS[s.id].name} — ${s.price} or`,
        action: () => {
            if (GAME.data.gold >= s.price) {
                GAME.addGold(-s.price);
                GAME.addItem(s.id, 1);
                toast(`Acheté : ${ITEMS[s.id].name}`, "gold");
            } else {
                toast("Pas assez d'or !", "bad");
            }
            openShop();
        },
    }));
    choices.push({ label: "Fermer", action: () => { } });
    openDialogue("Marchande Lys", [`Tu as ${GAME.data.gold} or. Que veux-tu ?`], choices);
}

function rewardText(reward) {
    if (!reward) return "rien";
    const parts = [];
    if (reward.xp) parts.push(`${reward.xp} XP`);
    if (reward.gold) parts.push(`${reward.gold} or`);
    (reward.items || []).forEach(it => parts.push(`${ITEMS[it.id].icon} ${ITEMS[it.id].name}`));
    return parts.join(", ");
}

function greeting(id) {
    return {
        elder: "Ah, un visage nouveau ! Le village a bien besoin d'aide ces temps-ci.",
        merchant: "Psst, tu cherches du travail rémunéré ?",
        guard: "Halte ! ... Oh, tu as l'air capable. J'ai une tâche pour toi.",
        villager: "Bonjour à toi, voyageur.",
    }[id] || "Bonjour.";
}

function idleLine(id) {
    return {
        elder: "Que les anciens esprits veillent sur toi.",
        merchant: "Reviens quand ta bourse sera pleine !",
        guard: "Je garde l'œil ouvert. Reste vigilant dans les plaines.",
        villager: "On dit qu'un cristal ancien brillerait au loin dans les plaines...",
    }[id] || "...";
}

function isLowEnd() {
    return /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
}
