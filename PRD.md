# COLLÉGÉ
## Product Requirements Document (PRD)

**Product:** Collégé  
**Category:** College-oriented Social Networking & Dating Platform  
**Target Market:** India  
**Target Users:** Adults aged 18+  
**Platform:** Responsive Website / PWA  
**Business Model:** Freemium  
**Primary Technology:** React.js, Tailwind CSS, Supabase, PostgreSQL  
**Version:** 1.0  
**Status:** Product Planning

---

# 1. Executive Summary

Collégé is a social dating platform designed for college students and young adults across India.

It enables users to discover new people, create authentic profiles, mutually match, communicate through private text messaging and voice notes, and participate in interactive conversation games.

Unlike traditional dating platforms, Collégé does not encourage users to rush into relationships.

Users can start with casual conversations, develop friendships, explore dating and eventually enter a serious relationship if both people independently agree.

The platform will not provide video calling.

## Core objectives

1. Make it easy to discover compatible people.
2. Encourage meaningful conversations.
3. Support casual chatting without relationship pressure.
4. Allow users to explore romantic connections.
5. Make relationship decisions mutual.
6. Create a safe and respectful online community.
7. Build a scalable India-wide platform.

# 2. Target Audience

## Primary audience

- College students aged 18–25.
- University students.
- Young adults aged 18–30.
- People interested in friendship and dating.
- People interested in serious relationships.

## Geographic market

Initial launch:
- West Bengal
- Kolkata
- Kharagpur
- Midnapore
- Other major college towns

Expansion:
- Delhi
- Mumbai
- Bengaluru
- Pune
- Hyderabad
- Chennai
- Other Indian cities

The platform is India-wide, not restricted to a particular college.

## User identity

Every user must create a real-person-oriented profile.

College verification is not compulsory.

Recommended verification:
- Verified email.
- Verified mobile number.
- Age assurance for 18+ eligibility.
- Optional selfie/liveness verification.
- Profile authenticity checks.

Do not describe someone as identity-verified simply because they verified their email or mobile number.

# 3. Product Philosophy

Collégé should have three main connection categories.

### Casual Connection
For people who simply want to talk, enjoy conversations, share interests and pass some free time.

### Dating Connection
For people interested in exploring romantic connections without immediately committing.

### Serious Relationship
For people who want a committed relationship after understanding each other.

Users can update their preferences whenever they want.

Nobody should be forced to change their relationship intentions to keep a match.

# 4. Functional Requirements

## 4.1 Authentication and Registration

Registration options:
- Email and password.
- Mobile OTP.
- Google authentication.

Registration workflow:

1. Enter name.
2. Enter date of birth.
3. Confirm 18+ eligibility.
4. Select gender.
5. Select interested-in preferences.
6. Enter mobile number.
7. Verify email or mobile.
8. Accept Terms and Privacy Policy.
9. Create profile.

Age eligibility must be checked using date of birth, not a manually entered age.

Additional age assurance should be introduced based on risk and legal requirements.

**Important:** Do not collect Aadhaar numbers or identity documents unnecessarily. If stronger age verification is required, use a suitable verification provider and minimise retained information.

## 4.2 Profile Creation

Profile fields:

| Field | Requirement |
|---|---|
| Full name | Required |
| Display name | Required |
| Date of birth | Required |
| Age | Automatically calculated |
| Gender | Required |
| Interested in | Required |
| City | Required |
| State | Required |
| College | Optional |
| Course | Optional |
| Profile photo | Required |
| Additional photos | Optional |
| Bio | Optional |
| Interests | Required |
| Languages | Optional |
| Relationship intention | Required |

Users can add interests such as:
- Coding
- Music
- Travelling
- Movies
- Gaming
- Photography
- Sports
- Reading
- Dancing
- Food
- Fitness

Profile privacy:
- Users control which information is public.
- Exact date of birth remains private.
- Contact information is never publicly displayed.
- Exact live location is never shared.

## 4.3 Discover People

This is the main dating feature.

Display profile cards containing:
- Profile photo.
- Display name.
- Age.
- City.
- College, if shared.
- Short biography.
- Interests.
- Relationship intention.
- Profile verification indicators, where applicable.

