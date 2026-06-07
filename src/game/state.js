// Central game state: player progression, inventory, quests, world flags.
// Persisted to localStorage. Emits events so the UI can react.

const SAVE_KEY = "rpg_save_v1";

// Tiny event emitter so HUD / panels stay in sync with state changes.
class Emitter {
    constructor() { this.listeners = {}; }
    on(event, cb) {
        (this.listeners[event] ||= []).push(cb);
        return () => this.off(event, cb);
    }
    off(event, cb) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(l => l !== cb);
    }
    emit(event, payload) {
        (this.listeners[event] || []).forEach(cb => {
            try { cb(payload); } catch (e) { console.error("listener error", e); }
        });
        // wildcard
        (this.listeners["*"] || []).forEach(cb => cb(event, payload));
    }
}

function defaultState() {
    return {
        name: "Héros",
        level: 1,
        xp: 0,
        xpToNext: 50,
        hp: 100,
        maxHp: 100,
        mp: 50,
        maxMp: 50,
        gold: 25,
        attack: 6,
        defense: 2,
        // inventory: array of { id, qty }
        inventory: [
            { id: "potion_health", qty: 3 },
            { id: "bread", qty: 2 },
        ],
        // equipment slots
        equipment: { weapon: "sword_iron", armor: null, trinket: null },
        // quest progress: { questId: { status, counters } }
        quests: {},
        // arbitrary world flags (npc talked, chest opened, etc.)
        flags: {},
        playtime: 0,
    };
}

class GameState extends Emitter {
    constructor() {
        super();
        this.data = defaultState();
        this.alive = true;
    }

    // ----- progression -----
    addXp(amount) {
        this.data.xp += amount;
        let leveled = false;
        while (this.data.xp >= this.data.xpToNext) {
            this.data.xp -= this.data.xpToNext;
            this._levelUp();
            leveled = true;
        }
        this.emit("xp", { xp: this.data.xp, xpToNext: this.data.xpToNext });
        if (leveled) this.emit("level", { level: this.data.level });
        this.emit("change");
        return leveled;
    }

    _levelUp() {
        this.data.level += 1;
        this.data.xpToNext = Math.floor(this.data.xpToNext * 1.6 + 20);
        this.data.maxHp += 20;
        this.data.maxMp += 10;
        this.data.attack += 2;
        this.data.defense += 1;
        this.data.hp = this.data.maxHp;
        this.data.mp = this.data.maxMp;
    }

    addGold(amount) {
        this.data.gold = Math.max(0, this.data.gold + amount);
        this.emit("gold", this.data.gold);
        this.emit("change");
    }

    // ----- combat / vitals -----
    get totalAttack() {
        return this.data.attack + this._equipBonus("attack");
    }
    get totalDefense() {
        return this.data.defense + this._equipBonus("defense");
    }
    _equipBonus(stat) {
        // resolved lazily; items module sets ITEMS reference
        let total = 0;
        const items = GameState.ITEMS || {};
        for (const slot of Object.values(this.data.equipment)) {
            if (slot && items[slot] && items[slot].stats && items[slot].stats[stat]) {
                total += items[slot].stats[stat];
            }
        }
        return total;
    }

    takeDamage(rawAmount) {
        if (!this.alive) return 0;
        const reduced = Math.max(1, Math.round(rawAmount - this.totalDefense * 0.5));
        this.data.hp = Math.max(0, this.data.hp - reduced);
        this.emit("hp", { hp: this.data.hp, maxHp: this.data.maxHp });
        this.emit("damaged", reduced);
        if (this.data.hp <= 0) {
            this.alive = false;
            this.emit("death");
        }
        this.emit("change");
        return reduced;
    }

    heal(amount) {
        this.data.hp = Math.min(this.data.maxHp, this.data.hp + amount);
        this.emit("hp", { hp: this.data.hp, maxHp: this.data.maxHp });
        this.emit("healed", amount);
        this.emit("change");
    }

    restoreMana(amount) {
        this.data.mp = Math.min(this.data.maxMp, this.data.mp + amount);
        this.emit("mp", { mp: this.data.mp, maxMp: this.data.maxMp });
        this.emit("change");
    }

    spendMana(amount) {
        if (this.data.mp < amount) return false;
        this.data.mp -= amount;
        this.emit("mp", { mp: this.data.mp, maxMp: this.data.maxMp });
        this.emit("change");
        return true;
    }

    revive() {
        this.alive = true;
        this.data.hp = this.data.maxHp;
        this.data.mp = this.data.maxMp;
        this.emit("hp", { hp: this.data.hp, maxHp: this.data.maxHp });
        this.emit("mp", { mp: this.data.mp, maxMp: this.data.maxMp });
        this.emit("revive");
        this.emit("change");
    }

    // ----- inventory -----
    addItem(id, qty = 1) {
        const existing = this.data.inventory.find(s => s.id === id);
        if (existing) existing.qty += qty;
        else this.data.inventory.push({ id, qty });
        this.emit("inventory", this.data.inventory);
        this.emit("change");
    }

    removeItem(id, qty = 1) {
        const existing = this.data.inventory.find(s => s.id === id);
        if (!existing) return false;
        existing.qty -= qty;
        if (existing.qty <= 0) {
            this.data.inventory = this.data.inventory.filter(s => s !== existing);
        }
        this.emit("inventory", this.data.inventory);
        this.emit("change");
        return true;
    }

    countItem(id) {
        const existing = this.data.inventory.find(s => s.id === id);
        return existing ? existing.qty : 0;
    }

    equip(slot, id) {
        this.data.equipment[slot] = id;
        this.emit("equipment", this.data.equipment);
        this.emit("change");
    }

    // ----- flags -----
    setFlag(key, value = true) {
        this.data.flags[key] = value;
        this.emit("flag", { key, value });
    }
    getFlag(key) { return this.data.flags[key]; }

    // ----- persistence -----
    save() {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
            this.emit("saved");
            return true;
        } catch (e) {
            console.warn("Save failed", e);
            return false;
        }
    }

    load() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return false;
            const parsed = JSON.parse(raw);
            this.data = Object.assign(defaultState(), parsed);
            this.alive = this.data.hp > 0;
            this.emit("loaded");
            this.emit("change");
            return true;
        } catch (e) {
            console.warn("Load failed", e);
            return false;
        }
    }

    hasSave() {
        try { return !!localStorage.getItem(SAVE_KEY); }
        catch { return false; }
    }

    reset() {
        this.data = defaultState();
        this.alive = true;
        try { localStorage.removeItem(SAVE_KEY); } catch { }
        this.emit("change");
        this.emit("reset");
    }
}

// Singleton shared across the whole game.
const GAME = new GameState();
export default GAME;
export { GameState };
