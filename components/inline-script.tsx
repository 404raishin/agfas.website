/**
 * Renders a synchronous inline script that runs while the browser parses the
 * HTML — before first paint.
 *
 * React warns in development whenever a component renders a `<script>` tag,
 * because scripts inserted through DOM updates never execute. Marking it
 * `text/plain` on the client sidesteps the warning without changing what
 * happens on a hard navigation, where the server-rendered `text/javascript`
 * version is what actually runs.
 *
 * See: node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
