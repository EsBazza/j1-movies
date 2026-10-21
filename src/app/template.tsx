/**
 * Re-mounted on every navigation, so each page fades in. Opacity only: a transform here
 * would become the containing block for `position: fixed` pages (watch, reels).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
