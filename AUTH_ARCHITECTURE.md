# Truth Estate: Authentication & Identity Unification Architecture

**Git Feature Branch**: `feature/unified-auth-merge`  
**Notice for Claude Code**: Antigravity is implementing the User Auth & Identity Unification module. Please do **NOT** modify or overwrite the files listed below while building parallel features.

---

## 1. Protected File Registry

| File Path | Status | Purpose & Responsibility |
| :--- | :--- | :--- |
| `src/lib/phoneAuth.ts` | **Protected** | 4-digit MSG91 SMS OTP, Google OAuth, `phoneKnown()` lookup, and profile merging RPC trigger (`mergeUserProfiles`). |
| `src/lib/geo.ts` | **Protected** | Client-side IP & timezone country detection helper for dial code prefill (`+91`, `+1`, `+971`, etc.). |
| `src/components/office/SignIn.tsx` | **Protected** | Guest Sign-in UI. Step 1 mobile-only input, returning user check, 4-digit OTP digits, and Google SSO fallback. |
| `src/components/office/OfficeApp.tsx` | **Protected** | Private Office portal. Includes inline `+ Add Mobile Number` linking with 4-digit OTP verification and account auto-merge. |
| `src/app/auth/callback/page.tsx` | **Protected** | React Client Component OAuth callback page with Truth Estate luxury styling. |
| `supabase/migrations/0014_google_sso_unified_profiles.sql` | **Protected** | Supabase SQL migration: UNIQUE indexes on `user_profiles(email)` and `user_profiles(phone)`, plus `merge_user_profiles` RPC. |

---

## 2. Core Auth Rules & Workflows

### A. Dual Identity Validation Rules
- **Indian Residents (`+91`)**:
  - **Mandatory**: Mobile Number verified via MSG91 4-digit SMS OTP.
  - **Optional**: Email address.
  - **UX**: Step 1 asks for 10-digit Indian mobile number. Checks returning status (`phoneKnown`) and sends 4-digit SMS OTP.
- **International Visitors (Non-`+91`)**:
  - **Mandatory**: Verified Email via **Google SSO**.
  - **Optional**: Mobile / WhatsApp number for advisory contact notes.
  - **UX**: Selecting a non-`+91` dial code (`+1`, `+971`, `+44`, etc.) presents Google SSO as the primary verified entry point.

### B. Automated Profile Merging (Account Unification)
- When a user logs in via Google SSO (`Profile B`) and later verifies an Indian phone number (`Profile A`) via 4-digit SMS OTP:
  1. The system verifies physical possession of the SIM card via MSG91.
  2. Supabase RPC `merge_user_profiles(target_uid, source_uid)` **merges Profile A and Profile B into one unified account**.
  3. All past Razorpay receipts, unlocked project reports, buyer briefs, and chat sessions are **instantly re-assigned to the unified profile**.
  4. Logging in next time via **either** Google SSO or Phone OTP lands in the **exact same Private Office**.

---

## 3. Database Constraints (`0014_google_sso_unified_profiles.sql`)

```sql
-- Enforce single source of truth uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_email_key 
  ON public.user_profiles (email) 
  WHERE email IS NOT NULL AND email != '';

CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_phone_key 
  ON public.user_profiles (phone) 
  WHERE phone IS NOT NULL AND phone != '';
```
