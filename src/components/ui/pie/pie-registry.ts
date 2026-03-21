/**
 * Pie chart ECharts module registry.
 *
 * Called by LuiPieChart._registerModules() during chart initialization.
 * PieChart is NOT registered in canvas-core.ts — it must be registered here.
 *
 * _pieRegistered guard prevents double-registration when multiple LuiPieChart
 * instances are on the same page. registerCanvasCore() has its own guard,
 * so calling it here is safe regardless of page initialization order.
 *
 * Donut mode is a pie series with a non-zero innerRadius — there is no separate
 * ECharts DonutChart module. Both pie and donut use this same registry.
 */

let _pieRegistered = false;

export async function registerPieModules(): Promise<void> {
  if (_pieRegistered) return;
  _pieRegistered = true;

  // registerCanvasCore() registers CanvasRenderer + shared ECharts components
  // including TitleComponent (required for donut center labels), GridComponent,
  // TooltipComponent, and LegendComponent.
  // Its own _registered guard makes double-call safe from any other chart registry.
  const { registerCanvasCore } = await import('../registry/canvas-core.js');
  await registerCanvasCore();

  // PieChart import: tree-shaken subpath import — keeps bundle at ~135KB gzip.
  // Do NOT use `import * as echarts from 'echarts'` (~400KB gzip).
  const [{ PieChart }, { use }] = await Promise.all([
    import('echarts/charts'),
    import('echarts/core'),
  ]);

  use([PieChart]);
}
