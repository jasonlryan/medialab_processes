declare module 'bpmn-js/dist/bpmn-navigated-viewer.production.min.js' {
  interface BpmnJsCanvas {
    zoom(newScale: number | 'fit-viewport', center?: { x: number, y: number }): void;
    scroll(delta: { dx: number, dy: number }): void;
    // Add other canvas methods if needed in the future
  }

  export default class BpmnJS {
    constructor(options?: any);
    importXML(xml: string): Promise<{ warnings: Array<any> }>;
    attachTo(element: HTMLElement): void;
    detach(): void;
    destroy(): void;
    get(moduleName: 'canvas'): BpmnJsCanvas;
    get(moduleName: string): any; // Fallback for other modules
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    saveSVG(options?: any): Promise<{ svg: string }>;
  }
}

declare module 'bpmn-js/dist/assets/diagram-js.css' {
  const content: any;
  export default content;
}

declare module 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css' {
  const content: any;
  export default content;
}

// Add module augmentation for Next.js dynamic imports
declare module 'next/dynamic' {
  import { ComponentType } from 'react';
  
  export interface DynamicOptions {
    ssr?: boolean;
    loading?: ComponentType;
    loader?: () => Promise<{ default: ComponentType<any> }>;
  }

  export default function dynamic<P = {}>(
    loader: () => Promise<{ default: ComponentType<P> }> | ComponentType<P>,
    options?: DynamicOptions
  ): ComponentType<P>;
} 