// Quest database.
// objective.type: kill | collect | talk | reach
//   kill   -> target = enemy tag (e.g. "slime"), count
//   collect-> target = item id, count
//   talk   -> target = npc id
//   reach  -> target = flag name (set elsewhere)

export const QUESTS = {
    q_intro: {
        title: "Bienvenue, aventurier",
        giver: "elder",
        summary: "Le doyen du village a besoin d'aide. Va lui parler.",
        objectives: [
            { id: "talk_elder", type: "talk", target: "elder", count: 1, desc: "Parler au Doyen" },
        ],
        reward: { xp: 20, gold: 10, items: [{ id: "potion_health", qty: 1 }] },
        next: "q_slimes",
    },
    q_slimes: {
        title: "La menace des slimes",
        giver: "elder",
        summary: "Des slimes envahissent les plaines. Élimine-les pour protéger le village.",
        objectives: [
            { id: "kill_slimes", type: "kill", target: "slime", count: 5, desc: "Vaincre des slimes (0/5)" },
        ],
        reward: { xp: 60, gold: 30, items: [{ id: "sword_steel", qty: 1 }] },
        next: "q_gel",
    },
    q_gel: {
        title: "Composants alchimiques",
        giver: "merchant",
        summary: "La marchande veut du gel de slime pour ses potions.",
        objectives: [
            { id: "collect_gel", type: "collect", target: "slime_gel", count: 4, desc: "Récolter du gel de slime (0/4)" },
        ],
        reward: { xp: 50, gold: 25, items: [{ id: "armor_leather", qty: 1 }] },
        next: "q_wood",
    },
    q_wood: {
        title: "Réparer la palissade",
        giver: "guard",
        summary: "Le garde a besoin de bois pour réparer les défenses du village.",
        objectives: [
            { id: "collect_wood", type: "collect", target: "wood", count: 6, desc: "Récolter du bois (0/6)" },
        ],
        reward: { xp: 70, gold: 40, items: [{ id: "potion_mana", qty: 2 }] },
        next: "q_crystal",
    },
    q_crystal: {
        title: "Le cristal ancien",
        giver: "elder",
        summary: "Une relique repose quelque part dans les plaines. Trouve le cristal ancien.",
        objectives: [
            { id: "find_crystal", type: "collect", target: "crystal", count: 1, desc: "Trouver le cristal ancien (0/1)" },
            { id: "kill_more", type: "kill", target: "slime", count: 8, desc: "Repousser les slimes (0/8)" },
        ],
        reward: { xp: 150, gold: 100, items: [{ id: "amulet_power", qty: 1 }, { id: "armor_plate", qty: 1 }] },
        next: null,
    },
};

export function getQuest(id) { return QUESTS[id]; }
