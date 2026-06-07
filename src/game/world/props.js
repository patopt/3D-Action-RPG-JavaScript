// Procedural props built from Babylon primitives (no external models needed).
// Low-poly + flat shaded for a clean retro look.

function flatMat(scene, name, hex, emissive = 0) {
    const m = new BABYLON.StandardMaterial(name, scene);
    const c = BABYLON.Color3.FromHexString(hex);
    m.diffuseColor = c;
    m.specularColor = new BABYLON.Color3(0, 0, 0);
    if (emissive > 0) m.emissiveColor = c.scale(emissive);
    return m;
}

let _matCache = {};
function mat(scene, key, hex, emissive = 0) {
    const ck = key + (scene.uniqueId || 0);
    if (!_matCache[ck]) _matCache[ck] = flatMat(scene, key, hex, emissive);
    return _matCache[ck];
}

// ---------------- Tree (harvestable for wood) ----------------
export function createTree(scene, pos, shadowGen) {
    const root = new BABYLON.TransformNode("tree", scene);
    root.position.copyFrom(pos);

    const trunk = BABYLON.MeshBuilder.CreateCylinder("treeTrunk", {
        height: 16, diameterTop: 2.2, diameterBottom: 3.4, tessellation: 7,
    }, scene);
    trunk.material = mat(scene, "barkMat", "#6b4423");
    trunk.position.y = 8;
    trunk.parent = root;
    trunk.isPickable = false;

    const foliageMat = mat(scene, "leafMat", "#3a7d2c");
    const blobs = [
        { d: 16, y: 19, x: 0, z: 0 },
        { d: 12, y: 24, x: 3, z: 2 },
        { d: 11, y: 23, x: -3, z: -2 },
        { d: 10, y: 27, x: 0, z: -1 },
    ];
    blobs.forEach((b, i) => {
        const s = BABYLON.MeshBuilder.CreateSphere("leaf" + i, { diameter: b.d, segments: 4 }, scene);
        s.material = foliageMat;
        s.position.set(b.x, b.y, b.z);
        s.parent = root;
        s.isPickable = false;
        if (shadowGen) shadowGen.addShadowCaster(s);
    });
    if (shadowGen) shadowGen.addShadowCaster(trunk);

    root.scaling.setAll(0.8 + Math.random() * 0.5);
    root.rotation.y = Math.random() * Math.PI * 2;
    return root;
}

// ---------------- Rock ----------------
export function createRock(scene, pos) {
    const rock = BABYLON.MeshBuilder.CreatePolyhedron("rock", { type: 1, size: 2 + Math.random() * 2.5 }, scene);
    rock.material = mat(scene, "rockMat", "#7d7d86");
    rock.position.copyFrom(pos);
    rock.position.y += 1.5;
    rock.rotation.set(Math.random(), Math.random() * Math.PI, Math.random());
    rock.freezeWorldMatrix();
    rock.isPickable = false;
    return rock;
}

// ---------------- Bush ----------------
export function createBush(scene, pos) {
    const bush = BABYLON.MeshBuilder.CreateSphere("bush", { diameter: 5 + Math.random() * 3, segments: 4 }, scene);
    bush.material = mat(scene, "bushMat", "#2f6b2a");
    bush.position.copyFrom(pos);
    bush.position.y += 2;
    bush.scaling.y = 0.7;
    bush.freezeWorldMatrix();
    bush.isPickable = false;
    return bush;
}

// ---------------- Chest (opens once) ----------------
export function createChest(scene, pos) {
    const root = new BABYLON.TransformNode("chest", scene);
    root.position.copyFrom(pos);
    const body = BABYLON.MeshBuilder.CreateBox("chestBody", { width: 5, height: 3.2, depth: 3.4 }, scene);
    body.material = mat(scene, "chestMat", "#7a4a1e");
    body.position.y = 1.8;
    body.parent = root;
    const lid = BABYLON.MeshBuilder.CreateBox("chestLid", { width: 5.2, height: 1.4, depth: 3.6 }, scene);
    lid.material = mat(scene, "chestLidMat", "#9a5a24");
    lid.position.y = 4;
    lid.parent = root;
    const band = BABYLON.MeshBuilder.CreateBox("chestBand", { width: 5.3, height: 0.6, depth: 3.7 }, scene);
    band.material = mat(scene, "chestBandMat", "#f5ca56", 0.2);
    band.position.y = 3.2;
    band.parent = root;
    root.lid = lid;
    return root;
}

export function openChestAnim(chest) {
    if (!chest.lid) return;
    const anim = new BABYLON.Animation("lidOpen", "rotation.x", 30,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    anim.setKeys([{ frame: 0, value: 0 }, { frame: 12, value: -1.1 }]);
    chest.lid.animations = [anim];
    chest.getScene().beginAnimation(chest.lid, 0, 12, false);
}

// ---------------- Glowing crystal pickup ----------------
export function createCrystal(scene, pos) {
    const crystal = BABYLON.MeshBuilder.CreatePolyhedron("crystalPickup", { type: 2, size: 3 }, scene);
    const m = flatMat(scene, "crystalMat", "#7be0ff", 0.9);
    m.alpha = 0.92;
    crystal.material = m;
    crystal.position.copyFrom(pos);
    crystal.position.y += 4;
    const light = new BABYLON.PointLight("crystalLight", crystal.position.clone(), scene);
    light.diffuse = BABYLON.Color3.FromHexString("#7be0ff");
    light.intensity = 0.6;
    light.range = 40;
    light.parent = crystal;
    scene.onBeforeRenderObservable.add(() => {
        if (crystal.isDisposed()) return;
        crystal.rotation.y += 0.02;
        crystal.position.y = pos.y + 4 + Math.sin(performance.now() * 0.002) * 0.8;
    });
    return crystal;
}

// ---------------- Ambient critter (harmless, wanders) ----------------
export function createCritter(scene, pos, terrain) {
    const colors = ["#e0b0ff", "#ffd36f", "#a0e0ff", "#ffa0c0"];
    const body = BABYLON.MeshBuilder.CreateSphere("critter", { diameter: 2.4, segments: 5 }, scene);
    body.material = mat(scene, "critter" + Math.floor(Math.random() * 4), colors[Math.floor(Math.random() * colors.length)]);
    body.position.copyFrom(pos);
    body.position.y += 1.5;

    let target = pos.clone();
    let timer = 0;
    const base = pos.clone();
    scene.onBeforeRenderObservable.add(() => {
        if (body.isDisposed()) return;
        timer -= 1;
        if (timer <= 0) {
            timer = 120 + Math.random() * 180;
            target = base.add(new BABYLON.Vector3((Math.random() - 0.5) * 60, 0, (Math.random() - 0.5) * 60));
            if (terrain) {
                const h = terrain.getHeightAtCoordinates(target.x, target.z);
                if (!isNaN(h)) target.y = h + 1.5;
            }
        }
        body.position = BABYLON.Vector3.Lerp(body.position, target, 0.01);
        body.position.y += Math.abs(Math.sin(performance.now() * 0.006)) * 0.4; // little hops
    });
    return body;
}
