-- CreateEnum
CREATE TYPE "Position" AS ENUM ('GK', 'DEF', 'MID', 'FWD');

-- CreateEnum
CREATE TYPE "ScoringType" AS ENUM ('CLASSIC', 'HEAD_TO_HEAD');

-- CreateEnum
CREATE TYPE "LeagueType" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "TradeMode" AS ENUM ('NONE', 'ALL', 'ADMIN_APPROVAL', 'MANAGER_APPROVAL');

-- CreateEnum
CREATE TYPE "LeagueStatus" AS ENUM ('PENDING', 'DRAFT_SCHEDULED', 'DRAFTING', 'ACTIVE', 'COMPLETE');

-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('OWNED', 'AVAILABLE', 'LOCKED');

-- CreateEnum
CREATE TYPE "GameweekStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETE');

-- CreateEnum
CREATE TYPE "RoundName" AS ENUM ('GROUP_MD1', 'GROUP_MD2', 'GROUP_MD3', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTERFINAL', 'SEMIFINAL', 'THIRD_PLACE_FINAL');

-- CreateEnum
CREATE TYPE "WaiverStatus" AS ENUM ('PENDING', 'PROCESSED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('PROPOSED', 'WITHDRAWN', 'REJECTED', 'ACCEPTED', 'INVALID', 'VETOED', 'EXPIRED', 'PROCESSED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AcquisitionType" AS ENUM ('DRAFT', 'WAIVER', 'FREE_AGENCY', 'TRADE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "supabaseId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leagues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LeagueType" NOT NULL,
    "scoringType" "ScoringType" NOT NULL,
    "status" "LeagueStatus" NOT NULL DEFAULT 'PENDING',
    "tradeMode" "TradeMode" NOT NULL DEFAULT 'ALL',
    "maxTeams" INTEGER NOT NULL DEFAULT 8,
    "minTeams" INTEGER NOT NULL DEFAULT 2,
    "pickTimerSeconds" INTEGER NOT NULL DEFAULT 90,
    "inviteCode" TEXT,
    "adminId" TEXT NOT NULL,
    "pushbackCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "draftPosition" INTEGER,
    "waiverPosition" INTEGER,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "h2hPoints" INTEGER NOT NULL DEFAULT 0,
    "h2hWins" INTEGER NOT NULL DEFAULT 0,
    "h2hDraws" INTEGER NOT NULL DEFAULT 0,
    "h2hLosses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "national_teams" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group" TEXT,
    "flagUrl" TEXT,
    "eliminated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "national_teams_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "apiFootballId" INTEGER,
    "name" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "position" "Position" NOT NULL,
    "clubTeam" TEXT,
    "imageUrl" TEXT,
    "status" "PlayerStatus" NOT NULL DEFAULT 'AVAILABLE',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gameweeks" (
    "id" TEXT NOT NULL,
    "round" "RoundName" NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "waiverDeadline" TIMESTAMP(3) NOT NULL,
    "status" "GameweekStatus" NOT NULL DEFAULT 'UPCOMING',

    CONSTRAINT "gameweeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "gameweekId" TEXT NOT NULL,
    "homeTeamCode" TEXT NOT NULL,
    "awayTeamCode" TEXT NOT NULL,
    "kickoffTime" TIMESTAMP(3) NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "apiMatchId" INTEGER,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_match_stats" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "minutesPlayed" INTEGER NOT NULL DEFAULT 0,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "yellowCards" INTEGER NOT NULL DEFAULT 0,
    "redCards" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "cleanSheet" BOOLEAN NOT NULL DEFAULT false,
    "penaltySaves" INTEGER NOT NULL DEFAULT 0,
    "penaltyMisses" INTEGER NOT NULL DEFAULT 0,
    "ownGoals" INTEGER NOT NULL DEFAULT 0,
    "goalsConceded" INTEGER NOT NULL DEFAULT 0,
    "clearances" INTEGER NOT NULL DEFAULT 0,
    "blocks" INTEGER NOT NULL DEFAULT 0,
    "interceptions" INTEGER NOT NULL DEFAULT 0,
    "tackles" INTEGER NOT NULL DEFAULT 0,
    "recoveries" INTEGER NOT NULL DEFAULT 0,
    "bonusPoints" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "bpsScore" INTEGER NOT NULL DEFAULT 0,
    "isFinalized" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "player_match_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drafts" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "DraftStatus" NOT NULL DEFAULT 'SCHEDULED',
    "currentRound" INTEGER NOT NULL DEFAULT 1,
    "currentPick" INTEGER NOT NULL DEFAULT 0,
    "draftOrder" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_picks" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "pick" INTEGER NOT NULL,
    "pickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draft_picks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlists" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,

    CONSTRAINT "watchlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_players" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "acquisitionType" "AcquisitionType" NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "droppedAt" TIMESTAMP(3),

    CONSTRAINT "team_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gameweek_selections" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "gameweekId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "isStarting" BOOLEAN NOT NULL DEFAULT true,
    "benchPriority" INTEGER,

    CONSTRAINT "gameweek_selections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gameweek_scores" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "gameweekId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "isAverage" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "gameweek_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "h2h_matches" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "gameweekId" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "homePoints" INTEGER NOT NULL DEFAULT 0,
    "awayPoints" INTEGER NOT NULL DEFAULT 0,
    "homeH2HPts" INTEGER NOT NULL DEFAULT 0,
    "awayH2HPts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "h2h_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waiver_requests" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "gameweekId" TEXT NOT NULL,
    "playerInId" TEXT NOT NULL,
    "playerOutId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "status" "WaiverStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "waiver_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_offers" (
    "id" TEXT NOT NULL,
    "proposingTeamId" TEXT NOT NULL,
    "receivingTeamId" TEXT NOT NULL,
    "gameweekId" TEXT NOT NULL,
    "status" "TradeStatus" NOT NULL DEFAULT 'PROPOSED',
    "proposedById" TEXT NOT NULL,
    "vetoCount" INTEGER NOT NULL DEFAULT 0,
    "offeredPlayerIds" JSONB NOT NULL,
    "requestedPlayerIds" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "trade_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_supabaseId_key" ON "users"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "leagues_inviteCode_key" ON "leagues"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "teams_userId_leagueId_key" ON "teams"("userId", "leagueId");

-- CreateIndex
CREATE UNIQUE INDEX "players_apiFootballId_key" ON "players"("apiFootballId");

-- CreateIndex
CREATE UNIQUE INDEX "gameweeks_round_key" ON "gameweeks"("round");

-- CreateIndex
CREATE UNIQUE INDEX "matches_apiMatchId_key" ON "matches"("apiMatchId");

-- CreateIndex
CREATE UNIQUE INDEX "player_match_stats_playerId_matchId_key" ON "player_match_stats"("playerId", "matchId");

-- CreateIndex
CREATE UNIQUE INDEX "draft_picks_draftId_round_pick_key" ON "draft_picks"("draftId", "round", "pick");

-- CreateIndex
CREATE UNIQUE INDEX "watchlists_teamId_playerId_key" ON "watchlists"("teamId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "gameweek_selections_teamId_gameweekId_playerId_key" ON "gameweek_selections"("teamId", "gameweekId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "gameweek_scores_teamId_gameweekId_key" ON "gameweek_scores"("teamId", "gameweekId");

-- CreateIndex
CREATE UNIQUE INDEX "h2h_matches_leagueId_gameweekId_homeTeamId_awayTeamId_key" ON "h2h_matches"("leagueId", "gameweekId", "homeTeamId", "awayTeamId");

-- AddForeignKey
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "national_teams"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_gameweekId_fkey" FOREIGN KEY ("gameweekId") REFERENCES "gameweeks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_homeTeamCode_fkey" FOREIGN KEY ("homeTeamCode") REFERENCES "national_teams"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_awayTeamCode_fkey" FOREIGN KEY ("awayTeamCode") REFERENCES "national_teams"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_match_stats" ADD CONSTRAINT "player_match_stats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_match_stats" ADD CONSTRAINT "player_match_stats_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_picks" ADD CONSTRAINT "draft_picks_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "drafts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_picks" ADD CONSTRAINT "draft_picks_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_picks" ADD CONSTRAINT "draft_picks_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_players" ADD CONSTRAINT "team_players_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_players" ADD CONSTRAINT "team_players_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameweek_selections" ADD CONSTRAINT "gameweek_selections_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameweek_selections" ADD CONSTRAINT "gameweek_selections_gameweekId_fkey" FOREIGN KEY ("gameweekId") REFERENCES "gameweeks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameweek_selections" ADD CONSTRAINT "gameweek_selections_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameweek_scores" ADD CONSTRAINT "gameweek_scores_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameweek_scores" ADD CONSTRAINT "gameweek_scores_gameweekId_fkey" FOREIGN KEY ("gameweekId") REFERENCES "gameweeks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h2h_matches" ADD CONSTRAINT "h2h_matches_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h2h_matches" ADD CONSTRAINT "h2h_matches_gameweekId_fkey" FOREIGN KEY ("gameweekId") REFERENCES "gameweeks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h2h_matches" ADD CONSTRAINT "h2h_matches_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "h2h_matches" ADD CONSTRAINT "h2h_matches_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiver_requests" ADD CONSTRAINT "waiver_requests_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiver_requests" ADD CONSTRAINT "waiver_requests_gameweekId_fkey" FOREIGN KEY ("gameweekId") REFERENCES "gameweeks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiver_requests" ADD CONSTRAINT "waiver_requests_playerInId_fkey" FOREIGN KEY ("playerInId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiver_requests" ADD CONSTRAINT "waiver_requests_playerOutId_fkey" FOREIGN KEY ("playerOutId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_offers" ADD CONSTRAINT "trade_offers_proposingTeamId_fkey" FOREIGN KEY ("proposingTeamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_offers" ADD CONSTRAINT "trade_offers_receivingTeamId_fkey" FOREIGN KEY ("receivingTeamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_offers" ADD CONSTRAINT "trade_offers_gameweekId_fkey" FOREIGN KEY ("gameweekId") REFERENCES "gameweeks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_offers" ADD CONSTRAINT "trade_offers_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
