# Collégé (Frontend Web & PWA)

> **Meet. Chat. Connect.**  
> India's authentic, pressure-free college-oriented social and dating platform.

Built strictly according to the specifications in [PRD.md](file:///c:/Users/ANITESH/Documents/GitHub/College/PRD.md).

---

## 🚀 Quick Start

To run the development server:
```bash
npm install
npm run dev
```

To build for production:
```bash
npm run build
```

To preview the production build:
```bash
npm run preview
```

---

## 🛠️ Technology Stack
- **Framework:** React.js 18 + Vite
- **Styling:** Tailwind CSS (Romantic rose & warm amber theme, responsive mobile-first PWA design, dark/light mode)
- **Icons:** Lucide React
- **Celebration Effects:** Canvas Confetti
- **Backend & Database Readiness:** Supabase client integration ready (`@supabase/supabase-js`, PostgreSQL, RLS)

---

## 📱 Implemented Features (PRD v1.0 Mapping)

### 1. Product Philosophy & Three Connection Categories (PRD §3)
- **Casual Connection:** Pressure-free banter, shared hobbies, passing free time.
- **Dating Connection:** Organic romance exploration without immediate commitment.
- **Serious Relationship:** Mutual understanding and deep commitment.

### 2. Match Requests ("Who Liked You") & Mutual Friends (PRD §4.3 & §4.4)
- **Who Liked You View:** In the Match section, users only see who liked them with **Accept** or **Reject** buttons.
- **Mutual Friend Requirement:** Only after accepting do two users become Mutual Friends and unlock private chatting. If unaccepted, neither can message each other.
- **Initial Connection:** All accepted pairs start talking as a **Friend** (Talking stage).

### 3. The "GO" Button Stage Transitions (PRD §4.4.2)
- While talking as a friend, either user can click the **"GO to Dating"** button.
- The opponent can react with 4 specific choices:
  1. **Accept** (transitions to Dating stage!)
  2. **Reject** (declines transition)
  3. **Sometimes later** (defers decision)
  4. **We are good as a friend** (stays comfortably as mutual friends)

### 4. Campus Board: College-Exclusive Announcement Hub (PRD §4.7)
- Automatically enrolls students into their college's exclusive board (e.g. IIT Kharagpur, St. Xavier's, etc.).
- No external students can view or post.
- Announcement-only feed (fests, club auditions, sports, seminars, lost & found).
- Strictly no direct chat/spam in this group.

### 5. 28-Day Subscription System & Match Quotas (PRD §10)
- **Free Plan:** Up to 5 mutual matches, up to 50 sent match requests.
- **Campus Pro (₹49 for 28 Days):** Up to 20 mutual matches, up to 100 sent match requests, priority board broadcasting.
- **Campus Unlimited (₹99 for 28 Days):** Unlimited mutual matches, unlimited sent match requests, top discovery spotlight.
- *Safety, blocking, and reporting are ALWAYS 100% free.*

### 6. Private Chat System & 60s Voice Notes (PRD §4.5)
- Real-time text messaging with responsive mock partner replies.
- **Voice Notes:** Real recording interface with waveform animations, preview before sending, duration timer, and 60-second restriction.
- Emojis, stickers, message reactions (❤️, 😂, 🔥, 👏), and deletion.
- **Strictly No Video Calling:** Preserving privacy and peace of mind.

### 7. 6 Signature Conversation Games (PRD §4.6)
1. **Truth or Dare:** College-safe prompts and witty dares.
2. **Would You Rather?:** Interactive voting cards with percentage consensus comparisons.
3. **This or That:** Fast-paced lightning choices.
4. **20 Questions:** Deduce mystery spots on campus.
5. **Compatibility Quiz:** 5 lifestyle questions with score breakdown.
6. **Never Have I Ever:** Campus and hostel icebreaker statements.

### 8. Mutual Relationship Mode & Centre (PRD §4.9)
- Milestone progression: Matched → Talking (Friend) → Dating → Relationship.
- **"I want to be in a relationship"** mutual request system.
- Partner confirmation flow: Accept, Decline, or Decide Later.
- Active Relationship view with start date anniversary, profile visibility toggle, and independent termination option.
- Explicit disclaimer: *"A digital match or relationship status is not a legally binding or real-world commitment."*

### 9. India DPDP Act 2023 & Safety (PRD §9)
- 18+ enforcement using calculated Date of Birth.
- No unnecessary collection of Aadhaar numbers or government IDs.
- Block and Report workflows with detailed categories (Fake profile, Harassment, Abusive messages, etc.).
- Account settings with complete data download and account purge options.

### 10. Administrative Dashboard (PRD §6)
- Metrics overview (Users, Matches, Messages, Reports, Suspensions).
- Moderation reports queue with investigation notes and action buttons (Warn, Suspend, Dismiss).
- Immutable administrative audit logs (`admin_audit_logs`).
