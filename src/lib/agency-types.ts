// Wanderlust — Agency booking system types & serializers

export type Role = "ADMIN" | "SENIOR_AGENT" | "JUNIOR_AGENT" | "ACCOUNTS";

export interface EmployeeT {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string | null;
  active: boolean;
  createdAt: string;
}

export interface SupplierT {
  id: string;
  name: string;
  type: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  currency: string;
  paymentTerms?: string | null;
  markupType: string;
  markupValue: number;
  active: boolean;
  rating: number;
  createdAt: string;
}

export interface GuestT {
  id: string;
  reservationId: string;
  title: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  passportNumber?: string | null;
  paxType: string;
  nationality?: string | null;
  dateOfBirth?: string | null;
  createdAt: string;
}

export interface TourBookingT {
  id: string;
  reservationId: string;
  tourId?: string | null;
  tourName: string;
  tourOption?: string | null;
  transferOption: string;
  pickupLocation?: string | null;
  tourDate: string;
  pickupTime?: string | null;
  timeSlot?: string | null;
  noOfAdults: number;
  noOfChildren: number;
  supplierId?: string | null;
  supplierName?: string | null;
  confirmationNumber?: string | null;
  status: string;
  comments?: string | null;
  costUnit: string;
  adultCostRate: number;
  childCostRate: number;
  carCostRate: number;
  netAdultRate: number;
  netChildRate: number;
  totalCost: number;
  adultSellRate: number;
  childSellRate: number;
  carSellRate: number;
  sellNetAdult: number;
  sellNetChild: number;
  totalSell: number;
  showOnVoucher: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransportBookingT {
  id: string;
  reservationId: string;
  carType: string;
  noOfPax: number;
  transportType: string;
  pickupDateTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  flightNumber?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  contactNumber?: string | null;
  confirmationNumber?: string | null;
  status: string;
  comments?: string | null;
  netRate: number;
  sellRate: number;
  margin: number;
  showOnVoucher: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HotelBookingT {
  id: string;
  reservationId: string;
  hotelId?: string | null;
  hotelName: string;
  roomType: string;
  mealPlan: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  noOfRooms: number;
  noOfAdults: number;
  noOfChildren: number;
  supplierId?: string | null;
  supplierName?: string | null;
  confirmationNumber?: string | null;
  status: string;
  comments?: string | null;
  costPerNight: number;
  totalCost: number;
  sellPerNight: number;
  totalSell: number;
  showOnVoucher: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FlightBookingT {
  id: string;
  reservationId: string;
  airline: string;
  flightNumber?: string | null;
  flightType: string;
  cabinClass: string;
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string | null;
  noOfAdults: number;
  noOfChildren: number;
  noOfInfants: number;
  supplierId?: string | null;
  supplierName?: string | null;
  pnr?: string | null;
  confirmationNumber?: string | null;
  status: string;
  comments?: string | null;
  adultCostRate: number;
  childCostRate: number;
  infantCostRate: number;
  totalCost: number;
  adultSellRate: number;
  childSellRate: number;
  infantSellRate: number;
  totalSell: number;
  showOnVoucher: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VisaBookingT {
  id: string;
  reservationId: string;
  visaType: string;
  destinationCountry: string;
  visaDuration?: string | null;
  processingType: string;
  applicationDate: string;
  travelDate?: string | null;
  noOfAdults: number;
  noOfChildren: number;
  supplierId?: string | null;
  supplierName?: string | null;
  applicationNumber?: string | null;
  confirmationNumber?: string | null;
  status: string;
  comments?: string | null;
  adultCostRate: number;
  childCostRate: number;
  totalCost: number;
  adultSellRate: number;
  childSellRate: number;
  totalSell: number;
  showOnVoucher: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExtraBookingT {
  id: string;
  reservationId: string;
  extraName: string;
  extraOption?: string | null;
  serviceDate?: string | null;
  quantity: number;
  supplierId?: string | null;
  supplierName?: string | null;
  confirmationNumber?: string | null;
  status: string;
  comments?: string | null;
  costRate: number;
  totalCost: number;
  sellRate: number;
  totalSell: number;
  showOnVoucher: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentT {
  id: string;
  reservationId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentDate: string;
  reference?: string | null;
  status: string;
  notes?: string | null;
  receivedBy?: string | null;
  createdAt: string;
}

export interface ReservationT {
  id: string;
  reference: string;
  invoiceNumber: string;
  customerId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  isGuest: boolean;
  orderDate: string;
  invoiceDate?: string | null;
  bookingStatus: string;
  saleById?: string | null;
  saleBy?: EmployeeT | null;
  createdById?: string | null;
  updatedById?: string | null;
  invoiceType: string;
  currency: string;
  subTotal: number;
  vatAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  remarks?: string | null;
  termsAccepted: boolean;
  // Fraud detection
  ipAddress?: string | null;
  userAgent?: string | null;
  fraudScore: number;
  fraudSignals: string; // JSON array string
  isFlagged: boolean;
  manualReview: string; // PENDING | REAL | SPAM
  tours: TourBookingT[];
  transports: TransportBookingT[];
  hotels: HotelBookingT[];
  flights: FlightBookingT[];
  visas: VisaBookingT[];
  extras: ExtraBookingT[];
  guests: GuestT[];
  payments: PaymentT[];
  createdAt: string;
  updatedAt: string;
}

export interface ReservationListItemT {
  id: string;
  reference: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  bookingStatus: string;
  orderDate: string;
  currency: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  saleById?: string | null;
  saleByName?: string | null;
  serviceCount: number;
  firstServiceName?: string | null;
  // Fraud detection (for the eye-button verification dialog)
  ipAddress?: string | null;
  userAgent?: string | null;
  fraudScore: number;
  fraudSignals: string; // JSON array string
  isFlagged: boolean;
  manualReview: string; // PENDING | REAL | SPAM
  createdAt: string;
}

// ------------------------------------------------------------------
// Serializers
// ------------------------------------------------------------------

export function serializeEmployee(e: any): EmployeeT {
  return {
    id: e.id,
    email: e.email,
    name: e.name,
    role: e.role as Role,
    phone: e.phone ?? null,
    active: e.active,
    createdAt: e.createdAt?.toISOString?.() ?? e.createdAt,
  };
}

export function serializeSupplier(s: any): SupplierT {
  return {
    id: s.id,
    name: s.name,
    type: s.type,
    contactPerson: s.contactPerson ?? null,
    email: s.email ?? null,
    phone: s.phone ?? null,
    whatsapp: s.whatsapp ?? null,
    address: s.address ?? null,
    city: s.city ?? null,
    country: s.country ?? null,
    currency: s.currency,
    paymentTerms: s.paymentTerms ?? null,
    markupType: s.markupType,
    markupValue: s.markupValue,
    active: s.active,
    rating: s.rating,
    createdAt: s.createdAt?.toISOString?.() ?? s.createdAt,
  };
}

export function serializeGuest(g: any): GuestT {
  return {
    id: g.id,
    reservationId: g.reservationId,
    title: g.title,
    fullName: g.fullName,
    email: g.email ?? null,
    phone: g.phone ?? null,
    passportNumber: g.passportNumber ?? null,
    paxType: g.paxType,
    nationality: g.nationality ?? null,
    dateOfBirth: g.dateOfBirth ? new Date(g.dateOfBirth).toISOString() : null,
    createdAt: g.createdAt?.toISOString?.() ?? g.createdAt,
  };
}

export function serializeTourBooking(t: any): TourBookingT {
  return {
    id: t.id,
    reservationId: t.reservationId,
    tourId: t.tourId ?? null,
    tourName: t.tourName,
    tourOption: t.tourOption ?? null,
    transferOption: t.transferOption,
    pickupLocation: t.pickupLocation ?? null,
    tourDate: t.tourDate ? new Date(t.tourDate).toISOString() : new Date().toISOString(),
    pickupTime: t.pickupTime ?? null,
    timeSlot: t.timeSlot ?? null,
    noOfAdults: t.noOfAdults,
    noOfChildren: t.noOfChildren,
    supplierId: t.supplierId ?? null,
    supplierName: t.supplierName ?? null,
    confirmationNumber: t.confirmationNumber ?? null,
    status: t.status,
    comments: t.comments ?? null,
    costUnit: t.costUnit,
    adultCostRate: t.adultCostRate,
    childCostRate: t.childCostRate,
    carCostRate: t.carCostRate,
    netAdultRate: t.netAdultRate,
    netChildRate: t.netChildRate,
    totalCost: t.totalCost,
    adultSellRate: t.adultSellRate,
    childSellRate: t.childSellRate,
    carSellRate: t.carSellRate,
    sellNetAdult: t.sellNetAdult,
    sellNetChild: t.sellNetChild,
    totalSell: t.totalSell,
    showOnVoucher: t.showOnVoucher,
    createdBy: t.createdBy ?? null,
    createdAt: t.createdAt?.toISOString?.() ?? t.createdAt,
    updatedAt: t.updatedAt?.toISOString?.() ?? t.updatedAt,
  };
}

export function serializeTransportBooking(t: any): TransportBookingT {
  return {
    id: t.id,
    reservationId: t.reservationId,
    carType: t.carType,
    noOfPax: t.noOfPax,
    transportType: t.transportType,
    pickupDateTime: t.pickupDateTime
      ? new Date(t.pickupDateTime).toISOString()
      : new Date().toISOString(),
    pickupLocation: t.pickupLocation,
    dropoffLocation: t.dropoffLocation,
    flightNumber: t.flightNumber ?? null,
    supplierId: t.supplierId ?? null,
    supplierName: t.supplierName ?? null,
    contactNumber: t.contactNumber ?? null,
    confirmationNumber: t.confirmationNumber ?? null,
    status: t.status,
    comments: t.comments ?? null,
    netRate: t.netRate,
    sellRate: t.sellRate,
    margin: t.margin,
    showOnVoucher: t.showOnVoucher,
    createdBy: t.createdBy ?? null,
    createdAt: t.createdAt?.toISOString?.() ?? t.createdAt,
    updatedAt: t.updatedAt?.toISOString?.() ?? t.updatedAt,
  };
}

export function serializeHotelBooking(h: any): HotelBookingT {
  return {
    id: h.id,
    reservationId: h.reservationId,
    hotelId: h.hotelId ?? null,
    hotelName: h.hotelName,
    roomType: h.roomType,
    mealPlan: h.mealPlan,
    checkInDate: h.checkInDate
      ? new Date(h.checkInDate).toISOString()
      : new Date().toISOString(),
    checkOutDate: h.checkOutDate
      ? new Date(h.checkOutDate).toISOString()
      : new Date().toISOString(),
    nights: h.nights,
    noOfRooms: h.noOfRooms,
    noOfAdults: h.noOfAdults,
    noOfChildren: h.noOfChildren,
    supplierId: h.supplierId ?? null,
    supplierName: h.supplierName ?? null,
    confirmationNumber: h.confirmationNumber ?? null,
    status: h.status,
    comments: h.comments ?? null,
    costPerNight: h.costPerNight,
    totalCost: h.totalCost,
    sellPerNight: h.sellPerNight,
    totalSell: h.totalSell,
    showOnVoucher: h.showOnVoucher,
    createdBy: h.createdBy ?? null,
    createdAt: h.createdAt?.toISOString?.() ?? h.createdAt,
    updatedAt: h.updatedAt?.toISOString?.() ?? h.updatedAt,
  };
}

export function serializeFlightBooking(f: any): FlightBookingT {
  return {
    id: f.id,
    reservationId: f.reservationId,
    airline: f.airline ?? "",
    flightNumber: f.flightNumber ?? null,
    flightType: f.flightType ?? "ONE_WAY",
    cabinClass: f.cabinClass ?? "ECONOMY",
    origin: f.origin ?? "",
    destination: f.destination ?? "",
    departDate: f.departDate
      ? new Date(f.departDate).toISOString()
      : new Date().toISOString(),
    returnDate: f.returnDate ? new Date(f.returnDate).toISOString() : null,
    noOfAdults: f.noOfAdults,
    noOfChildren: f.noOfChildren,
    noOfInfants: f.noOfInfants,
    supplierId: f.supplierId ?? null,
    supplierName: f.supplierName ?? null,
    pnr: f.pnr ?? null,
    confirmationNumber: f.confirmationNumber ?? null,
    status: f.status ?? "INITIATED",
    comments: f.comments ?? null,
    adultCostRate: f.adultCostRate,
    childCostRate: f.childCostRate,
    infantCostRate: f.infantCostRate,
    totalCost: f.totalCost,
    adultSellRate: f.adultSellRate,
    childSellRate: f.childSellRate,
    infantSellRate: f.infantSellRate,
    totalSell: f.totalSell,
    showOnVoucher: f.showOnVoucher,
    createdBy: f.createdBy ?? null,
    createdAt: f.createdAt?.toISOString?.() ?? f.createdAt,
    updatedAt: f.updatedAt?.toISOString?.() ?? f.updatedAt,
  };
}

export function serializeVisaBooking(v: any): VisaBookingT {
  return {
    id: v.id,
    reservationId: v.reservationId,
    visaType: v.visaType ?? "TOURIST",
    destinationCountry: v.destinationCountry ?? "",
    visaDuration: v.visaDuration ?? null,
    processingType: v.processingType ?? "NORMAL",
    applicationDate: v.applicationDate
      ? new Date(v.applicationDate).toISOString()
      : new Date().toISOString(),
    travelDate: v.travelDate ? new Date(v.travelDate).toISOString() : null,
    noOfAdults: v.noOfAdults,
    noOfChildren: v.noOfChildren,
    supplierId: v.supplierId ?? null,
    supplierName: v.supplierName ?? null,
    applicationNumber: v.applicationNumber ?? null,
    confirmationNumber: v.confirmationNumber ?? null,
    status: v.status ?? "INITIATED",
    comments: v.comments ?? null,
    adultCostRate: v.adultCostRate,
    childCostRate: v.childCostRate,
    totalCost: v.totalCost,
    adultSellRate: v.adultSellRate,
    childSellRate: v.childSellRate,
    totalSell: v.totalSell,
    showOnVoucher: v.showOnVoucher,
    createdBy: v.createdBy ?? null,
    createdAt: v.createdAt?.toISOString?.() ?? v.createdAt,
    updatedAt: v.updatedAt?.toISOString?.() ?? v.updatedAt,
  };
}

export function serializeExtraBooking(e: any): ExtraBookingT {
  return {
    id: e.id,
    reservationId: e.reservationId,
    extraName: e.extraName ?? "",
    extraOption: e.extraOption ?? null,
    serviceDate: e.serviceDate ? new Date(e.serviceDate).toISOString() : null,
    quantity: e.quantity,
    supplierId: e.supplierId ?? null,
    supplierName: e.supplierName ?? null,
    confirmationNumber: e.confirmationNumber ?? null,
    status: e.status ?? "INITIATED",
    comments: e.comments ?? null,
    costRate: e.costRate,
    totalCost: e.totalCost,
    sellRate: e.sellRate,
    totalSell: e.totalSell,
    showOnVoucher: e.showOnVoucher,
    createdBy: e.createdBy ?? null,
    createdAt: e.createdAt?.toISOString?.() ?? e.createdAt,
    updatedAt: e.updatedAt?.toISOString?.() ?? e.updatedAt,
  };
}

export function serializePayment(p: any): PaymentT {
  return {
    id: p.id,
    reservationId: p.reservationId,
    amount: p.amount,
    currency: p.currency,
    paymentMethod: p.paymentMethod,
    paymentDate: p.paymentDate
      ? new Date(p.paymentDate).toISOString()
      : new Date().toISOString(),
    reference: p.reference ?? null,
    status: p.status,
    notes: p.notes ?? null,
    receivedBy: p.receivedBy ?? null,
    createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
  };
}

export function serializeReservation(r: any): ReservationT {
  return {
    id: r.id,
    reference: r.reference,
    invoiceNumber: r.invoiceNumber,
    customerId: r.customerId ?? null,
    customerName: r.customerName,
    customerEmail: r.customerEmail,
    customerPhone: r.customerPhone ?? null,
    isGuest: r.isGuest,
    orderDate: r.orderDate ? new Date(r.orderDate).toISOString() : new Date().toISOString(),
    invoiceDate: r.invoiceDate ? new Date(r.invoiceDate).toISOString() : null,
    bookingStatus: r.bookingStatus,
    saleById: r.saleById ?? null,
    saleBy: r.employee ? serializeEmployee(r.employee) : null,
    createdById: r.createdById ?? null,
    updatedById: r.updatedById ?? null,
    invoiceType: r.invoiceType,
    currency: r.currency,
    subTotal: r.subTotal,
    vatAmount: r.vatAmount,
    totalAmount: r.totalAmount,
    amountPaid: r.amountPaid,
    balanceDue: r.balanceDue,
    remarks: r.remarks ?? null,
    termsAccepted: r.termsAccepted,
    ipAddress: r.ipAddress ?? null,
    userAgent: r.userAgent ?? null,
    fraudScore: r.fraudScore ?? 0,
    fraudSignals: r.fraudSignals ?? "[]",
    isFlagged: Boolean(r.isFlagged ?? false),
    manualReview: r.manualReview ?? "PENDING",
    tours: (r.tours ?? []).map(serializeTourBooking),
    transports: (r.transports ?? []).map(serializeTransportBooking),
    hotels: (r.hotels ?? []).map(serializeHotelBooking),
    flights: (r.flights ?? []).map(serializeFlightBooking),
    visas: (r.visas ?? []).map(serializeVisaBooking),
    extras: (r.extras ?? []).map(serializeExtraBooking),
    guests: (r.guests ?? []).map(serializeGuest),
    payments: (r.payments ?? []).map(serializePayment),
    createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
    updatedAt: r.updatedAt?.toISOString?.() ?? r.updatedAt,
  };
}

export function serializeReservationListItem(r: any): ReservationListItemT {
  const tours: any[] = r.tours ?? [];
  const transports: any[] = r.transports ?? [];
  const hotels: any[] = r.hotels ?? [];
  const flights: any[] = r.flights ?? [];
  const visas: any[] = r.visas ?? [];
  const extras: any[] = r.extras ?? [];

  let firstServiceName: string | null = null;
  if (tours[0]) firstServiceName = tours[0].tourName ?? null;
  if (!firstServiceName && hotels[0]) firstServiceName = hotels[0].hotelName ?? null;
  if (!firstServiceName && transports[0]) {
    const t = transports[0];
    firstServiceName = [t.pickupLocation, t.dropoffLocation]
      .filter(Boolean)
      .join(" → ");
    if (!firstServiceName) firstServiceName = "Transfer";
  }
  if (!firstServiceName && flights[0]) {
    const f = flights[0];
    firstServiceName =
      [f.airline, f.flightNumber, f.origin && f.destination ? `${f.origin} → ${f.destination}` : null]
        .filter(Boolean)
        .join(" — ") || "Flight";
  }
  if (!firstServiceName && visas[0]) {
    firstServiceName = visas[0].destinationCountry
      ? `${visas[0].destinationCountry} Visa`
      : "Visa";
  }
  if (!firstServiceName && extras[0]) {
    firstServiceName = extras[0].extraName || "Extra";
  }

  return {
    id: r.id,
    reference: r.reference,
    invoiceNumber: r.invoiceNumber,
    customerName: r.customerName,
    customerEmail: r.customerEmail,
    customerPhone: r.customerPhone ?? null,
    bookingStatus: r.bookingStatus,
    orderDate: r.orderDate ? new Date(r.orderDate).toISOString() : new Date().toISOString(),
    currency: r.currency,
    totalAmount: r.totalAmount,
    amountPaid: r.amountPaid,
    balanceDue: r.balanceDue,
    saleById: r.saleById ?? null,
    saleByName: r.employee?.name ?? null,
    serviceCount:
      tours.length +
      transports.length +
      hotels.length +
      flights.length +
      visas.length +
      extras.length,
    firstServiceName,
    ipAddress: r.ipAddress ?? null,
    userAgent: r.userAgent ?? null,
    fraudScore: r.fraudScore ?? 0,
    fraudSignals: r.fraudSignals ?? "[]",
    isFlagged: Boolean(r.isFlagged ?? false),
    manualReview: r.manualReview ?? "PENDING",
    createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
  };
}

// ------------------------------------------------------------------
// Pricing calculators — kept in sync with backend
// ------------------------------------------------------------------

export function calcTourPricing(input: {
  costUnit: string;
  adultCostRate: number;
  childCostRate: number;
  carCostRate: number;
  adultSellRate: number;
  childSellRate: number;
  carSellRate: number;
  noOfAdults: number;
  noOfChildren: number;
}) {
  const perPerson = input.costUnit === "PER_PERSON";
  const adults = input.noOfAdults;
  const children = input.noOfChildren;
  const netAdultRate = perPerson ? input.adultCostRate * adults : input.adultCostRate;
  const netChildRate = perPerson ? input.childCostRate * children : input.childCostRate;
  const totalCost = netAdultRate + netChildRate + input.carCostRate;
  const sellNetAdult = perPerson ? input.adultSellRate * adults : input.adultSellRate;
  const sellNetChild = perPerson ? input.childSellRate * children : input.childSellRate;
  const totalSell = sellNetAdult + sellNetChild + input.carSellRate;
  return { netAdultRate, netChildRate, totalCost, sellNetAdult, sellNetChild, totalSell };
}

export function calcTransportPricing(net: number, sell: number) {
  return { margin: sell - net };
}

export function calcHotelPricing(input: {
  costPerNight: number;
  sellPerNight: number;
  nights: number;
  noOfRooms: number;
}) {
  const totalCost = input.costPerNight * input.nights * input.noOfRooms;
  const totalSell = input.sellPerNight * input.nights * input.noOfRooms;
  return { totalCost, totalSell };
}

export function calcFlightPricing(input: {
  adultCostRate: number;
  childCostRate: number;
  infantCostRate: number;
  adultSellRate: number;
  childSellRate: number;
  infantSellRate: number;
  noOfAdults: number;
  noOfChildren: number;
  noOfInfants: number;
}) {
  const totalCost =
    input.adultCostRate * input.noOfAdults +
    input.childCostRate * input.noOfChildren +
    input.infantCostRate * input.noOfInfants;
  const totalSell =
    input.adultSellRate * input.noOfAdults +
    input.childSellRate * input.noOfChildren +
    input.infantSellRate * input.noOfInfants;
  return { totalCost, totalSell };
}

export function calcVisaPricing(input: {
  adultCostRate: number;
  childCostRate: number;
  adultSellRate: number;
  childSellRate: number;
  noOfAdults: number;
  noOfChildren: number;
}) {
  const totalCost =
    input.adultCostRate * input.noOfAdults +
    input.childCostRate * input.noOfChildren;
  const totalSell =
    input.adultSellRate * input.noOfAdults +
    input.childSellRate * input.noOfChildren;
  return { totalCost, totalSell };
}

export function calcExtraPricing(input: {
  costRate: number;
  sellRate: number;
  quantity: number;
}) {
  const qty = Math.max(0, input.quantity);
  const totalCost = input.costRate * qty;
  const totalSell = input.sellRate * qty;
  return { totalCost, totalSell };
}

export function calcReservationTotals(
  reservation: {
    tours: { totalSell: number; totalCost: number }[];
    transports: { sellRate: number; netRate: number }[];
    hotels: { totalSell: number; totalCost: number }[];
    payments: { amount: number; status: string }[];
    invoiceType: string;
  },
  options: {
    vatRate?: number;
    flights?: { totalSell: number; totalCost: number }[];
    visas?: { totalSell: number; totalCost: number }[];
    extras?: { totalSell: number; totalCost: number }[];
  } = {},
) {
  const vatRate = options.vatRate ?? 0.05;
  const flights = options.flights ?? [];
  const visas = options.visas ?? [];
  const extras = options.extras ?? [];
  const subTotal =
    reservation.tours.reduce((s, t) => s + (t.totalSell || 0), 0) +
    reservation.transports.reduce((s, t) => s + (t.sellRate || 0), 0) +
    reservation.hotels.reduce((s, t) => s + (t.totalSell || 0), 0) +
    flights.reduce((s, f) => s + (f.totalSell || 0), 0) +
    visas.reduce((s, v) => s + (v.totalSell || 0), 0) +
    extras.reduce((s, e) => s + (e.totalSell || 0), 0);
  const totalCost =
    reservation.tours.reduce((s, t) => s + (t.totalCost || 0), 0) +
    reservation.transports.reduce((s, t) => s + (t.netRate || 0), 0) +
    reservation.hotels.reduce((s, t) => s + (t.totalCost || 0), 0) +
    flights.reduce((s, f) => s + (f.totalCost || 0), 0) +
    visas.reduce((s, v) => s + (v.totalCost || 0), 0) +
    extras.reduce((s, e) => s + (e.totalCost || 0), 0);
  const vatAmount = reservation.invoiceType === "TAXABLE" ? subTotal * vatRate : 0;
  const totalAmount = subTotal + vatAmount;
  const amountPaid = reservation.payments
    .filter((p) => p.status !== "REFUNDED")
    .reduce((s, p) => s + (p.amount || 0), 0);
  const balanceDue = Math.max(0, totalAmount - amountPaid);
  return { subTotal, vatAmount, totalAmount, amountPaid, balanceDue, totalCost };
}
