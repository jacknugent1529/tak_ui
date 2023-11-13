export type BoardT = number[][][]

export interface TakGame {
    board: BoardT;
    turn: number;
    p1_pieces_rem: number;
    p2_pieces_rem: number;
}


export interface Move {
    move: string;
    i: number;
    j: number;
    di: number;
    dj: number;
    drop0: number;
    drop1: number;
    drop2: number;
}

export enum GameOutcome {
    P1_WIN,
    P2_WIN,
    TIE,
    IN_PROGRESS
}

const WALL_OFFSET = 10;

/* Helper functions to get tower heights */

function getTowerHeight(game: TakGame, i: number, j: number): number {
    console.log([i,j])
    if (!(i >= 0 && i < 4 && j >= 0 && j < 4)) {
        return 0
    }
    let h = 0;
    while (game.board[i][j][h] !== 0 && h < 8) {
        h++;
    }
    return h;
}

function tallestTower(game: TakGame): number {
    let max = 0;
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            while (max < 8 && game.board[i][j][max] !== 0) {
                max++;
            }
        }
    }
    return max;
}

/* Methods to mutate board state */

function addPiece(game: TakGame, i: number, j: number, piece: number): void {
    game.board[i][j].splice(1, 0, ...game.board[i][j].slice(0, 7));
    game.board[i][j][0] = piece;
}

function moveTower(
    game: TakGame,
    i: number,
    j: number,
    di: number,
    dj: number,
    drop0: number,
    drop1: number,
    drop2: number
): void {
    const drop3 = getTowerHeight(game, i, j) - drop0 - drop1 - drop2;
    const drops = [drop1, drop2, drop3];

    for (let c = 3; c >= 1; c--) {
        const i_dst = i + c * di;
        const j_dst = j + c * dj;
        const drop = drops[c - 1];

        if (
            i_dst < 0 ||
            i_dst >= 4 ||
            j_dst < 0 ||
            j_dst >= 4 ||
            drop === 0
        ) {
            continue;
        }

        // Move the current tower out of the way
        game.board[i_dst][j_dst].splice(drop, 0, ...game.board[i_dst][j_dst].slice(0, 8 - drop));

        // Move the tower into position
        game.board[i_dst][j_dst].splice(0, drop, ...game.board[i][j].slice(0, drop));

        // Shift the original tower into position
        game.board[i][j].splice(0, 8 - drop, ...game.board[i][j].slice(drop));
    }
}

async function applyMove(game: TakGame, move: Move): Promise<TakGame | undefined> {
    const valid_moves = availableMoves(game)
    let move_valid = false;
    for (const m of valid_moves) {
        console.log("Checking against")
        console.log(m)
        if (moveEq(m, move)) {
            move_valid = true;
        }
    }
    if (!move_valid) {
        console.log(`INVALID MOVE`)
        console.log(move)
        return;
    }

    switch (move.move) {
        case 'FLAT':
            addPiece(game, move.i, move.j, game.turn);
            break;
        case 'WALL':
            addPiece(game, move.i, move.j, game.turn + WALL_OFFSET);
            break;
        case 'MOVE':
            moveTower(game, move.i, move.j, move.di!, move.dj!, move.drop0!, move.drop1!, move.drop2!);
    }

    if (move.move !== 'MOVE') {
        if (game.turn === 1) {
            game.p1_pieces_rem--;
        } else {
            game.p2_pieces_rem--;
        }
    }

    game.turn = (game.turn % 2) + 1;

    return game;
}

/* Methods to check for available moves */

