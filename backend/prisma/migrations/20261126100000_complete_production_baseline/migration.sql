-- AlterTable
ALTER TABLE "CampusAnnouncement" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isOfficial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "postType" TEXT NOT NULL DEFAULT 'POST',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "relatedEntityId" TEXT;

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "moodUpdatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "UserSession" ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedPost" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampusEvent" (
    "id" TEXT NOT NULL,
    "collegeName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Workshop',
    "eventDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "organizer" TEXT NOT NULL,
    "posterUrl" TEXT,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "collegeName" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemIncident" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INVESTIGATING',
    "component" TEXT NOT NULL,
    "errorCategory" TEXT,
    "correlationId" TEXT,
    "resolutionNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentAuditLog" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemErrorLog" (
    "id" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'ERROR',
    "component" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "correlationId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoveryImpression" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discoveredUserId" TEXT NOT NULL,
    "cycleId" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscoveryImpression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDiscoveryState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentCycleId" INTEGER NOT NULL DEFAULT 1,
    "preferredGender" TEXT NOT NULL DEFAULT 'EVERYONE',
    "minAge" INTEGER NOT NULL DEFAULT 18,
    "maxAge" INTEGER NOT NULL DEFAULT 28,
    "relationshipIntention" TEXT NOT NULL DEFAULT 'All',
    "sameCollegeOnly" BOOLEAN NOT NULL DEFAULT false,
    "city" TEXT NOT NULL DEFAULT 'All',
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDiscoveryState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfilePass" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfilePass_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_tokenHash_idx" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE INDEX "PostLike_postId_idx" ON "PostLike"("postId");

-- CreateIndex
CREATE INDEX "PostLike_userId_idx" ON "PostLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PostLike_postId_userId_key" ON "PostLike"("postId", "userId");

-- CreateIndex
CREATE INDEX "PostComment_postId_idx" ON "PostComment"("postId");

-- CreateIndex
CREATE INDEX "PostComment_authorId_idx" ON "PostComment"("authorId");

-- CreateIndex
CREATE INDEX "PostComment_createdAt_idx" ON "PostComment"("createdAt");

-- CreateIndex
CREATE INDEX "SavedPost_userId_idx" ON "SavedPost"("userId");

-- CreateIndex
CREATE INDEX "SavedPost_postId_idx" ON "SavedPost"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedPost_postId_userId_key" ON "SavedPost"("postId", "userId");

-- CreateIndex
CREATE INDEX "CampusEvent_collegeName_idx" ON "CampusEvent"("collegeName");

-- CreateIndex
CREATE INDEX "CampusEvent_eventDate_idx" ON "CampusEvent"("eventDate");

-- CreateIndex
CREATE INDEX "CampusEvent_collegeName_eventDate_idx" ON "CampusEvent"("collegeName", "eventDate");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_createdAt_idx" ON "AnalyticsEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_collegeName_idx" ON "AnalyticsEvent"("collegeName");

-- CreateIndex
CREATE INDEX "SystemIncident_status_severity_idx" ON "SystemIncident"("status", "severity");

-- CreateIndex
CREATE INDEX "SystemIncident_createdAt_idx" ON "SystemIncident"("createdAt");

-- CreateIndex
CREATE INDEX "SystemIncident_component_idx" ON "SystemIncident"("component");

-- CreateIndex
CREATE INDEX "IncidentAuditLog_incidentId_idx" ON "IncidentAuditLog"("incidentId");

-- CreateIndex
CREATE INDEX "IncidentAuditLog_createdAt_idx" ON "IncidentAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "SystemErrorLog_severity_createdAt_idx" ON "SystemErrorLog"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "SystemErrorLog_component_idx" ON "SystemErrorLog"("component");

-- CreateIndex
CREATE INDEX "SystemErrorLog_createdAt_idx" ON "SystemErrorLog"("createdAt");

-- CreateIndex
CREATE INDEX "DiscoveryImpression_userId_cycleId_idx" ON "DiscoveryImpression"("userId", "cycleId");

-- CreateIndex
CREATE INDEX "DiscoveryImpression_discoveredUserId_idx" ON "DiscoveryImpression"("discoveredUserId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscoveryImpression_userId_discoveredUserId_cycleId_key" ON "DiscoveryImpression"("userId", "discoveredUserId", "cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDiscoveryState_userId_key" ON "UserDiscoveryState"("userId");

-- CreateIndex
CREATE INDEX "ProfilePass_userId_idx" ON "ProfilePass"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePass_userId_passedUserId_key" ON "ProfilePass"("userId", "passedUserId");

-- CreateIndex
CREATE INDEX "CampusAnnouncement_postType_idx" ON "CampusAnnouncement"("postType");

-- CreateIndex
CREATE INDEX "CampusAnnouncement_createdAt_idx" ON "CampusAnnouncement"("createdAt");

-- CreateIndex
CREATE INDEX "CampusAnnouncement_collegeName_createdAt_idx" ON "CampusAnnouncement"("collegeName", "createdAt");

-- CreateIndex
CREATE INDEX "Match_user1Id_status_idx" ON "Match"("user1Id", "status");

-- CreateIndex
CREATE INDEX "Match_user2Id_status_idx" ON "Match"("user2Id", "status");

-- CreateIndex
CREATE INDEX "Match_updatedAt_idx" ON "Match"("updatedAt");

-- CreateIndex
CREATE INDEX "MatchRequest_receiverId_status_idx" ON "MatchRequest"("receiverId", "status");

-- CreateIndex
CREATE INDEX "MatchRequest_senderId_status_idx" ON "MatchRequest"("senderId", "status");

-- CreateIndex
CREATE INDEX "MatchRequest_createdAt_idx" ON "MatchRequest"("createdAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_isRead_idx" ON "Message"("conversationId", "isRead");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Notification_userId_type_idx" ON "Notification"("userId", "type");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_reporterId_idx" ON "Report"("reporterId");

-- CreateIndex
CREATE INDEX "Report_reportedUserId_idx" ON "Report"("reportedUserId");

-- CreateIndex
CREATE INDEX "User_accountStatus_verificationStatus_idx" ON "User"("accountStatus", "verificationStatus");

-- CreateIndex
CREATE INDEX "UserPhoto_userId_photoOrder_idx" ON "UserPhoto"("userId", "photoOrder");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_tokenHash_idx" ON "UserSession"("tokenHash");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CampusAnnouncement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CampusAnnouncement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPost" ADD CONSTRAINT "SavedPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CampusAnnouncement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPost" ADD CONSTRAINT "SavedPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampusEvent" ADD CONSTRAINT "CampusEvent_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentAuditLog" ADD CONSTRAINT "IncidentAuditLog_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "SystemIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveryImpression" ADD CONSTRAINT "DiscoveryImpression_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveryImpression" ADD CONSTRAINT "DiscoveryImpression_discoveredUserId_fkey" FOREIGN KEY ("discoveredUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDiscoveryState" ADD CONSTRAINT "UserDiscoveryState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfilePass" ADD CONSTRAINT "ProfilePass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfilePass" ADD CONSTRAINT "ProfilePass_passedUserId_fkey" FOREIGN KEY ("passedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

