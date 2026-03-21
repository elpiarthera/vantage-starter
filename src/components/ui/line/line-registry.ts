/**
 * Line chart ECharts module registry.
 *
 * Called by LuiLineChart._registerModules() and LuiAreaChart._registerModules().
 * Area charts use the same LineChart ECharts module — ECharts has no separate AreaChart type.
 *
 * _lineRegistered guard prevents double-registration when multiple line/area chart
 * instances are on the same page. registerCanvasCore() has its own guard, so calling
 * it here and from area-chart.ts is safe.
 */

let _lineRegistered = false;

export async function registerLineModules(): Promise<void> {
  if (_lineRegistered) return;
  _lineRegistered = true;

  // registerCanvasCore() is always called first — it registers CanvasRenderer + shared components.
  // Its own _registered guard makes double-call safe from area-chart.ts.
  const { registerCanvasCore } = await import('../registry/canvas-core.js');
  await registerCanvasCore();

  const [{ LineChart }, { use }] = await Promise.all([
    import('echarts/charts'),
    import('echarts/core'),
  ]);

  use([LineChart]);
}