Actions:
- Like.
- Pass.
- Report.
- Block.
- View profile.

Discovery filters:
- Age range.
- Gender preference.
- City.
- Distance band.
- Interests.
- Relationship intention.
- Languages.

Matching algorithm:

1. Identify eligible profiles.
2. Apply user preferences.
3. Exclude blocked users.
4. Exclude previously passed profiles.
5. Prioritise compatible interests.
6. Prioritise recently active profiles without penalising less active users unfairly.
7. Display eligible profiles.

Never reveal who has passed on another user.

## 4.4 Mutual Matching & Connection Progression

### 4.4.1 Who Liked You & Mutual Friend Acceptance
In the Match section, users can see **who liked them** (Received Match Requests).
Each pending like displays:
- Profile photo and basic details.
- **Accept** button.
- **Reject** button.

Rules:
- **Acceptance Required to Message:** If User B accepts User A's like, they both become **Mutual Friends**. Only after acceptance can they message each other.
- **No Unaccepted Messaging:** If someone does not accept, neither person can message the other.
- **Initial Connection:** Once accepted, they first start talking as a **Friend** (Friend / Talking stage).

### 4.4.2 The "Go" Button (Stage Progression to Dating)
Inside the conversation, there is a dedicated **"Go" button**:
- If either user wants to advance from the **Talking as a Friend** stage to the **Dating** stage, they click the **"Go"** button.
- The opponent receives the stage transition prompt and can react with one of **four specific options**:
  1. **Accept:** Both users enter the **Dating Stage**!
  2. **Reject:** The request is declined.
  3. **Sometimes later:** Decision is deferred ("Decide later / Maybe later").
  4. **We are good as a friend:** Both stay comfortably in the Friend stage without pressure.

## 4.5 Private Chat System

Chat is one of the most important features.

Supported functionality:

- Real-time text messaging.
- Emojis.
- GIFs.
- Stickers.
- Voice notes.
- Message reactions.
- Message timestamps.
- Read receipts (optional).
- Typing indicators (optional).
- Unread message count.
- Delete message.
- Report message.
- Block user.
- Unmatch.

Voice notes:
- Record audio.
- Preview before sending.
- Cancel recording.
- Send voice message.
- Play and pause.
- Display recording duration.
- Allow deletion.

Suggested initial restrictions:
- Maximum voice note duration: 60 seconds.
- Maximum audio file size: 5 MB.
- Supported formats: WebM/Opus or another browser-compatible format.

Security:
- Voice notes accessible only to authorised chat participants.
- Use private storage buckets and short-lived signed URLs.
- Do not expose public audio links.

No video calling, video messaging or live video features.

## 4.6 Conversation Games

This will be one of Collégé's signature features.

Games should be available inside matched conversations.

### Game 1: Truth or Dare

Users take turns selecting Truth or Dare.

Truth examples:
- What is your biggest dream?
- What's your ideal date?
- What makes you happy?
- What's your most embarrassing moment?

Dare examples:
- Send your favourite song.
- Describe yourself in three words.
- Share a funny memory.

Users can skip any question or dare.

### Game 2: Would You Rather?

Examples:
- Beach or mountains?
- Coffee or tea?
- Movies or travelling?
- Love marriage or arranged marriage?

### Game 3: This or That

Quick selection game with two options.

### Game 4: 20 Questions

Users take turns asking questions to understand each other.

### Game 5: Compatibility Quiz

Both users answer the same questions.

The platform compares their answers and displays an entertainment-oriented compatibility result.

### Game 6: Never Have I Ever

A casual conversation game with optional prompts.

Game safety:
- No forced sexual questions.
- No requests for private images.
- No coercive or humiliating challenges.
- Every user can skip or leave a game.

## 4.7 Campus Board (College-Exclusive Announcement Group)

A dedicated public space for every college community:

- **Automatic College Group Enrollment:** Every verified student is added automatically to their college's exclusive group based on their verified college identity.
- **Strictly Campus-Exclusive:** No student from another college can join, view, or post in a different college's board.
- **Announcement-Only Model:** No direct 1-on-1 chatting or messaging is allowed in this group to prevent spam, trolling, and harassment.
- **Broadcast Notices:** Any student from the college can announce anything happening in campus:
  - Cultural and technical fest auditions and events.
  - Club recruitment and workshops.
  - Sports tournaments and inter-hostel matches.
  - Lost & found notices.
  - Academic reminders and campus buzz.