/* Helper function to handle movement of towers */
function searchLine(game: TakGame, i: number, j: number, towerHeight: number, moves: Move[]): void {
    const dis = [1, -1, 0, 0];
    const djs = [0, 0, 1, -1];

    for (let k = 0; k < 4; k++) {
        const di = dis[k];
        const dj = djs[k];

        console.log(`di, dj: ${[di,dj]}`)
        const maxDrops = [0,0,0,0];
        maxDrops[0] = towerHeight - 1;

        let hitWall = false;

        for (let k = 0; k < 3; k++) {
            if (
                i + (k + 1) * di < 0 ||
                i + (k + 1) * di >= 4 ||
                j + (k + 1) * dj < 0 ||
                j + (k + 1) * dj >= 4
            ) {
                break;
            }

            const curr = game.board[i + (k + 1) * di][j + (k + 1) * dj][0];

            if (curr >= WALL_OFFSET) {
                hitWall = true;
            }

            maxDrops[k + 1] = hitWall ? 0 : Math.max(0, towerHeight - k);
        }

        console.log(`max drops: ${maxDrops}`)
        for (let d0 = 0; d0 <= maxDrops[0]; d0++) {
            for (let d1 = 1; d1 <= maxDrops[1]; d1++) {
                for (let d2 = 0; d2 <= maxDrops[2]; d2++) {
                    if (
                        d0 + d1 + d2 > towerHeight ||
                        d0 + d1 + d2 + maxDrops[3] < towerHeight
                    ) {
                        continue;
                    }
                    console.log("HERE2")

                    const d3 = towerHeight - d0 - d1 - d2;

                    if (
                        d0 + getTowerHeight(game, i, j) < 8 &&
                        (d1 === 0 || d1 + getTowerHeight(game, i + di, j + dj) < 8) &&
                        (d2 === 0 || d2 + getTowerHeight(game, i + 2 * di, j + 2 * dj) < 8) &&
                        (d3 === 0 || d3 + getTowerHeight(game, i + 3 * di, j + 3 * dj) < 8)
                    ) {
                        // assert(game.board[i + di][j + dj][0] <= WALL_OFFSET);
                        const m: Move = {
                            move: 'MOVE',
                            i,
                            j,
                            di: di as number,
                            dj: dj as number,
                            drop0: d0,
                            drop1: d1,
                            drop2: d2
                        };
                        moves.push(m);
                    }
                }
            }
        }
    }
}

function availableMoves(game: TakGame): Move[] {
    const moves: Move[] = [];

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (game.board[i][j][0] === 0) {
                // Empty;
                // Can place a flat piece
                const flat: Move = { move: 'FLAT', i, j, di: 0, dj: 0, drop0: 0, drop1: 0, drop2: 0 };
                moves.push(flat);

                // Can place a wall here
                const wall: Move = { move: 'WALL', i, j, di: 0, dj: 0, drop0: 0, drop1: 0, drop2: 0 };
                moves.push(wall);
            }

            if (
                game.board[i][j][0] === game.turn ||
                game.board[i][j][0] === game.turn + WALL_OFFSET
            ) {
                const height = getTowerHeight(game, i, j);
                searchLine(game, i, j, height, moves);
            }
        }
    }

    return moves;
}

/* Simple evaluation function based on the number of squares controlled by each player */
function tilesEval(game: TakGame): number {
    let p1Count = 0;
    let p2Count = 0;

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (game.board[i][j][0] === 1 || game.board[i][j][0] === 1 + WALL_OFFSET) {
                p1Count += 1;
            } else if (game.board[i][j][0] === 2 || game.board[i][j][0] === 2 + WALL_OFFSET) {
                p2Count += 1;
            }
        }
    }

    if (p1Count + p2Count === 0) {
        return 0;
    }

    if (game.turn === 1) {
        return (p1Count - p2Count) / (p1Count + p2Count);
    } else {
        return (p2Count - p1Count) / (p1Count + p2Count);
    }
}

/* Check if two moves are equal */
function moveEq(move1: Move, move2: Move): boolean {
    const firstPartEq =
        move1.move === move2.move &&
        move1.i === move2.i &&
        move1.j === move2.j;

    if (move1.move === 'MOVE') {
        const secondPartEq =
            move1.di === move2.di &&
            move1.dj === move2.dj &&
            move1.drop0 === move2.drop0 &&
            move1.drop1 === move2.drop1 &&
            move1.drop2 === move2.drop2;

        return firstPartEq && secondPartEq;
    }

    return firstPartEq;
}

/* Find method for union-find data structure */
function find(uf: number[], a: number): number {
    if (uf[a] === -1) {
        return a;
    } else {
        return find(uf, uf[a]);
    }
}

/* 
Union method for union-find data structure; also updates the direction array 
*/
function unionDir(uf: number[], dirs: boolean[][], a: number, b: number): void {
    a = find(uf, a);
    b = find(uf, b);

    if (a === b) {
        return;
    }

    uf[b] = a;
    dirs[0][a] = dirs[0][a] || dirs[0][b];
    dirs[1][a] = dirs[1][a] || dirs[1][b];
    dirs[2][a] = dirs[2][a] || dirs[2][b];
    dirs[3][a] = dirs[3][a] || dirs[3][b];
}


