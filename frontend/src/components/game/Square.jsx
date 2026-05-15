// Square component

import Piece from './Piece';

export default function Square({
  row,
  col,
  piece,
  isDark,
  isSelected,
  isLegalTarget,
  isCaptureTarget,
  isOnCapturePath,
  captureCount,
  canMove,
  isLastMove,
  onClick,
}) {
  // Base background
  let bg = isDark ? '#1a1a1a' : '#b8b8b8';

  // Override for highlights
  if (isSelected) {
    bg = '#4a4a00'; // Yellow tint for selected
  } else if (isLegalTarget) {
    bg = '#004a00'; // Green tint for legal target
  } else if (isCaptureTarget) {
    bg = '#004a00'; // Green tint for capture trajectory
  } else if (isOnCapturePath) {
    bg = '#006600'; // Brighter green for squares on the path
  }

  return (
    <div
      onClick={isDark ? onClick : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: isDark ? 'pointer' : 'default',
        background: bg,
        aspectRatio: '1 / 1',
        outline: isLastMove ? '2px solid rgba(192, 193, 255, 0.5)' : 'none',
        outlineOffset: '-2px',
      }}
    >
      {/* Legal move dot indicator with capture count */}
      {isLegalTarget && !piece && (
        <div style={{
          width: '40%',
          height: '40%',
          borderRadius: '50%',
          background: captureCount > 1 ? 'rgba(251, 191, 36, 0.95)' : 'rgba(74, 222, 128, 0.9)',
          boxShadow: captureCount > 1
            ? '0 0 15px rgba(251, 191, 36, 0.9)'
            : '0 0 10px rgba(74, 222, 128, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {captureCount > 1 && (
            <span style={{
              color: '#1a1a1a',
              fontWeight: 'bold',
              fontSize: '0.75rem',
            }}>
              {captureCount}x
            </span>
          )}
        </div>
      )}

      {/* Capture target indicator (green ring on piece that will be captured) */}
      {isCaptureTarget && piece && !isSelected && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: '90%',
            height: '90%',
            borderRadius: '50%',
            border: '3px solid rgba(74, 222, 128, 0.8)',
            boxShadow: '0 0 15px rgba(74, 222, 128, 0.8), inset 0 0 10px rgba(74, 222, 128, 0.3)',
            animation: 'capturePulse 1.2s ease-in-out infinite',
          }} />
        </div>
      )}

      {piece && (
        <Piece
          piece={piece}
          isSelected={isSelected}
          canMove={canMove}
          isLastMove={isLastMove}
        />
      )}
    </div>
  );
}
