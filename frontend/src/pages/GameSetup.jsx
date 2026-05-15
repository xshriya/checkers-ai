// Game Setup Page - Choose game mode and settings before playing

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GameSetup() {
  const navigate = useNavigate();
  const [gameMode, setGameMode] = useState(null); // 'offline' or 'bot'
  const [difficulty, setDifficulty] = useState('medium');
  const [isFreeplay, setIsFreeplay] = useState(false);
  const [playerColor, setPlayerColor] = useState('red');
  const [showInsights, setShowInsights] = useState(true);
  const [isRated, setIsRated] = useState(true);

  const handleStartGame = () => {
    const settings = {
      mode: gameMode,
      difficulty: isFreeplay ? 'freeplay' : difficulty,
      canChangeDifficulty: isFreeplay,
      playerColor,
      showInsights,
      isRated,
    };
    
    // Navigate to game with settings
    navigate('/game', { state: settings });
  };

  const handleBack = () => {
    if (gameMode) {
      setGameMode(null);
    }
  };

  return (
    <main className="flex-grow px-6 pt-28 pb-16 relative overflow-hidden min-h-screen">
      {/* Background blobs */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-tertiary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12 fade-up">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-on-surface leading-none mb-3">
            {gameMode === 'offline' ? 'Offline Game' : gameMode === 'bot' ? 'Play vs AI' : 'Choose Game Mode'}
          </h1>
          <p className="text-on-surface-variant text-lg">
            {gameMode === null 
              ? 'Select how you want to play'
              : 'Configure your game settings'}
          </p>
        </div>

        {/* Game Mode Selection */}
        {!gameMode && (
          <div className="grid md:grid-cols-2 gap-6 fade-up fade-up-delay-1">
            {/* Offline Mode */}
            <button
              onClick={() => setGameMode('offline')}
              className="glass-panel rounded-2xl p-8 text-left hover:bg-white/10 transition-all duration-300 border border-white/5 hover:border-primary/30 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-secondary-container flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-on-secondary-container" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface">Play Offline</h3>
                  <p className="text-on-surface-variant text-sm">2 Players on same device</p>
                </div>
              </div>
              <p className="text-on-surface-variant text-sm">
                Play with a friend locally. Take turns on the same device. No AI involved.
              </p>
            </button>

            {/* Bot Mode */}
            <button
              onClick={() => setGameMode('bot')}
              className="glass-panel rounded-2xl p-8 text-left hover:bg-white/10 transition-all duration-300 border border-white/5 hover:border-primary/30 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-primary-container flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-on-primary-container" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface">Play vs AI</h3>
                  <p className="text-on-surface-variant text-sm">Challenge the computer</p>
                </div>
              </div>
              <p className="text-on-surface-variant text-sm">
                Play against an AI opponent. Choose difficulty and customize your experience.
              </p>
            </button>
          </div>
        )}

        {/* Settings Configuration */}
        {gameMode && (
          <div className="space-y-6 fade-up fade-up-delay-1">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to mode selection
            </button>

            {/* Bot Mode Settings */}
            {gameMode === 'bot' && (
              <>
                {/* Difficulty Selection */}
                <div className="glass-panel rounded-2xl p-6 border border-white/5">
                  <h3 className="text-lg font-bold text-on-surface mb-4">Difficulty</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {['easy', 'medium', 'hard', 'freeplay'].map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          if (d === 'freeplay') {
                            setIsFreeplay(true);
                            setDifficulty('medium');
                          } else {
                            setIsFreeplay(false);
                            setDifficulty(d);
                          }
                        }}
                        className={`px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                          (d === 'freeplay' && isFreeplay) || (d !== 'freeplay' && difficulty === d && !isFreeplay)
                            ? 'bg-primary text-on-primary shadow-lg shadow-primary/30'
                            : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                        }`}
                      >
                        {d === 'freeplay' ? 'Free' : d}
                      </button>
                    ))}
                  </div>
                  <p className="text-on-surface-variant text-xs mt-3">
                    {isFreeplay 
                      ? 'Freeplay: Starts at Medium. Change difficulty anytime during the game.'
                      : 'Difficulty is locked once game starts'}
                  </p>
                </div>

                {/* Player Color Selection */}
                <div className="glass-panel rounded-2xl p-6 border border-white/5">
                  <h3 className="text-lg font-bold text-on-surface mb-4">Your Pieces</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setPlayerColor('red')}
                      className={`p-6 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-3 ${
                        playerColor === 'red'
                          ? 'border-primary bg-primary/10'
                          : 'border-outline-variant bg-surface-container-high hover:border-primary/50'
                      }`}
                    >
                      <div 
                        className="w-16 h-16 rounded-full"
                        style={{
                          background: 'radial-gradient(circle at 30% 30%, #e53935, #8e0000)',
                          border: '3px solid #ff5252',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                        }}
                      />
                      <span className="font-bold text-on-surface">Red</span>
                      <span className="text-xs text-on-surface-variant">Move First</span>
                    </button>
                    <button
                      onClick={() => setPlayerColor('white')}
                      className={`p-6 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-3 ${
                        playerColor === 'white'
                          ? 'border-primary bg-primary/10'
                          : 'border-outline-variant bg-surface-container-high hover:border-primary/50'
                      }`}
                    >
                      <div 
                        className="w-16 h-16 rounded-full"
                        style={{
                          background: 'radial-gradient(circle at 30% 30%, #ffffff, #c0c0c0)',
                          border: '3px solid #1f1f1f67',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                        }}
                      />
                      <span className="font-bold text-on-surface">White</span>
                      <span className="text-xs text-on-surface-variant">AI Moves First</span>
                    </button>
                  </div>
                </div>

                {/* AI Insights Toggle */}
                <div className="glass-panel rounded-2xl p-6 border border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-on-surface">AI Insights</h3>
                      <p className="text-on-surface-variant text-sm">
                        Show AI explanations during the game
                      </p>
                    </div>
                    <button
                      onClick={() => setShowInsights(!showInsights)}
                      className={`w-14 h-8 rounded-full transition-all duration-200 ${
                        showInsights ? 'bg-primary' : 'bg-surface-container-highest'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                          showInsights ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Rated Game Toggle */}
                <div className="glass-panel rounded-2xl p-6 border border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-on-surface">Rated Game</h3>
                      <p className="text-on-surface-variant text-sm">
                        Affects your ELO rating on leaderboard
                      </p>
                    </div>
                    <button
                      onClick={() => setIsRated(!isRated)}
                      className={`w-14 h-8 rounded-full transition-all duration-200 ${
                        isRated ? 'bg-primary' : 'bg-surface-container-highest'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                          isRated ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Offline Mode Settings */}
            {gameMode === 'offline' && (
              <div className="glass-panel rounded-2xl p-6 border border-white/5">
                <h3 className="text-lg font-bold text-on-surface mb-4">Game Rules</h3>
                <ul className="space-y-2 text-on-surface-variant text-sm">
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Red player moves first
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Players take turns on the same device
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Standard checkers rules apply
                  </li>
                </ul>
              </div>
            )}

            {/* Start Game Button */}
            <button
              onClick={handleStartGame}
              className="w-full py-4 rounded-2xl bg-primary text-on-primary font-bold text-lg uppercase tracking-wider shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-200 hover:scale-[1.02]"
            >
              Start Game
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
