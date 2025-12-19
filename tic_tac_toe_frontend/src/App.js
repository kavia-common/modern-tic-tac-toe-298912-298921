import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/**
 * Ocean Professional Tic Tac Toe
 * - Modern, responsive UI
 * - 3x3 grid centered
 * - Player indicators, status banner, controls
 * - Game logic: X/O turns, win/draw detection, reset, optional history
 */

// Helpers
const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // cols
  [0, 4, 8],
  [2, 4, 6], // diags
];

function calculateWinner(squares) {
  for (const [a, b, c] of WIN_LINES) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] };
    }
  }
  return null;
}

// PUBLIC_INTERFACE
function App() {
  /**
   * This is the main entry point for the Tic Tac Toe UI.
   * It renders the board, status banner, player badges, and control buttons.
   * It manages the game state: board, turn, winner/draw, and optional move history.
   */
  const [theme] = useState('light'); // Respect data-theme infra if extended later
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [stepNumber, setStepNumber] = useState(0);

  // Apply theme to documentElement for consistency with template
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const result = useMemo(() => calculateWinner(squares), [squares]);
  const isBoardFull = useMemo(() => squares.every(Boolean), [squares]);
  const isDraw = !result && isBoardFull;

  const currentPlayer = xIsNext ? 'X' : 'O';

  // PUBLIC_INTERFACE
  function handleClick(index) {
    /** Handles a move on a cell index if not occupied and game not finished. */
    if (squares[index] || result) return;

    const next = squares.slice();
    next[index] = currentPlayer;
    const nextHistory = history.slice(0, stepNumber + 1);
    nextHistory.push(next);

    setSquares(next);
    setXIsNext(!xIsNext);
    setHistory(nextHistory);
    setStepNumber(nextHistory.length - 1);
  }

  // PUBLIC_INTERFACE
  function resetGame() {
    /** Resets the game state to start a fresh match. */
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    setHistory([Array(9).fill(null)]);
    setStepNumber(0);
  }

  // PUBLIC_INTERFACE
  function jumpTo(step) {
    /** Optional: time travel to a previous step in move history. */
    const board = history[step];
    setSquares(board);
    setXIsNext(step % 2 === 0);
    setStepNumber(step);
  }

  const statusMessage = result
    ? `Winner: ${result.winner}`
    : isDraw
    ? 'Draw – No winner'
    : `Next Player: ${currentPlayer}`;

  return (
    <div className="App ocean-bg">
      <main className="game-shell">
        <header className="game-header">
          <h1 className="game-title">Tic Tac Toe</h1>
          <p className={`status-banner ${result ? 'status-win' : isDraw ? 'status-draw' : 'status-next'}`}>
            {statusMessage}
          </p>
          <div className="player-indicators" role="group" aria-label="Player indicators">
            <PlayerBadge label="X" active={currentPlayer === 'X' && !result && !isDraw} />
            <PlayerBadge label="O" active={currentPlayer === 'O' && !result && !isDraw} />
          </div>
        </header>

        <section className="board-wrap">
          <Board
            squares={squares}
            onCellClick={handleClick}
            winLine={result?.line || []}
          />
        </section>

        <footer className="controls">
          <button className="btn primary" onClick={resetGame} aria-label="Start a new game">
            New Game
          </button>
          <details className="history">
            <summary className="history-summary">Move History</summary>
            <ol className="history-list">
              {history.map((_, move) => {
                const desc = move ? `Go to move #${move}` : 'Go to start';
                return (
                  <li key={move}>
                    <button
                      className={`btn ghost ${move === stepNumber ? 'active' : ''}`}
                      onClick={() => jumpTo(move)}
                      aria-current={move === stepNumber}
                    >
                      {desc}
                    </button>
                  </li>
                );
              })}
            </ol>
          </details>
        </footer>
      </main>
    </div>
  );
}

function PlayerBadge({ label, active }) {
  /** Small badge indicating player and active status. */
  return (
    <div className={`badge ${label === 'X' ? 'badge-x' : 'badge-o'} ${active ? 'active' : ''}`}>
      <span className="badge-label">{label}</span>
      {active && <span className="badge-dot" aria-hidden="true" />}
    </div>
  );
}

function Board({ squares, onCellClick, winLine }) {
  /** 3x3 grid board component. */
  return (
    <div className="board" role="grid" aria-label="Tic Tac Toe board">
      {squares.map((value, idx) => {
        const isWinning = winLine?.includes(idx);
        return (
          <button
            key={idx}
            role="gridcell"
            aria-label={`Cell ${idx + 1} ${value ? `occupied by ${value}` : 'empty'}`}
            className={`cell ${value ? 'filled' : ''} ${isWinning ? 'win' : ''}`}
            onClick={() => onCellClick(idx)}
            disabled={!!value || winLine.length > 0}
          >
            <span className={`mark ${value === 'X' ? 'mark-x' : value === 'O' ? 'mark-o' : ''}`}>
              {value}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default App;
