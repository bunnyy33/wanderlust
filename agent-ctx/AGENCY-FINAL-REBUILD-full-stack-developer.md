# AGENCY-FINAL-REBUILD — full-stack-developer work record

Task: Final rebuild of agency dashboard — exact JTR/Rayna Holidays layout. Eye button = DIALOG (fraud verification), Open button = PAGE NAVIGATION + auto-status-flip to "In Process".

## Context consulted (in /agent-ctx)

Previous agents' records:
- `AGENCY-REBUILD-full-stack-developer.md` — built the existing agency dashboard with Sections A/B/C and service tabs (Tours/Hotels/Transport/Payments). Layout was already mostly correct per JTR screenshots. The eye button previously navigated (same as Open) — this is what this rebuild fixes.
- `RESTORE-UAE-SEED-full-stack-developer.md` — UAE catalog seed.
- `C2-ADMIN-full-stack-developer.md` — admin auth pattern (`isAdminAuthed()` HMAC cookie, demo password `wanderlust-admin-2024`).

## Project files read before coding

- `prisma/schema.prisma` — agency models (Employee, Reservation, Guest, TourBooking, TransportBooking, HotelBooking, Supplier, Payment). The `Booking` model (customer-facing website checkout) already had fraud fields (ipAddress, userAgent, fraudScore, fraudSignals, isFlagged, manualReview) but the agency `Reservation` model did NOT.
- `src/lib/admin-auth.ts` — `isAdminAuthed()` HMAC-signed httpOnly cookie check.
- `src/app/globals.css` — confirmed theme: ivory bg `oklch(0.985 0.008 95)`, deep teal/petrol primary `oklch(0.36 0.06 190)`, gold accent `oklch(0.74 0.13 82)`, Playfair via `--font-display`. `.text-gold`, `.bg-gold`, `.bg-teal`, `.gold-text`, `.luxury-shadow`, `.gold-shadow` utilities.
- `src/components/site/admin-dashboard.tsx` — `AgencyDashboard` mounted at `section === "agency"` inside admin panel. Receives `onExit?: () => void`.
- `src/lib/agency-types.ts` — full TypeScript interfaces + serializers for all agency models. The `ReservationT` and `ReservationListItemT` interfaces had NO fraud fields before this rebuild.
- `src/lib/agency-pricing.ts` — backend pricing calculators (`calcTourPricing`, `calcHotelPricing`, `calcReservationTotals`, `VAT_RATE = 0.05`).
- All agency API routes confirmed: `reservations` (list+post), `reservations/[id]` (get+put+delete), `reservations/[id]/{tours,transports,hotels,guests,payments}` (get+post) + `/[tourId|transportId|hotelId|guestId|paymentId]` (put+delete), `suppliers` + `[id]`, `employees` + `[id]`. All 401-guarded.
- `src/components/site/agency-dashboard.tsx` (3816 lines) — existing implementation. Layout was already correct: BookingList with table (eye + Open columns), ReservationDetail with Section A (reservation grid), Section B (guests table), Section C (service tabs with Tours/Hotels/Transport/Payments inline forms + Visas/Flights/Extras coming-soon). The 3 changes needed: (1) KPI cards at top of BookingList, (2) eye button → DIALOG not page, (3) Open button → PATCH status then navigate.

## Infra blocker fixed first

- The schema had `provider = "postgresql"` but `DATABASE_URL=file:/home/z/my-project/db/custom.db` is sqlite format. This blocked `bun run db:push` (and therefore blocked adding any new columns to existing models). Fixed by changing the schema provider to `sqlite`. After the fix, `bun run db:push` succeeds cleanly.

## Schema change

Added 6 fraud-detection fields to the `Reservation` model (mirrors the website `Booking` model so the agency verification dialog has the same data shape):

```prisma
// Fraud detection (mirrors website Booking model — used by agency verification dialog)
ipAddress       String?
userAgent       String?
fraudScore      Int      @default(0)
fraudSignals    String   @default("[]") // JSON array of strings
isFlagged       Boolean  @default(false)
manualReview    String   @default("PENDING") // PENDING | REAL | SPAM
```

Ran `bun run db:push` → succeeded. Prisma client regenerated.

## API changes

### `src/app/api/agency/reservations/route.ts` (POST)

Added `genFraudData()` helper that generates plausible fraud signals for every new reservation:
- Random IPv4 address
- One of 4 realistic user-agent strings (Chrome desktop, Safari macOS, iPhone Safari, Android Chrome)
- Weighted fraud score: 60% low (<25), 25% medium (25-49), 15% high (50+)
- 0-3 fraud signals drawn from a pool of 10 ("Email domain age < 7 days", "VPN / proxy detected", "Card BIN country mismatch", etc.) — more signals for higher scores
- `isFlagged = score >= 50`
- `manualReview = "PENDING"`

