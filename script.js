(function () {
function generateWinningLines() {
    const lines = [];

    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            for (let z = 0; z < 3; z++) {
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dz = -1; dz <= 1; dz++) {
                            const firstStep = [dx, dy, dz].find(step => step !== 0);
                            if (firstStep !== 1) continue;

                            const end = [x + 2 * dx, y + 2 * dy, z + 2 * dz];
                            if (end.some(coordinate => coordinate < 0 || coordinate > 2)) continue;

                            lines.push([
                                [x, y, z],
                                [x + dx, y + dy, z + dz],
                                end
                            ]);
                        }
                    }
                }
            }
        }
    }

    return lines;
}

const WINNING_LINES = generateWinningLines();

function checkWin(state) {
    for (const line of WINNING_LINES) {
        const [first, second, third] = line;
        const value = state[first[0]][first[1]][first[2]];

        if (value !== 0 &&
            value === state[second[0]][second[1]][second[2]] &&
            value === state[third[0]][third[1]][third[2]]) {
            return { winner: value, line };
        }
    }

    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            for (let z = 0; z < 3; z++) {
                if (state[x][y][z] === 0) return null;
            }
        }
    }

    return { winner: 0, line: null };
}

function getLegalMoves(state) {
    const moves = [];

    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            for (let z = 0; z < 3; z++) {
                if (state[x][y][z] === 0) moves.push({ x, y, z });
            }
        }
    }

    moves.sort((a, b) =>
        (Math.abs(a.x - 1) + Math.abs(a.y - 1) + Math.abs(a.z - 1)) -
        (Math.abs(b.x - 1) + Math.abs(b.y - 1) + Math.abs(b.z - 1))
    );
    return moves;
}

function minimax(state, depth, isMaximizing, alpha, beta, maxDepth, metrics) {
    if (metrics.nodes >= metrics.maxNodes) return null;
    metrics.nodes++;
    const result = checkWin(state);

    if (result) {
        if (result.winner === -1) return 100 - depth;
        if (result.winner === 1) return depth - 100;
        return 0;
    }

    if (depth >= maxDepth) return 0;

    const moves = getLegalMoves(state);
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (const { x, y, z } of moves) {
            state[x][y][z] = -1;
            const score = minimax(state, depth + 1, false, alpha, beta, maxDepth, metrics);
            state[x][y][z] = 0;
            if (score === null) return null;
            bestScore = Math.max(bestScore, score);
            alpha = Math.max(alpha, score);
            if (beta <= alpha) break;
        }
        return bestScore;
    }

    let bestScore = Infinity;
    for (const { x, y, z } of moves) {
        state[x][y][z] = 1;
        const score = minimax(state, depth + 1, true, alpha, beta, maxDepth, metrics);
        state[x][y][z] = 0;
        if (score === null) return null;
        bestScore = Math.min(bestScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
    }
    return bestScore;
}

function getBestMove(state, maxDepth, options = {}) {
    const depthLimit = Math.max(1, Math.floor(maxDepth));
    const metrics = { nodes: 0, maxNodes: options.maxNodes ?? Infinity };
    const moves = getLegalMoves(state);
    let bestMove = null;
    let bestDepth = 0;
    const depths = options.iterative
        ? Array.from({ length: depthLimit }, (_, index) => index + 1)
        : [depthLimit];

    for (const depth of depths) {
        let bestScore = -Infinity;
        let bestMoves = [];
        let completed = true;

        for (const move of moves) {
            state[move.x][move.y][move.z] = -1;
            const score = minimax(state, 0, false, -Infinity, Infinity, depth, metrics);
            state[move.x][move.y][move.z] = 0;

            if (score === null) {
                completed = false;
                break;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMoves = [move];
            } else if (score === bestScore) {
                bestMoves.push(move);
            }
        }

        if (!completed) break;
        bestMove = bestMoves.length
            ? bestMoves[Math.floor(Math.random() * bestMoves.length)]
            : null;
        bestDepth = depth;
    }

    if (!bestMove && moves.length) {
        bestMove = moves[Math.floor(Math.random() * moves.length)];
    }

    return { move: bestMove, nodes: metrics.nodes, depth: bestDepth };
}

function getKeyboardMove(key) {
    const directions = {
        ArrowLeft: [-1, 0, 0],
        ArrowRight: [1, 0, 0],
        ArrowUp: [0, 1, 0],
        ArrowDown: [0, -1, 0],
        q: [0, 0, -1],
        e: [0, 0, 1]
    };
    return directions[key] || directions[key.toLowerCase()] || null;
}

const PREFERENCES_KEY = 'tres-en-raya.preferences.v1';
const SCORES_KEY = 'tres-en-raya.scores.v1';

function readStoredJson(key, fallback) {
    try {
        const stored = localStorage.getItem(key);
        return stored ? { ...fallback, ...JSON.parse(stored) } : fallback;
    } catch (error) {
        console.warn(`No se pudo leer el almacenamiento local (${key}).`, error);
        return fallback;
    }
}

function saveStoredJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn(`No se pudo guardar en el almacenamiento local (${key}).`, error);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateWinningLines, checkWin, getBestMove, getKeyboardMove };
}
if (typeof document === 'undefined') return;

const preferences = readStoredJson(PREFERENCES_KEY, {
    theme: 'dark',
    mode: 'ai',
    difficulty: 'medium',
    shapeP1: 'sphere',
    shapeP2: 'cube',
    layerSpacing: 1,
    soundEnabled: true,
    musicEnabled: true,
    musicTrack: 'ambient'
});
if (preferences.audioDefaultsVersion !== 1) {
    preferences.soundEnabled = true;
    preferences.musicEnabled = true;
    preferences.audioDefaultsVersion = 1;
    saveStoredJson(PREFERENCES_KEY, preferences);
}
const storedScores = readStoredJson(SCORES_KEY, { player1: 0, player2: 0, draws: 0 });
const scores = {
    player1: Number.isSafeInteger(storedScores.player1) && storedScores.player1 >= 0 ? storedScores.player1 : 0,
    player2: Number.isSafeInteger(storedScores.player2) && storedScores.player2 >= 0 ? storedScores.player2 : 0,
    draws: Number.isSafeInteger(storedScores.draws) && storedScores.draws >= 0 ? storedScores.draws : 0
};
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ==========================================================================
   3D TIC-TAC-TOE ENGINE (THREE.JS + MINIMAX 3D + MOBILE TOUCH SUPPORT)
   ========================================================================== */

