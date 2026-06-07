// Minimal DOM helpers for building the UI.

export function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
        if (k === "class") node.className = v;
        else if (k === "html") node.innerHTML = v;
        else if (k === "text") node.textContent = v;
        else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
        else if (k.startsWith("on") && typeof v === "function") {
            node.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (v !== null && v !== undefined) {
            node.setAttribute(k, v);
        }
    }
    (Array.isArray(children) ? children : [children]).forEach(c => {
        if (c == null) return;
        node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
}

export function getRoot() {
    let root = document.getElementById("pg-root");
    if (!root) {
        root = el("div", { id: "pg-root" });
        document.body.appendChild(root);
    }
    return root;
}

export function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
    return node;
}
