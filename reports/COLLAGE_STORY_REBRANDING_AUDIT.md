# COLLAGE STORY — COMPREHENSIVE BRAND REBRANDING AUDIT

**Target:** Rename existing college social networking and dating platform from **Collégé** to **Collage Story**.  
**Date:** November 23, 2026  
**Repository:** `c:\Users\ANITESH\Documents\GitHub\College`  

---

## 1. Executive Summary & Audit Scope

This audit catalogs every public-facing, user-facing, and internal brand representation across the frontend, backend, legal documentation, emails, SEO metadata, and administrative panels.

### Key Distinction:
- **BRAND NAME (`Collégé` -> `Collage Story`):** All branding mentions, headers, footers, modal titles, email templates, page titles, and terms are updated to **Collage Story**.
- **EDUCATIONAL TERMINOLOGY (`college`, `college_name`, `collegeId`, `campus`, `student`):** Preserved untouched. Educational concepts, schema models, API routes (`/api/v1/...`), college names (e.g. *Fergusson College*), and relational models remain intact.

---

## 2. Inventory of Audited Components

### A. Frontend Application & UI Components (`College/src/`)
1. **`index.html`**:
   - Page Title: `<title>Collégé — Meet. Chat. Connect. (College Social & Dating)</title>`
   - Meta Description: Needs update to *Collage Story* with suggested SEO description.
   - Open Graph / Twitter Card tags: Add full Open Graph / Twitter tags for *Collage Story*.
2. **`src/App.jsx`**:
   - Loading splash message: `Loading Collégé...` -> `Loading Collage Story...`
3. **`src/components/layout/Navbar.jsx`**:
   - Brand logo title: `Collégé` -> `Collage Story`
   - Subscription button tooltip: `Collégé Subscription Plan` -> `Collage Story Membership Plan`
4. **`src/components/layout/Footer.jsx`**:
   - Logo and brand heading: `Collégé` -> `Collage Story`
   - Navigation links: `About Collégé` -> `About Collage Story`
   - Legal disclaimer: `Collégé complies with India's Digital Personal Data Protection Act...` -> `Collage Story complies with...`
5. **`src/components/public/LandingPage.jsx`**:
   - Hero headline, sub-headline, badges, and CTA:
     - `How Collégé Works` -> `How Collage Story Works`
     - `Welcome to Collégé` -> `Welcome to Collage Story`
     - `Collégé vs Traditional Apps` comparison cards -> `Collage Story vs Traditional Apps`
6. **`src/components/public/AboutPage.jsx`**:
   - `About Collégé` -> `About Collage Story`
   - `Why Collégé is Different` -> `Why Collage Story is Different`
   - India-wide campus community text.
7. **`src/components/public/HowItWorksPage.jsx`**:
   - `How Collégé Works` -> `How Collage Story Works`
8. **`src/components/public/SafetyGuidelinesPage.jsx`**:
   - Safety pledge: `Safety, comfort, and peace of mind on Collégé` -> `...on Collage Story`
   - `Collégé strictly disables video calls...` -> `Collage Story strictly disables...`
9. **`src/components/public/TermsPage.jsx`**:
   - Comprehensive legal terms (14 sections referencing `Collégé`).
   - Official Helpdesk & Legal Cell reference.
10. **`src/components/public/PrivacyPolicyPage.jsx`**:
    - Privacy Policy, data fiduciary obligations, grievance contact.
11. **`src/components/auth/AuthModal.jsx`**:
    - `Activate Account & Enter Collégé 🎓` -> `...Enter Collage Story 🎓`
    - `Log In to Collégé` -> `Log In to Collage Story`
    - Terms summary modal.
12. **`src/components/admin/AdminDashboard.jsx` & `AdminLogin.jsx`**:
    - `Collégé Admin & Verification Portal` -> `Collage Story Admin & Verification Portal`
    - `Return to Collégé Website` -> `Return to Collage Story Website`
13. **`src/components/common/PremiumModal.jsx`**:
    - `Collégé Membership Plans` -> `Collage Story Membership Plans`
    - `Collégé Safety Commitment` -> `Collage Story Safety Commitment`
