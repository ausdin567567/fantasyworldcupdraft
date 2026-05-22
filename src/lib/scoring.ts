import type { Position, PlayerMatchStat } from "@prisma/client";

export function calculatePoints(
  stat: Omit<PlayerMatchStat, "id" | "playerId" | "matchId" | "totalPoints" | "bpsScore" | "isFinalized">,
  position: Position
): number {
  let points = 0;

  // Playing time
  if (stat.minutesPlayed >= 60) points += 2;
  else if (stat.minutesPlayed > 0) points += 1;

  // Goals
  const goalPoints: Record<Position, number> = { GK: 10, DEF: 6, MID: 5, FWD: 4 };
  points += stat.goals * goalPoints[position];

  // Assists
  points += stat.assists * 3;

  // Clean sheet (requires 60+ mins)
  if (stat.cleanSheet && stat.minutesPlayed >= 60) {
    if (position === "GK" || position === "DEF") points += 4;
    else if (position === "MID") points += 1;
  }

  // GK saves
  points += Math.floor(stat.saves / 3);

  // Defensive contribution
  if (position === "DEF") {
    const cbiTackles = stat.clearances + stat.blocks + stat.interceptions + stat.tackles;
    if (cbiTackles >= 10) points += 2;
  } else if (position === "MID" || position === "FWD") {
    const cbiTacklesRec = stat.clearances + stat.blocks + stat.interceptions + stat.tackles + stat.recoveries;
    if (cbiTacklesRec >= 12) points += 2;
  }

  // Penalty save / miss
  points += stat.penaltySaves * 5;
  points += stat.penaltyMisses * -2;

  // Goals conceded (GK/DEF)
  if (position === "GK" || position === "DEF") {
    points += Math.floor(stat.goalsConceded / 2) * -1;
  }

  // Cards
  points += stat.yellowCards * -1;
  // Red card includes yellow card deduction
  if (stat.redCards > 0) points += -3;

  // Own goals
  points += stat.ownGoals * -2;

  // Bonus
  points += stat.bonusPoints;

  return points;
}

export function calculateBPS(
  stat: Omit<PlayerMatchStat, "id" | "playerId" | "matchId" | "totalPoints" | "bpsScore" | "isFinalized">,
  position: Position,
  passCompletionPct?: number,
  passesAttempted?: number,
  extraStats?: {
    openPlayCrosses?: number;
    bigChancesCreated?: number;
    goalLineClrances?: number;
    foulsWon?: number;
    shotsOnTarget?: number;
    successfulDribbles?: number;
    keyPasses?: number;
    errorLeadingToGoal?: number;
    errorLeadingToAttempt?: number;
    beingTackled?: number;
    foulsCommitted?: number;
    offsides?: number;
    shotsOffTarget?: number;
    bigChancesMissed?: number;
    penaltyConceded?: number;
    scoredWinningGoal?: boolean;
  }
): number {
  let bps = 0;
  const e = extraStats ?? {};

  // Playing time
  if (stat.minutesPlayed > 60) bps += 6;
  else if (stat.minutesPlayed >= 1) bps += 3;

  // Goals
  if (position === "GK" || position === "DEF") {
    bps += stat.goals * 12;
  } else if (position === "MID") {
    bps += stat.goals * 18; // non-penalty; penalty goals = 12
  } else {
    bps += stat.goals * 24;
  }

  bps += stat.assists * 9;

  if (stat.cleanSheet && (position === "GK" || position === "DEF")) bps += 12;
  if (stat.penaltySaves > 0) bps += stat.penaltySaves * 8;

  // Save points
  // (saves inside/outside box tracked separately via extra stats if available)

  // Defensive contribution (1 per 2 CBI)
  const cbi = stat.clearances + stat.blocks + stat.interceptions;
  bps += Math.floor(cbi / 2);

  // Recoveries (1 per 3)
  bps += Math.floor(stat.recoveries / 3);

  bps += (e.keyPasses ?? 0) * 1;
  bps += (e.successfulDribbles ?? 0) * 1;
  bps += (e.openPlayCrosses ?? 0) * 1;
  bps += (e.bigChancesCreated ?? 0) * 3;
  bps += (e.foulsWon ?? 0) * 1;
  bps += (e.shotsOnTarget ?? 0) * 2;
  bps += (e.goalLineClrances ?? 0) * 9;
  if (e.scoredWinningGoal) bps += 3;

  // Pass completion
  if (passesAttempted && passesAttempted >= 30 && passCompletionPct) {
    if (passCompletionPct >= 90) bps += 6;
    else if (passCompletionPct >= 80) bps += 4;
    else if (passCompletionPct >= 70) bps += 2;
  }

  // Negatives
  if (position === "GK" || position === "DEF") bps += stat.goalsConceded * -4;
  bps += (e.penaltyConceded ?? 0) * -3;
  bps += stat.penaltyMisses * -6;
  bps += stat.yellowCards * -3;
  bps += stat.redCards * -9;
  bps += stat.ownGoals * -6;
  bps += (e.bigChancesMissed ?? 0) * -3;
  bps += (e.errorLeadingToGoal ?? 0) * -3;
  bps += (e.errorLeadingToAttempt ?? 0) * -1;
  bps += (e.beingTackled ?? 0) * -1;
  bps += (e.foulsCommitted ?? 0) * -1;
  bps += (e.offsides ?? 0) * -1;
  bps += (e.shotsOffTarget ?? 0) * -1;

  return bps;
}
