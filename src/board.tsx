import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { BoardT, Move, applyMove, TakGame, gameOutcome, GameOutcome } from './interface'
import { ReactJSXElement } from '@emotion/react/types/jsx-namespace';
import React from 'react';
import { Box, Button, IconButton } from '@mui/material';
import { ArrowCircleUpTwoTone, ArrowCircleLeftTwoTone, ArrowCircleRightTwoTone, ArrowCircleDownTwoTone, DoNotDisturbOnTwoTone, AddCircleOutlineTwoTone, RemoveCircleTwoTone, AddCircleTwoTone } from '@mui/icons-material';
import { ClassNames } from '@emotion/react';
// const { net } = require("electron")

type Direction = "up" | "down" | "left" | "right"

export function emptyBoard(): BoardT {
    let board = []
    for (let i = 0; i < 4; i++) {
        let row = []
        for (let j = 0; j < 4; j++) {
            let col: number[] = []
            for (let k = 0; k < 8; k++) {
                col.push(0)
            }
            row.push(col)
        }
        board.push(row)
    }
    return board
}

function getHeight(board: BoardT, i: number, j: number): number {
    let h = 0;
    while (h < 8 && board[i][j][h] != 0) {h++}
    return h;
}

interface ArrowProps {
    setDirection: (val?: Direction) => void;
    direction: Direction | undefined;
}
// TODO: highlight arrow if selected direction
function Arrows({setDirection, direction}: ArrowProps) {
    const f: (dir?: Direction) => (e: any) => void = dir => (e) => {setDirection(dir); e.stopPropagation()}
    return (
        <>
            <div className='arrow up-arrow'>
                <IconButton size="small" style={{transform: "scale(1.8)"}} onClick={f("up")}>
                    <ArrowCircleUpTwoTone color="secondary"/>
                </IconButton>
            </div>
            <div className='arrow left-arrow'>
                <IconButton size="small" style={{transform: "scale(1.8)"}} onClick={f("left")}>
                    <ArrowCircleLeftTwoTone color="secondary"/>
                </IconButton>
            </div>
            <div className='arrow right-arrow'>
                <IconButton size="small" style={{transform: "scale(1.8)"}} onClick={f("right")}>
                    <ArrowCircleRightTwoTone color="secondary"/>
                </IconButton>
            </div>
            <div className='arrow down-arrow'>
                <IconButton size="small" style={{transform: "scale(1.8)"}} onClick={f("down")}>
                    <ArrowCircleDownTwoTone color="secondary"/>
                </IconButton>
            </div>
        </>
    )
}

interface SquareProps {
    col: number[];
    i: number;
    j: number;
    choose_square: () => void;
    dirState: [boolean, Direction | undefined, (s?: Direction) => void];
    dropState: [number, (n: number) => void];
}

function Square({col, i, j, choose_square, dirState, dropState}: SquareProps) {

    const [show_direction, direction, setDirection] = dirState
    const [drop, setDrop] = dropState
    let squareClass: string;
    if ((i + j) % 2 == 1) {
        squareClass = "white square"
    } else {
        squareClass = "black square"
    }

    let h = 0;
    while (col[h] != 0) {h++}
    h--;

    function next_tile(i: number): ReactJSXElement {
        if (i < 0 || col[i] == 0) {
            return <></>
        }
        const wall = col[i] > 10
        const p1 = col[i] % 10 == 1
        let tile_color;

        if (wall && p1) {
            tile_color = 'tile-wall-white';
        } else if (wall && !p1) {
            tile_color = 'tile-wall-black';
        } else if (!wall && p1) {
            tile_color = 'tile-white';
        } else if (!wall && !p1) {
            tile_color = 'tile-black';
        }
        const color = col[i] % 10 == 1 ? "white" : "black";
        const tile_class = i == h ? "tile-bottom" : "tile-middle";
        const tile_next = next_tile(i - 1)
        return (
            <div className={`tile ${tile_class} ${tile_color}`} key={`tile_${i}_${j}`}>
                {tile_next}
                {wall}
            </div>
        )
    }

    function increment(e: React.MouseEvent<HTMLButtonElement>) {
        setDrop(drop + 1)
        e.stopPropagation()
    }

    function decrement(e: React.MouseEvent<HTMLButtonElement>) {
        setDrop(drop - 1)
        e.stopPropagation()
    }

    // TODO: +/- buttons
    return (
        <>
            <div className={squareClass} onClick={choose_square}>
                <div className='arrow-anchor'>
                    {next_tile(h)}
                    {drop >= 0 ?
                    (
                        <div className='tile-text'>
                            <div className='tile-wrapper'>
                                {!show_direction ? 
                                <IconButton onClick={decrement}>
                                    <RemoveCircleTwoTone style={{transform: "scale(1.6)"}} color='secondary'/>
                                </IconButton>
                                // <RemoveIcon onClick={decrement}/> 
                                : ""}
                                <span><span>{drop}</span></span>
                                {!show_direction ? 
                                // <AddIcon onClick={increment}/> 
                                <IconButton onClick={increment}>
                                    <AddCircleTwoTone style={{transform:"scale(1.6)"}} color='secondary' />
                                </IconButton>
                                : ""}
                            </div>
                        </div>
                    ) : ""}
                    {show_direction ? <Arrows direction={direction} setDirection={setDirection}/> : ""}
                </div>
            </div>
        </>
    )
}

