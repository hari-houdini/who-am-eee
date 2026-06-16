// global.d.ts
declare module '*.properties' {
  const content: Record<string, string>;
  export default content;
}
