// Safe player-combat helpers used by touch buttons and mouse clicks.
// Damage scales with GameState progression. Defensive against null targets
// and enemy health bars that are not attached yet.
import GAME from "./state.js";
import { SPELLS } from "../combat/SPELLS.js";
import { toast } from "./ui/hud.js";

const ATTACK_RANGE = 26;
const SPELL_MANA = 10;

export function createCombat(anim) {
    let attackCooldown = 0;

    function safeDamage(target, amount) {
        if (!target || !target.health || !target.health.isAlive) return;
        try {
            target.health.takeDamage(amount);
        } catch (e) {
            // Enemy health bar may not be attached during the first seconds.
            // Health was still reduced before the bar update threw.
        }
    }

    function inRange(target) {
        if (!target || !target.position || !PLAYER || !PLAYER.position) return false;
        return BABYLON.Vector3.Distance(PLAYER.position, target.position) <= ATTACK_RANGE;
    }

    function playAttackAnim() {
        if (!anim) return;
        try {
            if (anim.Attack) {
                anim.BreathingIdle && anim.BreathingIdle.stop();
                anim.Attack.start(false, 1.3, anim.Attack.from, anim.Attack.to - 20, true);
            }
        } catch (e) { }
    }

    function attack() {
        const now = performance.now();
        if (now < attackCooldown) return;
        attackCooldown = now + 280;
        playAttackAnim();
        const t = PLAYER && PLAYER.target;
        if (t && inRange(t)) {
            const dmg = GAME.totalAttack + Math.floor(Math.random() * 3);
            safeDamage(t, dmg);
        }
    }

    function spell() {
        const t = PLAYER && PLAYER.target;
        if (!GAME.spendMana(SPELL_MANA)) { toast("Pas assez de mana", "bad"); return; }
        try {
            if (anim && anim.SelfCast) anim.SelfCast.start(false, 1.0, anim.SelfCast.from, anim.SelfCast.to - 50, true);
        } catch (e) { }
        if (t && t.health && t.health.isAlive) {
            try { SPELLS.fireball.cast(PLAYER.health, t.health); } catch (e) { }
            // guaranteed scaled hit on top of the spell effect
            safeDamage(t, Math.max(6, Math.floor(GAME.totalAttack * 0.8)));
        } else {
            toast("Aucune cible", "bad");
        }
    }

    function roll() {
        // The movement loop reads inputMap[" "] to trigger the roll animation.
        inputMap[" "] = true;
        setTimeout(() => { inputMap[" "] = false; }, 80);
    }

    return { attack, spell, roll };
}
