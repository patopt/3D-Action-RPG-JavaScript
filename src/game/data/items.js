// Item database. Each item: id -> definition.
// type: consumable | weapon | armor | trinket | material | quest
// icon: a single emoji used in the pixel UI (rendered crisp).

import GAME from "../state.js";

export const ITEMS = {
    potion_health: {
        name: "Potion de soin",
        type: "consumable",
        icon: "🧪",
        desc: "Restaure 40 PV.",
        value: 15,
        use(state) { state.heal(40); },
    },
    potion_mana: {
        name: "Potion de mana",
        type: "consumable",
        icon: "🔵",
        desc: "Restaure 30 PM.",
        value: 15,
        use(state) { state.restoreMana(30); },
    },
    bread: {
        name: "Pain",
        type: "consumable",
        icon: "🍞",
        desc: "Restaure 15 PV.",
        value: 4,
        use(state) { state.heal(15); },
    },
    sword_iron: {
        name: "Épée de fer",
        type: "weapon",
        icon: "🗡️",
        desc: "Une lame solide. +6 ATQ.",
        value: 40,
        stats: { attack: 6 },
    },
    sword_steel: {
        name: "Épée d'acier",
        type: "weapon",
        icon: "⚔️",
        desc: "Forgée pour les héros. +12 ATQ.",
        value: 120,
        stats: { attack: 12 },
    },
    armor_leather: {
        name: "Armure de cuir",
        type: "armor",
        icon: "🦺",
        desc: "Protection légère. +4 DEF.",
        value: 50,
        stats: { defense: 4 },
    },
    armor_plate: {
        name: "Armure de plates",
        type: "armor",
        icon: "🛡️",
        desc: "Lourde mais robuste. +10 DEF.",
        value: 160,
        stats: { defense: 10 },
    },
    amulet_power: {
        name: "Amulette de puissance",
        type: "trinket",
        icon: "📿",
        desc: "+3 ATQ, +3 DEF.",
        value: 100,
        stats: { attack: 3, defense: 3 },
    },
    slime_gel: {
        name: "Gel de slime",
        type: "material",
        icon: "🟢",
        desc: "Substance gluante. Matériau d'artisanat.",
        value: 3,
    },
    wood: {
        name: "Bois",
        type: "material",
        icon: "🪵",
        desc: "Récolté sur les arbres.",
        value: 2,
    },
    crystal: {
        name: "Cristal ancien",
        type: "quest",
        icon: "💎",
        desc: "Émet une lueur étrange. Objet de quête.",
        value: 0,
    },
    gold_coin: {
        name: "Pièces d'or",
        type: "material",
        icon: "🪙",
        desc: "De l'or sonnant et trébuchant.",
        value: 1,
    },
};

// Let the state module resolve equipment bonuses without a circular import.
import { GameState } from "../state.js";
GameState.ITEMS = ITEMS;

export function getItem(id) { return ITEMS[id]; }

export function useItem(id) {
    const item = ITEMS[id];
    if (!item) return false;
    if (item.type === "consumable" && item.use) {
        if (GAME.countItem(id) <= 0) return false;
        item.use(GAME);
        GAME.removeItem(id, 1);
        return true;
    }
    if (item.type === "weapon") { GAME.equip("weapon", id); return true; }
    if (item.type === "armor") { GAME.equip("armor", id); return true; }
    if (item.type === "trinket") { GAME.equip("trinket", id); return true; }
    return false;
}
