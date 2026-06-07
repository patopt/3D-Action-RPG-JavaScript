// Main menu, pause menu, settings and death screen.
import GAME from "../state.js";
import { el, getRoot } from "./dom.js";

let menuNode = null;

export function isMenuOpen() { return menuNode !== null; }

function close() { if (menuNode) { menuNode.remove(); menuNode = null; } }

// ---------------- Main menu (title screen) ----------------
export function showMainMenu(handlers) {
    close();
    const hasSave = GAME.hasSave();
    menuNode = el("div", { id: "pg-menu", class: "pg-click" }, [
        el("div", { class: "pg-game-title", text: "Aether Quest" }),
        el("div", { class: "pg-sub", text: "★ Un RPG d'action 3D ★" }),
        el("div", { class: "pg-btn", text: "Nouvelle partie", onClick: () => { close(); handlers.newGame(); } }),
        hasSave ? el("div", { class: "pg-btn", text: "Continuer", onClick: () => { close(); handlers.continueGame(); } }) : null,
        el("div", { class: "pg-btn", text: "Comment jouer", onClick: () => showControls(handlers) }),
        el("div", {
            class: "pg-hint",
            html: isTouch()
                ? "Manette gauche : se déplacer · manette droite : caméra · boutons à droite : attaque / esquive / sort / interagir."
                : "ZQSD ou flèches : se déplacer · Souris : caméra · 5 : attaque · C : sort · Espace : esquive · G : interagir · I : inventaire · J : quêtes · Échap : pause.",
        }),
    ]);
    getRoot().appendChild(menuNode);
}

function showControls(handlers) {
    close();
    menuNode = el("div", { id: "pg-menu", class: "pg-click" }, [
        el("div", { class: "pg-title", style: { fontSize: "22px", marginBottom: "16px" }, text: "Comment jouer" }),
        el("div", { class: "pg-hint", style: { fontSize: "13px", maxWidth: "440px", textAlign: "left" }, html: controlsHelp() }),
        el("div", { class: "pg-btn", text: "Retour", onClick: () => showMainMenu(handlers) }),
    ]);
    getRoot().appendChild(menuNode);
}

function controlsHelp() {
    return `
    <b>But du jeu</b> : aide le village, accomplis des quêtes, combats les slimes,
    récolte des ressources et trouve le cristal ancien.<br><br>
    <b>Déplacement</b> : ZQSD / flèches (ou la manette tactile gauche).<br>
    <b>Caméra</b> : souris / manette tactile droite.<br>
    <b>Attaquer</b> : touche <b>5</b> ou clic (bouton ⚔ sur mobile). Vise un ennemi (contour rouge).<br>
    <b>Sort de feu</b> : touche <b>C</b> (bouton 🔥).<br>
    <b>Esquive</b> : <b>Espace</b> (bouton ↻).<br>
    <b>Interagir</b> : <b>G</b> (bouton ✋) près d'un PNJ, coffre ou ressource.<br>
    <b>Inventaire</b> : <b>I</b> · <b>Quêtes</b> : <b>J</b> · <b>Pause</b> : <b>Échap</b>.<br><br>
    Bats les ennemis pour gagner de l'XP et de l'or. Récolte le bois sur les arbres
    et le gel sur les slimes. Sauvegarde depuis le menu pause.`;
}

// ---------------- Pause menu ----------------
export function showPause(handlers) {
    close();
    menuNode = el("div", { id: "pg-menu", class: "pg-click" }, [
        el("div", { class: "pg-title", style: { fontSize: "30px", marginBottom: "10px" }, text: "Pause" }),
        el("div", { class: "pg-btn", text: "Reprendre", onClick: () => { close(); handlers.resume(); } }),
        el("div", { class: "pg-btn", text: "Inventaire", onClick: () => { close(); handlers.openInventory(); } }),
        el("div", { class: "pg-btn", text: "Quêtes", onClick: () => { close(); handlers.openQuests(); } }),
        el("div", { class: "pg-btn", text: "Sauvegarder", onClick: () => { handlers.save(); flash("Partie sauvegardée !"); } }),
        el("div", { class: "pg-btn", text: "Comment jouer", onClick: () => showControlsPause(handlers) }),
        el("div", { class: "pg-btn danger", text: "Menu principal", onClick: () => { close(); handlers.toMainMenu(); } }),
    ]);
    getRoot().appendChild(menuNode);
}

function showControlsPause(handlers) {
    close();
    menuNode = el("div", { id: "pg-menu", class: "pg-click" }, [
        el("div", { class: "pg-title", style: { fontSize: "22px", marginBottom: "16px" }, text: "Comment jouer" }),
        el("div", { class: "pg-hint", style: { fontSize: "13px", maxWidth: "440px", textAlign: "left" }, html: controlsHelp() }),
        el("div", { class: "pg-btn", text: "Retour", onClick: () => showPause(handlers) }),
    ]);
    getRoot().appendChild(menuNode);
}

function flash(msg) {
    const f = el("div", { class: "pg-toast good", text: msg, style: { position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)", zIndex: "50" } });
    getRoot().appendChild(f);
    setTimeout(() => f.remove(), 1800);
}

// ---------------- Death screen ----------------
export function showDeath(handlers) {
    close();
    menuNode = el("div", { id: "pg-death", class: "pg-click" }, [
        el("div", { class: "pg-dead-title", text: "Vous êtes tombé" }),
        el("div", { class: "pg-hint", text: "Le village a encore besoin de vous." }),
        el("div", { class: "pg-btn", text: "Renaître au village", onClick: () => { close(); handlers.respawn(); } }),
        el("div", { class: "pg-btn danger", text: "Menu principal", onClick: () => { close(); handlers.toMainMenu(); } }),
    ]);
    getRoot().appendChild(menuNode);
}

export function hideMenus() { close(); }

function isTouch() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
}
