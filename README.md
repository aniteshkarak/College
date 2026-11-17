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

### 2. Discover People & Smart Matching (PRD §4.3 & §4.4)
- Profile Cards with multi-photo gallery indicators, display name, auto-calculated age (18+), college, course, city, distance band, bio, and interest tags.
- Verification indicators (Selfie Verified / Phone Verified).
- Filter modal: Age slider (18+), gender preference, campus town (Kharagpur, Kolkata, Midnapore, etc.), distance, interests, and relationship intentions.
- Like & Pass actions (Passes are kept strictly anonymous).
- Mutual Match celebration with confetti and instant icebreaker shortcuts.

### 3. Private Chat System & Voice Notes (PRD §4.5)
- Real-time text messaging with responsive mock partner replies.
- **Voice Notes:** Real recording interface with waveform animations, preview before sending, duration timer, and 60-second restriction.
- Emoji picker, message reactions (❤️, 😂, 🔥, 👏), timestamps, read receipts, and message deletion.
- In-chat quick launcher for conversation games and relationship requests.
- **Strictly No Video Calling:** Preserving user privacy and peace of mind.

### 4. 6 Signature Conversation Games (PRD §4.6)
1. **Truth or Dare:** College-safe prompts and lighthearted dares.
2. **Would You Rather?:** Interactive voting cards with percentage consensus comparisons.
3. **This or That:** Fast-paced lightning choices.
4. **20 Questions:** Clue tracker and deduplication questions.
5. **Compatibility Quiz:** 5 lifestyle questions with compatibility score breakdown.
6. **Never Have I Ever:** Campus and hostel icebreaker statements.

### 5. Daily Question & Campus Mood (PRD §4.7 & §4.8)
- **Campus Question of the Day:** Public/private answering with peer responses.
- **Campus Mood Picker:** (Bored, Happy, Romantic, Want to make friends, Looking for conversation, Open to dating) with 24h auto-reset.

### 6. Mutual Relationship Mode & Centre (PRD §4.9)
- Milestone tracking: Matched → Talking → Dating → Relationship.
- **"I want to be in a relationship"** mutual request system.
- Partner confirmation flow: Accept, Decline, or Decide Later.
- Active Relationship view with start date anniversary, profile visibility toggle, and independent termination option.
- Explicit disclaimer: *"A digital match or relationship status is not a legally binding or real-world commitment."*

### 7. India DPDP Act 2023 & Safety (PRD §9)
- 18+ enforcement using calculated Date of Birth.
- No unnecessary collection of Aadhaar numbers or government IDs.
- Block and Report workflows with detailed categories (Fake profile, Harassment, Abusive messages, etc.).
- Account settings with complete data download and account purge options.

### 8. Administrative Dashboard (PRD §6)
- Metrics overview (Users, Matches, Messages, Reports, Suspensions).
- Moderation reports queue with investigation notes and action buttons (Warn, Suspend, Dismiss).
- Immutable administrative audit logs (`admin_audit_logs`).
