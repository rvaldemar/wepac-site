import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export default function PublicWepackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LocaleSwitcher className="fixed left-1/2 top-5 z-[60] -translate-x-1/2" />
      {children}
    </>
  );
}