- **Peer Engagement:** Students can upvote and share announcements.

## 4.8 Mood Status

Allow users to select their current mood.

Options:
- Bored
- Happy
- Feeling romantic
- Want to make friends
- Looking for a conversation
- Open to dating

Mood status expires automatically after a configurable period.

## 4.9 Relationship Mode

This is Collégé's most important differentiating feature.

After spending time together, both users can express their relationship intention.

Relationship stages:

1. Matched
2. Talking
3. Dating
4. Relationship

The status must not change automatically just because users chat frequently.

### Mutual relationship request

User A clicks:

"I want to be in a relationship."

The other person receives a private request.

They can choose:
- Accept.
- Decline.
- Decide later.

If the other person accepts, the platform asks them to confirm.

Only after both confirmations:

- Relationship status becomes active.
- Both receive confirmation.
- The relationship appears in their profiles according to their privacy settings.

If either person declines, the relationship status remains unchanged.

### Relationship management

- View relationship start date.
- End relationship.
- Hide relationship status.
- Report abusive behaviour.
- Block the other user.

Either person can end the platform relationship independently.

The platform must never imply that a digital status represents a legally binding or real-world commitment.

## 4.10 Notifications

Notification types:

- New like.
- New match.
- New message.
- New voice note.
- Game invitation.
- Daily question.
- Relationship request.
- Relationship confirmation.
- Safety notification.

Users can control notification preferences.

Support:
- In-app notifications.
- Browser push notifications.
- Optional email notifications.

# 5. User Interface and Pages

## Public pages

1. Landing page.
2. About Collégé.
3. How it works.
4. Safety guidelines.
5. Community guidelines.
6. Terms and conditions.
7. Privacy policy.
8. Contact and support.

## Authenticated user pages

1. Dashboard.
2. Discover.
3. Profile details.
4. Likes.
5. Matches.
6. Conversations.
7. Individual chat.
8. Conversation games.
9. Daily question.
10. Mood status.
11. Relationship centre.
12. Notifications.
13. Edit profile.
14. Privacy settings.
15. Account settings.

## Navigation

Desktop navigation:

- Discover
- Likes
- Matches
- Chats
- Games
- Profile

Mobile bottom navigation:

- Home
- Discover
- Matches
- Chats
- Profile

# 6. Admin Dashboard

A complete administrative dashboard is mandatory.

## Admin overview

Display:

- Total registered users.
- Active users.
- New registrations.
- Total matches.
- Total messages.
- Total reports.
- Suspended accounts.
- Pending verification reviews.

## User management

Admin can:

- Search users.
- View profile information necessary for moderation.
- Review account status.
- Suspend accounts.
- Ban accounts.
- Restore accounts.
- Review verification status.
- Investigate reported profiles.

Admin must not have unrestricted access to private conversations. Access to message content should be restricted to necessary, documented safety investigations with appropriate authorisation and audit logging.

## Reports management

Report categories:

- Fake profile.
- Harassment.
- Abusive messages.
- Impersonation.
- Spam.
- Threats.
- Inappropriate content.
- Underage user.
- Other.

Report statuses:

- Pending.
- Under review.
- Action taken.
- Rejected.
- Closed.

Admin actions:

- Review report.
- Review relevant submitted evidence.
- Warn user.
- Suspend user.
- Permanently ban user.
- Escalate serious cases.
- Record investigation notes.

## Content moderation

Admin can review:
- Profile photographs.
- Profile descriptions.
- Reported messages.
- Reported voice notes where appropriate.
- Reported game content.

## Admin roles

1. Super Admin.
2. Moderator.
3. Support Agent.
4. Content Moderator.

Apply role-based permissions.

All administrative actions must be logged.

# 7. Database Architecture

**Database:** PostgreSQL through Supabase.

Use UUID primary keys and timestamps.

## Table 1: profiles

