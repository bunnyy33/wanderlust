# Task: RESTORE-UAE-SEED — full-stack-developer

## Goal
Restore the lost UAE-focused catalog seed (`prisma/seed.ts`) for the Wanderlust luxury tourism booking platform after a git reset.

## Inputs read
- `/home/z/my-project/worklog.md` — project history (luxury teal/gold theme, Prisma schema, API routes, admin CRUD, booking flow, email log).
- `/home/z/my-project/prisma/schema.prisma` — confirmed new `cancellationType String @default("FLEXIBLE")` field with `FLEXIBLE | MODERATE | STRICT` values, plus existing `cancellationPolicy` field.
- `/home/z/my-project/prisma/seed.ts` (existing) — 21-experience international set; preserved the `img()` helper, `ExpSeed` type shape, review templates, reviewer list, coupon list and `main()` flow as the structural template.
- `/home/z/my-project/src/lib/db.ts` — confirmed `db` Prisma client singleton import path (`@/lib/db` from app, `../src/lib/db` from prisma scripts).

## What was written
Complete rewrite of `/home/z/my-project/prisma/seed.ts` (~2000 lines):
- **18 destinations** (10 UAE + 8 international).
- **77 experiences** (65 UAE + 12 international) — Dubai 36, Abu Dhabi 12, Sharjah 3, RAK 2, Fujairah 3, Khor Fakkan 1, Musandam 2, Ajman 1, Al Ain 1, Hatta 2, plus Sir Bani Yas and East Coast Scuba Dive filed under Abu Dhabi/Fujairah. International 12 kept verbatim from the original seed (Maldives villa, Maldives sandbank, Santorini caldera cruise, Santorini wine tour, Bali Mount Batur, Bali Ubud, Jungfrau, Glacier Express, Marrakech Agafay, Kyoto highlights, Amalfi cruise, Paris Eiffel + cruise).
- **21 hotels** (10 UAE + 11 international) — added Atlantis The Palm, Rixos The Palm, Anantara The Palm, Bab al Shams, Emirates Palace Abu Dhabi, Qasr Al Sarab, Anantara Sir Bani Yas; kept Atlantis The Royal, Burj Al Arab, Armani Hotel Dubai + all relevant international luxury hotels.
- **60 reviews** (up from 42), **25 reviewers**, **6 coupons** (added UAE15).
- `img()` helper reused with `IMG` constant map of known-working Unsplash IDs (Dubai skyline, desert dunes, desert camp, marina/yacht, creek/abra, beach/ocean, waterpark, aquarium, helicopter, balloon, mountain + original international IDs).
- Each experience carries realistic UAE vendor (Arabian Adventures, Emaar Entertainment, Atlantis Resorts, Jumeirah Group, Farah Experiences, Marine Luxury Charters, Dubai Balloon Adventures, etc.), price (Burj Khalifa $45-135, desert safari $35-220, yacht $480, helicopter $200, balloon $320, Ferrari World $85, Sheikh Zayed Grand Mosque $35), duration + durationHours, rating 4.4-5.0, reviewCount 220-5621, 4-5 highlights, 3-5 itinerary items, 3-5 includes/excludes, groupSize, meetingPoint, availability 4-50, bookedCount 220-4821, tags, featured ~15, bestseller ~20.
- Cancellation logic in `main()` infers `cancellationType` from `type`: ATTRACTION/TRANSFER → STRICT, CRUISE/ACTIVITY → MODERATE, TOUR/ADVENTURE → FLEXIBLE — with matching `cancellationPolicy` text.
- `main()` clears wishlist → review → emailLog → booking → experience → hotel → destination → coupon (FK-safe order), then re-seeds. Reviews and reviewCount/rating aggregation run after experiences/hotels.

## Verification
Ran `bun run prisma/seed.ts` (filtered prisma:query logs):
```
🌱 Seeding Wanderlust UAE-focused catalog...
  ✓ Destination: Dubai
  ✓ Destination: Abu Dhabi
  ✓ Destination: Sharjah
  ✓ Destination: Ras Al Khaimah
  ✓ Destination: Fujairah
  ✓ Destination: Ajman
  ✓ Destination: Al Ain
  ✓ Destination: Hatta
  ✓ Destination: Musandam (Khasab)
  ✓ Destination: Khor Fakkan
  ✓ Destination: Maldives
  ✓ Destination: Santorini
  ✓ Destination: Bali
  ✓ Destination: Swiss Alps
  ✓ Destination: Marrakech
  ✓ Destination: Kyoto
  ✓ Destination: Amalfi Coast
  ✓ Destination: Paris
  ✓ 77 experiences seeded
  ✓ 21 hotels seeded
  ✓ 60 reviews seeded
  ✓ 6 coupons seeded
✅ Seeding complete!
```

Count verification (`bun -e` inline script):
```
UAE exp: 65 | total: 77 | hotels: 21 | UAE dests: 10
```

All thresholds met:
- Total experiences printed: **77** (≥ 75 ✓)
- UAE experiences: **65** (≥ 60 ✓)
- Hotels: **21** (target 21 ✓)
- UAE destinations: **10** (target 10 ✓)

## Result
Seed runs cleanly with no errors. UAE-focused catalog is fully restored and verified.
