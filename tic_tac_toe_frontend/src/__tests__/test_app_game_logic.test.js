import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

/**
 * Helper to click a series of cell indices in order.
 * It also asserts that the cell becomes filled with expected mark after click.
 */
async function playMoves(user, indices, expectedMarks) {
  for (let i = 0; i < indices.length; i++) {
    const cellIndex = indices[i];
    const cell = await screen.findByRole('gridcell', { name: new RegExp(`Cell ${cellIndex + 1}`, 'i') });
    await user.click(cell);
    if (expectedMarks && expectedMarks[i]) {
      // mark should show in the cell
      expect(cell).toHaveTextContent(expectedMarks[i]);
      // button becomes disabled once filled or when game over
      expect(cell).toBeDisabled();
    }
  }
}

describe('Tic Tac Toe game logic', () => {
  test('turn progression alternates X then O and status reflects next player', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Initially it should show Next Player: X
    expect(screen.getByText(/Next Player: X/i)).toBeInTheDocument();

    // Click first empty cell -> X
    const cell1 = screen.getByRole('gridcell', { name: /Cell 1/i });
    await user.click(cell1);
    expect(cell1).toHaveTextContent('X');

    // Now status should show Next Player: O
    expect(screen.getByText(/Next Player: O/i)).toBeInTheDocument();

    // Click second cell -> O
    const cell2 = screen.getByRole('gridcell', { name: /Cell 2/i });
    await user.click(cell2);
    expect(cell2).toHaveTextContent('O');

    // Next should be X again
    expect(screen.getByText(/Next Player: X/i)).toBeInTheDocument();
  });

  test('prevents moves on an occupied cell', async () => {
    const user = userEvent.setup();
    render(<App />);

    const cell1 = screen.getByRole('gridcell', { name: /Cell 1/i });

    // First click fills with X
    await user.click(cell1);
    expect(cell1).toHaveTextContent('X');

    // Attempt to click same cell again should not change content
    await user.click(cell1);
    expect(cell1).toHaveTextContent('X'); // still X
  });

  test('winner detection - X wins on top row and board disables further moves', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Sequence for X to win on top row: X at 1, O at 4, X at 2, O at 5, X at 3
    // Indices are 0-based: [0,3,1,4,2]
    await playMoves(user, [0, 3, 1, 4, 2], ['X','O','X','O','X']);

    // Status should show Winner: X
    expect(screen.getByText(/Winner:\s*X/i)).toBeInTheDocument();

    // All cells should be disabled due to win state
    const cells = screen.getAllByRole('gridcell');
    cells.forEach((c) => {
      expect(c).toBeDisabled();
    });

    // Attempt to click an empty remaining cell (if any) should not change
    // Find any cell that is still empty text
    const maybeEmpty = cells.find((c) => !within(c).queryByText(/X|O/));
    if (maybeEmpty) {
      await user.click(maybeEmpty);
      expect(maybeEmpty).toHaveTextContent('');
    }
  });

  test('draw detection - board full with no winner shows Draw and disables board', async () => {
    const user = userEvent.setup();
    render(<App />);

    // A known draw sequence (0-based indices):
    // X O X
    // X X O
    // O X O
    // Sequence of plays with expected marks:
    const sequence = [0,1,2,4,3,5,7,6,8];
    const marks    = ['X','O','X','O','X','O','X','O','X']; // as they alternate

    await playMoves(user, sequence, marks);

    expect(screen.getByText(/Draw/i)).toBeInTheDocument();

    // Board should be disabled (all buttons disabled)
    const cells = screen.getAllByRole('gridcell');
    cells.forEach((c) => expect(c).toBeDisabled());
  });

  test('reset behavior - New Game button clears board and status resets to Next Player: X', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Make a couple of moves
    await playMoves(user, [0, 1], ['X', 'O']);

    // Click New Game
    const resetBtn = screen.getByRole('button', { name: /New Game/i });
    await user.click(resetBtn);

    // All cells should be enabled and empty
    const cells = screen.getAllByRole('gridcell');
    cells.forEach((c) => {
      expect(c).toBeEnabled();
      expect(c).toHaveTextContent('');
    });

    // Status reset
    expect(screen.getByText(/Next Player: X/i)).toBeInTheDocument();
  });

  test('prevents moves after game over (winner) even via UI interactions', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Create a quick win for O instead (X: 0, O:3, X:1, O:4, X:8, O:5 -> O wins on left column? Not exactly)
    // We'll make O win on middle column:
    // X at 0, O at 1, X at 3, O at 4, X at 8, O at 7 => O line [1,4,7]
    const moveSeq = [0,1,3,4,8,7];
    const marks =   ['X','O','X','O','X','O'];
    await playMoves(user, moveSeq, marks);

    expect(screen.getByText(/Winner:\s*O/i)).toBeInTheDocument();

    // Try clicking any empty cell (e.g., index 2 if empty)
    const cells = screen.getAllByRole('gridcell');
    const emptyCell = cells.find((c) => !within(c).queryByText(/X|O/));
    if (emptyCell) {
      expect(emptyCell).toBeDisabled(); // board disabled on win
      await user.click(emptyCell);
      expect(emptyCell).toHaveTextContent('');
    }
  });
});
