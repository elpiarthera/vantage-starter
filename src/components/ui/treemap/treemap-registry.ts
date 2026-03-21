/**
 * Treemap chart ECharts module registry.
 *
 * Called by LuiTreemapChart._registerModules() during chart initialization.
 * TreemapChart is NOT in canvas-core.ts — it must be registered here.
 *
 * CRITICAL: Breadcrumb navigation is built into TreemapChart itself.
 * There is NO separate BreadcrumbComponent export in 'echarts/components'.
 * Importing a non-existent module causes a runtime error (Pitfall 2 from RESEARCH.md).
 *
 * _treemapRegistered guard prevents double-registration when multiple LuiTreemapChart
 * instances are on the same page.
 */

let _treemapRegistered = false;

export async function registerTreemapModules(): Promise<void> {
  if (_treemapRegistered) return;
  _treemapRegistered = true;

  const { registerCanvasCore } = await import('../registry/canvas-core.js');
  await registerCanvasCore();

  const [{ TreemapChart }, { use }] = await Promise.all([
    import('echarts/charts'),
    import('echarts/core'),
  ]);

  use([TreemapChart]);
}
