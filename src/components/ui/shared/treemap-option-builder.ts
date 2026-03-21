// packages/charts/src/shared/treemap-option-builder.ts

/**
 * Treemap chart option builder.
 *
 * TREE-01 data format: hierarchical TreemapNode[] array with name/value/children fields.
 * TREE-02 breadcrumb/levelColors/borderRadius prop mapping:
 *   - breadcrumb: controls ECharts built-in breadcrumb.show
 *   - levelColors: per-level color arrays — must be string[][] (array of arrays), NOT a flat string[] (Pitfall 3)
 *   - borderRadius: applied to each level's itemStyle.borderRadius, decremented by level depth
 *
 * Pitfall 1 (no calc()): height uses '90%' string, NOT 'calc(100% - 30px)'.
 *   ECharts layout engine does not resolve CSS calc() expressions.
 * Pitfall 3 (level-colors): levelColors must be string[][] — each element is the color palette for one depth level.
 *   A flat string[] passed as levelColors[0] causes the entire treemap to use a single color.
 */

export type TreemapNode = {
  name: string;
  value: number;
  children?: TreemapNode[];
};

export type TreemapOptionProps = {
  /** Show ECharts built-in breadcrumb navigation. Default: true */
  breadcrumb?: boolean;
  /** Apply borderRadius to cells. Maps to itemStyle.borderRadius per level. Default: 0 */
  borderRadius?: number;
  /** Per-level color arrays. levels[0] applies to depth-0 nodes. Each inner array is the palette for that level. */
  levelColors?: string[][];
};

/**
 * Build an ECharts option object for a treemap chart.
 *
 * - No legend or grid needed — treemap is self-contained.
 * - nodeClick: 'zoomToNode' enables breadcrumb drill-down navigation (TREE-02).
 * - height: '90%' (not calc()) leaves room for breadcrumb bar when shown (Pitfall 1).
 * - levels[] uses color: string[] per entry matching levelColors input arrays (Pitfall 3).
 */
export function buildTreemapOption(
  data: TreemapNode[],
  props: TreemapOptionProps
): Record<string, unknown> {
  // Apply defaults
  const showBreadcrumb = props.breadcrumb ?? true;
  const borderRadius = props.borderRadius ?? 0;
  const levelColors = props.levelColors ?? [];

  // Build levels array from levelColors
  // Each level entry gets: color palette, itemStyle with borderRadius, gapWidth, borderWidth
  const levels = levelColors.map((colors, i) => ({
    color: colors,
    itemStyle: {
      borderRadius: borderRadius > 0 ? Math.max(0, borderRadius - i) : 0,
      gapWidth: i === 0 ? 4 : 2,
      borderWidth: i === 0 ? 3 : 1,
      borderColor: '#fff',
    },
  }));

  // When no levelColors are provided but borderRadius > 0, apply borderRadius on the series itemStyle directly
  const seriesItemStyle: Record<string, unknown> =
    levelColors.length === 0 && borderRadius > 0 ? { borderRadius } : {};

  return {
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'treemap',
        width: '100%',
        // IMPORTANT: Do NOT use calc() — ECharts layout engine does not resolve CSS calc().
        // '90%' gives room for the breadcrumb bar (Pitfall 1 from RESEARCH.md).
        height: showBreadcrumb ? '90%' : '100%',
        nodeClick: 'zoomToNode', // enables breadcrumb drill-down navigation (TREE-02)
        roam: false,
        animationDurationUpdate: 900,
        breadcrumb: {
          show: showBreadcrumb,
          height: 22,
          left: 'center',
          bottom: 0,
        },
        visibleMin: 10, // ECharts hides nodes below 10px² area automatically
        levels: levels.length > 0 ? levels : undefined,
        itemStyle: seriesItemStyle,
        data,
      },
    ],
  };
}