let boardState = Array(3).fill(null).map(() => Array(3).fill(null).map(() => Array(3).fill(0)));

let currentPlayer = 1;
let gameActive = false; // Inicia desactivado en la pantalla inicial
let isIntroState = true; // Controla la rotación y escala inicial
let gameMode = ['ai', 'pvp'].includes(preferences.mode) ? preferences.mode : 'ai';
let aiDifficulty = ['beginner', 'easy', 'medium', 'hard', 'expert'].includes(preferences.difficulty)
    ? preferences.difficulty
    : 'medium';

let evaluatedNodes = 0;
let currentLayerSpacing = Math.min(2.8, Math.max(1, Number(preferences.layerSpacing) || 1));
let activeLayer2D = 0;
let isDarkMode = preferences.theme !== 'light';
let soundEnabled = preferences.soundEnabled === true;
let musicEnabled = preferences.musicEnabled === true;
let audioContext = null;
let musicMasterGain = null;
let musicFilter = null;
let musicTimer = null;
let musicChordIndex = 0;
let musicGeneration = 0;
let gameOverAnnouncementTimer = null;
let difficultyMusicActive = !musicEnabled &&
    gameMode === 'ai' &&
    ['hard', 'expert'].includes(aiDifficulty);
const musicVoices = new Set();
let aiMoveTimer = null;
let keyboardCell = { x: 1, y: 1, z: 0 };

document.body.classList.toggle('dark', isDarkMode);
document.getElementById('select-mode').value = gameMode;
document.getElementById('select-difficulty').value = aiDifficulty;
preferences.musicTrack = ['ambient', 'pulse', 'calm'].includes(preferences.musicTrack)
    ? preferences.musicTrack
    : 'ambient';
document.getElementById('select-music-track').value = preferences.musicTrack;

if (['sphere', 'cube', 'cone', 'star', 'torus'].includes(preferences.shapeP1)) {
    document.getElementById('select-shape-p1').value = preferences.shapeP1;
}
if (['sphere', 'cube', 'cone', 'star', 'torus'].includes(preferences.shapeP2)) {
    document.getElementById('select-shape-p2').value = preferences.shapeP2;
}

const spacingSlider = document.getElementById('layer-spacing-slider');
spacingSlider.value = currentLayerSpacing;
document.getElementById('spacing-value').textContent = `${currentLayerSpacing.toFixed(1)}x`;

// Rotación aleatoria en la pantalla de inicio
let randomRotSpeedX = 0.003;
let randomRotSpeedY = 0.005;
let randomRotSpeedZ = 0.002;
let rotTime = 0;
let cameraTransitionGeneration = 0;

// 2. THREE.JS RENDERER & SCENE SETUP
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(isDarkMode ? 0x030712 : 0xf8fafc, 0.035);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 12); 

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.tabIndex = 0;
renderer.domElement.setAttribute('aria-label', 'Tablero 3D. Usa las flechas para elegir una casilla, Q y E para cambiar de capa, y Enter para jugar.');
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 25;
controls.minDistance = 4;
controls.target.set(0, 0.5, 0);
controls.enabled = false; 

// 3. ILUMINACIÓN
const ambientLight = new THREE.AmbientLight(isDarkMode ? 0x0f172a : 0xffffff, isDarkMode ? 1.5 : 2.2);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
mainLight.position.set(10, 15, 10);
mainLight.castShadow = true;
scene.add(mainLight);

const bluePointLight = new THREE.PointLight(0x38bdf8, 3, 15);
bluePointLight.position.set(-5, 5, -5);
scene.add(bluePointLight);

const rosePointLight = new THREE.PointLight(0xf43f5e, 3, 15);
rosePointLight.position.set(5, -5, 5);
scene.add(rosePointLight);

// 4. OBJETOS Y GEOMETRÍAS DE CASILLAS
const gridGroup = new THREE.Group();
gridGroup.scale.set(0.55, 0.55, 0.55);
gridGroup.position.y = 1.1;
scene.add(gridGroup);

const cellMeshes = [];
const pieceGroup = new THREE.Group();
gridGroup.add(pieceGroup);

let laserLineMesh = null;
const cellGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);

function createGrid() {
    cellMeshes.length = 0;
    while(gridGroup.children.length > 0) {
        if (gridGroup.children[0] === pieceGroup) {
            gridGroup.remove(pieceGroup);
            continue;
        }
        gridGroup.remove(gridGroup.children[0]);
    }
    gridGroup.add(pieceGroup);

    const spacing = 1.2 * currentLayerSpacing;

    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            for (let z = 0; z < 3; z++) {
                const material = new THREE.MeshStandardMaterial({
                    color: isDarkMode ? 0x0f172a : 0xe2e8f0,
                    transparent: true,
                    opacity: isDarkMode ? 0.35 : 0.45,
                    roughness: 0.2,
                    metalness: 0.8
                });

                const mesh = new THREE.Mesh(cellGeometry, material);
                const posX = (x - 1) * 1.3;
                const posY = (y - 1) * spacing;
                const posZ = (z - 1) * 1.3;

                mesh.position.set(posX, posY, posZ);
                mesh.userData = { x, y, z, basePos: { x: posX, y: posY, z: posZ } };

                const edges = new THREE.EdgesGeometry(cellGeometry);
                const lineMat = new THREE.LineBasicMaterial({ 
                    color: isDarkMode ? 0x1e293b : 0x94a3b8, 
                    transparent: true, 
                    opacity: 0.6 
                });
                const wireframe = new THREE.LineSegments(edges, lineMat);
                mesh.add(wireframe);

                gridGroup.add(mesh);
                cellMeshes.push(mesh);
            }
        }
    }
}

createGrid();
updateKeyboardSelection();

// Materiales de Fichas
const playerMaterial = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
    roughness: 0.1,
    metalness: 0.9
});

const aiMaterial = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xe11d48,
    emissiveIntensity: 0.6,
    roughness: 0.1,
    metalness: 0.9
});

function createPieceGeometry(shapeType, size) {
    switch (shapeType) {
        case 'sphere': return new THREE.SphereGeometry(size * 0.75, 32, 32);
        case 'cube': return new THREE.BoxGeometry(size * 1.0, size * 1.0, size * 1.0);
        case 'cone': return new THREE.ConeGeometry(size * 0.7, size * 1.1, 4);
        case 'star': return new THREE.OctahedronGeometry(size * 0.8, 0);
        case 'torus': return new THREE.TorusGeometry(size * 0.45, size * 0.18, 16, 32);
        default: return new THREE.SphereGeometry(size * 0.75, 32, 32);
    }
}

