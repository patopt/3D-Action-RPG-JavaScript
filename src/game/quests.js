// Quest manager: tracks active quests, advances objectives, hands out rewards.
import GAME from "./state.js";
import { QUESTS } from "./data/quests.js";

const STATUS = { ACTIVE: "active", READY: "ready", DONE: "done" };

class QuestManager {
    constructor() { this.toasts = []; }

    get progress() { return GAME.data.quests; }

    isStarted(id) { return !!this.progress[id]; }
    isDone(id) { return this.progress[id] && this.progress[id].status === STATUS.DONE; }

    start(id) {
        if (!QUESTS[id] || this.progress[id]) return false;
        const counters = {};
        QUESTS[id].objectives.forEach(o => { counters[o.id] = 0; });
        this.progress[id] = { status: STATUS.ACTIVE, counters };
        GAME.emit("quest", { id, type: "start" });
        GAME.emit("change");
        return true;
    }

    // Advance any active objective matching (type, target).
    advance(type, target, amount = 1) {
        let changed = false;
        for (const id in this.progress) {
            const p = this.progress[id];
            if (p.status !== STATUS.ACTIVE) continue;
            const def = QUESTS[id];
            def.objectives.forEach(o => {
                if (o.type === type && o.target === target && p.counters[o.id] < o.count) {
                    p.counters[o.id] = Math.min(o.count, p.counters[o.id] + amount);
                    changed = true;
                }
            });
            if (this._objectivesMet(id)) {
                p.status = STATUS.READY;
                GAME.emit("quest", { id, type: "ready" });
            }
        }
        if (changed) {
            GAME.emit("quest", { type: "advance" });
            GAME.emit("change");
        }
        return changed;
    }

    _objectivesMet(id) {
        const p = this.progress[id];
        const def = QUESTS[id];
        return def.objectives.every(o => p.counters[o.id] >= o.count);
    }

    isReady(id) { return this.progress[id] && this.progress[id].status === STATUS.READY; }

    turnIn(id) {
        const p = this.progress[id];
        const def = QUESTS[id];
        if (!p || p.status !== STATUS.READY) return false;
        p.status = STATUS.DONE;
        if (def.reward) {
            if (def.reward.xp) GAME.addXp(def.reward.xp);
            if (def.reward.gold) GAME.addGold(def.reward.gold);
            (def.reward.items || []).forEach(it => GAME.addItem(it.id, it.qty));
        }
        GAME.emit("quest", { id, type: "complete", reward: def.reward });
        GAME.emit("change");
        if (def.next) this.start(def.next);
        return true;
    }

    objectiveText(id) {
        const p = this.progress[id];
        const def = QUESTS[id];
        if (!p) return [];
        return def.objectives.map(o => {
            const cur = p.counters[o.id];
            const base = o.desc.replace(/\(\d+\/\d+\)/, "").trim();
            const showCount = o.count > 1 || o.type === "kill" || o.type === "collect";
            return {
                text: showCount ? `${base} (${cur}/${o.count})` : base,
                done: cur >= o.count,
            };
        });
    }

    activeQuests() {
        return Object.keys(this.progress)
            .filter(id => this.progress[id].status !== STATUS.DONE)
            .map(id => ({ id, def: QUESTS[id], state: this.progress[id] }));
    }

    // The quest currently shown in the HUD tracker (first non-done).
    trackedQuest() {
        const active = this.activeQuests();
        return active.length ? active[0] : null;
    }
}

const QUEST_MANAGER = new QuestManager();
export default QUEST_MANAGER;
export { STATUS };
