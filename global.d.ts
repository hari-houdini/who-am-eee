// global.d.ts
declare module '*.properties' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.css' {
  const content: CSSStyleSheet;
  export default content;
}
