/**
 * Shared JavaScript contracts used by the platform infrastructure.
 * Runtime validation remains in the backend/game modules.
 */

/**
 * @typedef {Object} SharedPlayer
 * @property {string} id
 * @property {string} username
 * @property {number} [seat]
 * @property {boolean} ready
 * @property {boolean} connected
 * @property {boolean} [host]
 * @property {number} [score]
 * @property {string} [status]
 */

/**
 * @typedef {Object} SharedRoom
 * @property {string} code
 * @property {string} gameId
 * @property {string} hostId
 * @property {string} status
 * @property {number} createdAt
 * @property {number} [startedAt]
 * @property {number} [finishedAt]
 * @property {SharedPlayer[]} players
 */

/**
 * @typedef {Object} SharedGameState
 * @property {string} gameId
 * @property {string} roomCode
 * @property {string} phase
 * @property {SharedPlayer[]} players
 * @property {string} [currentPlayer]
 * @property {number} [round]
 * @property {Object} [scores]
 * @property {string} [winner]
 * @property {number} [startedAt]
 * @property {number} [finishedAt]
 * @property {Object} [game]
 */

export { };
