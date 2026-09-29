/**
 * The dawn light behind every screen, fixed to the viewport so translucent
 * surfaces keep their tint while the page scrolls. Purely decorative.
 */
export function DawnBackdrop() {
  return <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-mist bg-dawn" />;
}
