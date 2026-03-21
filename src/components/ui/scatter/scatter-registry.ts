/**
 * Scatter chart ECharts module registry.
 *
 * Called by LuiScatterChart._registerModules() during chart initialization.
 * Registers both the Canvas ScatterChart and the WebGL ScatterGLChart so that
 * type: 'scatterGL' works when enable-gl is set on the component.
 *
 * _scatterRegistered guard prevents double-registration when multiple LuiScatterChart
 * instances are on the same page. registerCanvasCore() has its own guard,
 * so calling it here is safe regardless of page initialization order.
 *
 * ScatterGLChart is always registered here (not conditionally) because
 * _maybeLoadGl() in BaseChartElement handles the side-effect echarts-gl import
 * separately. Unconditional use() ensures the tree-shaken build includes the
 * correct module when enable-gl is declared on any scatter chart instance.
 */

let _scatterRegistered = false;

export async function registerScatterModules(): Promise<void> {
  if (_scatterRegistered) return;
  _scatterRegistered = true;

  // registerCanvasCore() registers CanvasRenderer + shared ECharts components
  // (GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, etc.)
  // Its own _registered guard makes double-call safe from any other chart registry.
  const { registerCanvasCore } = await import('../registry/canvas-core.js');
  await registerCanvasCore();

  // ScatterChart: tree-shaken subpath import — keeps bundle at ~135KB gzip.
  const [{ ScatterChart }, { use }] = await Promise.all([
    import('echarts/charts'),
    import('echarts/core'),
  ]);
  use([ScatterChart]);

  // ScatterGLChart: always register so type: 'scatterGL' works when enable-gl is set.
  // _maybeLoadGl() in BaseChartElement side-effect-imports echarts-gl when enableGl is true,
  // but explicit use() ensures the tree-shaken build includes the correct module.
  // Type shim in echarts-gl.d.ts provides TypeScript types for this import.
  const { ScatterGLChart } = await import('echarts-gl/charts');
  use([ScatterGLChart]);
}