function getShapeSymbol(shapeType) {
    switch(shapeType) {
        case 'sphere': return '●';
        case 'cube': return '■';
        case 'cone': return '▲';
        case 'star': return '★';
        case 'torus': return '⦸';
        default: return '●';
    }
}

// 5. INTERACCIÓN Y RAYCASTER (Soporte Clic y Toque Táctil)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let pointerStart = null;

function isInteractiveTarget(target) {
    return target.closest('header, footer, aside, #panel-options, #btn-toggle-2d');
}

function refreshCellAppearance(cell) {
    const { x, y, z } = cell.userData;
    if (boardState[x][y][z] !== 0) return;

    const selected = gameActive &&
        keyboardCell.x === x && keyboardCell.y === y && keyboardCell.z === z;
    cell.material.color.setHex(selected
        ? (currentPlayer === 1 ? 0x0284c7 : 0xe11d48)
        : (isDarkMode ? 0x0f172a : 0xe2e8f0));
    cell.material.opacity = selected ? 0.8 : (isDarkMode ? 0.35 : 0.45);
}

function updateKeyboardSelection() {
    cellMeshes.forEach(refreshCellAppearance);
}

function handleInteraction(clientX, clientY) {
    if (isIntroState || !gameActive) return;
    if (gameMode === 'ai' && currentPlayer === -1) return;

    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cellMeshes);

    if (intersects.length > 0) {
        const clickedCell = intersects[0].object;
        const { x, y, z } = clickedCell.userData;

        if (boardState[x][y][z] === 0) {
            makeMove(x, y, z, currentPlayer);
        }
    }
}

window.addEventListener('pointerdown', (e) => {
    if (isInteractiveTarget(e.target)) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointerStart = { x: e.clientX, y: e.clientY };
});

window.addEventListener('pointerup', (e) => {
    if (!pointerStart) return;
    const start = pointerStart;
    pointerStart = null;
    if (isInteractiveTarget(e.target)) return;

    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) <= 8) {
        handleInteraction(e.clientX, e.clientY);
    }
});

window.addEventListener('pointercancel', () => {
    pointerStart = null;
});

let hoveredCell = null;
window.addEventListener('pointermove', (e) => {
    if (isIntroState || !gameActive) return;
    if (isInteractiveTarget(e.target) || e.pointerType !== 'mouse') return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(cellMeshes);

    if (intersects.length > 0) {
        const cell = intersects[0].object;
        if (hoveredCell !== cell) {
            if (hoveredCell) refreshCellAppearance(hoveredCell);
            hoveredCell = cell;
            if (boardState[cell.userData.x][cell.userData.y][cell.userData.z] === 0) {
                cell.material.opacity = 0.75;
                cell.material.color.setHex(currentPlayer === 1 ? 0x0284c7 : 0xe11d48);
            }
        }
    } else if (hoveredCell) {
        refreshCellAppearance(hoveredCell);
        hoveredCell = null;
    }
});

window.addEventListener('keydown', (event) => {
    if (!gameActive || isIntroState || (gameMode === 'ai' && currentPlayer === -1)) return;
    if (event.target.isContentEditable ||
        ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(event.target.tagName)) return;

    const movement = getKeyboardMove(event.key);
    if (movement && event.key.startsWith('Arrow')) {
        event.preventDefault();
        moveKeyboardSelection(movement[0], movement[1]);
    } else if (event.key.toLowerCase() === 'q') {
        event.preventDefault();
        changeKeyboardLayer(movement[2]);
    } else if (event.key.toLowerCase() === 'e') {
        event.preventDefault();
        changeKeyboardLayer(movement[2]);
    } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        makeMove(keyboardCell.x, keyboardCell.y, keyboardCell.z, currentPlayer);
    }
});

function moveKeyboardSelection(dx, dy) {
    keyboardCell = {
        x: Math.min(2, Math.max(0, keyboardCell.x + dx)),
        y: Math.min(2, Math.max(0, keyboardCell.y + dy)),
        z: keyboardCell.z
    };
    updateKeyboardSelection();
}

function changeKeyboardLayer(direction) {
    keyboardCell.z = Math.min(2, Math.max(0, keyboardCell.z + direction));
    activeLayer2D = keyboardCell.z;
    document.querySelectorAll('.layer-tab').forEach(tab => {
        const selected = Number(tab.dataset.z) === activeLayer2D;
        tab.classList.toggle('bg-sky-600', selected);
        tab.classList.toggle('text-white', selected);
    });
    updateKeyboardSelection();
    update2DGrid();
}

// 6. MOVIMIENTOS
function makeMove(x, y, z, player) {
    if (!gameActive || player !== currentPlayer || boardState[x][y][z] !== 0) return;
    boardState[x][y][z] = player;
    playMoveSound(player);

    let pieceMesh;
    let pieceShape;
    const size = 0.5;

    if (player === 1) {
        pieceShape = document.getElementById('select-shape-p1').value;
        const geom = createPieceGeometry(pieceShape, size);
        pieceMesh = new THREE.Mesh(geom, playerMaterial);
    } else {
        pieceShape = document.getElementById('select-shape-p2').value;
        const geom = createPieceGeometry(pieceShape, size);
        pieceMesh = new THREE.Mesh(geom, aiMaterial);
    }

    const cell = cellMeshes.find(c => c.userData.x === x && c.userData.y === y && c.userData.z === z);
    pieceMesh.position.copy(cell.position);
    pieceMesh.userData = { x, y, z, placedAt: performance.now(), shapeType: pieceShape };
    if (!prefersReducedMotion) pieceMesh.scale.setScalar(0.05);
    pieceGroup.add(pieceMesh);

    cell.material.opacity = 0.15;
    update2DGrid();

    const result = checkWin(boardState);
    if (result) {
        handleGameOver(result);
        return;
    }

    currentPlayer = -currentPlayer;
    updateStatusUI();
    keyboardCell = getLegalMoves(boardState)[0] || keyboardCell;
    updateKeyboardSelection();

    if (gameActive && gameMode === 'ai' && currentPlayer === -1) {
        aiMoveTimer = setTimeout(triggerAIMove, prefersReducedMotion ? 0 : 250);
    }
}

