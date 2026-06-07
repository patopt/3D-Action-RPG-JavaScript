// Dialogue box with typewriter effect, multi-line pages and choice buttons.
import { el, getRoot } from "./dom.js";

let box = null;
let state = null;

export function isDialogueOpen() { return box !== null; }

// lines: array of strings (pages). choices: [{ label, action }] shown after last page.
export function openDialogue(speaker, lines, choices = []) {
    closeDialogue();
    state = { speaker, lines: Array.isArray(lines) ? lines : [lines], choices, page: 0, typing: false };
    box = el("div", { id: "pg-dialogue", class: "pg-frame pg-click" }, [
        el("div", { class: "pg-speaker", text: speaker }),
        el("div", { class: "pg-line", id: "pg-dia-line" }),
        el("div", { class: "pg-choices", id: "pg-dia-choices" }),
        el("div", { class: "pg-cont", id: "pg-dia-cont", text: "▼ continuer" }),
    ]);
    box.addEventListener("click", advance);
    getRoot().appendChild(box);
    showPage();
}

function showPage() {
    const lineNode = document.getElementById("pg-dia-line");
    const choicesNode = document.getElementById("pg-dia-choices");
    const cont = document.getElementById("pg-dia-cont");
    choicesNode.innerHTML = "";
    cont.style.display = "none";
    const text = state.lines[state.page] || "";
    typeWriter(lineNode, text, () => {
        const isLast = state.page >= state.lines.length - 1;
        if (isLast && state.choices.length) {
            renderChoices(choicesNode);
        } else {
            cont.style.display = "block";
        }
    });
}

let typeTimer = null;
function typeWriter(node, text, done) {
    state.typing = true;
    node.textContent = "";
    let i = 0;
    clearInterval(typeTimer);
    typeTimer = setInterval(() => {
        node.textContent = text.slice(0, ++i);
        if (i >= text.length) {
            clearInterval(typeTimer);
            state.typing = false;
            done && done();
        }
    }, 18);
}

function renderChoices(container) {
    state.choices.forEach(c => {
        container.appendChild(el("div", {
            class: "pg-choice",
            text: "▶ " + c.label,
            onClick: (e) => { e.stopPropagation(); const fn = c.action; closeDialogue(); fn && fn(); },
        }));
    });
}

function advance(e) {
    if (!state) return;
    // If still typing, finish instantly.
    if (state.typing) {
        clearInterval(typeTimer);
        const lineNode = document.getElementById("pg-dia-line");
        lineNode.textContent = state.lines[state.page] || "";
        state.typing = false;
        const isLast = state.page >= state.lines.length - 1;
        if (isLast && state.choices.length) renderChoices(document.getElementById("pg-dia-choices"));
        else document.getElementById("pg-dia-cont").style.display = "block";
        return;
    }
    const isLast = state.page >= state.lines.length - 1;
    if (isLast) {
        if (!state.choices.length) closeDialogue();
        return; // choices handle their own click
    }
    state.page += 1;
    showPage();
}

export function closeDialogue() {
    clearInterval(typeTimer);
    if (box) { box.remove(); box = null; }
    state = null;
}
