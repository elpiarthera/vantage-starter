/**
 * TypeScript module declarations for echarts-gl subpath imports.
 *
 * echarts-gl 2.0.9 does not ship type definitions or subpath export declarations.
 * These shims provide TypeScript type safety for the dynamic imports used in
 * BaseChartElement._maybeLoadGl() and scatter-registry.ts.
 *
 * Resolves the Phase 88 @ts-ignore workaround on the echarts-gl dynamic import.
 * Phase 92 deliverable per project research recommendation.
 */

declare module 'echarts-gl' {
  /** Side-effect import — echarts-gl registers GL renderers with ECharts globally. */
  const _default: unknown;
  export default _default;
}

declare module 'echarts-gl/charts' {
  import type { EChartsExtensionInstallRegisters } from 'echarts/core';

  /** Common interface for all echarts-gl chart extension objects. */
  export type EChartsGLExtension = {
    install(registers: EChartsExtensionInstallRegisters): void;
  };

  /** GL-accelerated scatter chart. Replaces type: 'scatter' with type: 'scatterGL'. */
  export const ScatterGLChart: EChartsGLExtension;

  /** GL-accelerated graph/network chart. */
  export const GraphGLChart: EChartsGLExtension;

  /** GL-accelerated flow field visualization. */
  export const FlowGLChart: EChartsGLExtension;

  /** GL-accelerated lines chart. */
  export const LinesGLChart: EChartsGLExtension;

  /** 3D bar chart. */
  export const Bar3DChart: EChartsGLExtension;

  /** 3D line chart. */
  export const Line3DChart: EChartsGLExtension;

  /** 3D scatter chart. */
  export const Scatter3DChart: EChartsGLExtension;
}
