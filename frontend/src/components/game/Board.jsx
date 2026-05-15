// Board component

import Square from './Square';

// Helper to check if square is dark
function isDarkSquare(row, col) {
  return (row + col) % 2 === 1;
}

export default function Board({
  state,
  selectedSquare,
  legalMoves,
  allLegalMoves,
  lastMove,
  onSquareClick,
  playerColor = 'red',
}) {
  const isSelected = (row, col) =>
    selectedSquare?.row === row && selectedSquare?.col === col;

  const isLegalTarget = (row, col) =>
    legalMoves.some(m => m.to.row === row && m.to.col === col);

  const canMove = (row, col) =>
    allLegalMoves.some(m => {
      const fromRow = m.from_pos?.row ?? m.from?.row;
      const fromCol = m.from_pos?.col ?? m.from?.col;
      return fromRow === row && fromCol === col;
    });

  // Check if this square is part of a capture path (being captured)
  const isCaptureTarget = (row, col) => {
    return legalMoves.some(m =>
      m.captures && m.captures.some(c => c.row === row && c.col === col)
    );
  };

  // Check if this square is on the capture trajectory path
  const isOnCapturePath = (row, col) => {
    if (!selectedSquare) return false;

    return legalMoves.some(move => {
      const fromRow = move.from_pos?.row ?? move.from?.row;
      const fromCol = move.from_pos?.col ?? move.from?.col;
      const toRow = move.to?.row;
      const toCol = move.to?.col;

      // Only check for capture moves
      if (!move.captures || move.captures.length === 0) return false;

      // Check if square is between start and end (diagonal)
      const rowDiff = toRow - fromRow;
      const colDiff = toCol - fromCol;
      const steps = Math.abs(rowDiff); // Number of squares in path

      // For each step in the path
      for (let i = 1; i < steps; i++) {
        const pathRow = fromRow + (rowDiff / steps) * i;
        const pathCol = fromCol + (colDiff / steps) * i;

        if (Math.round(pathRow) === row && Math.round(pathCol) === col) {
          return true;
        }
      }

      return false;
    });
  };

  // Get capture count for a legal move to this square
  const getCaptureCount = (row, col) => {
    const move = legalMoves.find(m => m.to.row === row && m.to.col === col);
    return move?.captures?.length || 0;
  };

  const isLastMove = (row, col) => {
    if (!lastMove) return false;
    const fromRow = lastMove.from?.row ?? lastMove.from_pos?.row;
    const fromCol = lastMove.from?.col ?? lastMove.from_pos?.col;
    const toRow = lastMove.to?.row;
    const toCol = lastMove.to?.col;
    return (
      (fromRow === row && fromCol === col) ||
      (toRow === row && toCol === col)
    );
  };

  // If player is white, don't reverse the board (white pieces at bottom)
  // If player is red, reverse the board (red pieces at bottom)
  const boardToRender = playerColor === 'white' ? state.board : [...state.board].reverse();

  return (
    <div className="glass-panel rounded-[2rem] border border-white/5 p-3 sm:p-4 shadow-2xl">
      <div
        className="checker-board rounded-xl overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          width: '100%',
          aspectRatio: '1 / 1',
          background: '#1a1a1a',
        }}
      >
        {boardToRender.map((row, displayRowIndex) => {
          const actualRowIndex = playerColor === 'white' ? displayRowIndex : 7 - displayRowIndex;
          return row.map((piece, colIndex) => {
            const dark = isDarkSquare(actualRowIndex, colIndex);
            return (
              <Square
                key={`${actualRowIndex}-${colIndex}`}
                row={actualRowIndex}
                col={colIndex}
                piece={piece}
                isDark={dark}
                isSelected={isSelected(actualRowIndex, colIndex)}
                isLegalTarget={isLegalTarget(actualRowIndex, colIndex)}
                isCaptureTarget={isCaptureTarget(actualRowIndex, colIndex)}
                isOnCapturePath={isOnCapturePath(actualRowIndex, colIndex)}
                captureCount={getCaptureCount(actualRowIndex, colIndex)}
                canMove={canMove(actualRowIndex, colIndex)}
                isLastMove={isLastMove(actualRowIndex, colIndex)}
                onClick={() => onSquareClick(actualRowIndex, colIndex)}
              />
            );
          });
        })}
      </div>
    </div>
  );
}
