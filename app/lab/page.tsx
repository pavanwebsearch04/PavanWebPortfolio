import type { Metadata } from "next";
import SiteShell from "@/components/shell/SiteShell";
import LabPage from "@/components/lab/LabPage";

export const metadata: Metadata = {
  title: "Lab — Web Experiments | Pavan Vasita",
  description:
    "Interface concepts, animation studies and small interaction prototypes built by Pavan Vasita, a Web Developer in Udaipur, Rajasthan. Working demos, clearly labelled as experiments.",
};

export default function Lab() {
  return (
    <SiteShell inner>
      <LabPage />
    </SiteShell>
  );
}
