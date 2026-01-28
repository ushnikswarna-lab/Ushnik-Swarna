import type { Metadata } from "next";
import { DigitalGoldPage } from "../../../components/website/DigitalGoldPage";

export const metadata: Metadata = {
  title: "Digital Gold | Ushnik-Swarna",
  description:
    "Buy and sell 24K digital gold. Store in your wallet. Sell requests require admin approval.",
};

export default function DigitalGoldRoute() {
  return <DigitalGoldPage />;
}
