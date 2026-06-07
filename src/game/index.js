// Game controller: wires together state, UI, world, combat and input.
// Call initGame(ctx) once the scene, player and enemies exist.
import GAME from "./state.js";
import QUESTS from "./quests.js";
import "./data/items.js"; // registers ITEMS on GameState
import { injectStyles } from "./ui/styles.js";
import { createHUD, toast } from "./ui/hud.js";
import { openInventory, openQuestLog, closePanel, isPanelOpen } from "./ui/panels.js";
import { isDialogueOpen, closeDialogue } from "./ui/dialogue.js";
import { showMainMenu, showPause, showDeath, hideMenus, isMenuOpen } from "./ui/menu.js";
import { createTouchControls, createSystemBar } from "./ui/mobile.js";
import { createCombat } from "./combat.js";
import { buildWorld } from "./world/world.js";

let started = false;

export function initGame(ctx) {
    if (started) return;
    started = true;

    const { scene, character, camera, engine, terrain, enemies, anim, dummyAggregate } = ctx;
    const shadowGen = ctx.shadowGen || null;
    const spawn = character.position.clone();

    // ----- flags -----
    const flow = { running: false, paused: false };
    const isInteractive = () =>
        flow.running && !flow.paused && !isMenuOpen() && !isPanelOpen() && !isDialogueOpen();

    // ----- UI -----
    injectStyles();
    createHUD();
    const combat = createCombat(anim);
    const actions = {
        attack: () => isInteractive() && combat.attack(),
        spell: () => isInteractive() && combat.spell(),
        roll: () => isInteractive() && combat.roll(),
        interact: () => { if (isInteractive()) world.interactNearest(); },
    };
    createTouchControls(actions, isInteractive);
    createSystemBar({
        openInventory: () => { if (flow.running) openInventory(); },
        openQuests: () => { if (flow.running) openQuestLog(); },
        pause: () => togglePause(),
    });

    // ----- world -----
    const world = buildWorld({ scene, terrain, character, shadowGen, enemies });

    // ----- helpers -----
    function clearMovementInput() {
        inputMap["w"] = inputMap["s"] = inputMap["q"] = inputMap["e"] = false;
        inputMap[" "] = false;
    }

    function teleport(pos) {
        try { dummyAggregate && dummyAggregate.body.setLinearVelocity(BABYLON.Vector3.Zero()); } catch (e) { }
        try {
            if (dummyAggregate && dummyAggregate.body.setTargetTransform) {
                dummyAggregate.body.setTargetTransform(pos.clone(), character.rotationQuaternion || BABYLON.Quaternion.Identity());
            }
        } catch (e) { }
        character.position.copyFrom(pos);
    }

    function togglePause() {
        if (!flow.running) return;
        if (flow.paused) { resume(); return; }
        flow.paused = true;
        clearMovementInput();
        showPause(pauseHandlers);
    }

    function resume() {
        flow.paused = false;
        hideMenus();
        closePanel();
    }

    const pauseHandlers = {
        resume,
        openInventory: () => { flow.paused = true; openInventory(); },
        openQuests: () => { flow.paused = true; openQuestLog(); },
        save: () => GAME.save(),
        toMainMenu: () => toMainMenu(),
    };

    function startGame(fresh) {
        if (fresh) {
            GAME.reset();
            QUESTS.start("q_intro");
            teleport(spawn);
        } else {
            GAME.load();
            if (!QUESTS.activeQuests().length && !QUESTS.isDone("q_intro")) QUESTS.start("q_intro");
        }
        flow.running = true;
        flow.paused = false;
        hideMenus();
        GAME.alive = GAME.data.hp > 0;
        toast("Bonne aventure !", "good");
    }

    function toMainMenu() {
        flow.running = false;
        flow.paused = false;
        closePanel();
        closeDialogue();
        clearMovementInput();
        showMainMenu(menuHandlers);
    }

    const menuHandlers = {
        newGame: () => startGame(true),
        continueGame: () => startGame(false),
    };

    const deathHandlers = {
        respawn: () => {
            GAME.revive();
            teleport(spawn);
            flow.running = true;
            flow.paused = false;
            hideMenus();
        },
        toMainMenu: () => toMainMenu(),
    };

    // ----- death -----
    GAME.on("death", () => {
        flow.running = false;
        clearMovementInput();
        showDeath(deathHandlers);
    });

    // ----- autosave -----
    const autosave = () => { if (flow.running) GAME.save(); };
    GAME.on("level", autosave);
    GAME.on("quest", (e) => { if (e && e.type === "complete") autosave(); });
    window.addEventListener("beforeunload", autosave);
    setInterval(autosave, 30000);

    // ----- keyboard shortcuts (desktop) -----
    window.addEventListener("keydown", (e) => {
        const k = e.key.toLowerCase();
        if (k === "escape") { e.preventDefault(); if (isPanelOpen() || isDialogueOpen()) { closePanel(); closeDialogue(); } else togglePause(); return; }
        if (!flow.running) return;
        if (k === "i") { e.preventDefault(); if (!flow.paused) openInventory(); }
        else if (k === "j") { e.preventDefault(); if (!flow.paused) openQuestLog(); }
        else if (k === "g" || k === "enter") { if (isInteractive()) world.interactNearest(); }
    });

    // Left-click attack on the canvas (desktop).
    const canvas = document.getElementById("renderCanvas");
    if (canvas) {
        canvas.addEventListener("pointerdown", (e) => {
            if (e.button === 0 && isInteractive()) combat.attack();
        });
    }

    // ----- per-frame: input gating + enemy attacks + mana regen -----
    let regenAcc = 0;
    scene.onBeforeRenderObservable.add(() => {
        if (!isInteractive()) { clearMovementInput(); return; }

        // slow mana / health regen
        regenAcc += engine.getDeltaTime();
        if (regenAcc > 1500) {
            regenAcc = 0;
            if (GAME.data.mp < GAME.data.maxMp) GAME.restoreMana(1);
        }

        // enemies damage the player when close
        if (enemies && enemies.length) {
            enemies.forEach(en => {
                if (!en || !en.health || !en.health.isAlive) return;
                const d = BABYLON.Vector3.Distance(en.position, character.position);
                if (d < 11) {
                    en._atkCd = (en._atkCd || 0) - engine.getDeltaTime();
                    if (en._atkCd <= 0) {
                        en._atkCd = 1200;
                        GAME.takeDamage(6 + Math.floor(Math.random() * 4));
                    }
                }
            });
        }
    });

    // ----- boot into the main menu -----
    showMainMenu(menuHandlers);
    return { flow, world };
}
