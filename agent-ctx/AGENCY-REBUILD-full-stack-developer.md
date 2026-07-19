# AGENCY-REBUILD — full-stack-developer work record

Task: Rebuild agency dashboard to match Rayna Tours / JTR Holidays style (inline forms, booking list, status workflow) and sync website bookings into the agency system.

## Context consulted (in /agent-ctx)

Previous agents' records:
- `RESTORE-UAE-SEED-full-stack-developer.md` — restored UAE content + agency seed data (WL-RES-100001 demo reservation).
- `C2-ADMIN-full-stack-developer.md` — admin auth pattern (`isAdminAuthed()` via HMAC-signed httpOnly cookie; demo password `wanderlust-admin-2024`), Coupons + booking cancel/refund admin pattern, shadcn component confirmation (switch, label, dialog, alert-dialog, table, select, badge, card, skeleton, button, input, textarea all present).

Project files read before coding:
- `prisma/schema.prisma` — agency models: Employee, Reservation (with subTotal/vatAmount/totalAmount/amountPaid/balanceDue + bookingStatus String free-text, invoiceType TAXABLE|ZERO_RATED|EXEMPT, isGuest Boolean), Guest (title Mr/Mrs/Miss/Master/Dr, paxType ADULT|CHILD|INFANT, nationality), TourBooking (costUnit PER_PERSON|PER_BOOKING, adultCostRate/childCostRate/carCostRate/netAdultRate/netChildRate/totalCost + matching sell fields, transferOption WITHOUT_TRANSFER|SHARED|PRIVATE, status INITIATED|SUPPLIER_CONFIRMED|CUSTOMER_CONFIRMED|CONFIRMED|CANCELLED), TransportBooking (carType SEDAN|SUV|MINIVAN|VAN|LUXURY|COACH, transportType ARRIVAL|DEPARTURE|INTERCITY|HOURLY, netRate/sellRate/margin auto), HotelBooking (roomType, mealPlan BB|HB|FB|AI, checkInDate/checkOutDate, nights, noOfRooms, costPerNight/totalCost + sellPerNight/totalSell auto), Supplier (type TOUR|HOTEL|TRANSPORT|VISA|FLIGHT, markupType PERCENT|FIXED, rating 1-5), Payment (amount, paymentMethod CASH|CARD|BANK_TRANSFER|WHATSAPP|ONLINE, status PENDING|RECEIVED|REFUNDED).
- `src/lib/admin-auth.ts` — `isAdminAuthed()` HMAC-signed httpOnly cookie check.
- `src/app/globals.css` — confirmed theme: ivory bg `oklch(0.985 0.008 95)`, deep teal/petrol primary `oklch(0.36 0.06 190)`, gold accent `oklch(0.74 0.13 82)`, Playfair via `--font-display`. `.text-gold`, `.bg-gold`, `.bg-teal`, `.gold-text`, `.luxury-shadow`, `.gold-shadow` utilities defined.
- `src/components/site/admin-dashboard.tsx` (line 102, 644) — `AgencyDashboard` is mounted at `section === "agency"` inside the admin main panel which already provides Header + Sidebar + main wrapper (`p-4 sm:p-6 lg:p-8`). Component receives `onExit?: () => void`. No need to add header/sidebar.
- `src/lib/agency-types.ts` — full ReservationT / TourBookingT / TransportBookingT / HotelBookingT / GuestT / PaymentT / EmployeeT / SupplierT TypeScript interfaces + serializers (Dates → ISO strings) + client-side `calcTourPricing`, `calcHotelPricing`, `calcReservationTotals` (re-exported from agency-pricing.ts).
- `src/lib/agency-pricing.ts` — backend `calcTourPricing`, `calcHotelPricing`, `calcNights`, `calcReservationTotals` + `VAT_RATE = 0.05`.
- `src/lib/agency-recalc.ts` — `recalcReservation(id)` re-computes subTotal/VAT/totalAmount/amountPaid/balanceDue after every service/payment mutation.
- All agency API routes confirmed: reservations (list+post, get+put+delete), reservations/[id]/{tours,transports,hotels,guests,payments} (get+post) + /[tourId|transportId|hotelId|guestId|paymentId] (put+delete — paymentId only delete), suppliers (list+post), suppliers/[id] (put+delete), employees (list+post), employees/[id] (put+delete). All 401-guarded, all use serializeX() + recalcReservation where applicable.
- `src/app/api/experiences/route.ts` GET — public catalog, returns status:ACTIVE experiences with `destination` included. Used to populate the Tours dropdown.
- `src/app/api/hotels/route.ts` GET — public catalog, used to populate the Hotels dropdown (via `?limit=200`).
- `src/app/api/bookings/route.ts` POST — website checkout flow. Creates Booking (status PENDING, paymentStatus PAID, paymentMethod CARD), updates experience availability, fires confirmation email. Returns `{ booking, reference }`.

