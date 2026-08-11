"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, MapPin, Plus, ShoppingBag, Truck } from "lucide-react";

import { useCart } from "@/app/components-home/lib/CartContext";
import { getAddresses, addAddress, type Address } from "@/app/components-home/lib/addresses";
import { computeTotals, type DeliveryMethodId } from "@/app/components-home/lib/pricing";
import { payWithRazorpay } from "@/app/components-home/lib/razorpay";
import { deliveryMethods, paymentMethods } from "@/app/components-home/data/home-content";
import Container from "@/app/components-home/ui/Container";
import Button from "@/app/components-home/ui/Button";
import TextField from "@/app/components-home/ui/TextField";
import SelectField from "@/app/components-home/ui/SelectField";
import Stepper from "@/app/components-home/ui/Stepper";
import Icon, { type IconName } from "@/app/components-home/ui/Icon";
import { formatPrice } from "@/app/components-home/lib/format";
import { cn } from "@/app/components-home/lib/cn";
import { useCurrentUser } from "@/app/components-home/lib/useCurrentUser";
import { INDIAN_STATES, OTHER_CITY } from "@/app/components-home/data/india";

const PHONE = /^[0-9+\-\s()]{8,}$/;
const PINCODE = /^\d{6}$/;

/** Indian mobile: 10 digits starting 6–9, with or without +91/91/0 prefix. */
function validMobile(raw: string): boolean {
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length === 10) return /^[6-9]/.test(digits);
  if (digits.length === 12 && digits.startsWith("91")) return /^[6-9]/.test(digits.slice(2));
  return false;
}

interface AddressSuggestion {
  label: string;
  name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  line: string;
}

const STEPS = [
  { key: "address", label: "Address" },
  { key: "delivery", label: "Delivery" },
  { key: "payment", label: "Payment" },
];

type NewAddressErrors = Partial<
  Record<"label" | "fullName" | "phone" | "line1" | "state" | "city" | "otherCity" | "pincode", string>
>;

/**
 * Checkout — a single page carrying three steps (Address → Delivery →
 * Payment), matching the approved mobile design's stepper.
 *
 * "Pay Now" opens the hosted Razorpay modal whichever method is selected —
 * UPI/card/netbanking are all tabs inside that one modal, so the list here is
 * a preselection, not separate processors. On success the verified order's id
 * rides the redirect (`/checkout/success?order=…`) so the confirmation screen
 * can always show the exact order just paid for.
 */
