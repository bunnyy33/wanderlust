import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { amount, currency = "USD", card, reference } = body;
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey) {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeKey);
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        metadata: { reference: reference || "" },
        payment_method_data: {
          type: "card",
          card: { number: card?.number, exp_month: Number(card?.expMonth), exp_year: Number(card?.expYear), cvc: card?.cvc },
        },
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      });
      if (intent.status === "succeeded") {
        return NextResponse.json({ ok: true, paid: true, mode: "stripe", id: intent.id });
      }
      return NextResponse.json({ ok: false, paid: false, error: intent.last_payment_error?.message || "Payment failed" }, { status: 402 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Stripe error";
      return NextResponse.json({ ok: false, paid: false, error: msg }, { status: 402 });
    }
  }
  // Demo mode
  await new Promise((r) => setTimeout(r, 1200));
  const num = String(card?.number || "").replace(/\s/g, "");
  if (!luhnCheck(num)) {
    return NextResponse.json({ ok: false, paid: false, error: "Invalid card number" }, { status: 400 });
  }
  if (!card?.expMonth || !card?.expYear || !card?.cvc) {
    return NextResponse.json({ ok: false, paid: false, error: "Missing card details" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, paid: true, mode: "demo", id: "demo_" + Date.now() });
}

function luhnCheck(num: string): boolean {
  if (!/^\d{13,19}$/.test(num)) return false;
  let sum = 0, dbl = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = parseInt(num[i], 10);
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d; dbl = !dbl;
  }
  return sum % 10 === 0;
}
