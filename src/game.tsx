import { forwardRef, useEffect, useState } from "react"
import { Board, emptyBoard } from "./board"
import { applyMove, TakGame, gameOutcome, GameOutcome } from "./interface";
import { Alert, Button, Snackbar, Tooltip } from "@mui/material";

interface MoveButtonProps {
    wallState: [boolean, (val: boolean) => void];
    showMoveState: [boolean, (val: boolean) => void];
}

function MoveButton({wallState, showMoveState}: MoveButtonProps) {
    const [wall, setWall] = wallState;
    const [show_move, setShowMove] = showMoveState;
    // 0 - flat; 1 - wall; 2 - move
    const onClick = () => {
        if (!wall && !show_move) {
            setWall(true);
        } else if (wall && !show_move) {
            setWall(false);
            setShowMove(true);
        } else {
            setShowMove(false);
        }
    }

    let text = 'flat';
    if (wall) {
        text = 'wall';
    } 
    if (show_move) {
        text = 'move';
    }
    return (
        <>
            <Button variant='outlined' color='secondary' className={`move-button`} onClick={onClick}>{text}</Button>
        </>
    )
}

function TurnWidget({turn}: {turn: number}) {
    const text = turn == 1 ? "Player 1" : "Player 2" 
    const color = turn == 1 ? "tile-white" : "tile-black"
    return (
        <span style={{color: "orange"}} className={color}>{text}</span>
        
    )
}

interface TurnApplyMoveWidgetProps {
    turn: number;
    show_move: boolean;
    applyMove: () => void;
}
function TurnApplyMoveWidget({turn, show_move, applyMove}: TurnApplyMoveWidgetProps) {
    const variant = show_move ? "contained" : "outlined"
    const turn_text = turn == 1 ? "Player 1" : "Player 2"
    const text = show_move ? "apply move" : turn_text
    const onClick = show_move ? applyMove : () => {}
    const color = turn == 1 ? "player1" : "player2"

    return (
        // @ts-ignore
        <Button variant={variant} onClick={onClick} className="turn-apply-widget" color={color}>{text}</Button>
    )
}

interface MessageProps {
    msg: string;
    setMsg: (s: string) => void
}

// https://mui.com/material-ui/react-snackbar/

function Message({msg, setMsg}: MessageProps) {

    const open = msg != "";

    const handleClose = () => setMsg("")

    return <Snackbar anchorOrigin={{vertical: 'top', horizontal: 'center'}} open={open} autoHideDuration={3000} onClose={handleClose}>
        <Alert variant="filled" severity="error">{msg}</Alert>
    </Snackbar>
}

function Game() {
    const emptyMove = () => { return {
        move: "MOVE",
        i: -1, j: -1,
        di: 0, dj: 0,
        drop0: 0,
        drop1: 1,
        drop2: 0
    }}
        
    const [board, setBoard] = useState(emptyBoard())
    const [turn, setTurn] = useState(1)
    const [wall, setWall] = useState(false)
    const [show_move, setShowMove] = useState(false)
    const [move, setMove] = useState(emptyMove())
    const [done, setDone] = useState(GameOutcome.IN_PROGRESS);
    const [msg, setMsg] = useState("")
    const [pieces_rem, setPiecesRem] = useState([15,15])
    // TODO: figure out how to apply move; may need to move state here
    // just create move object then write functions to modify certain parts in the board class
    
    const clearBoard = () => {
        setBoard(emptyBoard());
        setMove(emptyMove())
        setShowMove(false)
        setDone(GameOutcome.IN_PROGRESS)
        setTurn(1);
    }

    const applyCurrMove = () => {
        console.log("applying move: ")
        console.log(move)
        let g: TakGame = {board: board, turn: turn, p1_pieces_rem: pieces_rem[0], p2_pieces_rem: pieces_rem[1]}
        applyMove(g, move).then(gamestate => {
            if (!gamestate) {
                console.log("invalid move");
                setMsg("Invalid Move")
            } else {
                const done = gameOutcome(gamestate);
                setTurn(gamestate.turn);
                setBoard(gamestate.board);
                setMove(emptyMove())
                setPiecesRem([gamestate.p1_pieces_rem, gamestate.p2_pieces_rem])
                setDone(done)
            }
        })
    }

    const is_done = done !== GameOutcome.IN_PROGRESS
    const done_msg = done == GameOutcome.P1_WIN ? "P1 wins!" : (done == GameOutcome.TIE ? "It's a tie!" : "P2 wins!")

    return (
        <>
            <div className="widget-container">    
                <MoveButton wallState={[wall, setWall]} showMoveState={[show_move, setShowMove]}/>
                {/* {show_move ? (
                    <button onClick={applyCurrMove}>Apply move</button>
                    ) : ""}
                <TurnWidget turn={turn}/> */}
                <TurnApplyMoveWidget turn={turn} applyMove={applyCurrMove} show_move={show_move}/>
                <Button variant="outlined" color='secondary' onClick={clearBoard}>Clear Board</Button>
                <Tooltip title="Bot move not supported online">
                <span>
                <Button variant='outlined' color='secondary' disabled>Bot Move</Button>
                </span>
                </Tooltip>
            </div>
            <div className="footer">
                <Message msg={msg} setMsg={setMsg}/>
                <div className="game-done">
                    {is_done ? done_msg : ""}
                </div>
            </div>
            <Board boardState={[board, setBoard]} turnState={[turn, setTurn]} wall={wall} show_move={show_move} moveState={[move,setMove]} setDone={setDone} setMsg={setMsg} piecesState={[pieces_rem, setPiecesRem]}/>
        </>
    )
    
}

export default Game;