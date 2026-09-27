import { validateDeclaration } from "../games/indian-rummy/indianRummyEngine.js";

const RANK_VALUES = Object.freeze({
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
});

const SUIT_ORDER = [
  "spades",
  "hearts",
  "diamonds",
  "clubs",
  "S",
  "H",
  "D",
  "C",
];

function rankValue(card) {
  return (
    RANK_VALUES[String(card?.rank ?? "").toUpperCase()] ||
    Number(card?.value) ||
    0
  );
}

function lowest(cards) {
  return (
    [...(cards || [])].sort((a, b) => rankValue(a) - rankValue(b))[0] || null
  );
}

function highest(cards) {
  return (
    [...(cards || [])].sort((a, b) => rankValue(b) - rankValue(a))[0] || null
  );
}

function chooseRandom(items) {
  if (!items?.length) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function legalFollowCards(hand, currentTrick, trump = null) {
  if (!hand?.length) return [];
  if (!currentTrick?.length) return hand;
  const ledSuit = currentTrick[0]?.card?.suit;
  const followed = hand.filter((card) => card.suit === ledSuit);
  return followed.length ? followed : hand;
}

function trickPlayCard(hand, trick, trump = null) {
  const legal = legalFollowCards(hand, trick, trump);
  if (!legal.length) return null;
  if (!trick?.length) return lowest(legal);

  const ledSuit = trick[0]?.card?.suit;
  const trumpCards = trump ? legal.filter((card) => card.suit === trump) : [];
  const currentWinningValue = (() => {
    let winner = trick[0];
    for (const play of trick.slice(1)) {
      const a = winner.card;
      const b = play.card;
      const aTrump = trump && a.suit === trump;
      const bTrump = trump && b.suit === trump;
      if (bTrump && !aTrump) winner = play;
      else if (bTrump && aTrump && rankValue(b) > rankValue(a)) winner = play;
      else if (!aTrump && !bTrump && b.suit === ledSuit && a.suit !== ledSuit)
        winner = play;
      else if (
        !aTrump &&
        !bTrump &&
        a.suit === b.suit &&
        rankValue(b) > rankValue(a)
      )
        winner = play;
    }
    return winner?.card ? rankValue(winner.card) : 0;
  })();

  if (trumpCards.length && trick.some((play) => play.card?.suit === trump)) {
    const winningTrump = trumpCards.filter(
      (card) => rankValue(card) > currentWinningValue,
    );
    return lowest(winningTrump) || lowest(legal);
  }

  return (
    lowest(legal.filter((card) => rankValue(card) > currentWinningValue)) ||
    lowest(legal)
  );
}

function countBy(cards, key) {
  return (cards || []).reduce((map, card) => {
    const value = card?.[key];
    if (value !== undefined) map.set(value, (map.get(value) || 0) + 1);
    return map;
  }, new Map());
}

function estimateTricks(cards, trump) {
  let estimate = 0;
  for (const card of cards || []) {
    const value = rankValue(card);
    if (card.suit === trump) {
      if (value >= 13) estimate += 0.9;
      else if (value >= 11) estimate += 0.6;
      else estimate += 0.15;
    } else if (value === 14) estimate += 0.8;
    else if (value === 13) estimate += 0.45;
  }
  return Math.max(0, Math.min(cards?.length || 0, Math.round(estimate)));
}

function kachufulDecision(state, playerId) {
  const cards = state?.yourCards || [];
  if (state?.status === "game-complete") return null;
  if (state?.status === "round-complete") {
    return state?.allBidsSubmitted !== undefined
      ? {
          event: "kachuful:next-round",
          payload: { roomCode: state.roomCode, userId: playerId },
        }
      : null;
  }
  if (state?.status === "bidding") {
    const me = state.players?.find((player) => player.id === playerId);
    if (me && me.bid == null) {
      return {
        event: "kachuful:bid",
        payload: {
          roomCode: state.roomCode,
          userId: playerId,
          bid: estimateTricks(cards, state.trump?.suit),
        },
      };
    }
    return null;
  }
  if (state?.status !== "playing" || state.currentPlayerId !== playerId)
    return null;
  const card = trickPlayCard(cards, state.currentTrick, state.trump?.suit);
  return card
    ? {
        event: "kachuful:play-card",
        payload: {
          roomCode: state.roomCode,
          userId: playerId,
          cardId: card.id,
        },
      }
    : null;
}

function teenPattiDecision(state, playerId) {
  if (!state) return null;
  if (state.status === "round-complete") {
    return {
      event: "teen-patti:action",
      payload: {
        roomCode: state.roomCode,
        userId: playerId,
        action: "next-round",
      },
    };
  }
  if (state.status !== "playing" || state.currentPlayerId !== playerId)
    return null;
  const me = state.players?.find((player) => player.id === playerId);
  if (me?.status !== "active") return null;
  const cards = state.cards || [];
  // Fold only a weak high-card hand; continue on pairs or better.
  const values = cards.map(rankValue).sort((a, b) => b - a);
  const pair =
    values.length >= 2 &&
    values.some((value, index) => values.indexOf(value) !== index);
  const action =
    pair || values[0] >= 13 || Math.random() < 0.45 ? "play" : "fold";
  return {
    event: "teen-patti:action",
    payload: { roomCode: state.roomCode, userId: playerId, action },
  };
}

function rummyDiscardCard(cards) {
  const rankCounts = countBy(cards, "rank");
  const suitRankKeys = new Set(
    (cards || []).map((card) => `${card.suit}:${rankValue(card)}`),
  );
  const candidates = [...(cards || [])].filter((card) => !card.printedJoker);
  candidates.sort((a, b) => {
    const supportA =
      (rankCounts.get(a.rank) || 0) * 5 +
      (suitRankKeys.has(`${a.suit}:${rankValue(a) - 1}`) ? 3 : 0) +
      (suitRankKeys.has(`${a.suit}:${rankValue(a) + 1}`) ? 3 : 0);
    const supportB =
      (rankCounts.get(b.rank) || 0) * 5 +
      (suitRankKeys.has(`${b.suit}:${rankValue(b) - 1}`) ? 3 : 0) +
      (suitRankKeys.has(`${b.suit}:${rankValue(b) + 1}`) ? 3 : 0);
    return supportA - supportB || rankValue(b) - rankValue(a);
  });
  return candidates[0] || lowest(cards);
}

function indianRummyDecision(state, playerId) {
  const you = state?.you;
  if (!you || state.status !== "playing" || state.currentPlayerId !== playerId)
    return null;
  if (!you.hasDrawn) {
    const discard = state.discardTop;
    const takeDiscard =
      discard &&
      you.cards.some(
        (card) =>
          card.rank === discard.rank ||
          (card.suit === discard.suit &&
            Math.abs(rankValue(card) - rankValue(discard)) === 1),
      );
    return {
      event: "indian-rummy:action",
      payload: {
        roomCode: state.roomCode,
        userId: playerId,
        action: takeDiscard ? "draw-discard" : "draw-closed",
      },
    };
  }

  const cards = you.cards || [];
  for (const candidate of cards) {
    const remaining = cards.filter((card) => card.id !== candidate.id);
    const declaration = validateDeclaration(remaining, state.wildJoker);
    if (declaration.valid) {
      return {
        event: "indian-rummy:action",
        payload: {
          roomCode: state.roomCode,
          userId: playerId,
          action: "declare",
          cardId: candidate.id,
        },
      };
    }
  }

  const discard = rummyDiscardCard(cards);
  return {
    event: "indian-rummy:action",
    payload: {
      roomCode: state.roomCode,
      userId: playerId,
      action: "discard",
      cardId: discard?.id,
    },
  };
}

function mangooseDecision(state, playerId) {
  if (!state || state.status === "complete") return null;
  if (state.canCallMongoose && state.pendingMongoose && Math.random() < 0.4) {
    return {
      event: "mangoose:action",
      payload: {
        roomCode: state.roomCode,
        userId: playerId,
        action: "call-mongoose",
      },
    };
  }
  if (state.currentPlayerId !== playerId || !state.legalActions?.length)
    return null;
  const legal = state.legalActions;
  if (legal.includes("play-open") && state.openTargets) {
    const target =
      state.openTargets.center?.[0] || state.openTargets.opponents?.[0];
    if (target) {
      return {
        event: "mangoose:action",
        payload: {
          roomCode: state.roomCode,
          userId: playerId,
          action: "play-open",
          target,
        },
      };
    }
  }
  if (legal.includes("flip"))
    return {
      event: "mangoose:action",
      payload: { roomCode: state.roomCode, userId: playerId, action: "flip" },
    };
  if (legal.includes("play-center") && state.legalTargets?.center?.length) {
    return {
      event: "mangoose:action",
      payload: {
        roomCode: state.roomCode,
        userId: playerId,
        action: "play-center",
        target: state.legalTargets.center[0],
      },
    };
  }
  if (
    legal.includes("play-opponent") &&
    state.legalTargets?.opponents?.length
  ) {
    return {
      event: "mangoose:action",
      payload: {
        roomCode: state.roomCode,
        userId: playerId,
        action: "play-opponent",
        target: state.legalTargets.opponents[0],
      },
    };
  }
  if (legal.includes("play-own"))
    return {
      event: "mangoose:action",
      payload: {
        roomCode: state.roomCode,
        userId: playerId,
        action: "play-own",
      },
    };
  return null;
}

function unoDecision(state, playerId) {
  if (!state) return null;
  if (state.status === "round-complete") {
    // The current engine allows only seat 0 to start the next round; the bot room manager
    // keeps seat 0 available for bots when the platform requires automatic progression.
    const me = state.players?.find((player) => player.id === playerId);
    if (me?.seat === 0)
      return {
        event: "uno:action",
        payload: {
          roomCode: state.roomCode,
          userId: playerId,
          action: "next-round",
        },
      };
    return null;
  }
  if (
    state.pendingUno &&
    state.pendingUno.playerId !== playerId &&
    state.canCallUno
  ) {
    return {
      event: "uno:action",
      payload: {
        roomCode: state.roomCode,
        userId: playerId,
        action: "call-uno",
      },
    };
  }
  if (state.currentPlayerId !== playerId || !state.legalActions?.length)
    return null;
  if (
    state.legalActions.includes("choose-color") &&
    state.pendingColorChoice?.playerId === playerId
  ) {
    const cards = state.hand || [];
    const counts = countBy(cards, "color");
    const best = ["red", "yellow", "green", "blue"].sort(
      (a, b) => (counts.get(b) || 0) - (counts.get(a) || 0),
    )[0];
    return {
      event: "uno:action",
      payload: {
        roomCode: state.roomCode,
        userId: playerId,
        action: "choose-color",
        payload: { color: best },
      },
    };
  }
  if (state.hand?.length === 1 && state.legalActions.includes("uno")) {
    return {
      event: "uno:action",
      payload: { roomCode: state.roomCode, userId: playerId, action: "uno" },
    };
  }
  const playable = (state.playableCardIds || [])
    .map((id) => state.hand?.find((card) => card.id === id))
    .filter(Boolean);
  if (playable.length && state.legalActions.includes("play-card")) {
    playable.sort((a, b) => {
      const scoreA =
        a.type === "wild-draw-four"
          ? 100
          : a.type === "draw-two"
            ? 70
            : a.type === "skip" || a.type === "reverse"
              ? 50
              : Number(a.value) || 0;
      const scoreB =
        b.type === "wild-draw-four"
          ? 100
          : b.type === "draw-two"
            ? 70
            : b.type === "skip" || b.type === "reverse"
              ? 50
              : Number(b.value) || 0;
      return state.hand?.length <= 3 ? scoreB - scoreA : scoreA - scoreB;
    });
    return {
      event: "uno:action",
      payload: {
        roomCode: state.roomCode,
        userId: playerId,
        action: "play-card",
        payload: { cardId: playable[0].id },
      },
    };
  }
  if (state.legalActions.includes("draw-card"))
    return {
      event: "uno:action",
      payload: {
        roomCode: state.roomCode,
        userId: playerId,
        action: "draw-card",
      },
    };
  return null;
}

function jackThiefDecision(state, playerId) {
  if (
    !state ||
    state.status === "complete" ||
    !state.legalActions?.includes("draw-card")
  )
    return null;
  if (state.currentPlayerId !== playerId || !state.targetPlayerId) return null;
  const target = state.players?.find(
    (player) => player.id === state.targetPlayerId,
  );
  if (!target || target.cardCount < 1) return null;
  const cardIndex = Math.floor((target.cardCount - 1) / 2);
  return {
    event: "jack-thief:draw",
    payload: {
      roomCode: state.roomCode,
      userId: playerId,
      targetPlayerId: target.id,
      cardIndex,
    },
  };
}

function napoleonBidScore(cards) {
  let score = 0;
  const suitCounts = countBy(cards, "suit");
  for (const card of cards || []) {
    const value = rankValue(card);
    if (value === 14) score += 1.8;
    else if (value === 13) score += 1;
    else if (value === 12) score += 0.7;
    if ((suitCounts.get(card.suit) || 0) >= 4) score += 0.25;
  }
  return score;
}

function napoleonDecision(state, playerId) {
  if (!state || state.status === "game-complete") return null;
  const me = state.players?.find((player) => player.id === playerId);
  if (!me) return null;
  if (state.phase === "round-complete") {
    return {
      event: "napoleon:next-round",
      payload: { roomCode: state.roomCode, userId: playerId },
    };
  }
  if (state.currentPlayerId !== playerId) return null;
  if (state.phase === "bidding") {
    const cards = state.yourCards || [];
    const strength = napoleonBidScore(cards);
    const suitCounts = countBy(cards, "suit");
    const preferredSuits = ["spades", "hearts", "diamonds", "clubs"].sort(
      (a, b) => (suitCounts.get(b) || 0) - (suitCounts.get(a) || 0),
    );
    const preferredSuit = preferredSuits[0] || "clubs";
    const desiredAmount = Math.max(
      11,
      Math.min(20, 11 + Math.round(Math.max(0, strength - 3))),
    );
    const currentBid = state.currentBid;

    if (!currentBid) {
      return {
        event: "napoleon:bid",
        payload: {
          roomCode: state.roomCode,
          userId: playerId,
          bid: { amount: desiredAmount, suit: preferredSuit },
        },
      };
    }

    const suitRank = { clubs: 0, diamonds: 1, hearts: 2, spades: 3 };
    if (
      desiredAmount < currentBid.amount ||
      (desiredAmount === currentBid.amount &&
        suitRank[preferredSuit] <= suitRank[currentBid.suit])
    ) {
      if (currentBid.amount >= 20) {
        return {
          event: "napoleon:bid",
          payload: { roomCode: state.roomCode, userId: playerId, bid: "pass" },
        };
      }
      const raise = Math.min(20, currentBid.amount + 1);
      return {
        event: "napoleon:bid",
        payload: {
          roomCode: state.roomCode,
          userId: playerId,
          bid: { amount: raise, suit: preferredSuit },
        },
      };
    }

    const amount = Math.max(currentBid.amount, desiredAmount);
    if (
      amount === currentBid.amount &&
      suitRank[preferredSuit] > suitRank[currentBid.suit]
    ) {
      return {
        event: "napoleon:bid",
        payload: {
          roomCode: state.roomCode,
          userId: playerId,
          bid: { amount, suit: preferredSuit },
        },
      };
    }

    return {
      event: "napoleon:bid",
      payload: {
        roomCode: state.roomCode,
        userId: playerId,
        bid: {
          amount: Math.min(20, Math.max(currentBid.amount + 1, amount)),
          suit: preferredSuit,
        },
      },
    };
  }
  if (state.phase === "contract" && state.napoleonId === playerId) {
    const cards = state.yourCards || [];
    const allSuits = ["spades", "hearts", "diamonds", "clubs"];
    // A called card outside our hand gives a chance of an unseen partner without using hidden information.
    const card =
      chooseRandom(
        allSuits
          .flatMap((suit) =>
            ["2", "7", "10", "A"].map((rank) => ({ rank, suit })),
          )
          .filter(
            (candidateCard) =>
              !cards.some(
                (owned) =>
                  owned.rank === candidateCard.rank &&
                  owned.suit === candidateCard.suit,
              ),
          ),
      ) || cards[0];
    return {
      event: "napoleon:call-partner",
      payload: { roomCode: state.roomCode, userId: playerId, card },
    };
  }
  if (state.phase === "blind" && state.napoleonId === playerId) {
    const cards = [...(state.yourCards || [])].sort(
      (a, b) => rankValue(a) - rankValue(b),
    );
    return {
      event: "napoleon:discard",
      payload: {
        roomCode: state.roomCode,
        userId: playerId,
        cardIds: cards.slice(0, 2).map((card) => card.id),
      },
    };
  }
  if (state.phase === "playing") {
    const card = trickPlayCard(
      state.yourCards || [],
      state.currentTrick,
      state.trump?.suit,
    );
    return card
      ? {
          event: "napoleon:play-card",
          payload: {
            roomCode: state.roomCode,
            userId: playerId,
            cardId: card.id,
          },
        }
      : null;
  }
  return null;
}

function bridgeBidValue(options, hand) {
  if (!options?.length) return null;
  const strength = (hand || []).reduce(
    (sum, card) =>
      sum + (rankValue(card) >= 14 ? 2 : rankValue(card) >= 13 ? 1 : 0),
    0,
  );
  const suitCounts = countBy(hand || [], "suit");
  const ranked = [...options];
  ranked.sort((a, b) => {
    const score = (option) => {
      if (!option || option.type === "pass") return 0;
      let value = Number(option.level || 0) * 1.3;
      if (option.strain && option.strain !== "NT")
        value += (suitCounts.get(option.strain) || 0) * 0.8;
      value += strength * 0.55;
      return value;
    };
    return score(b) - score(a);
  });
  return ranked[0] || null;
}

function bridgeDecision(state, playerId) {
  if (!state) return null;
  if (state.phase === "auction") {
    const current = state.players?.find((player) => player.id === playerId);
    if (current?.seat !== state.currentSeat || !state.legalBidOptions?.length)
      return null;
    const choice = bridgeBidValue(
      state.legalBidOptions,
      state.players?.find((player) => player.id === playerId)?.hand || [],
    );
    return choice
      ? {
          event: "bridge:bid",
          payload: {
            roomCode: state.roomCode,
            userId: playerId,
            action: choice,
          },
        }
      : null;
  }
  if (state.phase === "opening-lead" && state.turnActorId === playerId) {
    const me = state.players?.find((player) => player.id === playerId);
    const card = lowest(me?.hand || []);
    return card
      ? {
          event: "bridge:play-card",
          payload: {
            roomCode: state.roomCode,
            userId: playerId,
            cardId: card.id,
          },
        }
      : null;
  }
  if (state.phase === "trick-play" && state.turnActorId === playerId) {
    const contract = state.contract;
    const currentSeat = state.currentSeat;
    const sourcePlayer = state.players?.find(
      (player) => player.seat === currentSeat,
    );
    const isDummy = contract?.dummyId === sourcePlayer?.id;
    const hand =
      isDummy && state.dummyRevealed
        ? sourcePlayer?.hand || []
        : state.players?.find((player) => player.id === playerId)?.hand || [];
    const card = trickPlayCard(
      hand,
      state.trick,
      contract?.strain === "NT" ? null : contract?.strain,
    );
    if (!card) return null;
    return {
      event: "bridge:play-card",
      payload: {
        roomCode: state.roomCode,
        userId: playerId,
        cardId: card.id,
        ...(isDummy ? { sourceSeat: currentSeat } : {}),
      },
    };
  }
  if (state.phase === "deal-complete") {
    const me = state.players?.find((player) => player.id === playerId);
    if (me?.seat === state.dealer) {
      return {
        event: "bridge:next-deal",
        payload: { roomCode: state.roomCode, userId: playerId },
      };
    }
  }
  return null;
}

function spadesBid(state) {
  const hand = state.hand || [];
  const spades = hand.filter(
    (card) => String(card.suit).toLowerCase() === "spades",
  ).length;
  const high = hand.filter((card) => rankValue(card) >= 14).length;
  return Math.max(0, Math.min(13, Math.round(spades * 0.65 + high * 0.6)));
}

function spadesDecision(state, playerId) {
  if (!state) return null;
  if (
    state.phase === "bidding" &&
    state.turnActorId === playerId &&
    state.bidOptions?.length
  ) {
    const bid = spadesBid(state);
    return {
      event: "spades:bid",
      payload: { roomCode: state.roomCode, userId: playerId, bid },
    };
  }
  if (state.phase === "playing" && state.turnActorId === playerId) {
    const legal = (state.legalCardIds || [])
      .map((id) => state.hand?.find((card) => card.id === id))
      .filter(Boolean);
    const card = trickPlayCard(legal, state.trick, "spades");
    return card
      ? {
          event: "spades:play-card",
          payload: {
            roomCode: state.roomCode,
            userId: playerId,
            cardId: card.id,
          },
        }
      : null;
  }
  if (state.phase === "hand-complete" && state.canStartNextHand) {
    return {
      event: "spades:next-hand",
      payload: { roomCode: state.roomCode, userId: playerId },
    };
  }
  return null;
}

function twentyNineBid(state) {
  const hand = state.myHand || [];
  let value = 16;
  value += hand.filter((card) => rankValue(card) >= 14).length * 1.1;
  value +=
    hand.filter((card) => Number(card.pointValue || card.value) >= 3).length *
    0.35;
  return Math.max(16, Math.min(28, Math.round(value)));
}

function twentyNineDecision(state, playerId) {
  if (!state) return null;
  if (state.phase === "bidding" && state.isMyTurn && state.legalBids?.length) {
    const desired = twentyNineBid(state);
    const legal = state.legalBids.filter((bid) => bid !== "pass");
    const valid = legal.filter((bid) => Number(bid) <= desired);
    const bid = valid.length ? Math.max(...valid.map(Number)) : "pass";
    return {
      event: "twenty-nine:bid",
      payload: { roomCode: state.roomCode, userId: playerId, bid },
    };
  }
  if (state.phase === "trump-selection" && state.canSelectTrump) {
    const counts = countBy(state.myHand || [], "suit");
    const suit =
      SUIT_ORDER.slice(4).sort(
        (a, b) => (counts.get(b) || 0) - (counts.get(a) || 0),
      )[0] || "S";
    return {
      event: "twenty-nine:trump",
      payload: { roomCode: state.roomCode, userId: playerId, suit },
    };
  }
  if (state.phase === "trick-play" && state.isMyTurn) {
    const legal = (state.legalCardIds || [])
      .map((id) => state.myHand?.find((card) => card.id === id))
      .filter(Boolean);
    const card = trickPlayCard(
      legal,
      state.trick,
      state.knownTrump?.suit || state.trump?.suit,
    );
    return card
      ? {
          event: "twenty-nine:play-card",
          payload: {
            roomCode: state.roomCode,
            userId: playerId,
            cardId: card.id,
          },
        }
      : null;
  }
  if (state.phase === "hand-complete" && state.isDealer) {
    return {
      event: "twenty-nine:next-hand",
      payload: { roomCode: state.roomCode, userId: playerId },
    };
  }
  return null;
}

function mindiDecision(state, playerId) {
  if (!state) return null;
  if (state.phase === "trump-select" && state.canSelectTrump) {
    // The server deliberately hides the real card identity in this phase.
    const hidden = (state.hand || []).find((card) => card?.hidden);
    return hidden
      ? {
          event: "mindi-coat:trump-select",
          payload: {
            roomCode: state.roomCode,
            userId: playerId,
            cardId: hidden.id,
          },
        }
      : null;
  }
  if (state.phase === "trick-play" && state.turnActorId === playerId) {
    if (state.canOpenHukum) {
      return {
        event: "mindi-coat:open-hukum",
        payload: { roomCode: state.roomCode, userId: playerId },
      };
    }
    const legal = (state.legalCardIds || [])
      .map((id) => state.hand?.find((card) => card.id === id))
      .filter(Boolean);
    const card = lowest(legal);
    return card
      ? {
          event: "mindi-coat:play-card",
          payload: {
            roomCode: state.roomCode,
            userId: playerId,
            cardId: card.id,
          },
        }
      : null;
  }
  if (state.phase === "hand-complete" && state.canStartNextHand) {
    return {
      event: "mindi-coat:next-hand",
      payload: { roomCode: state.roomCode, userId: playerId },
    };
  }
  return null;
}

function bluffDecision(state, playerId) {
  if (!state || state.status === "complete") return null;
  if (state.canChallenge && state.currentClaim) {
    const myCards = state.hand || [];
    const matching = myCards.filter(
      (card) => card.rank === state.currentClaim.rank,
    ).length;
    const riskyClaim =
      state.currentClaim.count >= 3 ||
      (matching === 0 && state.currentClaim.count >= 2);
    if (riskyClaim && Math.random() < 0.65)
      return {
        event: "bluff:challenge",
        payload: { roomCode: state.roomCode, userId: playerId },
      };
  }
  if (
    !state.canPlay ||
    state.currentPlayerId !== playerId ||
    !state.selectableCardIds?.length
  )
    return null;
  const cards = state.selectableCardIds
    .map((id) => state.hand?.find((card) => card.id === id))
    .filter(Boolean);
  const nextRank = state.requiredRank;
  const truthful = cards.filter((card) => card.rank === nextRank);
  const count = Math.min(3, Math.max(1, truthful.length || 1));
  const selected = truthful.length ? truthful.slice(0, count) : [lowest(cards)];
  return {
    event: "bluff:play-cards",
    payload: {
      roomCode: state.roomCode,
      userId: playerId,
      cardIds: selected.filter(Boolean).map((card) => card.id),
    },
  };
}

function sattePeSattaDecision(state, playerId) {
  if (
    !state ||
    state.status === "complete" ||
    state.currentPlayerId !== playerId
  )
    return null;
  const legal = (state.me?.legalMoves || [])
    .map((id) => state.me.hand?.find((card) => card.id === id))
    .filter(Boolean);
  if (legal.length) {
    legal.sort((a, b) => {
      const distanceA = Math.abs(rankValue(a) - 7);
      const distanceB = Math.abs(rankValue(b) - 7);
      return distanceA - distanceB || rankValue(a) - rankValue(b);
    });
    return {
      event: "satte-pe-satta:play-card",
      payload: {
        roomCode: state.roomCode,
        userId: playerId,
        cardId: legal[0].id,
      },
    };
  }
  return {
    event: "satte-pe-satta:pass",
    payload: { roomCode: state.roomCode, userId: playerId },
  };
}

const STRATEGIES = Object.freeze({
  kachuful: kachufulDecision,
  "teen-patti": teenPattiDecision,
  "indian-rummy": indianRummyDecision,
  mangoose: mangooseDecision,
  uno: unoDecision,
  "jack-thief": jackThiefDecision,
  napoleon: napoleonDecision,
  bridge: bridgeDecision,
  spades: spadesDecision,
  "twenty-nine": twentyNineDecision,
  "mindi-coat": mindiDecision,
  bluff: bluffDecision,
  "satte-pe-satta": sattePeSattaDecision,
  war: () => null,
});

export function decideBotAction(gameId, state, playerId) {
  const strategy = STRATEGIES[gameId];
  if (!strategy) return null;
  return strategy(state, playerId);
}
