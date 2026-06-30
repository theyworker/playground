import type { Metadata } from "next";
import KadeAir from "./KadeAir";

export const metadata: Metadata = {
  title: "drop · Kadé Air",
  description: "Nothing arrives, on purpose.",
};

export default function Page() {
  return <KadeAir />;
}
