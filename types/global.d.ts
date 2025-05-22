// types/global.d.ts

// Type for the svg2pdf function, assuming it's similar to what we expect.
// This can be made more precise if the actual signature is known.
declare type Svg2PdfGlobalFunction = (element: SVGElement, pdf: any, options?: object) => Promise<void>;

declare global {
  interface Window {
    svg2pdf?: Svg2PdfGlobalFunction;
  }
}

// Export {} to make this a module file, which is good practice for .d.ts files
// if they are not solely ambient declarations intended for global scope without import/export.
// In this case, it helps ensure TypeScript processes it as a module augmenting the global scope.
export {}; 