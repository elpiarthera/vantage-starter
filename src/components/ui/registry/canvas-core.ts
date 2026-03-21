/**
 * Canvas Core Registry — registers shared ECharts components for Canvas rendering.
 *
 * Called by each concrete chart component's _registerModules() before echarts.init().
 * Guard ensures registration runs exactly once across all chart instances.
 *
 * CRITICAL: All echarts imports are dynamic (await import) — static imports crash SSR.
 * Tree-shaking: Only registered components are included in the bundle.
 */

let _registered = false;

export async function registerCanvasCore(): Promise<void> {
  if (_registered) return;
  _registered = true;

  // Dynamic imports — required for SSR safety (CRITICAL-04)
  // These run client-side only since registerCanvasCore() is called from firstUpdated()
  const [
    { use },
    { CanvasRenderer },
    {
      TitleComponent,
      TooltipComponent,
      GridComponent,
      LegendComponent,
      DataZoomComponent,
      MarkLineComponent,
      MarkAreaComponent,
      ToolboxComponent,
    },
    { LabelLayout, UniversalTransition },
  ] = await Promise.all([
    import('echarts/core'),
    import('echarts/renderers'),
    import('echarts/components'),
    import('echarts/features'),
  ]);

  use([
    CanvasRenderer,
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    DataZoomComponent,
    MarkLineComponent,
    MarkAreaComponent,
    ToolboxComponent,
    LabelLayout,
    UniversalTransition,
  ]);
}
