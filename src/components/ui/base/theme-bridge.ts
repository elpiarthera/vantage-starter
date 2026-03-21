/**
 * ThemeBridge — resolves CSS custom properties into ECharts-compatible theme objects.
 *
 * ECharts Canvas 2D API does not evaluate CSS custom properties (var()).
 * All token values must be pre-resolved via getComputedStyle before being
 * passed to ECharts option objects. This class centralizes that resolution.
 *
 * INFRA-04: Rebuilding theme on .dark class toggle updates chart colors.
 * INFRA-05: All --ui-chart-* tokens are read and fallbacks applied.
 */
export class ThemeBridge {
  private readonly _tokenDefaults: Record<string, string> = {
    '--ui-chart-color-1': '#3b82f6',
    '--ui-chart-color-2': '#8b5cf6',
    '--ui-chart-color-3': '#10b981',
    '--ui-chart-color-4': '#f59e0b',
    '--ui-chart-color-5': '#ef4444',
    '--ui-chart-color-6': '#06b6d4',
    '--ui-chart-color-7': '#f97316',
    '--ui-chart-color-8': '#84cc16',
    '--ui-chart-grid-line': '#e5e7eb',
    '--ui-chart-axis-label': '#6b7280',
    '--ui-chart-axis-line': '#d1d5db',
    '--ui-chart-tooltip-bg': '#ffffff',
    '--ui-chart-tooltip-border': '#e5e7eb',
    '--ui-chart-tooltip-text': '#111827',
    '--ui-chart-legend-text': '#374151',
    '--ui-chart-font-family': 'system-ui, sans-serif',
  };

  constructor(private readonly host: Element) {}

  /**
   * Read a single CSS token, falling back to the default if unset.
   * CRITICAL: Never pass the token name itself to ECharts — always resolve it here.
   */
  readToken(name: string): string {
    const fallback = this._tokenDefaults[name] ?? '';
    return getComputedStyle(this.host).getPropertyValue(name).trim() || fallback;
  }

  /**
   * Build a complete ECharts theme object with all resolved token values.
   * Called at chart init and again whenever .dark class toggles on <html>.
   */
  buildThemeObject(): object {
    return {
      color: Array.from({ length: 8 }, (_, i) =>
        this.readToken(`--ui-chart-color-${i + 1}`)
      ),
      backgroundColor: 'transparent',
      textStyle: {
        fontFamily: this.readToken('--ui-chart-font-family'),
        color: this.readToken('--ui-chart-axis-label'),
      },
      grid: {
        borderColor: this.readToken('--ui-chart-grid-line'),
      },
      categoryAxis: {
        axisLine: { lineStyle: { color: this.readToken('--ui-chart-axis-line') } },
        axisLabel: { color: this.readToken('--ui-chart-axis-label') },
      },
      valueAxis: {
        axisLine: { lineStyle: { color: this.readToken('--ui-chart-axis-line') } },
        axisLabel: { color: this.readToken('--ui-chart-axis-label') },
        splitLine: { lineStyle: { color: this.readToken('--ui-chart-grid-line') } },
      },
      tooltip: {
        backgroundColor: this.readToken('--ui-chart-tooltip-bg'),
        borderColor: this.readToken('--ui-chart-tooltip-border'),
        textStyle: { color: this.readToken('--ui-chart-tooltip-text') },
      },
      legend: {
        textStyle: { color: this.readToken('--ui-chart-legend-text') },
      },
    };
  }

  /**
   * Build only the color update payload — used for incremental dark mode updates.
   * Cheaper than rebuilding the full theme object.
   */
  buildColorUpdate(): { color: string[] } {
    return {
      color: Array.from({ length: 8 }, (_, i) =>
        this.readToken(`--ui-chart-color-${i + 1}`)
      ),
    };
  }
}