function playTone(frequency, duration = 0.12, type = 'sine') {
    if (!soundEnabled) return;
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) {
        soundEnabled = false;
        preferences.soundEnabled = false;
        saveStoredJson(PREFERENCES_KEY, preferences);
        updateSoundControl();
        console.warn('El navegador no admite Web Audio; los sonidos se desactivaron.');
        return;
    }

    try {
        audioContext = audioContext || new AudioContextClass();
        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(error => console.warn('No se pudo activar el audio.', error));
        }

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const now = audioContext.currentTime;
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + duration);
    } catch (error) {
        soundEnabled = false;
        preferences.soundEnabled = false;
        saveStoredJson(PREFERENCES_KEY, preferences);
        updateSoundControl();
        console.warn('No se pudo reproducir el sonido; se desactivó esta opción.', error);
    }
}

function playMoveSound(player) {
    playTone(player === 1 ? 520 : 330, 0.1, 'triangle');
}

function isBackgroundMusicEnabled() {
    return musicEnabled || difficultyMusicActive;
}

const musicTracks = {
    ambient: {
        badge: 'ESPACIAL',
        icon: 'fa-solid fa-star',
        chords: [
            [98, 146.83, 196, 246.94],
            [110, 164.81, 220, 293.66],
            [87.31, 130.81, 174.61, 261.63],
            [103.83, 155.56, 196, 246.94]
        ],
        style: 'ambient',
        interval: 10000,
        advancedInterval: 7600,
        cutoff: 700,
        advancedCutoff: 1100,
        fade: 4,
        wave: 'sine',
        bassLevel: 0.016,
        chordLevel: 0.008
    },
    pulse: {
        badge: 'PULSO',
        icon: 'fa-solid fa-wave-square',
        chords: [
            [55, 110, 164.81, 220],
            [49, 98, 146.83, 196],
            [41.2, 82.41, 123.47, 164.81],
            [46.25, 92.5, 138.59, 185]
        ],
        style: 'pulse',
        interval: 4000,
        advancedInterval: 2800,
        cutoff: 2200,
        advancedCutoff: 3200,
        fade: 0.12,
        wave: 'sawtooth',
        bassLevel: 0.06,
        chordLevel: 0.035,
        volume: 0.72
    },
    calm: {
        badge: 'CALMA',
        icon: 'fa-solid fa-leaf',
        chords: [
            [146.83, 220, 293.66, 369.99],
            [130.81, 196, 261.63, 329.63],
            [110, 164.81, 220, 329.63],
            [123.47, 185, 246.94, 369.99]
        ],
        style: 'calm',
        interval: 7600,
        advancedInterval: 6000,
        cutoff: 1400,
        advancedCutoff: 1800,
        fade: 0.025,
        wave: 'triangle',
        bassLevel: 0.005,
        chordLevel: 0.0025
    }
};

async function startBackgroundMusic() {
    stopBackgroundMusic();
    const generation = musicGeneration;
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) {
        disableBackgroundMusic('El navegador no admite Web Audio; la música se desactivó.');
        return;
    }

    try {
        audioContext = audioContext || new AudioContextClass();
        if (audioContext.state === 'suspended') await audioContext.resume();
        if (!isBackgroundMusicEnabled() || generation !== musicGeneration) return;

        if (!musicFilter) {
            musicFilter = audioContext.createBiquadFilter();
            musicFilter.type = 'lowpass';
            musicMasterGain = audioContext.createGain();
            musicMasterGain.gain.value = 0;
            musicFilter.connect(musicMasterGain);
            musicMasterGain.connect(audioContext.destination);
        }

        const track = musicTracks[preferences.musicTrack] || musicTracks.ambient;
        const advancedMode = gameMode === 'ai' && ['hard', 'expert'].includes(aiDifficulty);
        musicFilter.frequency.setTargetAtTime(
            advancedMode ? track.advancedCutoff : track.cutoff,
            audioContext.currentTime,
            0.25
        );
        const now = audioContext.currentTime;
        musicMasterGain.gain.cancelScheduledValues(now);
        musicMasterGain.gain.setValueAtTime(musicMasterGain.gain.value, now);
        musicMasterGain.gain.linearRampToValueAtTime(track.volume || 0.55, now + 1.5);
        musicChordIndex = 0;
        scheduleBackgroundChord(generation);
    } catch (error) {
        disableBackgroundMusic('No se pudo iniciar la música ambiental.', error);
    }
}

