/**
 * Candlestick chart ECharts module registry.
 *
 * Called by LuiCandlestickChart._registerModules() during chart initialization.
 * CandlestickChart, BarChart, and LineChart are NOT in canvas-core.ts — they must be registered here.
 *
 * CRITICAL: All three chart modules MUST be registered:
 * - CandlestickChart — for the main candlestick price series
 * - BarChart — for the volume panel bar series (type: 'bar'); silently renders nothing if omitted (Pitfall 1)
 * - LineChart — for MA overlay line series (type: 'line'); same silent failure if omitted
 *
 * DataZoomComponent is already registered in canvas-core.ts — do NOT re-register from 'echarts/components'.
 *
 * _candlestickRegistered guard prevents double-registration when multiple LuiCandlestickChart
 * instances are on the same page.
 */

let _candlestickRegistered = false;

export async function registerCandlestickModules(): Promise<void> {
  if (_candlestickRegistered) return;
  _candlestickRegistered = true;

  const { registerCanvasCore } = await import('../registry/canvas-core.js');
  await registerCanvasCore();

  const [{ CandlestickChart, BarChart, LineChart }, { use }] = await Promise.all([
    import('echarts/charts'),
    import('echarts/core'),
  ]);

  use([CandlestickChart, BarChart, LineChart]);
}
