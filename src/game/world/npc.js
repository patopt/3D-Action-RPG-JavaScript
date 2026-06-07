// Stylized NPC built from primitives, with a floating nameplate and a
// quest indicator ( ! available, ? ready to hand in ).

function flat(scene, name, hex) {
    const m = new BABYLON.StandardMaterial(name, scene);
    m.diffuseColor = BABYLON.Color3.FromHexString(hex);
    m.specularColor = new BABYLON.Color3(0, 0, 0);
    return m;
}

export function createNPC(scene, def, pos, shadowGen) {
    const root = new BABYLON.TransformNode("npc_" + def.id, scene);
    root.position.copyFrom(pos);

    // body
    const body = BABYLON.MeshBuilder.CreateCylinder("npcBody", {
        height: 9, diameterTop: 3.5, diameterBottom: 5, tessellation: 8,
    }, scene);
    body.material = flat(scene, "npcRobe_" + def.id, def.color || "#5a6cc0");
    body.position.y = 4.5;
    body.parent = root;

    // head
    const head = BABYLON.MeshBuilder.CreateSphere("npcHead", { diameter: 3.4, segments: 6 }, scene);
    head.material = flat(scene, "npcSkin_" + def.id, "#e8b98a");
    head.position.y = 10.6;
    head.parent = root;

    // simple hair/hat cap
    const cap = BABYLON.MeshBuilder.CreateCylinder("npcCap", { height: 1.6, diameterTop: 0.6, diameterBottom: 3.6, tessellation: 8 }, scene);
    cap.material = flat(scene, "npcCap_" + def.id, def.hair || "#3a2a1a");
    cap.position.y = 12.2;
    cap.parent = root;

    if (shadowGen) { shadowGen.addShadowCaster(body); shadowGen.addShadowCaster(head); }

    // nameplate
    const plate = makeLabelPlane(scene, def.name, "#f5ca56");
    plate.position.y = 15;
    plate.parent = root;

    // quest indicator
    const indicator = makeLabelPlane(scene, " ", "#ffe35a", 2.6);
    indicator.position.y = 17.6;
    indicator.parent = root;
    indicator.setEnabled(false);

    // idle bob + face the player
    scene.onBeforeRenderObservable.add(() => {
        if (root.isDisposed()) return;
        body.position.y = 4.5 + Math.sin(performance.now() * 0.002 + pos.x) * 0.15;
        if (typeof PLAYER === "object" && PLAYER.position) {
            const dir = PLAYER.position.subtract(root.position);
            dir.y = 0;
            if (dir.lengthSquared() > 1) {
                root.rotation.y = Math.atan2(dir.x, dir.z);
            }
        }
    });

    return {
        id: def.id,
        def,
        root,
        position: root.position,
        setIndicator(symbol) {
            if (!symbol) { indicator.setEnabled(false); return; }
            indicator.setEnabled(true);
            updateLabel(indicator, symbol, symbol === "?" ? "#6fd66f" : "#ffe35a");
        },
    };
}

function makeLabelPlane(scene, text, color, size = 1) {
    const dt = new BABYLON.DynamicTexture("npcLabel", { width: 256, height: 64 }, scene, true);
    dt.hasAlpha = true;
    drawLabel(dt, text, color);
    const plane = BABYLON.MeshBuilder.CreatePlane("npcLabelPlane", { width: 12 * size, height: 3 * size }, scene);
    const m = new BABYLON.StandardMaterial("npcLabelMat", scene);
    m.diffuseTexture = dt;
    m.opacityTexture = dt;
    m.emissiveColor = new BABYLON.Color3(1, 1, 1);
    m.disableLighting = true;
    m.backFaceCulling = false;
    plane.material = m;
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    plane._dt = dt;
    return plane;
}

function updateLabel(plane, text, color) {
    drawLabel(plane._dt, text, color);
}

function drawLabel(dt, text, color) {
    const ctx = dt.getContext();
    ctx.clearRect(0, 0, 256, 64);
    ctx.font = "bold 40px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#000";
    ctx.strokeText(text, 128, 34);
    ctx.fillStyle = color;
    ctx.fillText(text, 128, 34);
    dt.update();
}