function gameOutcome(game: TakGame): GameOutcome {
    if (game.p1_pieces_rem === 0 || game.p2_pieces_rem === 0) {
        let p1_count = 0;
        let p2_count = 0;
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                switch (game.board[i][j][0]) {
                    case 1:
                        p1_count += 1;
                        break;
                    case 2:
                        p2_count += 1;
                        break;
                }
            }
        }

        if (p1_count > p2_count) {
            return GameOutcome.P1_WIN;
        } else if (p2_count > p1_count) {
            return GameOutcome.P2_WIN;
        } else {
            return GameOutcome.TIE;
        }
    }

    const uf: number[] = Array(16).fill(-1);
    const dirs: boolean[][] = Array.from({ length: 4 }, () => Array(16).fill(false));

    for (let i = 0; i < 4; i++) {
        dirs[0][i * 4 + 0] = true; // left
        dirs[1][i * 4 + 3] = true; // right
        dirs[2][0 * 4 + i] = true; // top
        dirs[3][3 * 4 + i] = true; // bottom
    }

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const dis = [1, -1, 0, 0];
            const djs = [0, 0, 1, -1];
            for (let k = 0; k < 4; k++) {
                const di = dis[k];
                const dj = djs[k];

                const i_p = i + di;
                const j_p = j + dj;
                if (i_p < 0 || i_p >= 4 || j_p < 0 || j_p >= 4) {
                    continue;
                }

                if (game.board[i][j][0] === game.board[i_p][j_p][0] && (game.board[i][j][0] === 1 || game.board[i][j][0] === 2)) {
                    const a = i * 4 + j;
                    const b = i_p * 4 + j_p;
                    unionDir(uf, dirs, a, b);

                    const a_new = find(uf, a);
                    if ((dirs[0][a_new] && dirs[1][a_new]) || (dirs[2][a_new] && dirs[3][a_new])) {
                        return game.board[i][j][0] === 1 ? GameOutcome.P1_WIN : GameOutcome.P2_WIN;
                    }
                }
            }
        }
    }

    let p1_count = 0;
    let p2_count = 0;

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            switch (game.board[i][j][0]) {
                case 1:
                    p1_count += 1;
                    break;
                case 2:
                    p2_count += 1;
                    break;
                case 0:
                    return GameOutcome.IN_PROGRESS;
            }
        }
    }

    return p1_count > p2_count ? GameOutcome.P1_WIN : GameOutcome.P2_WIN;
}

function newTakGame(): TakGame {
    const g: TakGame = {
        board: Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => Array(8).fill(0))),
        turn: 1,
        p1_pieces_rem: 15,
        p2_pieces_rem: 15,
    };
    return g;
}

function gameToString(game: TakGame): string {
    const cellHeight = Math.max(tallestTower(game), 1);
    const cellWidth = 1;
    const width = 1 + (1 + cellWidth) * 4 + 1 + 1;
    const height = 1 + (1 + cellHeight) * 4 + 1;
    let s: string[][] = Array(height).fill('').map(() => Array(width).fill(' '));

    for (let i = 1; i < height; i += cellHeight + 1) {
        for (let j = 1; j < width; j += 1) {
            s[i][j] = '-';
        }
    }

    for (let i = 0; i < 4; i++) {
        const s_i = 2 + (1 + cellHeight) * i;
        const j_i = 0;
        s[s_i][j_i] = String.fromCharCode('1'.charCodeAt(0) + i);
    }

    for (let j = 0; j < 4; j++) {
        const s_i = 0;
        const j_i = 2 + 2 * j;
        s[s_i][j_i] = String.fromCharCode('a'.charCodeAt(0) + j);
    }

    for (let i = 1; i < height; i++) {
        for (let j = 1; j < width; j += cellWidth + 1) {
            s[i][j] = '|';
        }
    }

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const s_i = 1 + (1 + cellHeight) * j + cellHeight;
            const s_j = 1 + (1 + cellWidth) * i + 1;
            const tHeight = getTowerHeight(game, i, j);
            for (let di = 0; di < tHeight; di++) {
                const c = game.board[i][j][di];
                if (c !== 0) {
                    const idx = (s_i - tHeight + di + 1);
                    s[idx][s_j] = String.fromCharCode('0'.charCodeAt(0) + c);
                }
            }
        }
    }

    for (let i = 0; i < height; i++) {
        s[i][width - 1] = '\n';
    }

    for (let i = 0; i < s.length; i++) {
        for (let j = 0; j < s[i].length; j++) {
            if (s[i][j] === String.fromCharCode('0'.charCodeAt(0) + 1 + WALL_OFFSET)) {
                s[i][j] = 'A';
            } else if (s[i][j] === String.fromCharCode('0'.charCodeAt(0) + 2 + WALL_OFFSET)) {
                s[i][j] = 'B';
            }
        }
    }

    return s.map((row) => row.join('')).join('');
}

export { applyMove, newTakGame, gameOutcome}