| Column | Type |
|---|---|
| id | UUID, references auth.users |
| display_name | TEXT |
| date_of_birth | DATE |
| gender | TEXT |
| interested_in | TEXT[] |
| bio | TEXT |
| city | TEXT |
| state | TEXT |
| college_name | TEXT |
| course | TEXT |
| relationship_intention | TEXT |
| avatar_url | TEXT |
| is_active | BOOLEAN |
| verification_status | TEXT |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

## Table 2: profile_photos

- id
- user_id
- storage_path
- display_order
- moderation_status
- created_at

## Table 3: interests

- id
- name
- category

## Table 4: user_interests

- id
- user_id
- interest_id

## Table 5: likes

- id
- sender_id
- receiver_id
- created_at

Unique constraint: sender_id + receiver_id.

## Table 6: passes

- id
- sender_id
- receiver_id
- created_at

## Table 7: matches

- id
- user_one_id
- user_two_id
- status
- matched_at
- unmatched_at

Use a canonical ordering of user IDs to prevent duplicate pair records.

## Table 8: conversations

- id
- match_id
- created_at
- updated_at
- status

## Table 9: messages

- id
- conversation_id
- sender_id
- message_type
- content
- attachment_path
- duration_seconds
- created_at
- edited_at
- deleted_at

Message types:
- text
- voice
- sticker
- gif
- system

## Table 10: message_reactions

- id
- message_id
- user_id
- reaction
- created_at

## Table 11: games

- id
- title
- game_type
- description
- is_active

## Table 12: game_sessions

- id
- conversation_id
- game_id
- initiated_by
- status
- started_at
- ended_at

## Table 13: game_answers

- id
- session_id
- user_id
- question_id
- answer
- created_at

## Table 14: relationship_requests

- id
- requester_id
- receiver_id
- status
- requested_at
- responded_at

## Table 15: relationships

- id
- user_one_id
- user_two_id
- status
- started_at
- ended_at

## Table 16: user_blocks

- id
- blocker_id
- blocked_id
- created_at

## Table 17: reports

- id
- reporter_id
- reported_user_id
- message_id
- category
- description
- status
- assigned_admin_id
- created_at
- resolved_at

## Table 18: notifications

- id
- user_id
- type
- title
- body
- reference_id
- is_read
- created_at

## Table 19: user_moods

- id
- user_id
- mood
- expires_at
- created_at

## Table 20: daily_questions

- id
- question
- category
- is_active
- publish_date

## Table 21: daily_answers

- id
- user_id
- question_id
- answer
- visibility
- created_at

## Table 22: user_settings

- id
- user_id
- discovery_enabled
- show_online_status
- read_receipts_enabled
- push_notifications_enabled
- profile_visibility
- created_at
- updated_at

## Table 23: admin_users

- id
- auth_user_id
- role
- is_active
- created_at

## Table 24: admin_audit_logs

- id
- admin_id
- action
- target_type
- target_id
- reason
- created_at

## Table 25: user_consents

- id
- user_id
- consent_type
- policy_version
- consented_at
- withdrawn_at

## Table 26: user_devices

- id
- user_id
- device_token
- device_type
- created_at

### Database relationships

- One user has one profile.
- One user can have multiple photos.
- One user can have multiple interests.
- Users can send multiple likes.
- Two mutual likes can create one match.
- One match has one conversation.
- One conversation contains multiple messages.
- One conversation can contain multiple game sessions.
- One user can send multiple relationship requests.
- One confirmed relationship connects two users.
- One user can create multiple reports and blocks.

### Database implementation rules

1. Add foreign keys.
2. Add indexes to frequently queried columns.
3. Add unique constraints to prevent duplicate matches.
4. Use transactions for mutual matching and relationship confirmation.
5. Enable Row Level Security on exposed tables.
6. Never expose the Supabase service-role key in frontend code.
7. Store audio and profile images in private or appropriately controlled storage.
8. Use database migrations to track schema changes.

# 8. Backend Architecture

Recommended architecture:

**React frontend → Supabase Auth → PostgreSQL → Supabase Realtime → Supabase Storage → Edge Functions**

### Frontend

React.js and Tailwind CSS.

Responsibilities:
- UI rendering.
- User interactions.
- Form validation.
- Discover interface.
- Chat interface.
- Audio recording.
- Notification display.

