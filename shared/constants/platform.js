export const GAME_IDS = Object.freeze({
    KACHUFUL: "kachuful",
    TEEN_PATTI: "teen-patti",
    INDIAN_RUMMY: "indian-rummy",
    MANGOOSE: "mangoose",
    UNO: "uno",
    JACK_THIEF: "jack-thief",
    NAPOLEON: "napoleon",
    BRIDGE: "bridge",
    SPADES: "spades",
    TWENTY_NINE: "twenty-nine",
    MINDI_COAT: "mindi-coat",
    BLUFF: "bluff",
    SATTE_PE_SATTA: "satte-pe-satta",
    WAR: "war",
    SOLITAIRE: "solitaire",
});

export const GAME_LIMITS = Object.freeze({
    [GAME_IDS.KACHUFUL]: Object.freeze({ min: 4, max: 10 }),
    [GAME_IDS.TEEN_PATTI]: Object.freeze({ min: 3, max: 6 }),
    [GAME_IDS.INDIAN_RUMMY]: Object.freeze({ min: 2, max: 6 }),
    [GAME_IDS.MANGOOSE]: Object.freeze({ min: 2, max: 12 }),
    [GAME_IDS.UNO]: Object.freeze({ min: 2, max: 12 }),
    [GAME_IDS.JACK_THIEF]: Object.freeze({ min: 2, max: 8 }),
    [GAME_IDS.NAPOLEON]: Object.freeze({ min: 5, max: 5 }),
    [GAME_IDS.BRIDGE]: Object.freeze({ min: 4, max: 4 }),
    [GAME_IDS.SPADES]: Object.freeze({ min: 4, max: 4 }),
    [GAME_IDS.TWENTY_NINE]: Object.freeze({ min: 4, max: 4 }),
    [GAME_IDS.MINDI_COAT]: Object.freeze({ min: 4, max: 4 }),
    [GAME_IDS.BLUFF]: Object.freeze({ min: 2, max: 6 }),
    [GAME_IDS.SATTE_PE_SATTA]: Object.freeze({ min: 3, max: 8 }),
    [GAME_IDS.WAR]: Object.freeze({ min: 2, max: 2 }),
    [GAME_IDS.SOLITAIRE]: Object.freeze({ min: 2, max: 8 }),
});

export const ROOM_STATUS = Object.freeze({
    WAITING: "waiting",
    PLAYING: "playing",
    COMPLETE: "complete",
    FINISHED: "finished",
});

export const PLAYER_STATUS = Object.freeze({
    CONNECTED: "connected",
    DISCONNECTED: "disconnected",
    ACTIVE: "active",
    FINISHED: "finished",
});

export const GAME_PHASE = Object.freeze({
    WAITING: "waiting",
    READY: "ready",
    STARTING: "starting",
    PLAYING: "playing",
    ROUND_COMPLETE: "round-complete",
    GAME_COMPLETE: "game-complete",
    FINISHED: "finished",
});

export const CARD_SUITS = Object.freeze([
    "spades",
    "hearts",
    "diamonds",
    "clubs",
]);

export const CARD_RANKS = Object.freeze([
    "ace",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "jack",
    "queen",
    "king",
]);
