import { prisma } from "./prisma";
import { calculatePoints, calculateBPS } from "./scoring";
import { Position } from "@prisma/client";

/**
 * Fetches live stats from API-Football for a given match and upserts PlayerMatchStat records.
 * Called by the polling cron job during active match windows.
 */
export async function syncMatchStats(apiMatchId: number) {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) throw new Error("API_FOOTBALL_KEY not set");

  const res = await fetch(
    `${process.env.API_FOOTBALL_BASE_URL}/fixtures/players?fixture=${apiMatchId}`,
    { headers: { "x-apisports-key": apiKey } }
  );

  if (!res.ok) throw new Error(`API-Football error: ${res.status}`);
  const data = await res.json();

  const match = await prisma.match.findUnique({ where: { apiMatchId } });
  if (!match) return;

  for (const teamData of data.response ?? []) {
    for (const playerData of teamData.players ?? []) {
      const stats = playerData.statistics?.[0];
      if (!stats) continue;

      const apiPlayerId = playerData.player?.id;
      const player = await prisma.player.findUnique({
        where: { apiFootballId: apiPlayerId },
      });
      if (!player) continue;

      const minutesPlayed = stats.games?.minutes ?? 0;
      const goals = stats.goals?.total ?? 0;
      const assists = stats.goals?.assists ?? 0;
      const yellowCards = stats.cards?.yellow ?? 0;
      const redCards = stats.cards?.red ?? 0;
      const saves = stats.goalkeeper?.saves ?? 0;
      const penaltySaves = stats.penalty?.saved ?? 0;
      const penaltyMisses = stats.penalty?.missed ?? 0;
      const ownGoals = stats.goals?.owngoal ?? 0;
      const goalsConceded = stats.goals?.concedes ?? 0;
      const clearances = stats.tackles?.blocks ?? 0;
      const blocks = stats.tackles?.blocks ?? 0;
      const interceptions = stats.tackles?.interceptions ?? 0;
      const tackles = stats.tackles?.total ?? 0;
      const recoveries = stats.duels?.won ?? 0;

      // Determine clean sheet
      const homeScore = match.homeScore ?? 0;
      const awayScore = match.awayScore ?? 0;
      const isHomeTeam = teamData.team?.id === match.homeTeamCode;
      const goalsConcededByTeam = isHomeTeam ? awayScore : homeScore;
      const cleanSheet = goalsConcededByTeam === 0 && minutesPlayed >= 60;

      const statObj = {
        minutesPlayed,
        goals,
        assists,
        yellowCards,
        redCards,
        saves,
        penaltySaves,
        penaltyMisses,
        ownGoals,
        goalsConceded,
        clearances,
        blocks,
        interceptions,
        tackles,
        recoveries,
        cleanSheet,
        bonusPoints: 0,
        bpsScore: 0,
        totalPoints: 0,
      };

      const bps = calculateBPS(statObj, player.position as Position);
      const points = calculatePoints(statObj, player.position as Position);

      await prisma.playerMatchStat.upsert({
        where: { playerId_matchId: { playerId: player.id, matchId: match.id } },
        update: { ...statObj, bpsScore: bps, totalPoints: points },
        create: { playerId: player.id, matchId: match.id, ...statObj, bpsScore: bps, totalPoints: points },
      });
    }
  }

  // Award bonus points top 3 BPS per match
  await assignBonusPoints(match.id);
}

async function assignBonusPoints(matchId: string) {
  const stats = await prisma.playerMatchStat.findMany({
    where: { matchId },
    orderBy: { bpsScore: "desc" },
  });

  const bonusMap: Record<string, number> = {};
  if (stats[0]) bonusMap[stats[0].id] = 3;
  if (stats[1]) {
    // Handle ties at 1st
    bonusMap[stats[1].id] = stats[1].bpsScore === stats[0]?.bpsScore ? 3 : 2;
  }
  if (stats[2]) {
    const p1tied = stats[1]?.bpsScore === stats[0]?.bpsScore;
    const p2tied = stats[2].bpsScore === stats[1]?.bpsScore;
    bonusMap[stats[2].id] = p1tied ? 1 : p2tied ? 2 : 1;
  }
  if (stats[3] && stats[3].bpsScore === stats[2]?.bpsScore) {
    bonusMap[stats[3].id] = 1;
  }

  for (const [statId, bonus] of Object.entries(bonusMap)) {
    const stat = stats.find((s) => s.id === statId)!;
    const player = await prisma.player.findUnique({ where: { id: stat.playerId } });
    if (!player) continue;
    const newTotal = stat.totalPoints - stat.bonusPoints + bonus;
    await prisma.playerMatchStat.update({
      where: { id: statId },
      data: { bonusPoints: bonus, totalPoints: newTotal },
    });
  }
}

/**
 * Calculates and saves GameweekScore for all teams in all leagues for a given gameweek.
 * Applies auto-substitution rules before calculating.
 */
