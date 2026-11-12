const test = require('node:test');
const assert = require('node:assert/strict');
const { checkWin, generateWinningLines, getBestMove, getKeyboardMove } = require('../script.js');

function emptyBoard() {
    return Array.from({ length: 3 }, () =>
        Array.from({ length: 3 }, () => Array(3).fill(0))
    );
}

test('genera las 49 líneas rectas únicas del tablero 3D', () => {
    const lines = generateWinningLines();
    const keys = new Set(lines.map(line => line.map(cell => cell.join(',')).join('|')));

    assert.equal(lines.length, 49);
    assert.equal(keys.size, 49);
    for (const line of lines) {
        const [start, middle, end] = line;
        assert.deepEqual(
            middle.map((value, i) => value - start[i]),
            end.map((value, i) => value - middle[i])
        );
    }
});

test('detecta una columna en una capa, incluida la columna antes omitida', () => {
    const board = emptyBoard();
    board[2][0][1] = 1;
    board[2][1][1] = 1;
    board[2][2][1] = 1;

    assert.equal(checkWin(board).winner, 1);
});

test('detecta diagonales tridimensionales de ambos jugadores', () => {
    const board = emptyBoard();
    board[0][0][0] = -1;
    board[1][1][1] = -1;
    board[2][2][2] = -1;

    assert.equal(checkWin(board).winner, -1);
});

test('detecta correctamente cada una de las 49 líneas ganadoras', () => {
    for (const line of generateWinningLines()) {
        for (const player of [1, -1]) {
            const board = emptyBoard();
            for (const [x, y, z] of line) board[x][y][z] = player;
            assert.equal(checkWin(board).winner, player);
            assert.deepEqual(checkWin(board).line, line);
        }
    }
});

test('prioriza una victoria sobre un tablero completo', () => {
    const board = Array.from({ length: 3 }, () =>
        Array.from({ length: 3 }, () => Array(3).fill(1))
    );

    assert.equal(checkWin(board).winner, 1);
});

test('devuelve null mientras una partida siga abierta', () => {
    assert.equal(checkWin(emptyBoard()), null);
});

test('las flechas verticales siguen la dirección visual y Q/E cambian de capa', () => {
    assert.deepEqual(getKeyboardMove('ArrowUp'), [0, 1, 0]);
    assert.deepEqual(getKeyboardMove('ArrowDown'), [0, -1, 0]);
    assert.deepEqual(getKeyboardMove('q'), [0, 0, -1]);
    assert.deepEqual(getKeyboardMove('E'), [0, 0, 1]);
    assert.equal(getKeyboardMove('PageUp'), null);
});

test('la IA gana en una jugada cuando tiene una línea abierta', () => {
    const board = emptyBoard();
    board[1][1][1] = -1;
    board[0][0][0] = -1;
    const before = JSON.stringify(board);

    const result = getBestMove(board, 2);

    assert.ok(result.move);
    assert.equal(JSON.stringify(board), before);
    assert.equal(board[result.move.x][result.move.y][result.move.z], 0);
    board[result.move.x][result.move.y][result.move.z] = -1;
    assert.equal(checkWin(board).winner, -1);
    assert.ok(result.nodes > 0);
});

test('la IA bloquea una victoria inmediata del jugador', () => {
    const board = emptyBoard();
    board[0][0][1] = 1;
    board[1][0][1] = 1;

    const result = getBestMove(board, 1);

    assert.deepEqual(result.move, { x: 2, y: 0, z: 1 });
});

test('la búsqueda experta respeta el límite de nodos y devuelve una jugada legal', () => {
    const board = emptyBoard();
    const before = JSON.stringify(board);

    const result = getBestMove(board, 5, { iterative: true, maxNodes: 5000 });

    assert.ok(result.move);
    assert.equal(board[result.move.x][result.move.y][result.move.z], 0);
    assert.equal(JSON.stringify(board), before);
    assert.ok(result.nodes <= 5000);
    assert.ok(result.depth >= 1 && result.depth <= 5);
});