function scheduleBackgroundChord(generation) {
    if (!isBackgroundMusicEnabled() || generation !== musicGeneration ||
        !audioContext || audioContext.state !== 'running') return;

    const challengeMode = gameMode === 'ai' && ['hard', 'expert'].includes(aiDifficulty);
    const track = musicTracks[preferences.musicTrack] || musicTracks.ambient;
    const chord = track.chords[musicChordIndex % track.chords.length];
    musicChordIndex = (musicChordIndex + 1) % track.chords.length;
    const now = audioContext.currentTime;
    const duration = (challengeMode ? track.advancedInterval : track.interval) / 1000;

    try {
        const addVoice = (frequency, startAt, noteDuration, wave, peak, attack, release) => {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            const voice = { oscillator, gain };
            const endAt = startAt + noteDuration;

            oscillator.type = wave;
            oscillator.frequency.setValueAtTime(frequency, startAt);
            gain.gain.setValueAtTime(0.0001, startAt);
            gain.gain.linearRampToValueAtTime(peak, startAt + attack);
            gain.gain.setValueAtTime(peak, Math.max(startAt + attack, endAt - release));
            gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
            oscillator.connect(gain);
            gain.connect(musicFilter);
            oscillator.onended = () => {
                oscillator.disconnect();
                gain.disconnect();
                musicVoices.delete(voice);
            };
            oscillator.start(startAt);
            oscillator.stop(endAt);
            musicVoices.add(voice);
        };

        if (track.style === 'ambient') {
            chord.forEach((frequency, index) => {
                const level = index === 0 ? track.bassLevel : track.chordLevel;
                addVoice(frequency, now, duration, 'sine', level, track.fade, track.fade);
            });

            if (challengeMode) {
                chord.slice(1).forEach(frequency => {
                    addVoice(frequency * 2, now, duration, 'sine', track.chordLevel * 0.38, 2.4, 2.4);
                });
                [3, 1, 2, 3, 2, 1].forEach((noteIndex, index) => {
                    const startAt = now + index * (duration / 6);
                    addVoice(chord[noteIndex] * 4, startAt, 0.9, 'sine', 0.014, 0.08, 0.75);
                });
            } else {
                [3, 2, 1, 2].forEach((noteIndex, index) => {
                    const startAt = now + index * 2.1;
                    if (startAt < now + duration - 0.5) {
                        addVoice(chord[noteIndex] * 2, startAt, 1.5, 'sine', 0.006, 0.45, 0.9);
                    }
                });
            }
        } else if (track.style === 'pulse') {
            const beat = duration / 4;
            const pattern = [0, 2, 1, 3, 0, 2, 3, 1];

            pattern.forEach((noteIndex, index) => {
                const startAt = now + index * duration / pattern.length;
                const downbeat = index % 2 === 0;
                const accent = downbeat ? 1 : 0.7;
                const bassFrequency = chord[0] * 2;
                const leadFrequency = chord[1 + (noteIndex % 3)] * 2;

                addVoice(bassFrequency, startAt, beat * (downbeat ? 0.28 : 0.16),
                    'sine', track.bassLevel * accent * (challengeMode ? 1.3 : 1), 0.012, beat * 0.16);
                addVoice(leadFrequency, startAt + (downbeat ? 0.12 : 0.04),
                    beat * 0.2, 'square', track.chordLevel * accent * (challengeMode ? 1.25 : 1), 0.008, beat * 0.12);

                if (challengeMode && downbeat) {
                    addVoice(55, startAt, beat * 0.2, 'sine', 0.11, 0.008, beat * 0.18);
                    addVoice(880, startAt + beat * 0.24, beat * 0.07,
                        'square', 0.025, 0.003, beat * 0.06);
                }
            });
        } else {
            chord.forEach((frequency, index) => {
                const level = index === 0 ? track.bassLevel : track.chordLevel;
                addVoice(frequency, now, duration, 'sine', level, 2, 2.5);
            });

            const melody = challengeMode
                ? [3, 1, 2, 0, 2, 1, 3, 2]
                : [0, 2, 1, 3, 2, 0, 3, 1];
            const noteSpacing = duration / melody.length;
            melody.forEach((noteIndex, index) => {
                const startAt = now + index * noteSpacing;
                if (startAt < now + duration - 0.1) {
                    addVoice(chord[noteIndex] * (challengeMode ? 4 : 3), startAt,
                        challengeMode ? 0.8 : 0.55, challengeMode ? 'sine' : 'triangle',
                        challengeMode ? 0.022 : 0.016, 0.015, challengeMode ? 0.7 : 0.48);
                }
            });
        }

        const nextInterval = challengeMode ? track.advancedInterval : track.interval;
        musicTimer = window.setTimeout(() => scheduleBackgroundChord(generation), nextInterval * 0.94);
    } catch (error) {
        disableBackgroundMusic('La música ambiental se detuvo por un error de audio.', error);
    }
}

function stopBackgroundMusic() {
    musicGeneration++;
    if (musicTimer !== null) {
        clearTimeout(musicTimer);
        musicTimer = null;
    }

    if (!audioContext || !musicMasterGain) return;
    const now = audioContext.currentTime;
    musicMasterGain.gain.cancelScheduledValues(now);
    musicMasterGain.gain.setTargetAtTime(0, now, 0.12);

    musicVoices.forEach(({ oscillator, gain }) => {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setTargetAtTime(0, now, 0.08);
        try {
            oscillator.stop(now + 0.5);
        } catch (error) {
            if (error.name !== 'InvalidStateError') {
                console.warn('No se pudo detener una voz de música.', error);
            }
        }
    });
}

function disableBackgroundMusic(message, error) {
    musicEnabled = false;
    difficultyMusicActive = false;
    preferences.musicEnabled = false;
    stopBackgroundMusic();
    saveStoredJson(PREFERENCES_KEY, preferences);
    updateMusicControl();
    if (error) console.warn(message, error);
    else console.warn(message);
}

// 7. IA MINIMAX 3D
function triggerAIMove() {
    if (!gameActive || gameMode !== 'ai' || currentPlayer !== -1) return;
    aiMoveTimer = null;
    const startTime = performance.now();
    evaluatedNodes = 0;

    let bestMove;
    let depth = 0;

    if (aiDifficulty === 'beginner') {
        bestMove = getRandomMove();
    } else {
        const depthByDifficulty = { easy: 1, medium: 2, hard: 3, expert: 5 };
        const searchDepth = depthByDifficulty[aiDifficulty];
        const result = getBestMove(boardState, searchDepth, aiDifficulty === 'expert'
            ? { iterative: true, maxNodes: 35000 }
            : undefined);
        bestMove = result.move;
        evaluatedNodes = result.nodes;
        depth = result.depth;
    }

    const endTime = performance.now();

    document.getElementById('metric-nodes').textContent = evaluatedNodes;
    document.getElementById('metric-time').textContent = `${Math.round(endTime - startTime)} ms`;
    document.getElementById('metric-depth').textContent = depth
        ? `Prof: ${depth}`
        : 'Aleatoria';

    if (bestMove) {
        makeMove(bestMove.x, bestMove.y, bestMove.z, -1);
    }
}

function getRandomMove() {
    const emptyCells = [];
    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            for (let z = 0; z < 3; z++) {
                if (boardState[x][y][z] === 0) emptyCells.push({ x, y, z });
            }
        }
    }
    return emptyCells.length ? emptyCells[Math.floor(Math.random() * emptyCells.length)] : null;
}

// 8. WIN CHECK & LASER
function drawLaserWinLine(line) {
    removeLaserLine();

    const [p1, , p3] = line;
    const cell1 = cellMeshes.find(c => c.userData.x === p1[0] && c.userData.y === p1[1] && c.userData.z === p1[2]);
    const cell3 = cellMeshes.find(c => c.userData.x === p3[0] && c.userData.y === p3[1] && c.userData.z === p3[2]);

    const startVec = cell1.position.clone();
    const endVec = cell3.position.clone();

    const distance = startVec.distanceTo(endVec);
    const geometry = new THREE.CylinderGeometry(0.08, 0.08, distance, 16);
    
    const material = new THREE.MeshBasicMaterial({
        color: currentPlayer === 1 ? 0x38bdf8 : 0xf43f5e,
        transparent: true,
        opacity: 0.9
    });

    laserLineMesh = new THREE.Mesh(geometry, material);

    const midPoint = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
    laserLineMesh.position.copy(midPoint);
    laserLineMesh.lookAt(endVec);
    laserLineMesh.rotateX(Math.PI / 2);

    gridGroup.add(laserLineMesh);
}

function removeLaserLine() {
    if (!laserLineMesh) return;

    gridGroup.remove(laserLineMesh);
    laserLineMesh.geometry.dispose();
    laserLineMesh.material.dispose();
    laserLineMesh = null;
}

