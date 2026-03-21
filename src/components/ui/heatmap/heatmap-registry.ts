/**
 * Heatmap chart ECharts module registry.
 *
 * Called by LuiHeatmapChart._registerModules() during chart initialization.
 * HeatmapChart and VisualMapContinuousComponent are NOT in canvas-core.ts — they must be registered here.
 *
 * CRITICAL: VisualMapContinuousComponent MUST be registered. If omitted, the visualMap key
 * in the ECharts option is silently ignored — no color legend appears, no error thrown.
 *
 * _heatmapRegistered guard prevents double-registration when multiple LuiHeatmapChart
 * instances are on the same page.
 */

let _heatmapRegistered = false;

export async function registerHeatmapModules(): Promise<void> {
  if (_heatmapRegistered) return;
  _heatmapRegistered = true;

  const { registerCanvasCore } = await import('../registry/canvas-core.js');
  await registerCanvasCore();

  const [{ HeatmapChart }, { VisualMapContinuousComponent }, { use }] = await Promise.all([
    import('echarts/charts'),
    import('echarts/components'),
    import('echarts/core'),
  ]);

  use([HeatmapChart, VisualMapContinuousComponent]);
}