### Supabase Auth

Responsibilities:
- Registration.
- Login.
- OTP verification.
- Session management.
- Authentication.

### PostgreSQL

Responsibilities:
- Profiles.
- Matching.
- Likes.
- Conversations.
- Messages.
- Relationship status.
- Reports.

### Supabase Realtime

Responsibilities:
- Real-time messaging.
- Typing indicators.
- Online status.
- Match notifications.
- Conversation updates.

### Supabase Storage

Buckets:
- profile-photos
- voice-notes
- reported-evidence

Use private buckets for sensitive media.

### Supabase Edge Functions

Recommended functions:

1. create-profile
2. discover-users
3. send-like
4. create-match
5. send-message
6. send-voice-note
7. send-notification
8. submit-report
9. block-user
10. unmatch-user
11. request-relationship
12. confirm-relationship
13. delete-account
14. moderate-profile

Sensitive operations must be authorised on the server, not trusted to frontend logic.

# 9. Security and Privacy

Security is a foundational product requirement.

## Authentication

- Email verification.
- Mobile verification.
- Secure sessions.
- Rate limiting.
- Login attempt monitoring.
- Protection against automated registrations.

## Database security

- Row Level Security.
- User-specific access.
- Private conversation access.
- Admin role separation.
- No public access to private messages.
- Secure server-side functions.

## Profile security

- Prevent unauthorised profile edits.
- Prevent photo URL manipulation.
- Validate uploaded file types and sizes.
- Moderate profile images.
- Protect private user information.

## Dating safety

- Report.
- Block.
- Unmatch.
- Suspend.
- Ban.
- Appeal.

## Privacy controls

- Hide online status.
- Control profile visibility.
- Control notifications.
- Delete account.
- Request data access and correction.
- Withdraw applicable consent.

## India compliance

Design the platform around India's Digital Personal Data Protection Act, 2023 and the Digital Personal Data Protection Rules, 2025.

Before launch, obtain a legal review of:
- Privacy policy.
- Consent management.
- Data retention.
- User rights.
- Data deletion.
- Security safeguards.
- Breach response.
- Grievance redressal.
- Applicable age and child-data requirements.

Do not assume that a simple 18+ checkbox alone is sufficient for all age-assurance and compliance requirements.

# 10. Monetisation & 28-Day Subscription System

Collégé implements a transparent, affordable tiered model designed for Indian college student budgets with 28-day validity cycles:

## 10.1 Free Plan (Always Free)
- Up to **5 Mutual Matches** (by accepting or sent).
- Send up to **50 Match Requests**.
- Access to your college's exclusive **Campus Board**.
- 1-on-1 text messaging and 60-second voice notes with mutual friends.
- All 6 Conversation Games.
- Essential trust and safety features (blocking, reporting, DPDP privacy controls).

## 10.2 Campus Pro Plan (₹49 for 28 Days)
- Up to **20 Mutual Matches** (by accepting or sent — 4x increase).
- Send up to **100 Match Requests**.
- Priority announcement broadcasting on your College Campus Board.
- Instantly view all received likes under "Who Liked You".
- Exclusive "Campus Pro" profile badge.

## 10.3 Campus Unlimited Plan (₹99 for 28 Days)
- **Unlimited Mutual Matches**.
- **Unlimited Sent Match Requests**.
- Spotlight top discovery placement across college feeds.
- Broadcast highlighted notices on Campus Board.
- VIP Gold profile badge.

## 10.4 Fundamental Safety Principle
**Never charge for safety:** Consent management, blocking, reporting, and statutory DPDP privacy controls are ALWAYS 100% free for every user.

# 11. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Responsive design | Mobile, tablet, desktop |
| Availability | Target 99.5% MVP |
| Page loading | Target under 3 seconds on typical connections |
| Chat delivery | Target under 2 seconds under normal conditions |
| Security | RLS and server-side authorisation |
| Scalability | Modular backend |
| Accessibility | Keyboard and screen-reader support |
| Browser support | Chrome, Edge, Firefox, Safari |
| Data protection | Encrypted transport and protected storage |

These are initial product targets and must be validated through testing.