export async function finalizeGameweekScores(gameweekId: string) {
  const gw = await prisma.gameweek.findUnique({
    where: { id: gameweekId },
    include: { matches: { include: { playerStats: true } } },
  });
  if (!gw) return;

  const leagues = await prisma.league.findMany({ where: { status: "ACTIVE" } });

  for (const league of leagues) {
    const teams = await prisma.team.findMany({
      where: { leagueId: league.id },
      include: {
        gameweekSelections: {
          where: { gameweekId },
          include: { player: true },
        },
      },
    });

    for (const team of teams) {
      const starters = team.gameweekSelections.filter((s) => s.isStarting);
      const bench = team.gameweekSelections
        .filter((s) => !s.isStarting)
        .sort((a, b) => (a.benchPriority ?? 99) - (b.benchPriority ?? 99));

      // Determine which players actually played
      const playedSet = new Set<string>();
      for (const match of gw.matches) {
        for (const stat of match.playerStats) {
          if (stat.minutesPlayed > 0 || stat.yellowCards > 0 || stat.redCards > 0) {
            playedSet.add(stat.playerId);
          }
        }
      }

      // Auto-substitution
      const finalStarterIds = new Set(starters.map((s) => s.playerId));
      const usedBenchIds = new Set<string>();

      // GK sub
      const startingGK = starters.find((s) => s.player.position === "GK");
      if (startingGK && !playedSet.has(startingGK.playerId)) {
        const benchGK = bench.find(
          (b) => b.player.position === "GK" && playedSet.has(b.playerId) && !usedBenchIds.has(b.playerId)
        );
        if (benchGK) {
          finalStarterIds.delete(startingGK.playerId);
          finalStarterIds.add(benchGK.playerId);
          usedBenchIds.add(benchGK.playerId);
        }
      }

      // Outfield subs
      const nonPlayingOutfield = starters.filter(
        (s) => s.player.position !== "GK" && !playedSet.has(s.playerId)
      );

      for (const dnp of nonPlayingOutfield) {
        // Count current positions to enforce formation rules
        const currentStarters = starters.filter((s) => finalStarterIds.has(s.playerId));
        const posCount = currentStarters.reduce((acc, s) => {
          acc[s.player.position] = (acc[s.player.position] ?? 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const sub = bench.find((b) => {
          if (!playedSet.has(b.playerId)) return false;
          if (usedBenchIds.has(b.playerId)) return false;
          if (b.player.position === "GK") return false;

          // Check formation rules: can't drop below 3 DEF or 1 FWD
          const newPosCounts = { ...posCount };
          newPosCounts[dnp.player.position] = (newPosCounts[dnp.player.position] ?? 1) - 1;
          newPosCounts[b.player.position] = (newPosCounts[b.player.position] ?? 0) + 1;
          if ((newPosCounts["DEF"] ?? 0) < 3) return false;
          if ((newPosCounts["FWD"] ?? 0) < 1) return false;
          return true;
        });

        if (sub) {
          finalStarterIds.delete(dnp.playerId);
          finalStarterIds.add(sub.playerId);
          usedBenchIds.add(sub.playerId);
        }
      }

      // Calculate total points for final XI
      let totalPoints = 0;
      for (const playerId of finalStarterIds) {
        for (const match of gw.matches) {
          const stat = match.playerStats.find((s) => s.playerId === playerId);
          if (stat) totalPoints += stat.totalPoints;
        }
      }

      await prisma.gameweekScore.upsert({
        where: { teamId_gameweekId: { teamId: team.id, gameweekId } },
        update: { points: totalPoints },
        create: { teamId: team.id, gameweekId, points: totalPoints },
      });

      await prisma.team.update({
        where: { id: team.id },
        data: { totalPoints: { increment: totalPoints } },
      });
    }

    // H2H scoring
    if (league.scoringType === "HEAD_TO_HEAD") {
      const h2hMatches = await prisma.h2HMatch.findMany({
        where: { leagueId: league.id, gameweekId },
        include: {
          homeTeam: { include: { gameweekScores: { where: { gameweekId } } } },
          awayTeam: { include: { gameweekScores: { where: { gameweekId } } } },
        },
      });

      for (const match of h2hMatches) {
        const homePts = match.homeTeam.gameweekScores[0]?.points ?? 0;
        const awayPts = match.awayTeam.gameweekScores[0]?.points ?? 0;
        const homeH2H = homePts > awayPts ? 3 : homePts === awayPts ? 1 : 0;
        const awayH2H = awayPts > homePts ? 3 : homePts === awayPts ? 1 : 0;

        await prisma.h2HMatch.update({
          where: { id: match.id },
          data: { homePoints: homePts, awayPoints: awayPts, homeH2HPts: homeH2H, awayH2HPts: awayH2H },
        });

        await prisma.team.update({
          where: { id: match.homeTeamId },
          data: {
            h2hPoints: { increment: homeH2H },
            h2hWins: { increment: homeH2H === 3 ? 1 : 0 },
            h2hDraws: { increment: homeH2H === 1 ? 1 : 0 },
            h2hLosses: { increment: homeH2H === 0 ? 1 : 0 },
          },
        });
        await prisma.team.update({
          where: { id: match.awayTeamId },
          data: {
            h2hPoints: { increment: awayH2H },
            h2hWins: { increment: awayH2H === 3 ? 1 : 0 },
            h2hDraws: { increment: awayH2H === 1 ? 1 : 0 },
            h2hLosses: { increment: awayH2H === 0 ? 1 : 0 },
          },
        });
      }
    }
  }

  await prisma.gameweek.update({ where: { id: gameweekId }, data: { status: "COMPLETE" } });
}