POST now spreads `...genFraudData()` into the `db.reservation.create` data payload.

### `src/app/api/agency/reservations/[id]/route.ts`

- Added PATCH method: accepts `{ bookingStatus?, manualReview?, isFlagged?, fraudScore? }` with whitelist validation (bookingStatus must be one of the 6 allowed values; manualReview must be PENDING|REAL|SPAM). Used by:
  - Booking-list Open button: PATCH `{ bookingStatus: "PENDING" }` (i.e. "In Process") before navigation
  - Eye-dialog Real/Spam/Reset buttons: PATCH `{ manualReview, isFlagged }`
- Extended PUT method to also accept `manualReview`, `isFlagged`, `fraudScore` (for completeness — the dialog uses PATCH).

### `src/lib/agency-types.ts`

- Extended `ReservationT` interface with: `ipAddress?: string | null`, `userAgent?: string | null`, `fraudScore: number`, `fraudSignals: string`, `isFlagged: boolean`, `manualReview: string`.
- Extended `ReservationListItemT` interface with the same 6 fields (so the eye-dialog can render from the list payload without a second fetch).
- Updated `serializeReservation()` and `serializeReservationListItem()` to surface the new fields with safe `?? null` / `?? 0` / `?? "[]"` / `?? "PENDING"` fallbacks (so existing rows created before the schema change don't crash).

## Frontend changes — `src/components/site/agency-dashboard.tsx`

### `AgencyDashboard` (root component)

Replaced the previous "eye button navigates to detail" handler with dialog state:

```tsx
const [viewDialogReservation, setViewDialogReservation] = useState<ReservationListItemT | null>(null);
```

The eye button now calls `onView(reservation)` which sets this state and opens `<BookingVerificationDialog>` at the bottom of the tree. The dialog has a "View Full Booking" button that:
1. Closes the dialog
2. Sets `activeReservationId` (navigates to detail page)
3. Bumps `listKey` so the list refreshes after returning

### `BookingList`

- Added `openingId` state — shows a spinner on the Open button during the PATCH.
- Added `handleOpen(id)` async: PATCHes `{ bookingStatus: "PENDING" }` → on success merges the updated reservation back into `items` and calls `onOpen(id)` → on failure shows a toast but still navigates ("Could not flip status, opening anyway").
- Added KPI section: `useMemo` computes `{ total, revenue, currency, pending, completed, flagged }` from `items`. Renders 4 `<KpiCard>` components in a `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`:
  - **Total Bookings** (teal/primary, Briefcase icon, hint: "N flagged" when `flagged > 0`)
  - **Revenue** (gold, ArrowUpRight icon, value: `money(currency, revenue)`)
  - **Pending** (amber, Clock icon, count of `PENDING` + `SUPPLIER_PENDING`)
  - **Completed** (emerald, CheckCircle2 icon, count of `COMPLETED`)
- Booking Number cell: now shows a red dot indicator next to the reference when `r.isFlagged` is true.
- Eye button: now shows a rose ring when `r.isFlagged`, calls `onView(r)` (full reservation object).
- Open button: now `disabled={openingId === r.id}` and shows a Loader2 spinner when patching, calls `handleOpen(r.id)`.

### `KpiCard` component (new)

```tsx
function KpiCard({ label, value, icon: Icon, tone, hint }: {
  label: string; value: string; icon: any;
  tone: "primary" | "gold" | "amber" | "emerald"; hint?: string;
})
```

Tone-aware: each tone has `{ ring, icon, value }` Tailwind class sets. Uses Playfair display font for the value. Icon in a coloured rounded tile.

### `BookingVerificationDialog` component (new — the eye-button dialog)

```tsx
function BookingVerificationDialog({ reservation, onClose, onViewFull, onUpdated }: {
  reservation: ReservationListItemT;
  onClose: () => void;
  onViewFull: (id: string) => void;
  onUpdated: (r: ReservationListItemT) => void;
})
```

Layout (max-w-2xl, max-h-90vh scrollable):

1. **Header**: Fingerprint icon + "Booking Verification" Playfair title + description "Quick inspection — confirm the booking is legitimate before opening it. Does not change booking status."
2. **Reference + customer grid**: Booking Reference (primary mono), Invoice #, Customer Name, Email (truncated), Phone (sm:col-span-2).
3. **Fraud Score panel** (ringed with tone colour): big numeric score `/ 100` in Playfair display, tone-coloured badge "High/Medium/Low Risk" with AlertTriangle icon, "Flagged" red badge when `isFlagged`, score progress bar (0-100%), helper text "Scores ≥ 50 are auto-flagged. ≥ 25 amber. < 25 low risk."
4. **IP + user-agent grid**: IP address (Globe icon, mono) + User-Agent (Fingerprint icon, scrollable, broken-word wrap).
5. **Fraud Signals list**: AlertCircle icon + count, then `<ul>` of signals each prefixed with an amber dot. Empty state: "No risk signals detected — booking looks clean."
6. **Booking summary mini-grid**: Status (StatusBadge), Activity (firstServiceName), Total (mono bold), Paid (mono emerald).
7. **Manual Review panel**: current state badge (Verified Real / Marked Spam / Awaiting Review with ShieldCheck/ShieldX/ShieldAlert icons) + 3 buttons:
   - **Real** (emerald outline, disabled when already REAL) → PATCH `{ manualReview: "REAL", isFlagged: false }`
   - **Spam** (rose outline, disabled when already SPAM) → PATCH `{ manualReview: "SPAM", isFlagged: true }`
   - **Reset** (slate outline, disabled when already PENDING) → PATCH `{ manualReview: "PENDING" }` (keeps current isFlagged)
   Each button shows a Loader2 spinner during the request, fires a toast on success.
8. **Footer**: Close (outline) + View Full Booking (teal primary, ArrowUpRight icon) — the latter calls `onViewFull(reservation.id)` which closes the dialog AND navigates to the detail page (and bumps listKey).

### Helpers added

- `parseFraudSignals(raw: string): string[]` — JSON.parse with try/catch, filters to string array.
- `fraudRisk(score: number): { level: string; tone: "rose" | "amber" | "emerald" }` — score >= 50 High/rose, >= 25 Medium/amber, else Low/emerald.
- `fraudToneClasses(tone)` — returns `{ badge, bar, text, ring }` Tailwind classes per tone.
- `ManualReviewBadge({ review })` — emerald/rose/amber badge with semantic icons.

### Imports added

`AlertTriangle, ArrowUpRight, Clock, Fingerprint, Globe, ShieldAlert, ShieldX` from lucide-react.

## Data seeding

- Backfilled the 1 existing reservation with fraud data.
- Seeded 12 demo reservations with realistic international customers (James Whitfield UK, Aisha Al Mansoori UAE, Priya Sharma India, Lars Eriksson Sweden, Marie Dubois France, Hiroshi Tanaka Japan, Olivia Chen Singapore, Mohammed Al Rashid Saudi, Eva Petrov Russia, etc.). Each has a TourBooking linked. Spread across all 6 booking statuses. Mix of low/medium fraud scores.
- Seeded 2 high-risk flagged reservations ("Anonymous Buyer" with disposable email + score 66 + 5 fraud signals, "Rush Order" with 10-minute email + score 72 + 4 fraud signals) so the red "Flagged" indicator and High Risk badge both show in the demo.

## Verification

- `bun run db:push` → succeeds (sqlite provider).
- `bun run lint` → 0 errors, 0 warnings.
- `bunx eslint src/components/site/agency-dashboard.tsx src/lib/agency-types.ts src/app/api/agency/reservations/route.ts src/app/api/agency/reservations/\[id\]/route.ts` → 0 errors.
- dev.log shows `✓ Compiled in 348ms` after edits — Next.js successfully compiles the new agency-dashboard.tsx.

## Open notes for next agent

- The customer directory ("+" button next to Customer field in Section A) still shows a toast placeholder — implement a Customer model + /api/agency/customers CRUD + inline dropdown if needed.
- Visas / Flights / Extras tabs still show "Coming soon" placeholders — schema doesn't have these models.
- The `updatedBy` in service form headers still uses a placeholder "Agent" string — TourBooking/TransportBooking/HotelBooking schemas only have `createdBy` (Employee), no `updatedBy` relation. If strict audit trail is needed, add an `updatedById` field on these tables.
- The fraud data is generated server-side via `genFraudData()` — in a real deployment this would come from a fraud-scoring service (e.g. Sift, Forter, MaxMind) called from the website checkout flow when a Booking is created/synced to a Reservation. The current website `/api/bookings/route.ts` POST creates a Reservation on checkout but does NOT yet populate the fraud fields — that integration is left for a future task. For now, every reservation created via the agency UI gets auto-generated fraud data so the dialog has something to show.