function handleGameOver(result) {
    gameActive = false;
    if (result.winner === 1) scores.player1++;
    else if (result.winner === -1) scores.player2++;
    else scores.draws++;
    saveStoredJson(SCORES_KEY, scores);
    updateScoreboard();

    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');

    if (result.winner === 1) {
        statusText.textContent = "🎉 ¡Has ganado!";
        statusText.className = "text-xs font-semibold text-sky-400";
        statusDot.className = "w-2.5 h-2.5 rounded-full bg-sky-400";
        triggerConfetti();
    } else if (result.winner === -1) {
        statusText.textContent = gameMode === 'ai' ? "🤖 ¡Ha ganado la IA!" : "🎉 ¡Ganador Jugador 2!";
        statusText.className = "text-xs font-semibold text-rose-400";
        statusDot.className = "w-2.5 h-2.5 rounded-full bg-rose-500";
    } else {
        statusText.textContent = "🤝 ¡Empate!";
        statusText.className = "text-xs font-semibold text-amber-400";
        statusDot.className = "w-2.5 h-2.5 rounded-full bg-amber-400";
    }

    animateGameOverStatus();
    if (result.line) drawLaserWinLine(result.line);
    if (result.winner === 0) playTone(440, 0.3);
    else {
        playTone(result.winner === 1 ? 660 : 240, 0.24, 'sawtooth');
        setTimeout(() => playTone(result.winner === 1 ? 880 : 180, 0.3), 130);
    }
}

function clearGameOverAnnouncement() {
    if (gameOverAnnouncementTimer !== null) {
        clearTimeout(gameOverAnnouncementTimer);
        gameOverAnnouncementTimer = null;
    }

    const status = document.getElementById('game-status');
    status.classList.remove('game-over-center', 'game-over-shrinking');
    status.style.removeProperty('transition');
    status.style.removeProperty('--status-shrink-x');
    status.style.removeProperty('--status-shrink-y');
    status.style.removeProperty('--status-shrink-scale');
}

function animateGameOverStatus() {
    clearGameOverAnnouncement();
    const status = document.getElementById('game-status');
    const target = status.getBoundingClientRect();
    status.style.transition = 'none';
    status.classList.add('game-over-center');
    const centered = status.getBoundingClientRect();
    const scale = Math.min(1, target.width / centered.width, target.height / centered.height);
    requestAnimationFrame(() => status.style.removeProperty('transition'));

    gameOverAnnouncementTimer = window.setTimeout(() => {
        const dx = target.left + target.width / 2 - window.innerWidth / 2;
        const dy = target.top + target.height / 2 - window.innerHeight / 2;
        status.style.setProperty('--status-shrink-x', `${dx}px`);
        status.style.setProperty('--status-shrink-y', `${dy}px`);
        status.style.setProperty('--status-shrink-scale', String(scale));
        status.classList.add('game-over-shrinking');

        gameOverAnnouncementTimer = window.setTimeout(() => {
            clearGameOverAnnouncement();
        }, prefersReducedMotion ? 50 : 850);
    }, prefersReducedMotion ? 1000 : 2200);
}

function triggerConfetti() {
    if (prefersReducedMotion) return;
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#818cf8', '#f43f5e']
    });
}

// 9. EVENTOS DE INICIO & TRANSICIÓN DE PANTALLAS
document.getElementById('btn-start-game').addEventListener('click', startGame);

function startGame() {
    if (isBackgroundMusicEnabled() && (!audioContext || audioContext.state !== 'running')) {
        startBackgroundMusic();
    }

    const transitionGeneration = ++cameraTransitionGeneration;
    isIntroState = false;
    gameActive = true;
    updateKeyboardSelection();
    renderer.domElement.focus({ preventScroll: true });

    const overlay = document.getElementById('start-overlay');
    overlay.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => overlay.style.display = 'none', 700);

    document.getElementById('game-header').classList.remove('opacity-0');
    document.getElementById('game-footer-left').classList.remove('opacity-0');
    document.getElementById('game-footer-right').classList.remove('opacity-0');

    controls.enabled = true;

    const targetCameraPos = new THREE.Vector3(7, 6, 9);
    const startCameraPos = camera.position.clone();
    const duration = prefersReducedMotion ? 0 : 1200;
    const startTime = performance.now();

    function animateTransition(now) {
        if (transitionGeneration !== cameraTransitionGeneration) return;

        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        const scaleVal = THREE.MathUtils.lerp(0.55, 1.0, easeProgress);
        gridGroup.scale.set(scaleVal, scaleVal, scaleVal);
        gridGroup.position.y = THREE.MathUtils.lerp(1.1, 0, easeProgress);

        camera.position.lerpVectors(startCameraPos, targetCameraPos, easeProgress);
        controls.target.lerpVectors(new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(0, 0, 0), easeProgress);

        gridGroup.rotation.x = THREE.MathUtils.lerp(gridGroup.rotation.x, 0, easeProgress);
        gridGroup.rotation.z = THREE.MathUtils.lerp(gridGroup.rotation.z, 0, easeProgress);

        if (progress < 1) {
            requestAnimationFrame(animateTransition);
        } else {
            gridGroup.scale.set(1.0, 1.0, 1.0);
            gridGroup.rotation.set(0, 0, 0);
            controls.target.set(0, 0, 0);
        }
    }

    requestAnimationFrame(animateTransition);
}

// RESTO DE CONTROLES UI
const panelOptions = document.getElementById('panel-options');
document.getElementById('btn-toggle-options').addEventListener('click', () => {
    panelOptions.classList.toggle('hidden');
    panelOptions.classList.toggle('flex');
});
document.getElementById('btn-close-options').addEventListener('click', () => {
    panelOptions.classList.add('hidden');
    panelOptions.classList.remove('flex');
    focusBoard();
});

const panel2D = document.getElementById('panel-2d');
document.getElementById('btn-toggle-2d').addEventListener('click', () => {
    panel2D.classList.toggle('hidden');
    panel2D.classList.toggle('flex');
});
document.getElementById('btn-close-2d').addEventListener('click', () => {
    panel2D.classList.add('hidden');
    panel2D.classList.remove('flex');
    focusBoard();
});

function updateThemeControls() {
    const iconClass = isDarkMode ? 'fa-solid fa-sun text-amber-400' : 'fa-solid fa-moon';
    const nextMode = isDarkMode ? 'claro' : 'oscuro';
    document.querySelectorAll('.theme-icon').forEach(icon => {
        icon.className = `theme-icon ${iconClass}`;
    });
    document.querySelectorAll('.theme-toggle').forEach(button => {
        button.setAttribute('aria-label', `Cambiar al modo ${nextMode}`);
        button.title = `Cambiar al modo ${nextMode}`;
        const label = button.querySelector('span');
        if (label) label.textContent = `Modo ${nextMode}`;
    });
}