## Files modified

1. `src/lib/agency-types.ts`
   - Added optional `firstServiceName?: string | null` to `ReservationListItemT` interface.
   - Updated `serializeReservationListItem(r)` to compute it from the included `tours/transports/hotels` relations: tours[0].tourName → hotels[0].hotelName → transports[0] pickup→dropoff string → "Transfer" fallback. This powers the "Activity Name" column in the new booking list (the GET /api/agency/reservations route already includes these relations).

2. `src/components/site/agency-dashboard.tsx` — COMPLETE REPLACEMENT (4778 → ~1900 lines)
   - Old file used a wizard / section-switcher pattern. New file implements exactly two views per the spec:
     - **View 1 — BookingList**: page header with Playfair "Reservations" + count; filter Card with search input + status Select dropdown (All + 6 statuses); dense Table with exact required columns: Booking Number (WL-RES-XXXXXX mono + StatusBadge), Customer Name, Email Address, Phone Number, Activity Name (firstServiceName or italic placeholder), View (Eye icon), Open (CTA button). New Booking button POSTs stub + opens detail.
     - **View 2 — ReservationDetail**: sticky top bar (Back + reference + status + invoice + total + Reload/Exit); then ONE scrollable page with three inline sections:
       - Section A — ReservationDetailsSection: grid (1/2/3/4 cols responsive) of all required fields. Booking Status Select with exactly the 6 spec options mapped to backend PENDING/SUPPLIER_PENDING/SUPPLIER_CONFIRMED/CUSTOMER_CONFIRMED/COMPLETED/CANCELLED. Invoice Type Select (Taxable Invoice 5% / Zero Rated / Exempt). Sale By Select from `/api/agency/employees?active=1`. Green "Save Record" (bg-emerald-600) PUTs the reservation. Below grid: 5-tile financial summary (Subtotal / VAT / Total / Paid / Balance Due) with semantic colors.
       - Section B — GuestsSection: inline-editable Table where each row has Title Select (Mr/Mrs/Miss/Master/Dr), Guest Name, Email, Phone, Passport, Pax Type Select (Adult/Child/Infant), Nationality Select (full country list). Per-row Trash2 delete. Header right: blue "Add New" + green "Save Record(s)" (Save does diff: DELETE removed + PUT existing + POST new).
       - Section C — Service Tabs Card: horizontal tab bar (Home | Hotels | Tours | Visas | Flights | Transport | Extras | Payments) with lucide icons + count badges; active tab = teal bg + white text. Clicking a tab opens inline form BELOW on the same page (no dialog/wizard):
         - HomeTab: customer/services/invoice/timeline summary cards.
         - ToursTab: list view (table of saved tours) + inline TourFormCard. Header bar (teal bg, white text) with "Updated at: … By: Agent" + X close button. Tour Details grid: Tour Select (from /api/experiences), Tour Option, Transfer Option Select (Without/Shared/Private), Pickup Location, Tour Date, Pickup Time, Time Slot, No of Adults/Children, Supplier Select (from /api/agency/suppliers?type=TOUR) + AddSupplierButton, Confirmation Number, Status Select (5 options), Comments Textarea. Pricing: Cost Unit Select (Per Person / Per Booking), Cost Price subsection (Adult/Child/Car Rate + auto-calc Net Adult/Net Child read-only + Total Cost), Selling Price subsection (same layout, teal-accented, auto-calc Total Sell). Auto-calc via `useMemo` on form state. Show on Voucher Switch. Footer: Cancel + green Save/Add.
         - HotelsTab: list view + inline HotelFormCard. Hotel Select (from /api/hotels), Room Type, Meal Plan Select (BB/HB/FB/AI), Check-in/out Dates, Nights, No of Rooms, No of Adults/Children, Supplier + AddSupplierButton, Confirmation, Status, Show on Voucher, Comments. Pricing with auto-calc totalCost/totalSell via `calcHotelPricing`.
         - TransportTab: list view + inline TransportFormCard. Car Select (Sedan/SUV/Minivan/Van/Luxury/Coach), No of Pax, Transport Type Select (Arrival/Departure/Intercity/Hourly), Pick Up Date Time (datetime-local), Pickup/Dropoff Locations, Flight Number, Net Rate (cost), Sell Rate, Margin read-only auto-calc, Supplier + AddSupplierButton, Contact Number, Status Select, Confirmation, Show on Voucher, Comments.
         - PaymentsTab: list view + inline form. Amount, Payment Method Select (Cash/Card/Bank Transfer/WhatsApp/Online), Status Select (Received/Pending/Refunded), Payment Date, Reference, Notes.
         - VisasTab / FlightsTab / ExtrasTab: styled "Coming soon" placeholders with icon + explanatory text.
   - Reusable components: AddSupplierButton → SupplierAddDialog (full supplier create form, default type matches tab), EmptyServiceState, LoadingBlock, ErrorState, StatusBadge (semantic colors per status), SummaryStat, DetailItem, ServiceCount, ServiceFormHeader (teal header bar with Updated at + By + X), ServiceListHeader (list view header with Add button).
   - Reusable hooks: `useEmployees()`, `useSuppliers(type?)`, `useExperiences()`, `useHotelsCatalog()` — all fetch from existing API routes with loading state + reload callback.
   - Pricing auto-calc: `useMemo` over form state using `calcTourPricing` / `calcHotelPricing` — Net Adult/Child rates and Total Cost/Sell update in real time as the user types (display only — backend recalculates on save).
   - Style: Playfair serif headings (`style={{fontFamily:'var(--font-display)'}}`), teal primary, gold accents, ivory background, emerald Save buttons (bg-emerald-600), teal Add buttons (bg-primary), teal service-form header bars with white text. Card `luxury-shadow`. Sonner toasts for every save/delete/error. Skeletons during loading. Responsive grid (mobile 1 col → desktop 4 cols). No blue/indigo colors used.
   - Uses existing shadcn components only: AlertDialog, Badge, Button, Card, Dialog, Input, Label, Select, Separator, Skeleton, Switch, Table, Textarea.

