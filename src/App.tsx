import React from 'react';
import logo from './logo.svg';
import './App.css';
import { ThemeProvider } from '@emotion/react';
import { createTheme } from '@mui/material';
import Header from './header';


import Game from './game';

const theme = createTheme({
  palette: {
    // @ts-ignore
    player1: {
      main: "#e60707",
      contrastText: "#fff"
    },
    player2: {
      main: "#0a8af2",
      contrastText: "#fff"
    },
    secondary: {
      main: "#000"
    }
  }
})


function Tak() {
  return (
    <>
      <ThemeProvider theme={theme}>
        <div className='container'>
          <div className='top-container'>
            <Header/>
            <Game/>
          </div>
        </div>
      </ThemeProvider>
    </>
  )
}

function App() {
  return (
    <Tak/>
  );
}

export default App;