function updateSoundControl() {
    const button = document.getElementById('btn-toggle-sound');
    const state = document.getElementById('sound-state');
    button.setAttribute('aria-pressed', String(soundEnabled));
    state.textContent = soundEnabled ? 'Activados' : 'Desactivados';
    state.className = soundEnabled
        ? 'text-[10px] font-bold uppercase text-sky-400'
        : 'text-[10px] font-bold uppercase text-slate-400';
}

function updateMusicControl() {
    const button = document.getElementById('btn-toggle-music');
    const state = document.getElementById('music-state');
    const enabled = isBackgroundMusicEnabled();
    button.setAttribute('aria-pressed', String(enabled));
    state.textContent = difficultyMusicActive && !musicEnabled
        ? 'Automática'
        : (enabled ? 'Activada' : 'Desactivada');
    state.className = enabled
        ? 'text-[10px] font-bold uppercase text-sky-400'
        : 'text-[10px] font-bold uppercase text-slate-400';
}

function updateDifficultyBadge() {
    const badge = document.getElementById('difficulty-badge');
    const isChallengeMode = gameMode === 'ai' && ['hard', 'expert'].includes(aiDifficulty);
    badge.classList.toggle('hidden', !isChallengeMode);
    if (isChallengeMode) {
        const track = musicTracks[preferences.musicTrack] || musicTracks.ambient;
        const difficultyLabel = aiDifficulty === 'expert' ? 'EXPERTO' : 'DIFÍCIL';
        badge.classList.remove('badge-track-ambient', 'badge-track-pulse', 'badge-track-calm');
        badge.classList.add(`badge-track-${track.style}`);
        badge.innerHTML = `<i class="${track.icon}" aria-hidden="true"></i> ${difficultyLabel} · ${track.badge}`;
    }
}

function syncDifficultyMusic() {
    const shouldPlayAutomatically = gameMode === 'ai' &&
        ['hard', 'expert'].includes(aiDifficulty) &&
        !musicEnabled;
    const wasEnabled = isBackgroundMusicEnabled();
    difficultyMusicActive = shouldPlayAutomatically;

    if (isBackgroundMusicEnabled()) startBackgroundMusic();
    else if (wasEnabled) stopBackgroundMusic();

    updateMusicControl();
    updateDifficultyBadge();
}

function updateScoreboard() {
    document.getElementById('score-p1').textContent = scores.player1;
    document.getElementById('score-p2').textContent = scores.player2;
    document.getElementById('score-draws').textContent = scores.draws;
    document.getElementById('score-p2-label').textContent = gameMode === 'ai' ? 'IA' : 'J2';
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    
    if (isDarkMode) {
        document.body.classList.add('dark');
        scene.fog.color.setHex(0x030712);
        ambientLight.color.setHex(0x0f172a);
        ambientLight.intensity = 1.5;
    } else {
        document.body.classList.remove('dark');
        scene.fog.color.setHex(0xf8fafc);
        ambientLight.color.setHex(0xffffff);
        ambientLight.intensity = 2.2;
    }

    cellMeshes.forEach(cell => {
        refreshCellAppearance(cell);
        if (cell.children[0]) {
            cell.children[0].material.color.setHex(isDarkMode ? 0x1e293b : 0x94a3b8);
        }
    });
    preferences.theme = isDarkMode ? 'dark' : 'light';
    saveStoredJson(PREFERENCES_KEY, preferences);
    updateThemeControls();
}

document.querySelectorAll('.theme-toggle').forEach(button => {
    button.addEventListener('click', toggleTheme);
});

document.getElementById('btn-toggle-sound').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    preferences.soundEnabled = soundEnabled;
    saveStoredJson(PREFERENCES_KEY, preferences);
    updateSoundControl();
    if (soundEnabled) playTone(520, 0.08);
});

document.getElementById('btn-toggle-music').addEventListener('click', () => {
    if (difficultyMusicActive) {
        difficultyMusicActive = false;
    } else {
        musicEnabled = !musicEnabled;
    }
    preferences.musicEnabled = musicEnabled;
    saveStoredJson(PREFERENCES_KEY, preferences);
    updateMusicControl();

    if (isBackgroundMusicEnabled()) startBackgroundMusic();
    else stopBackgroundMusic();
});

document.getElementById('select-music-track').addEventListener('change', (event) => {
    preferences.musicTrack = event.target.value;
    musicChordIndex = 0;
    saveStoredJson(PREFERENCES_KEY, preferences);
    if (isBackgroundMusicEnabled()) startBackgroundMusic();
    updateDifficultyBadge();
});

spacingSlider.addEventListener('input', (e) => {
    currentLayerSpacing = parseFloat(e.target.value);
    document.getElementById('spacing-value').textContent = `${currentLayerSpacing.toFixed(1)}x`;
    preferences.layerSpacing = currentLayerSpacing;
    saveStoredJson(PREFERENCES_KEY, preferences);

    const spacing = 1.2 * currentLayerSpacing;
    cellMeshes.forEach(cell => {
        cell.position.y = (cell.userData.y - 1) * spacing;
    });

    pieceGroup.children.forEach(piece => {
        piece.position.y = (piece.userData.y - 1) * spacing;
    });

    const result = gameActive ? null : checkWin(boardState);
    if (result?.line) drawLaserWinLine(result.line);
    else removeLaserLine();
});

document.getElementById('select-mode').addEventListener('change', (e) => {
    const nextMode = e.target.value;
    if (hasMoves() && gameActive &&
        !window.confirm('Cambiar el modo empezará una partida nueva. ¿Quieres continuar?')) {
        e.target.value = gameMode;
        return;
    }

    gameMode = nextMode;
    preferences.mode = gameMode;
    saveStoredJson(PREFERENCES_KEY, preferences);
    updateScoreboard();
    document.getElementById('wrapper-difficulty').style.display = gameMode === 'ai' ? 'flex' : 'none';
    document.getElementById('panel-metrics').style.display = gameMode === 'ai' ? 'flex' : 'none';
    syncDifficultyMusic();
    startNewGame();
});

