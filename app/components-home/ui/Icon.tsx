import {
  BadgeCheck,
  Blocks,
  Bot,
  Car,
  CreditCard,
  Dices,
  Gamepad2,
  GraduationCap,
  Grid2X2,
  Headset,
  Heart,
  Landmark,
  LockKeyhole,
  Plane,
  RotateCcw,
  Ship,
  ShieldCheck,
  Smartphone,
  Trophy,
  Truck,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Maps the string icon keys used in `data/home-content.ts` to Lucide components,
 * so content stays serialisable and free of JSX.
 */
const ICONS = {
  zap: Zap,
  gamepad: Gamepad2,
  truck: Truck,
  return: RotateCcw,
  verified: BadgeCheck,
  shield: ShieldCheck,
  grid: Grid2X2,
  users: Users,
  lock: LockKeyhole,
  headset: Headset,
  car: Car,
  plane: Plane,
  dice: Dices,
  blocks: Blocks,
  ship: Ship,
  bot: Bot,
  trophy: Trophy,
  graduation: GraduationCap,
  heart: Heart,
  smartphone: Smartphone,
  creditCard: CreditCard,
  bank: Landmark,
  wallet: Wallet,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export default function Icon({
  name,
  size = 14,
  className,
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const Cmp = ICONS[name];
  return <Cmp size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />;
}
