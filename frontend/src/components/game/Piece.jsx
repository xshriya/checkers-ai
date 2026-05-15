// Piece component

export default function Piece({ piece, isSelected, canMove, isLastMove }) {
  if (!piece) return null;

  const isRed = piece.player === 'red';
  const isKing = piece.type === 'king';

  const pieceStyle = {
    width: '75%',
    height: '75%',
    borderRadius: '50%',
    position: 'relative',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    transform: isSelected ? 'scale(1.1)' : 'scale(1)',
    cursor: 'pointer',
  };

  // Add subtle land animation for piece that just moved
  if (isLastMove && !isSelected) {
    pieceStyle.animation = 'pieceLand 0.25s ease-out';
  }

  if (isRed) {
    pieceStyle.background = 'radial-gradient(circle at 30% 30%, #e53935, #8e0000)';
    pieceStyle.border = '3px solid #ff5252';
    if (isSelected) {
      pieceStyle.boxShadow = '0 0 20px 5px rgba(192, 193, 255, 0.6)';
      pieceStyle.animation = 'selectedPulse 1s ease-in-out infinite';
    } else if (canMove) {
      pieceStyle.boxShadow = '0 0 15px 3px rgba(192, 193, 255, 0.4)';
    } else {
      pieceStyle.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';
    }
  } else {
    pieceStyle.background = 'radial-gradient(circle at 30% 30%, #ffffff, #c0c0c0)';
    pieceStyle.border = '3px solid #1f1f1f67';
    if (isSelected) {
      pieceStyle.boxShadow = '0 0 20px 5px rgba(192, 193, 255, 0.6)';
      pieceStyle.animation = 'selectedPulse 1s ease-in-out infinite';
    } else if (canMove) {
      pieceStyle.boxShadow = '0 0 15px 3px rgba(192, 193, 255, 0.4)';
    } else {
      pieceStyle.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    }
  }

  return (
    <div style={pieceStyle}>
      {isKing && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{
            color: isRed ? '#ffd700' : '#ffd700',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            userSelect: 'none',
          }}>♔</span>
        </div>
      )}
    </div>
  );
}
