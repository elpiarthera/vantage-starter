// packages/charts/src/shared/pie-option-builder.ts

// PIE-01: Data shape — named slices with numeric values.
// Small slices below minPercent are merged into a single 'Other' entry by
// _mergeSmallSlices() before data is passed to ECharts. ECharts minAngle only
// affects rendering, NOT the underlying data — always use pre-processing here.
export type PieSlice = {
  name: string;
  value: number;
};

export type PieOptionProps = {
  // PIE-01: Merge slices below this percentage into "Other". 0 = no merging (default).
  minPercent?: number;
  // PIE-02: Inner radius for donut mode. 0 or '' = filled pie. Examples: '40%', '60%'.
  innerRadius?: string | number;
  // PIE-02: Text displayed in the donut center hole. Only shown when innerRadius is non-zero.
  centerLabel?: string;
  // PIE-LABEL: Slice label position.
  // 'top' (default) = labels outside the pie with connector lines.
  // 'bottom' = labels rendered inside each slice.
  labelPosition?: 'top' | 'bottom';
};

/**
 * Merge slices whose percentage of the total is below minPercent into a single
 * 'Other' slice. This is the correct way to suppress tiny slices — ECharts
 * minAngle only hides them visually; they still pollute the legend and tooltip.
 *
 * NOT exported — internal implementation detail of buildPieOption.
 */
function _mergeSmallSlices(slices: PieSlice[], minPercent: number): PieSlice[] {
  if (minPercent <= 0 || slices.length === 0) return slices;

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return slices;

  const kept: PieSlice[] = [];
  let otherValue = 0;

  for (const slice of slices) {
    if ((slice.value / total) * 100 < minPercent) {
      otherValue += slice.value;
    } else {
      kept.push(slice);
    }
  }

  if (otherValue > 0) {
    kept.push({ name: 'Other', value: otherValue });
  }

  return kept;
}

export function buildPieOption(
  slices: PieSlice[],
  props: PieOptionProps
): Record<string, unknown> {
  // PIE-01: Pre-process small slices before handing data to ECharts.
  const mergedSlices = _mergeSmallSlices(slices, props.minPercent ?? 0);

  // PIE-02: Donut mode is activated by any non-zero, non-empty innerRadius value.
  // '0' is truthy in JS but semantically means "no inner radius" — treat it as pie mode.
  const ir = props.innerRadius;
  const isDonut =
    ir !== 0 && ir !== '0%' && ir !== '0' && ir !== '' && ir !== undefined;

  // PIE-LABEL: 'top' = outside with connector lines (ECharts default).
  // 'bottom' = inside each slice (no connector lines needed).
  const echartsLabelPosition = props.labelPosition === 'bottom' ? 'inside' : 'outside';

  const series: Record<string, unknown> = {
    type: 'pie',
    data: mergedSlices,
    // PIE-02: radius is an array [inner, outer] for donut; outer-only string for filled pie.
    radius: isDonut ? [ir, '70%'] : '70%',
    label: { position: echartsLabelPosition },
    tooltip: { trigger: 'item' },
  };

  const option: Record<string, unknown> = {
    // scroll legend handles crowded legend with many slices gracefully.
    legend: { show: true, type: 'scroll' },
    tooltip: { trigger: 'item' },
    series: [series],
  };

  // PIE-02: Inject center label ONLY in donut mode with a non-empty centerLabel.
  // Empty title key causes layout interference — do NOT inject when absent.
  if (isDonut && props.centerLabel) {
    option['title'] = {
      text: props.centerLabel,
      left: 'center',
      top: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold' },
    };
  }

  return option;
}
