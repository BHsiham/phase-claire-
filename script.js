// --- ÉTAT GLOBAL ET HISTORIQUE ---
let state = {
    photon680: false, 
    photon700: false, 
    electronPos: 'ps2', 
    protonsLumen: 4, 
    protonsStroma: 15,
    nadphProduced: 0,
    atpProduced: 0,
    e2Pumped: false 
};

let history = []; // Stockage des états pour le bouton "Reculer"

// --- FONCTIONS DE GESTION D'ÉTAT ---
function sauvegarderEtat() {
    history.push(JSON.parse(JSON.stringify(state)));
}

function reinitialiser() {
    state = {
        photon680: false, photon700: false, electronPos: 'ps2',
        protonsLumen: 4, protonsStroma: 15, nadphProduced: 0,
        atpProduced: 0, e2Pumped: false
    };
    history = [];
    document.getElementById('atp-count').innerText = "0";
    document.getElementById('nadph-count').innerText = "0";
    initScene();
    actualiserInstruction();
}

function reculerEtape() {
    if (history.length > 0) {
        state = history.pop();
        document.getElementById('atp-count').innerText = state.atpProduced;
        document.getElementById('nadph-count').innerText = state.nadphProduced;
        initScene();
        actualiserInstruction();
    } else {
        alert("Vous êtes au début de l'expérience.");
    }
}

// --- INITIALISATION ---
function init() {
    initScene();
    setupDragAndDrop();
    actualiserInstruction();
}

function initScene() {
    // Nettoyage des éléments dynamiques
    document.querySelectorAll('.proton-particle').forEach(p => p.remove());
    const existingE1 = document.getElementById('electron-mobile');
    const existingE2 = document.getElementById('electron-psi-active');
    if(existingE1) existingE1.remove();
    if(existingE2) existingE2.remove();

    // Reconstruction selon l'état
    for(let i=0; i < state.protonsLumen; i++) creerProtonLumen(false);
    for(let i=0; i < state.protonsStroma; i++) creerProtonStroma();

    // Rétablir les éléments de drag & drop
    document.getElementById('h2o-source').style.display = (state.photon680 && state.electronPos !== 'ps2') ? 'none' : 'block';
    document.getElementById('nadp-target').style.display = (state.nadphProduced > 0) ? 'none' : 'block';
    document.getElementById('adp-pi').style.display = (state.nadphProduced > 0) ? 'block' : 'none';

    // Repositionner l'électron si nécessaire
    if (state.electronPos !== 'ps2' && state.electronPos !== 'e3') {
        const id = (state.electronPos === 'ps1' || state.electronPos === 't3') ? 'electron-psi-active' : 'electron-mobile';
        creerElectron(id, state.electronPos, id === 'electron-mobile' ? 'electron' : 'electron-excité');
    }
}

// --- GÉNÉRATION DES PARTICULES ---
function creerProtonStroma() {
    const p = document.createElement('div');
    p.className = "proton-particle stroma-h";
    p.innerText = "H+";
    p.style.left = (Math.random() * 90) + "%";
    p.style.top = (Math.random() * 30 + 5) + "%";
    document.getElementById('stroma').appendChild(p);
}

function creerProtonLumen(isAnimated) {
    const p = document.createElement('div');
    p.className = "proton-particle";
    if(isAnimated) p.classList.add('pumping-animation');
    p.innerText = "H+";
    p.style.left = (Math.random() * 80 + 10) + "%";
    p.style.top = (Math.random() * 50 + 25) + "%";
    document.getElementById('lumen').appendChild(p);
}

function creerOxygene() {
    const o2 = document.createElement('div');
    o2.className = "oxygen-particle";
    o2.innerText = "1/2 O₂";
    o2.style.left = "15%";
    o2.style.bottom = "30%";
    document.getElementById('game-container').appendChild(o2);
    setTimeout(() => { o2.style.transform = "translateY(-300px)"; o2.style.opacity = "0"; }, 100);
    setTimeout(() => o2.remove(), 3000);
}

// --- GUIDAGE PÉDAGOGIQUE ---
function actualiserInstruction() {
    const instr = document.getElementById('instruction');
    instr.style.color = "white";

    // Mise à jour visuelle des complexes
    document.getElementById('ps2').style.backgroundColor = state.photon680 ? "#ffeb3b" : "";
    document.getElementById('ps1').style.backgroundColor = (state.photon700 && state.electronPos !== 'ps1') ? "#d32f2f" : "";

    switch (state.electronPos) {
        case 'ps2':
            instr.innerText = state.photon680 ? "PSII excité! Faites la photolyse de l'eau (H2O)." : "Étape 1 : Choisissez la radiation convenable (680nm) pour activer le PSII.";
            break;
        case 't1': instr.innerText = "Transportez l'électron vers b6f (E2)."; break;
        case 'e2':
            instr.innerText = !state.e2Pumped ? "Cliquez sur E2 pour pomper des protons !" : "Flux activé ! Continuez vers T2.";
            break;
        case 't2': instr.innerText = "L'électron arrive au PSI. Excitez le (700nm)."; break;
        case 'ps1': instr.innerText = "PSI stabilisé. Déplacez l'électron excité vers T3."; break;
        case 't3': instr.innerText = "Allez vers la Ferrédoxine (E3)."; break;
        case 'e3': instr.innerText = "Réduisez le NADP+ en NADPH,H+ sur E3."; break;
    }
}

