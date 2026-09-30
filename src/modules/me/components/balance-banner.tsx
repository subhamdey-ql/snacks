import Link from "next/link";
import { Wallet } from "lucide-react";
import { StatCard } from "@/components/common/stat-card";
import { AccentTone } from "@/types/enums";

// "Credits left this month" stat on the Today screen; tapping it opens the wallet.
export function BalanceBanner({ remaining }: { readonly remaining: number }): React.JSX.Element {
  return (
    <Link href="/me/wallet" className="block rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/35">
      <StatCard icon={Wallet} label="credits left this month" value={remaining} tone={AccentTone.PRIMARY} />
    </Link>
  );
}
