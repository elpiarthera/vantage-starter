/**
 * Bar chart ECharts module registry.
 *
 * Called by LuiBarChart._registerModules() during chart initialization.
 * BarChart is NOT registered in canvas-core.ts — it must be registered here.
 *
 * _barRegistered guard prevents double-registration when multiple LuiBarChart
 * instances are on the same page. registerCanvasCore() has its own guard,
 * so calling it here is safe regardless of page initialization order.
 *
 * Unlike LuiLineChart/LuiAreaChart, bar charts do NOT use a shared registry
 * across variants — there is only one bar chart type.
 */

let _barRegistered = false;

export async function registerBarModules(): Promise<void> {
  if (_barRegistered) return;
  _barRegistered = true;

  // registerCanvasCore() registers CanvasRenderer + shared ECharts components.
  // Its own _registered guard makes double-call safe from any other chart registry.
  const { registerCanvasCore } = await import('../registry/canvas-core.js');
  await registerCanvasCore();

  // BarChart import: tree-shaken subpath import — keeps bundle at ~135KB gzip.
  // Do NOT use `import * as echarts from 'echarts'` (~400KB gzip).
  const [{ BarChart }, { use }] = await Promise.all([
    import('echarts/charts'),
    import('echarts/core'),
  ]);

  use([BarChart]);
}