// --- INTERACTIONS ---
function setupDragAndDrop() {
    const sequence = ['ps2', 't1', 'e2', 't2', 'ps1', 't3', 'e3'];

    // Éléments Draggable
    document.querySelectorAll('.light-beam, #h2o-source, #nadp-target, #adp-pi').forEach(el => {
        el.addEventListener('dragstart', e => {
            if(el.classList.contains('light-beam')) e.dataTransfer.setData('wavelength', el.id);
            else e.dataTransfer.setData('item', el.id.split('-')[0]); // h2o, nadp, adp
        });
    });

    document.querySelectorAll('.complex, #atp-synthase').forEach(target => {
        target.addEventListener('dragover', e => e.preventDefault());
        target.addEventListener('drop', e => {
            const wave = e.dataTransfer.getData('wavelength');
            const item = e.dataTransfer.getData('item');
            const type = e.dataTransfer.getData('type');

            // 1. Lumière sur PSII
            if (target.id === 'ps2' && wave === 'light-680') {
                sauvegarderEtat();
                state.photon680 = true;
                actualiserInstruction();
            }

            // 2. Photolyse H2O
            else if (target.id === 'ps2' && item === 'h2o' && state.photon680) {
                sauvegarderEtat();
                document.getElementById('h2o-source').style.display = 'none';
                creerOxygene();
                creerProtonLumen(true); creerProtonLumen(true);
                state.protonsLumen += 2;
                creerElectron('electron-mobile', 'ps2', 'electron');
                actualiserInstruction();
            }

            // 3. Lumière sur PSI
            else if (target.id === 'ps1' && wave === 'light-700') {
                sauvegarderEtat();
                state.photon700 = true;
                creerElectron('electron-psi-active', 'ps1', 'electron-excité');
                actualiserInstruction();
            }

            // 4. Mouvement Électrons
            else if (type === 'electron' || type === 'electron-excité') {
                const eImg = document.getElementById(type === 'electron' ? 'electron-mobile' : 'electron-psi-active');
                const nextIdx = sequence.indexOf(target.id);
                const currIdx = sequence.indexOf(state.electronPos);

                if (nextIdx === currIdx + 1) {
                    if (target.id === 'ps1' && !state.photon700) return alert("Le PSI doit être excité !");
                    if (state.electronPos === 'e2' && !state.e2Pumped) return alert("Pompez d'abord les protons !");
                    
                    sauvegarderEtat();
                    target.appendChild(eImg);
                    state.electronPos = target.id;
                    if (target.id === 'e2') gererControleEtape();
                    actualiserInstruction();
                }
            }

            // 5. Réduction NADP+
            else if (target.id === 'e3' && item === 'nadp' && state.electronPos === 'e3') {
                sauvegarderEtat();
                state.nadphProduced++;
                document.getElementById('nadph-count').innerText = state.nadphProduced;
                if(document.getElementById('electron-psi-active')) document.getElementById('electron-psi-active').remove();
                
                for(let i=0; i<8; i++) setTimeout(() => { creerProtonLumen(true); state.protonsLumen++; }, i*100);
                
                setTimeout(() => {
                    alert("⚠️ GRADIENT ÉLEVÉ ! La force proton-motrice est prête.");
                    document.getElementById('adp-pi').style.display = 'block';
                }, 1000);
                document.getElementById('nadp-target').style.display = 'none';
            }

            // 6. ATP Synthase
            else if (target.id === 'atp-synthase' && item === 'adp') {
                if (state.protonsLumen >= 3) {
                    sauvegarderEtat();
                    state.atpProduced++;
                    document.getElementById('atp-count').innerText = state.atpProduced;
                    for(let i=0; i<3; i++) {
                        setTimeout(() => {
                            const p = document.querySelector('.proton-particle:not(.stroma-h)');
                            if(p) {
                                p.style.transform = "translateY(-150px)"; p.style.opacity = "0";
                                setTimeout(() => { p.remove(); creerProtonStroma(); }, 1000);
                            }
                        }, i * 200);
                    }
                    state.protonsLumen -= 3;
                } else alert("Gradient insuffisant !");
            }
        });
    });
}

function creerElectron(id, parentId, type) {
    if(document.getElementById(id)) return;
    const e = document.createElement('div');
    e.id = id; e.className = "electron-particle"; e.innerText = "e-"; e.setAttribute('draggable', 'true');
    e.addEventListener('dragstart', ev => ev.dataTransfer.setData('type', type));
    document.getElementById(parentId).appendChild(e);
}

function gererControleEtape() {
    const e2 = document.getElementById('e2');
    e2.onclick = () => {
        sauvegarderEtat();
        let count = 0;
        const interval = setInterval(() => {
            const sH = document.querySelector('.stroma-h');
            if(sH) sH.remove();
            creerProtonLumen(true);
            state.protonsLumen++;
            if(++count >= 4) { 
                clearInterval(interval); 
                state.e2Pumped = true; 
                actualiserInstruction(); 
                e2.onclick = null; 
            }
        }, 200);
    };
}

document.addEventListener("DOMContentLoaded", init);