export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    hydrated,
    discountPercent,
    clearCart,
    selectedAddressId,
    setSelectedAddressId,
  } = useCart();

  const [step, setStep] = useState(0);

  // The address book can grow (this page's own "Add new address" writes to the
  // same store), so it's read fresh on mount and kept in sync via
  // `addressesChange` — the seeded addresses are instant, but anything added
  // this session loads from the server a moment later.
  const [addresses, setAddresses] = useState(() => getAddresses());
  useEffect(() => {
    const onChange = () => {
      const next = getAddresses();
      setAddresses(next);
      // A just-saved address is selected under its optimistic id; the server
      // refresh replaces that id with the real row's. Re-point the selection
      // at the newest address so the tick doesn't silently vanish.
      if (
        selectedAddressId &&
        next.length > 0 &&
        !next.some((a) => a.id === selectedAddressId)
      ) {
        setSelectedAddressId(next[next.length - 1].id);
      }
    };
    window.addEventListener("addressesChange", onChange);
    return () => window.removeEventListener("addressesChange", onChange);
  }, [selectedAddressId, setSelectedAddressId]);

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethodId>("standard");
  const [paymentMethodId, setPaymentMethodId] = useState<string>(paymentMethods[0]?.id ?? "upi");
  const [placing, setPlacing] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // The *selected* address id lives in CartContext, shared with Cart — picking
  // "Work" there and landing here must not silently revert to the first saved
  // address. Falls back to the first address only until a real choice exists.
  const addressId = selectedAddressId ?? addresses[0]?.id ?? "";
  const selectedAddress = addresses.find((a) => a.id === addressId) ?? addresses[0];

  const totals = useMemo(
    () => computeTotals(cart, discountPercent, deliveryMethod),
    [cart, discountPercent, deliveryMethod],
  );

  // Tracks whether the component is still mounted when Razorpay's async
  // callbacks fire — otherwise a shopper who navigates away mid-payment still
  // triggers a setState after unmount.
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // Moves focus to each step's heading as it becomes current, and announces the
  // change — otherwise a keyboard/screen-reader user's focus silently resets to
  // <body> on every "Continue" click with no indication where they landed.
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const [announcement, setAnnouncement] = useState("");
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    stepHeadingRef.current?.focus();
    setAnnouncement(`Step ${step + 1} of ${STEPS.length}: ${STEPS[step].label}`);
  }, [step]);

  /* ---------------- empty cart guard ---------------- */
  // Gated on `hydrated` (cart hasn't been read from localStorage yet) and
  // `placing` (an order was just placed and clearCart() fired a render before
  // the redirect to /checkout/success completes) — without both, a shopper
  // with a real cart can see "Your cart is empty" flash on screen for no
  // reason, once on load and once on their own successful purchase.
  if (!hydrated) return null;

  if (cart.length === 0 && !placing) {
    return (
      <>
        <MobileHeader title="Checkout" onBack={() => router.back()} />
        <Container className="pt-6 lg:pt-8">
          <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-mist py-16 text-center">
            <ShoppingBag size={32} className="mb-3 text-slate-300" aria-hidden="true" />
            <h1 className="text-ui font-bold text-ink">Your cart is empty</h1>
            <p className="mt-1 max-w-xs text-micro text-slate-500">
              Add something to your cart before checking out.
            </p>
            <Button href="/category/all" size="sm" className="mt-4">
              Start shopping
            </Button>
          </div>
        </Container>
      </>
    );
  }

  const placeOrder = async () => {
    if (!selectedAddress) return;
    setPayError(null);
    setPlacing(true);

    const method = paymentMethods.find((m) => m.id === paymentMethodId);
    const paymentMethodLabel = method?.label ?? "Razorpay";

    try {
      const order = await payWithRazorpay({
        amount: totals.total,
        customer: {
          name: selectedAddress.name ?? selectedAddress.label,
          contact: selectedAddress.phone,
        },
        order: {
          items: cart,
          address: selectedAddress,
          deliveryMethod,
          paymentMethodLabel,
          totals,
        },
        onDismiss: () => {
          if (mountedRef.current) setPlacing(false);
        },
      });
      if (!mountedRef.current) return;
      // Flip button text ("Redirecting…") before nav so the user sees a
      // definite state change the instant Razorpay's modal closes on success —
      // otherwise the button reads "Placing order…" all the way through the
      // route push and looks stuck. `replace`, not `push`, so Back doesn't go
      // to a checkout page whose cart is empty. The order id rides the URL so
      // the success screen never depends on a session-cookie lookup to know
      // which order was just paid for.
      setRedirecting(true);
      clearCart();
      router.replace(`/checkout/success?order=${encodeURIComponent(order.id)}`);
    } catch (err) {
      if (!mountedRef.current) return;
      setPayError(err instanceof Error ? err.message : "Payment failed. Please try again.");
      setPlacing(false);
    }
  };

  return (
    <>
      <MobileHeader title="Checkout" onBack={() => router.back()} />
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <Container className="pt-4 md:pt-8">
        <h1 className="mb-5 hidden text-section font-bold text-ink md:block">Checkout</h1>

        <div className="mb-6 md:mb-8">
          <Stepper steps={STEPS} currentIndex={step} onStepClick={setStep} />
        </div>

        {/* `md:` rather than `lg:` — a tablet-portrait checkout with a single
            narrow column stranded in a wide viewport is exactly the "just
            stretched the mobile layout" outcome the design system forbids. */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_22rem] md:gap-10">
          <div className="min-w-0">
            {step === 0 && (
              <AddressStep
                headingRef={stepHeadingRef}
                addresses={addresses}
                selectedId={addressId}
                onSelect={setSelectedAddressId}
                onSaved={(nextAddresses, newId) => {
                  setAddresses(nextAddresses);
                  setSelectedAddressId(newId);
                }}
                onContinue={() => setStep(1)}
              />
            )}

            {step === 1 && (
              <DeliveryStep
                headingRef={stepHeadingRef}
                items={cart}
                discountPercent={discountPercent}
                selected={deliveryMethod}
                onSelect={setDeliveryMethod}
                onBack={() => setStep(0)}
                onContinue={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <PaymentStep
                headingRef={stepHeadingRef}
                selected={paymentMethodId}
                onSelect={setPaymentMethodId}
                onBack={() => setStep(1)}
                placing={placing}
                redirecting={redirecting}
                onPlaceOrder={placeOrder}
                totals={totals}
                itemCount={cart.reduce((n, i) => n + i.quantity, 0)}
                payError={payError}
                mobileOnly
              />
            )}
          </div>

          {/* Order summary — sticky from tablet up, always visible regardless of step. */}
          <aside className="hidden rounded-xl border border-line p-5 md:sticky md:top-[8.5rem] md:block md:self-start">
            <h2 className="text-ui font-bold text-ink">Order Summary</h2>

            <ul className="mt-3 flex flex-col gap-3 border-b border-line pb-4">
              {cart.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-mist">
                    {item.image && (
                      <Image src={item.image} alt={item.title} fill sizes="48px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-micro font-semibold text-ink">{item.title}</p>
                    <p className="text-nano text-slate-500">Qty {item.quantity}</p>
                  </div>
                  <p className="shrink-0 text-micro font-bold tabular-nums text-ink">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <TotalsBreakdown totals={totals} />

            {step === 2 && (
              <>
                <Button
                  onClick={placeOrder}
                  disabled={placing || redirecting}
                  size="md"
                  className="mt-4 w-full"
                >
                  {redirecting ? "Redirecting…" : placing ? "Placing order…" : "Pay Now"}
                </Button>
                <p className="mt-2 text-center text-nano text-slate-400">
                  Secured by Razorpay. Payments are processed in INR.
                </p>
                {payError && (
                  <p className="mt-2 text-center text-nano text-red-600" role="alert">
                    {payError}
                  </p>
                )}
              </>
            )}
          </aside>
        </div>
      </Container>

    </>
  );
}

/* ------------------------------------------------------------------ */
/* Step 1 — Address                                                     */
/* ------------------------------------------------------------------ */

function AddressStep({
  headingRef,
  addresses,
  selectedId,
  onSelect,
  onSaved,
  onContinue,
}: {
  headingRef: React.MutableRefObject<HTMLHeadingElement | null>;
  addresses: Address[];
  selectedId: string;
  onSelect: (id: string) => void;
  onSaved: (addresses: Address[], newId: string) => void;
  onContinue: () => void;
}) {
  const headingId = "checkout-step-address";
  const user = useCurrentUser();
  const hasAddresses = addresses.length > 0;
  // The form renders inline (not in a drawer, which is mobile-only chrome):
  // always when there's nothing saved yet, on demand otherwise.
  const [formOpen, setFormOpen] = useState(false);

  // Guest flow: the mobile number comes first, always. If it has ordered
  // before, the previous shipping address comes back as a one-tap suggestion.
  const [guestPhone, setGuestPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [phoneChecked, setPhoneChecked] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);

  const showPhoneGate = user === null && !hasAddresses && !phoneChecked;
  const authLoading = user === undefined && !hasAddresses;
  const showForm = hasAddresses ? formOpen : suggestions.length === 0 || formOpen;

  const checkPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validMobile(guestPhone)) {
      setPhoneError("Enter a valid mobile number.");
      return;
    }
    setPhoneError(null);
    setChecking(true);
    try {
      const res = await fetch("/api/addresses/from-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: guestPhone }),
      });
      const body = await res.json().catch(() => null);
      setSuggestions(res.ok && Array.isArray(body?.suggestions) ? body.suggestions : []);
    } catch {
      setSuggestions([]);
    } finally {
      setChecking(false);
      setPhoneChecked(true);
    }
  };

  const applySuggestion = (s: AddressSuggestion) => {
    const next = addAddress({
      label: s.label,
      fullName: s.name || s.label,
      phone: s.phone,
      line1: s.line1,
      city: s.city,
      state: s.state,
      pincode: s.pincode,
    });
    onSaved(next, next[next.length - 1].id);
  };

  if (showPhoneGate) {
    return (
      <div>
        <h2 ref={headingRef} id={headingId} tabIndex={-1} className="text-ui font-bold text-ink outline-none">
          Shipping Address
        </h2>
        <p className="mt-1 text-micro text-slate-500">
          Enter your mobile number to continue — if you&apos;ve ordered with us before, we&apos;ll
          fetch your saved delivery address.
        </p>
        <form onSubmit={checkPhone} noValidate className="mt-4 flex flex-col gap-3">
          <TextField
            label="Mobile number"
            type="tel"
            autoComplete="tel"
            placeholder="Mobile Number"
            value={guestPhone}
            onChange={(e) => {
              setGuestPhone(e.target.value);
              if (phoneError) setPhoneError(null);
            }}
            error={phoneError ?? undefined}
          />
          <Button type="submit" size="md" disabled={checking} className="w-full">
            {checking ? "Checking…" : "Continue"}
          </Button>
        </form>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div>
        <h2 ref={headingRef} id={headingId} tabIndex={-1} className="text-ui font-bold text-ink outline-none">
          Shipping Address
        </h2>
        <div className="mt-3 h-24 animate-pulse rounded-xl border border-line bg-mist" />
      </div>
    );
  }

  return (
    <div>
      <h2 ref={headingRef} id={headingId} tabIndex={-1} className="text-ui font-bold text-ink outline-none">
        Shipping Address
      </h2>
      {!hasAddresses && suggestions.length === 0 && (
        <p className="mt-1 text-micro text-slate-500">
          Enter your delivery details — the mobile number and pincode are used for delivery updates.
        </p>
      )}

      {!hasAddresses && suggestions.length > 0 && !formOpen && (
        <>
          <p className="mt-1 text-micro text-slate-500">
            Welcome back! We found your previous delivery{" "}
            {suggestions.length === 1 ? "address" : "addresses"} — tap to use{" "}
            {suggestions.length === 1 ? "it" : "one"}.
          </p>
          <ul className="mt-3 flex flex-col gap-2.5">
            {suggestions.map((s) => (
              <li key={s.line}>
                <button
                  type="button"
                  onClick={() => applySuggestion(s)}
                  className="flex w-full items-start gap-3 rounded-lg border border-line p-3.5 text-left transition-colors hover:border-gold-400 hover:bg-gold-50"
                >
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mist text-gold-600">
                    <MapPin size={16} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-micro font-semibold text-ink">
                      {s.label}
                      {s.name && <span className="font-normal text-slate-500"> — {s.name}</span>}
                    </span>
                    <span className="mt-0.5 block text-micro text-slate-600">{s.line}</span>
                    <span className="mt-0.5 block text-nano text-slate-500">{s.phone}</span>
                  </span>
                  <span className="mt-0.5 shrink-0 text-nano font-semibold text-gold-600">Use this</span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line py-3 text-micro font-semibold text-gold-600 transition-colors hover:border-gold-400 hover:bg-gold-50"
          >
            <Plus size={14} aria-hidden="true" />
            Deliver to a different address
          </button>
        </>
      )}

      {hasAddresses && (
      <ul role="radiogroup" aria-labelledby={headingId} className="mt-3 flex flex-col gap-2.5">
        {addresses.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              role="radio"
              aria-checked={a.id === selectedId}
              onClick={() => onSelect(a.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border p-3.5 text-left transition-colors",
                a.id === selectedId ? "border-gold-500 bg-gold-50" : "border-line hover:border-gold-300",
              )}
            >
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mist text-gold-600">
                <MapPin size={16} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-micro font-semibold text-ink">
                  {a.label}
                  {a.name && <span className="font-normal text-slate-500"> — {a.name}</span>}
                </span>
                <span className="mt-0.5 block text-micro text-slate-600">{a.line}</span>
                <span className="mt-0.5 block text-nano text-slate-500">{a.phone}</span>
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                  a.id === selectedId ? "border-gold-500 bg-gold-500" : "border-slate-300",
                )}
              >
                {a.id === selectedId && (
                  <Check size={10} strokeWidth={3} className="text-navy-900" aria-hidden="true" />
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
      )}

      {showForm ? (
        <div
          className={cn(
            "rounded-xl border border-line p-4",
            (hasAddresses || suggestions.length > 0) && "mt-3",
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-micro font-bold text-ink">
              {hasAddresses ? "New address" : "Delivery address"}
            </p>
            {(hasAddresses || suggestions.length > 0) && (
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="text-nano font-semibold text-slate-500 transition-colors hover:text-ink"
              >
                Cancel
              </button>
            )}
          </div>
          <div className="mt-3">
            <NewAddressForm
              initialPhone={guestPhone}
              onSaved={(nextAddresses, newId) => {
                onSaved(nextAddresses, newId);
                setFormOpen(false);
              }}
            />
          </div>
        </div>
      ) : hasAddresses ? (
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line py-3 text-micro font-semibold text-gold-600 transition-colors hover:border-gold-400 hover:bg-gold-50"
        >
          <Plus size={14} aria-hidden="true" />
          Add New Address
        </button>
      ) : null}

      <Button
        onClick={onContinue}
        disabled={!addresses.length}
        size="md"
        className="mt-6 w-full"
      >
        Continue to Delivery
      </Button>
    </div>
  );
}

function NewAddressForm({
  onSaved,
  initialPhone = "",
}: {
  onSaved: (addresses: Address[], newId: string) => void;
  /** Prefilled from the guest phone gate so the number isn't typed twice. */
  initialPhone?: string;
}) {
  const [form, setForm] = useState({
    label: "",
    fullName: "",
    phone: initialPhone,
    line1: "",
    state: "",
    city: "",
    otherCity: "",
    pincode: "",
  });
  const [errors, setErrors] = useState<NewAddressErrors>({});
  const fieldRefs = useRef<
    Partial<Record<keyof NewAddressErrors, HTMLInputElement | HTMLSelectElement | null>>
  >({});
  const errorSummaryRef = useRef<HTMLParagraphElement>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const cities = INDIAN_STATES.find((s) => s.name === form.state)?.cities ?? [];

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: NewAddressErrors = {};
    if (form.fullName.trim().length < 2) next.fullName = "Enter the recipient's name.";
    if (!PHONE.test(form.phone) || !validMobile(form.phone)) {
      next.phone = "Enter a valid mobile number.";
    }
    if (form.line1.trim().length < 4) next.line1 = "Enter the street address.";
    if (!form.state) next.state = "Select your state.";
    if (!form.city) next.city = "Select your city.";
    if (form.city === OTHER_CITY && form.otherCity.trim().length < 2) {
      next.otherCity = "Enter your city name.";
    }
    if (!PINCODE.test(form.pincode)) next.pincode = "Enter a 6-digit pincode.";
    setErrors(next);

    const firstInvalid = (Object.keys(next) as (keyof NewAddressErrors)[])[0];
    if (firstInvalid) {
      // Screen readers get an explicit announcement rather than relying on the
      // user to discover the per-field aria-describedby text on their own, and
      // focus moves straight to the first thing that needs fixing.
      errorSummaryRef.current?.focus();
      fieldRefs.current[firstInvalid]?.focus();
      return;
    }

    const nextAddresses = addAddress({
      label: form.label || "Address",
      fullName: form.fullName,
      phone: form.phone,
      line1: form.line1,
      city: form.city === OTHER_CITY ? form.otherCity.trim() : form.city,
      state: form.state,
      pincode: form.pincode,
    });
    onSaved(nextAddresses, nextAddresses[nextAddresses.length - 1].id);
  };

  const errorCount = Object.keys(errors).length;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3 pb-2">
      <p ref={errorSummaryRef} tabIndex={-1} role="alert" className="sr-only">
        {errorCount > 0 && `${errorCount} field${errorCount === 1 ? "" : "s"} need attention.`}
      </p>

      <TextField
        label="Address label"
        placeholder="Home, Work…"
        value={form.label}
        onChange={set("label")}
      />
      <TextField
        ref={(el) => {
          fieldRefs.current.fullName = el;
        }}
        label="Full name"
        placeholder="Full Name"
        value={form.fullName}
        onChange={set("fullName")}
        error={errors.fullName}
      />
      <TextField
        ref={(el) => {
          fieldRefs.current.phone = el;
        }}
        label="Phone number"
        type="tel"
        placeholder="Phone Number"
        value={form.phone}
        onChange={set("phone")}
        error={errors.phone}
      />
      <TextField
        ref={(el) => {
          fieldRefs.current.line1 = el;
        }}
        label="Address line"
        placeholder="House no., street, area"
        value={form.line1}
        onChange={set("line1")}
        error={errors.line1}
      />
      {/* State first — the city list depends on it. */}
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          ref={(el) => {
            fieldRefs.current.state = el;
          }}
          label="State"
          placeholder="Select State"
          options={INDIAN_STATES.map((s) => s.name)}
          value={form.state}
          onChange={(e) =>
            setForm((f) => ({ ...f, state: e.target.value, city: "", otherCity: "" }))
          }
          error={errors.state}
        />
        <SelectField
          ref={(el) => {
            fieldRefs.current.city = el;
          }}
          label="City"
          placeholder={form.state ? "Select City" : "Select state first"}
          options={[...cities, OTHER_CITY]}
          value={form.city}
          disabled={!form.state}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          error={errors.city}
        />
      </div>
      {form.city === OTHER_CITY && (
        <TextField
          ref={(el) => {
            fieldRefs.current.otherCity = el;
          }}
          label="City name"
          placeholder="Enter your city name"
          value={form.otherCity}
          onChange={set("otherCity")}
          error={errors.otherCity}
        />
      )}
      <TextField
        ref={(el) => {
          fieldRefs.current.pincode = el;
        }}
        label="Pincode"
        placeholder="Pincode"
        inputMode="numeric"
        value={form.pincode}
        onChange={set("pincode")}
        error={errors.pincode}
      />
      <Button type="submit" size="md" className="mt-2 w-full">
        Save Address
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2 — Delivery                                                    */
/* ------------------------------------------------------------------ */

function DeliveryStep({
  headingRef,
  items,
  discountPercent,
  selected,
  onSelect,
  onBack,
  onContinue,
}: {
  headingRef: React.MutableRefObject<HTMLHeadingElement | null>;
  items: import("@/app/components-home/lib/CartContext").CartItem[];
  discountPercent: number;
  selected: DeliveryMethodId;
  onSelect: (id: DeliveryMethodId) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const headingId = "checkout-step-delivery";

  return (
    <div>
      <h2 ref={headingRef} id={headingId} tabIndex={-1} className="text-ui font-bold text-ink outline-none">
        Delivery Method
      </h2>

      <ul role="radiogroup" aria-labelledby={headingId} className="mt-3 flex flex-col gap-2.5">
        {deliveryMethods.map((m) => {
          const { shipping } = computeTotals(items, discountPercent, m.id as DeliveryMethodId);
          return (
            <li key={m.id}>
              <button
                type="button"
                role="radio"
                aria-checked={m.id === selected}
                onClick={() => onSelect(m.id as DeliveryMethodId)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3.5 text-left transition-colors",
                  m.id === selected ? "border-gold-500 bg-gold-50" : "border-line hover:border-gold-300",
                )}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mist text-gold-600">
                  <Truck size={16} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-micro font-semibold text-ink">{m.label}</span>
                  <span className="mt-0.5 block text-nano text-slate-500">{m.eta}</span>
                </span>
                <span className="shrink-0 text-micro font-bold text-ink">
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                    m.id === selected ? "border-gold-500 bg-gold-500" : "border-slate-300",
                  )}
                >
                  {m.id === selected && (
                    <Check size={10} strokeWidth={3} className="text-navy-900" aria-hidden="true" />
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex gap-3">
        <Button onClick={onBack} variant="outline" size="md" className="flex-1">
          Back
        </Button>
        <Button onClick={onContinue} size="md" className="flex-1">
          Continue to Payment
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 3 — Payment                                                     */
/* ------------------------------------------------------------------ */

function PaymentStep({
  headingRef,
  selected,
  onSelect,
  onBack,
  placing,
  redirecting,
  onPlaceOrder,
  totals,
  itemCount,
  payError,
  mobileOnly,
}: {
  headingRef: React.MutableRefObject<HTMLHeadingElement | null>;
  selected: string;
  onSelect: (id: string) => void;
  onBack: () => void;
  placing: boolean;
  redirecting: boolean;
  onPlaceOrder: () => void;
  totals: ReturnType<typeof computeTotals>;
  itemCount: number;
  payError?: string | null;
  mobileOnly?: boolean;
}) {
  const headingId = "checkout-step-payment";

  return (
    <div className={mobileOnly ? "pb-2 md:pb-0" : undefined}>
      <h2 ref={headingRef} id={headingId} tabIndex={-1} className="text-ui font-bold text-ink outline-none">
        Payment Method
      </h2>

      <ul role="radiogroup" aria-labelledby={headingId} className="mt-3 flex flex-col gap-2.5">
        {paymentMethods.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              role="radio"
              aria-checked={m.id === selected}
              onClick={() => onSelect(m.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border p-3.5 text-left transition-colors",
                m.id === selected ? "border-gold-500 bg-gold-50" : "border-line hover:border-gold-300",
              )}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mist text-gold-600">
                <Icon name={m.icon as IconName} size={16} />
              </span>
              <span className="min-w-0 flex-1 text-micro font-semibold text-ink">{m.label}</span>
              <span
                aria-hidden="true"
                className={cn(
                  "grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                  m.id === selected ? "border-gold-500 bg-gold-500" : "border-slate-300",
                )}
              >
                {m.id === selected && (
                  <Check size={10} strokeWidth={3} className="text-navy-900" aria-hidden="true" />
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 md:hidden">
        <TotalsBreakdown totals={totals} itemCount={itemCount} />
      </div>

      <div className="mt-6 hidden md:block">
        <Button onClick={onBack} variant="outline" size="md" className="w-full">
          Back
        </Button>
      </div>

      {/* Sticky mobile buy bar, mirroring the approved design's bottom action. */}
      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-white/95 px-3 py-2.5 shadow-[0_-8px_24px_-16px_rgba(16,33,53,0.4)] backdrop-blur-sm md:hidden">
        <div className="flex items-center gap-3">
          <p className="shrink-0">
            <span className="block text-nano text-slate-500">Total Payable</span>
            <span className="block text-ui font-bold tabular-nums text-ink">
              {formatPrice(totals.total)}
            </span>
          </p>
          <Button
            onClick={onPlaceOrder}
            disabled={placing || redirecting}
            size="md"
            className="min-w-0 flex-1"
          >
            {redirecting ? "Redirecting…" : placing ? "Placing order…" : "Pay Now"}
          </Button>
        </div>
        <p className="mt-1.5 text-center text-nano text-slate-400">
          Secured by Razorpay. Payments are processed in INR.
        </p>
        {payError && (
          <p className="mt-1 text-center text-nano text-red-600" role="alert">
            {payError}
          </p>
        )}
      </div>
      {/* Reserves the height of the bar above, mirroring ProductDetailClient's
          own spacer — sized generously since this bar carries an extra line
          (the demo notice) that product's buy bar doesn't. */}
      <div aria-hidden="true" className="h-[6.5rem] md:hidden" />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function TotalsBreakdown({
  totals,
  itemCount,
}: {
  totals: ReturnType<typeof computeTotals>;
  itemCount?: number;
}) {
  return (
    <dl className="flex flex-col gap-2 border-t border-line pt-4 text-micro">
      <div className="flex justify-between">
        <dt className="text-slate-500">Subtotal</dt>
        <dd className="font-medium tabular-nums text-ink">{formatPrice(totals.subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-500">Discount</dt>
        <dd className={cn("font-medium tabular-nums", totals.discount > 0 ? "text-[#0F7B3F]" : "text-ink")}>
          {totals.discount > 0 ? `−${formatPrice(totals.discount)}` : formatPrice(0)}
        </dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-500">Shipping</dt>
        <dd className="font-medium tabular-nums text-ink">
          {totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)}
        </dd>
      </div>
      {totals.gst > 0 && (
        <div className="flex justify-between">
          <dt className="text-slate-500">GST</dt>
          <dd className="font-medium tabular-nums text-ink">{formatPrice(totals.gst)}</dd>
        </div>
      )}
      <div className="mt-1 flex items-baseline justify-between border-t border-line pt-3">
        <dt className="text-ui font-bold text-ink">
          Total Payable
          {itemCount !== undefined && (
            <span className="ml-1.5 text-nano font-medium text-slate-500">
              ({itemCount} {itemCount === 1 ? "item" : "items"})
            </span>
          )}
        </dt>
        <dd className="text-promo font-bold tabular-nums text-ink">{formatPrice(totals.total)}</dd>
      </div>
    </dl>
  );
}

function MobileHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-sm lg:hidden">
      <div className="flex h-14 items-center gap-1 px-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-ink transition-colors hover:bg-mist"
        >
          <ArrowLeft size={19} aria-hidden="true" />
        </button>
        <p className="min-w-0 flex-1 truncate px-1 text-center text-ui font-bold text-ink">{title}</p>
        <span className="h-11 w-11 shrink-0" aria-hidden="true" />
      </div>
    </header>
  );
}