3. `src/app/api/bookings/route.ts`
   - Added two helper functions at top: `pickUniqueAgencyReference()` and `pickUniqueAgencyInvoice()` — both generate `WL-RES-XXXXXX` / `WL-INV-XXXXXX` (6-digit suffix) with 8-try collision retry against the DB, falling back to `Date.now()` slice if all retries fail.
   - After the existing Booking creation + email send (and before the final NextResponse.json), wrapped in try/catch (sync failures must NEVER break the website checkout flow):
     - Generates unique `WL-RES-XXXXXX` reference + `WL-INV-XXXXXX` invoice.
     - Creates Reservation: customerName/Email/Phone from booking, `isGuest: true`, `bookingStatus: "CUSTOMER_CONFIRMED"` (paid online), `invoiceType: "TAXABLE"`, `currency: "USD"`, `remarks: "Auto-synced from website booking <ref>."`, `termsAccepted: true`.
     - Creates TourBooking (if EXPERIENCE) or HotelBooking (if HOTEL) with `confirmationNumber: <website reference>`, `status: "CUSTOMER_CONFIRMED"`, cost ≈ unitPrice, sell = totalAmount (split per-adult or per-night).
     - Creates Payment record: `paymentMethod: "ONLINE"`, `status: "RECEIVED"`, `amount: totalAmount`, `reference: <website reference>`.
     - Recalculates reservation subTotal/VAT/totalAmount/amountPaid/balanceDue inline (mirrors `recalcReservation` logic without an extra round-trip).

## Verification

- `bun run lint` → exit 0, 0 errors, 0 warnings in new/modified files.
- `/home/z/my-project/dev.log` shows `✓ Compiled in 331ms` after edits — Next.js successfully compiles the new agency-dashboard.tsx + bookings route changes.
- Note: pre-existing infra issue (prisma schema says `provider = "postgresql"` but `DATABASE_URL=file:.../custom.db` is sqlite format) — out of scope for this task; doesn't affect Next.js compilation. The new sync block is wrapped in try/catch so any runtime DB issue won't break the website checkout.

## Open notes for next agent

- The schema provider mismatch (`postgresql` vs sqlite DATABASE_URL) blocks `bun run db:push`. Either change schema to `provider = "sqlite"` or set DATABASE_URL to a real postgres URL. This is pre-existing — the dev DB was already seeded before the mismatch appeared.
- The customer directory ("+" button next to Customer field) shows a toast placeholder — implement a Customer model + /api/agency/customers CRUD + an inline dropdown if needed in a future task.
- Visas / Flights / Extras tabs show "Coming soon" placeholders — schema doesn't have these models. Add models + API routes + forms if needed.
- The "Updated at: … By: …" in service form headers uses the booking's `updatedAt` (always present) and a placeholder "Agent" for the updated-by name. The TourBooking/TransportBooking/HotelBooking schemas only have `createdBy` (Employee), no `updatedBy` relation. If strict audit trail is needed, add an `updatedById` field on these tables.
