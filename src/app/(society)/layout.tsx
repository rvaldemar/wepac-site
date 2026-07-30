import { SocietyFooter } from "@/components/society/SocietyFooter";
import { SocietyHeader } from "@/components/society/SocietyHeader";

export default function SocietyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-wepac-gray selection:text-black">
      <SocietyHeader />
      <main>{children}</main>
      <SocietyFooter />
    </div>
  );
}
