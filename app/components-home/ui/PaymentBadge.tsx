/**
 * White payment chips shown in the footer's "We Accept" column. Each mark is
 * drawn inline so there are no extra network requests and no logo assets to ship.
 */
export type PaymentMethod = "VISA" | "Mastercard" | "UPI" | "Paytm" | "GPay" | "PhonePe";

function Mark({ method }: { method: PaymentMethod }) {
  switch (method) {
    case "VISA":
      return <span className="text-nano font-black italic tracking-tight text-[#1A1F71]">VISA</span>;
    case "Mastercard":
      return (
        <span className="flex items-center" aria-hidden="true">
          <span className="h-[13px] w-[13px] rounded-full bg-[#EB001B]" />
          <span className="-ml-[5px] h-[13px] w-[13px] rounded-full bg-[#F79E1B] mix-blend-multiply" />
        </span>
      );
    case "UPI":
      return (
        <span className="text-nano font-black leading-none">
          <span className="text-[#097939]">U</span>
          <span className="text-[#ED752E]">P</span>
          <span className="text-[#097939]">I</span>
          <span className="ml-[2px] align-super text-[6px] text-slate-400">»</span>
        </span>
      );
    case "Paytm":
      return (
        <span className="text-nano font-bold leading-none">
          <span className="text-[#00BAF2]">Pay</span>
          <span className="text-[#002970]">tm</span>
        </span>
      );
    case "GPay":
      return (
        <span className="text-nano font-semibold leading-none">
          <span className="text-[#4285F4]">G</span>
          <span className="text-[#5F6368]"> Pay</span>
        </span>
      );
    case "PhonePe":
      return (
        <span className="flex items-center gap-1" aria-hidden="true">
          <span className="grid h-[14px] w-[14px] place-items-center rounded-full bg-[#5F259F] text-[8px] font-bold text-white">
            ₹
          </span>
          <span className="text-[9px] font-semibold leading-none text-[#5F259F]">Pe</span>
        </span>
      );
  }
}

export default function PaymentBadge({ method }: { method: PaymentMethod }) {
  return (
    <li
      className="grid h-control-xs w-[3.04rem] place-items-center rounded bg-white"
      title={method}
    >
      <Mark method={method} />
      <span className="sr-only">{method}</span>
    </li>
  );
}
