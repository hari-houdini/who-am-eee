/** Ambient declarations for non-TypeScript asset imports used throughout the project. */

declare module '*.properties' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.css' {
  const content: CSSStyleSheet;
  export default content;
}

declare module '*.html' {
  /** Raw HTML string returned by Bun when imported with `with { type: 'text' }`. */
  const content: string;
  export default content;
}