document.getElementById('select-difficulty').addEventListener('change', (e) => {
    const nextDifficulty = e.target.value;
    if (hasMoves() && gameActive &&
        !window.confirm('Cambiar la dificultad empezará una partida nueva. ¿Quieres continuar?')) {
        e.target.value = aiDifficulty;
        return;
    }

    aiDifficulty = nextDifficulty;
    preferences.difficulty = aiDifficulty;
    saveStoredJson(PREFERENCES_KEY, preferences);
    syncDifficultyMusic();
    startNewGame();
});

document.getElementById('select-shape-p1').addEventListener('change', (e) => {
    preferences.shapeP1 = e.target.value;
    saveStoredJson(PREFERENCES_KEY, preferences);
    updateStatusUI();
    update2DGrid();
});
document.getElementById('select-shape-p2').addEventListener('change', (e) => {
    preferences.shapeP2 = e.target.value;
    saveStoredJson(PREFERENCES_KEY, preferences);
    updateStatusUI();
    update2DGrid();
});

document.getElementById('btn-reset').addEventListener('click', () => {
    startNewGame();
});

function hasMoves() {
    return boardState.some(layer => layer.some(row => row.some(cell => cell !== 0)));
}

function startNewGame() {
    resetGame();
    resetBoardView();
    focusBoard();
}

function focusBoard() {
    window.setTimeout(() => renderer.domElement.focus({ preventScroll: true }), 0);
}

function resetBoardView() {
    cameraTransitionGeneration++;
    gridGroup.rotation.set(0, 0, 0);
    gridGroup.position.y = 0;
    gridGroup.scale.set(1, 1, 1);
    camera.position.set(7, 6, 9);
    controls.target.set(0, 0, 0);
    controls.update();
}

document.getElementById('btn-reset-camera').addEventListener('click', resetBoardView);

document.querySelectorAll('.layer-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.layer-tab').forEach(t => t.classList.remove('bg-sky-600', 'text-white'));
        e.target.classList.add('bg-sky-600', 'text-white');
        activeLayer2D = parseInt(e.target.dataset.z);
        keyboardCell.z = activeLayer2D;
        updateKeyboardSelection();
        update2DGrid();
    });
});

function update2DGrid() {
    const container2D = document.getElementById('grid-2d-container');
    container2D.innerHTML = '';

    const shapeP1 = document.getElementById('select-shape-p1').value;
    const shapeP2 = document.getElementById('select-shape-p2').value;

    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
            const val = boardState[x][y][activeLayer2D];
            const btn = document.createElement('button');
            btn.className = `h-11 sm:h-12 text-sm rounded-xl border border-slate-700/80 font-bold flex items-center justify-center transition ${
                val === 0 ? 'bg-slate-900/80 hover:bg-sky-950/50 hover:border-sky-500' : 'bg-slate-800'
            }`;

            if (val !== 0) {
                const piece = pieceGroup.children.find(child =>
                    child.userData.x === x &&
                    child.userData.y === y &&
                    child.userData.z === activeLayer2D
                );
                const shape = piece?.userData.shapeType || (val === 1 ? shapeP1 : shapeP2);
                const colorClass = val === 1 ? 'text-sky-400' : 'text-rose-500';
                btn.innerHTML = `<span class="${colorClass} text-base">${getShapeSymbol(shape)}</span>`;
            }

            btn.addEventListener('click', () => {
                if (gameActive && !(gameMode === 'ai' && currentPlayer === -1) &&
                    boardState[x][y][activeLayer2D] === 0) {
                    makeMove(x, y, activeLayer2D, currentPlayer);
                    focusBoard();
                }
            });

            container2D.appendChild(btn);
        }
    }
}

function updateStatusUI() {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');

    const shapeP1 = document.getElementById('select-shape-p1').value;
    const shapeP2 = document.getElementById('select-shape-p2').value;

    if (currentPlayer === 1) {
        statusText.textContent = `Tu turno (${getShapeSymbol(shapeP1)})`;
        statusText.className = "text-xs font-semibold text-sky-300";
        statusDot.className = "w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse";
    } else {
        statusText.textContent = gameMode === 'ai' ? `Pensando IA (${getShapeSymbol(shapeP2)})...` : `Turno J2 (${getShapeSymbol(shapeP2)})`;
        statusText.className = "text-xs font-semibold text-rose-300";
        statusDot.className = "w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse";
    }
}

function resetGame() {
    clearGameOverAnnouncement();
    if (aiMoveTimer !== null) {
        clearTimeout(aiMoveTimer);
        aiMoveTimer = null;
    }
    boardState = Array(3).fill(null).map(() => Array(3).fill(null).map(() => Array(3).fill(0)));
    currentPlayer = 1;
    gameActive = true;
    keyboardCell = { x: 1, y: 1, z: activeLayer2D };

    while (pieceGroup.children.length > 0) {
        const piece = pieceGroup.children[0];
        pieceGroup.remove(piece);
        piece.geometry.dispose();
    }

    removeLaserLine();

    cellMeshes.forEach(cell => {
        refreshCellAppearance(cell);
    });

    updateStatusUI();
    updateKeyboardSelection();
    update2DGrid();
}

function animate() {
    requestAnimationFrame(animate);

    if (isIntroState) {
        rotTime += 0.01;
        if (!prefersReducedMotion) {
            gridGroup.rotation.x += Math.sin(rotTime * 0.5) * 0.003 + 0.002;
            gridGroup.rotation.y += Math.cos(rotTime * 0.3) * 0.005 + 0.003;
            gridGroup.rotation.z += Math.sin(rotTime * 0.7) * 0.002;
        }
    } else {
        controls.update();
    }

    pieceGroup.children.forEach(piece => {
        if (prefersReducedMotion) return;
        piece.rotation.y += 0.015;
        piece.rotation.x += 0.005;
        const progress = Math.min((performance.now() - piece.userData.placedAt) / 220, 1);
        piece.scale.setScalar(THREE.MathUtils.lerp(0.05, 1, 1 - Math.pow(1 - progress, 3)));
    });

    if (laserLineMesh && !prefersReducedMotion) {
        laserLineMesh.material.opacity = 0.5 + Math.sin(Date.now() * 0.008) * 0.4;
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

window.onload = () => {
    updateThemeControls();
    updateSoundControl();
    updateMusicControl();
    updateDifficultyBadge();
    updateScoreboard();
    document.getElementById('wrapper-difficulty').style.display = gameMode === 'ai' ? 'flex' : 'none';
    document.getElementById('panel-metrics').style.display = gameMode === 'ai' ? 'flex' : 'none';
    animate();
    update2DGrid();
};
})();