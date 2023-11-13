import { HelpOutline } from "@mui/icons-material";
import { IconButton, Popover, Typography } from "@mui/material";
import React from "react";

// https://mui.com/material-ui/react-popover/
function BasicPopover() {
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
    };
  
    const handleClose = () => {
      setAnchorEl(null);
    };
  
    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;
  
    return (
      <div>
        <IconButton aria-describedby={id} onClick={handleClick}>
            <HelpOutline color='secondary' style={{transform: "scale(2)"}}/>
        </IconButton>
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          <Typography sx={{ p: 2 }}>
            <h2>Tak Rules</h2>
            <p>
                This is the 4x4 version of Tak with no capstone pieces. On each turn, a player can place a piece on an empty square or move a stack. When placing a piece, either a flat piece or a wall (denoted by stripes) can be placed. No pieces can be stacked on top of walls.
            </p>
            <p>
                The goal of the game is to complete a path of tiles from one edge of the board to the opposite edge. Only flat pieces of the player's color are counted in the path. The game also ends if the board is full, or both players have played 15 pieces. In this case, each players counts the number of flat pieces at the top of a stack. The player with the higher count wins.
            </p>

            <h2>How to Play</h2>
            <p>
                Selecting a move: use the leftmost button to alternate between the possible moves. For "FLAT" and "WALL", click on the square you would like to place the piece. For "MOVE", select the starting square, select a direction, and then adjust the number of pieces left behind at each location. Finally, click "APPLY MOVE" to apply the move.

                Bot move: click this button to play the move selected by an AI player.
            </p>


            </Typography>
        </Popover>
      </div>
    );
  }

export default function Header() {
    return (
        <>
            <div className="header">
                <div className="logo-container">
                    <div className="icon-container">
                        <div className="tile-small tile-small-bottom tile-white">
                            <div className="tile-small tile-small-middle tile-black">
                            <div className="tile-small tile-small-middle tile-white"></div>
                            </div>
                        </div>
                    </div>
                    <h1>Tak</h1>
                </div>
                <div className="help-container" >
                    <BasicPopover/>
                </div>
            </div>
        </>
    )
}