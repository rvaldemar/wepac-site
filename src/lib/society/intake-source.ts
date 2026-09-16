export function getSocietyIntakeHref(pathname: string): string {
  if (pathname.startsWith("/society/life-plan")) {
    return "/wepacker/intake?source=life-plan";
  }
  if (pathname.startsWith("/society/familias")) {
    return "/wepacker/intake?source=familias";
  }
  if (pathname.startsWith("/academy")) {
    return "/wepacker/intake?source=academy";
  }
  return "/wepacker/intake?source=society";
}