function get_delta_from_dir(dir?: Direction): [number, number] {
    switch (dir) {
        case "left":
            return [0,-1]
        case "right":
            return [0,1]
        case "up":
            return [-1,0]
        case "down":
            return [1,0]
        default:
            return [0,0]
    }
}
function get_dir_from_delta(di: number, dj: number): Direction | undefined {
    switch ([di,dj]) {
        case [0,-1]:
            return "left"
        case [0,1]:
            return "right"
        case [-1,0]:
            return "up"
        case [1,0]:
            return "down"
        default:
            return undefined
    }
}


interface BoardProps {
    boardState: [BoardT, (b: BoardT) => void];
    turnState: [number, (t: number) => void];
    wall: boolean;
    show_move: boolean;
    moveState: [Move, (m: Move) => any];
    setDone: (b: GameOutcome) => void;
    setMsg: (s: string) => void;
    piecesState: [number[], (p: number[]) => void];
}

export function Board({boardState, turnState, wall, show_move, moveState, setDone, setMsg, piecesState}: BoardProps) {
    const [board, setBoard] = boardState;
    const [turn, setTurn] = turnState;
    const [move, setMove] = moveState;
    const [pieces_rem, setPiecesRem] = piecesState;

    function add_piece(i: number, j: number): void {
        const move = {
            "move": wall ? "WALL" : "FLAT",
            "i": i, 
            "j": j,
            "di": 0, "dj": 0, "drop0": 0, "drop1": 0, "drop2": 0
        }
        let g: TakGame = {board: board, turn: turn, p1_pieces_rem: pieces_rem[0], p2_pieces_rem: pieces_rem[1]}; 
        applyMove(g, move).then(gamestate => {
            if (!gamestate) {
                console.log("invalid move");
                setMsg("Invalid Move")
            } else {
                const done = gameOutcome(gamestate)
                setTurn(gamestate.turn);
                setBoard(gamestate.board);
                setPiecesRem([gamestate.p1_pieces_rem, gamestate.p2_pieces_rem])
                setDone(done);
            }
        })
    }

    const drops: number[] = [move.drop0 || 0, move.drop1 || 1, move.drop2 || 0];
    function setDrop(i: number, j: number, drop_i: number) {
        function f(n: number): void {
            switch (drop_i) {
                // case 0: 
                //     setMove({
                //         ...move,
                //         drop0: n
                //     })
                //     break;
                case 1:
                    // TODO: FIX
                    const delta1 = n - drops[1] ;
                    setMove({
                        ...move,
                        drop0: drops[0] - delta1,
                        drop1: n
                    });
                    break;
                case 2:
                    const delta2 = n - drops[2] ;
                    move.drop2 = n;
                    setMove({
                        ...move,
                        drop0: drops[0] - delta2,
                        drop2: n
                    });
                    break;
                case 3:
                    const drop0 = getHeight(board, i, j) - (drops[1] + drops[2] + n);
                    setMove({
                        ...move,
                        drop0: drop0
                    });
                    break;
            }
        }
        return f;
    }

    function setMoveStart(i: number, j: number): void {
        setMove({
            ...move,
            i: i, j: j,
            di: 1, dj: 0,
            drop0: 0,
            drop1: getHeight(board, i, j),
            drop2: 0,
        });
    }

    function changeDirection(s?: Direction): void {
        const [di, dj] = get_delta_from_dir(s);
        setMove({
            ...move,
            di, dj
        })
    }

    function get_tile_dropState(i: number, j: number): [number, (n: number) => void] {
        if (!show_move || move.i < 0 || move.j < 0) {
            return [-1, n => {}];
        }
        const [i0,j0] = [move.i, move.j];
        const [di,dj] = [move.di, move.dj];
        for (let k = 0; k <= 3; k++) {
            let i2 = i0 + k * di
            let j2 = j0 + k * dj
            if (0 > i2 || i2 >= 4 || 0 > j2 || j2 >= 4) {
                continue;
            }
            if (i2 == i && j2 == j) {
                let drop;
                if (k == 3) {
                    drop = getHeight(board, i0,j0 ) - (drops[0] + drops[1] + drops[2])
                } else {
                    drop = drops[k]
                }
                return [drop, setDrop(i0, j0, k)];
            }
        }
        return [-1, n => {}]
    }

    function get_tile_dirState(i: number, j: number): [boolean, Direction | undefined, (s?: Direction) => void] {
        if (show_move && i == move.i && j == move.j) {
            return [true, get_dir_from_delta(move.di, move.dj), changeDirection]
        } else {
            return [false, undefined, s => {}]
        }
    }

    const choose_square = show_move ? setMoveStart : add_piece

    const getGrid = (grid: number[][][]) => grid.map(
        (row, i) => (
            <div className="row" key={`row${i}`}>
            {
            row.map(
                (col, j) => (
                    <Square col={col} i={i} j={j} 
                    choose_square={() => choose_square(i,j)} 
                    dirState={get_tile_dirState(i,j)} 
                    dropState={get_tile_dropState(i,j)}
                    />
                )
            )
            }
            </div>
        )
    )

    return (
        <>
            <div className='board-container'>
                {getGrid(board)}
            </div>
        </>
    )
}