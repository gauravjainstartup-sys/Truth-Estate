import type { Metadata } from "next";
import DealRoomTrack from "@/components/dealroom/DealRoomTrack";

export const metadata: Metadata = {
  title: "Track Your Deal Room Mandate",
  // A personal status page keyed off the buyer's own device — never indexed.
  robots: { index: false, follow: false },
  alternates: { canonical: "/deal-room/track" },
};

export default function DealRoomTrackPage() {
  return (
    <main>
      <DealRoomTrack />
    </main>
  );
}
