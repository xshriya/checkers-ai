// API service for Checkers AI backend

const API_BASE = 'http://localhost:8000';

/**
 * Create a new game
 */
export async function newGame() {
  const response = await fetch(`${API_BASE}/game/new`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return response.json();
}

/**
 * Get current game state
 */
export async function getGame(gameId) {
  const response = await fetch(`${API_BASE}/game/${gameId}`);
  return response.json();
}

/**
 * Make a player move
 */
export async function makeMove(gameId, move) {
  const response = await fetch(`${API_BASE}/game/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ game_id: gameId, move }),
  });
  return response.json();
}

/**
 * Get AI move
 */
export async function getAIMove(gameId, difficulty = 'medium') {
  const response = await fetch(`${API_BASE}/game/ai-move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ game_id: gameId, difficulty }),
  });
  return response.json();
}

/**
 * Get all legal moves for current player
 */
export async function getLegalMoves(gameId) {
  const response = await fetch(`${API_BASE}/game/${gameId}/legal-moves`);
  return response.json();
}

/**
 * Get legal moves for a specific piece
 */
export async function getPieceMoves(gameId, row, col) {
  const response = await fetch(`${API_BASE}/game/${gameId}/moves/${row}/${col}`);
  return response.json();
}

/**
 * Undo the last two moves (AI + player)
 */
export async function undoMoves(gameId) {
  const response = await fetch(`${API_BASE}/game/undo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ game_id: gameId }),
  });
  return response.json();
}

/**
 * Get a hint (best move suggestion without applying it)
 */
export async function getHint(gameId, difficulty = 'medium') {
  const response = await fetch(`${API_BASE}/game/hint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ game_id: gameId, difficulty }),
  });
  return response.json();
}


// ==================== Auth API ====================

/**
 * Get stored token
 */
export function getToken() {
  return localStorage.getItem('token');
}

/**
 * Set token in storage
 */
export function setToken(token) {
  localStorage.setItem('token', token);
}

/**
 * Remove token from storage
 */
export function removeToken() {
  localStorage.removeItem('token');
}

/**
 * Get auth headers
 */
function getAuthHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

/**
 * Register a new user
 */
export async function register(username, email, password) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || 'Registration failed');
  }
  
  if (data.access_token) {
    setToken(data.access_token);
  }
  
  return data;
}

/**
 * Login with email and password
 */
export async function login(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Login failed');
  }

  if (data.access_token) {
    setToken(data.access_token);
  }

  return data;
}

/**
 * Logout (remove token)
 */
export function logout() {
  removeToken();
}

/**
 * Get current user info
 */
export async function getCurrentUser() {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    return null;
  }
  
  return response.json();
}

/**
 * Check auth status
 */
export async function getAuthStatus() {
  const response = await fetch(`${API_BASE}/auth/status`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  return data;
}

export async function recalculateStats() {
  const response = await fetch(`${API_BASE}/auth/recalculate-stats`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to recalculate stats');
  }

  return response.json();
}


// ==================== Game Management API ====================

/**
 * Create a new game record
 */
export async function createGameRecord(gameData) {
  const response = await fetch(`${API_BASE}/games`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(gameData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create game record');
  }
  
  return response.json();
}

/**
 * Complete a game with result
 */
export async function completeGame(gameId, result, winner = null, finalState = null) {
  const response = await fetch(`${API_BASE}/games/${gameId}/complete?result=${result}${winner ? `&winner=${winner}` : ''}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ final_state: finalState }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to complete game');
  }
  
  return response.json();
}

/**
 * Get user's games
 */
export async function getUserGames(page = 1, perPage = 20, gameMode = null) {
  let url = `${API_BASE}/games?page=${page}&per_page=${perPage}`;
  if (gameMode) {
    url += `&game_mode=${gameMode}`;
  }
  
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get games');
  }
  
  return response.json();
}

/**
 * Get a specific game
 */
export async function getGameRecord(gameId) {
  const response = await fetch(`${API_BASE}/games/${gameId}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get game');
  }
  
  return response.json();
}


// ==================== Leaderboard API ====================

/**
 * Get leaderboard
 */
export async function getLeaderboard(page = 1, perPage = 20, sortBy = 'rating') {
  const response = await fetch(`${API_BASE}/leaderboard?page=${page}&per_page=${perPage}&sort_by=${sortBy}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to get leaderboard');
  }

  return response.json();
}

// ==================== Game Analysis ====================

export async function analyzeGame(gameId, analysisType = 'full', force = false) {
  const response = await fetch(`${API_BASE}/games/${gameId}/analyze?analysis_type=${analysisType}&force=${force}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to analyze game');
  }

  return response.json();
}

export async function getGameAnalysis(gameId) {
  const response = await fetch(`${API_BASE}/games/${gameId}/analysis`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get analysis');
  }

  return response.json();
}

export async function getGameSummary(gameId) {
  const response = await fetch(`${API_BASE}/games/${gameId}/summary`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate summary');
  }

  return response.json();
}

export async function explainAIContinuation(gameId, continuation) {
  const response = await fetch(`${API_BASE}/game/${gameId}/explain-continuation`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ continuation }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to explain continuation');
  }

  return response.json();
}

export async function getGameReplay(gameId) {
  const response = await fetch(`${API_BASE}/games/${gameId}/replay`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get replay data');
  }

  return response.json();
}

export async function getStateAtMove(gameId, moveNumber) {
  const response = await fetch(`${API_BASE}/games/${gameId}/state/${moveNumber}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get state');
  }

  return response.json();
}