# 12. Development Roadmap

## Phase 1: Product Foundation

Duration: 1–2 weeks

- Finalise branding.
- Design UI/UX.
- Create React project.
- Configure Tailwind CSS.
- Create Supabase project.
- Design database schema.
- Configure authentication.
- Implement initial RLS policies.

## Phase 2: Authentication and Profiles

Duration: 1–2 weeks

- Registration.
- Login.
- OTP.
- 18+ eligibility checks.
- Profile creation.
- Profile editing.
- Photo uploads.
- Interest selection.
- City and college information.

## Phase 3: Discovery and Matching

Duration: 2 weeks

- Profile discovery.
- Filtering.
- Like system.
- Pass system.
- Mutual matching.
- Match notifications.
- Duplicate match prevention.

## Phase 4: Chat System

Duration: 2–3 weeks

- Conversation creation.
- Real-time messaging.
- Message history.
- Voice notes.
- Audio playback.
- Reactions.
- Typing status.
- Unread counts.

## Phase 5: Interactive Features

Duration: 1–2 weeks

- Truth or Dare.
- Would You Rather.
- This or That.
- 20 Questions.
- Daily Questions.
- Mood status.
- Compatibility quiz.

## Phase 6: Relationship System

Duration: 1 week

- Relationship requests.
- Acceptance.
- Rejection.
- Mutual confirmation.
- Relationship history.
- End relationship.

## Phase 7: Admin and Safety

Duration: 2 weeks

- Admin authentication.
- Role permissions.
- User management.
- Reports.
- Moderation.
- Account suspension.
- Audit logs.
- Account deletion.
- Privacy settings.

## Phase 8: Testing and Launch

Duration: 2 weeks

- Functional testing.
- Security testing.
- Mobile responsiveness.
- Performance testing.
- Database policy testing.
- Abuse-case testing.
- Beta launch.
- Bug fixing.
- Production deployment.

**Estimated MVP development time: 13–16 weeks**, depending on team size, integration complexity and testing.

# 13. MVP Scope

Do not build every advanced feature at once.

### Must-have for first launch

- Authentication.
- 18+ eligibility.
- Profile creation.
- Profile discovery.
- Likes and mutual matches.
- Text chat.
- Voice notes.
- Basic conversation games.
- Mutual relationship request.
- Block and report.
- Admin dashboard.
- Privacy settings.

### Version 2

- Daily questions.
- Mood status.
- Compatibility quiz.
- Advanced filters.
- Push notifications.
- Premium subscriptions.
- Profile boosts.

### Version 3

- AI-assisted conversation starters.
- Improved fake-profile detection.
- Advanced recommendation engine.
- Multi-language support.
- More community features.
- Mobile applications.

# 14. Product Success Metrics

Measure:

- Number of registrations.
- Profile completion rate.
- Daily active users.
- Weekly active users.
- Likes per user.
- Mutual match rate.
- Conversations started.
- Messages per match.
- Game participation.
- Relationship requests.
- User retention.
- Reports per 1,000 active users.
- Moderation response time.

Prioritise user safety and meaningful engagement rather than maximising time spent on the platform.

# 15. Launch Strategy

Start with a controlled beta launch.

### Stage 1: Local launch

Launch in Kharagpur and nearby college communities.

### Stage 2: Regional expansion

Expand to Kolkata, Midnapore and other parts of West Bengal.

### Stage 3: India-wide expansion

Open registrations across India.

Marketing channels:
- Instagram Reels.
- YouTube Shorts.
- College communities.
- Student ambassadors.
- Referral programmes.
- Campus marketing.

Do not use fake profiles or fabricated matches to make the platform appear active.

# 16. Final Product Positioning

**Brand:** Collégé

**Tagline:** Meet. Chat. Connect.

**Brand personality:** Modern, youthful, friendly, respectful and trustworthy.

**Primary message:**

"Not everyone comes here looking for love. Some just want someone to talk to. Some want friendship. Some want to fall in love. Whatever your intention, start with a conversation."

**Final product principle:**

A match is not a commitment. A conversation is not a promise. A relationship happens only when both people freely choose it.

---

**END OF PRODUCT REQUIREMENTS DOCUMENT**