14. **`src/components/profile/ProfileView.jsx`, `EditProfile.jsx`, `SettingsView.jsx`**:
    - `Personalize your Collégé experience` -> `...Collage Story experience`
    - `Sign Out of Collégé` -> `Sign Out of Collage Story`
    - `Permanently Delete Collégé Account?` -> `Permanently Delete Collage Story Account?`
15. **`src/components/relationship/RelationshipHub.jsx`**:
    - `On Collégé, relationship status is never automatic...` -> `On Collage Story...`
    - `End Relationship on Collégé?` -> `End Relationship on Collage Story?`
16. **`src/context/AppContext.jsx`**:
    - Default bio fallback: `Verified college student on Collégé.` -> `Verified college student on Collage Story.`
    - Toast notifications: `Logged out of Collégé.`, `Please log in to enter Collégé.`
17. **`src/services/api.js` & `src/services/mockData.js`**:
    - Header comments & static labels.

---

### B. Backend Services & Templates (`College/backend/src/`)
1. **`backend/src/services/emailService.js`**:
   - 10 Collégé-branded HTML templates:
     - Header: `Collégé` -> `Collage Story`
     - Subtitle: `Collégé — Exclusively for Verified College Students Across India` -> `Collage Story — Exclusively for Verified College Students Across India`
     - Subject lines:
       - `Welcome to Collégé – Your Registration has Started!`
       - `Your Collégé Verification Code`
       - `Collégé Application Received`
       - `Collégé Application Under Review`
       - `Congratulations! Your Collégé Account is Approved 🎉`
       - `Important: Update Regarding Collégé Application`
       - `Reset Your Collégé Password`
       - `Security Alert on your Collégé Account`
2. **`backend/src/config/swagger.js`**:
   - Title: `Collage Story API – Meet. Chat. Connect.`
   - Description & contact: `Collage Story Engineering Team`
3. **`backend/src/app.js` & `backend/src/server.js`**:
   - Root API info & fallback: `Collage Story Backend API`
   - Default avatar placeholder SVG: `Collage Story Student`
   - Log message: `🚀 Collage Story Backend API Server running...`
4. **`backend/src/services/healthService.js`**:
   - App identifier: `Collage Story Backend API`
5. **`backend/src/middleware/activeAccountGuard.js`**:
   - Inactive notice: `Access to Collage Story community features is restricted.`
6. **`backend/src/modules/auth/auth.service.js` & `auth.validator.js`**:
   - `Login successful! Welcome to Collage Story.`
   - Age validation error: `You must be at least 18 years old to join Collage Story.`
7. **`backend/src/modules/profiles/profile.controller.js`**:
   - Age error messages: `You must be at least 18 years old to join Collage Story.`
8. **`backend/src/modules/registration/registration.service.js` & `registration.validator.js`**:
   - Confirmation response: `Your Collage Story application has been successfully submitted...`
   - Default bio: `Student at Collage Story.`
9. **`backend/src/utils/serializers.js`**:
   - Header comments and serializer tags.

---

### C. Database Audit
- Verified database tables: All Prisma models (`User`, `UserProfile`, `PendingRegistration`, `Admin`, `Match`, etc.) use standard domain naming. No breaking migrations required.
- Queried administrative accounts: Updated `admin@college.internal` (`fullName: 'Collégé Lead Reviewer'`) to `Collage Story Lead Reviewer`.
- Student bios: 0 user profiles or applications contained hardcoded brand names.

---

### D. Brand Assets & Logo
- Favicon: `public/logo.svg` uses geometric cap + heart motif gradient, which fits the aesthetic.
- Added Open Graph / PWA metadata references with exact brand name `Collage Story`.

---

## 3. Rebranding Execution Plan

1. **Phase 2 & 3:** Frontend UI, Navbar, Footer, Landing, Modals, Profiles, Settings, and Logo.
2. **Phase 4:** `index.html` SEO metadata, Open Graph, Twitter cards, PWA manifest.
3. **Phase 5:** Backend response messages, email templates, Swagger docs, health endpoint, server logs.
4. **Phase 6:** Legal documents (`TermsPage.jsx`, `PrivacyPolicyPage.jsx`, consent checkboxes).
5. **Phase 7:** Database admin record update.
6. **Phase 8:** Validation: build, unit tests, health check, Prisma validate.
7. **Phase 9 & 10:** Git security audit, clean diff inspection, commit & push to GitHub `origin/main`.
