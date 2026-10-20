import { SocietyFooter } from "@/components/society/SocietyFooter";
import { SocietyHeader } from "@/components/society/SocietyHeader";

// WEPAC Society is the parent brand: institutional and Companhia de Artes
// pages share its header (which switches to the Companhia navigation on
// those sections) and footer.
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <SocietyHeader />
      <main>{children}</main>
      <SocietyFooter />
    </div>
  );
}
