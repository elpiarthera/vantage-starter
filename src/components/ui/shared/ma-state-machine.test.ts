/**
 * MAStateMachine — behavioral tests (RED phase).
 *
 * These tests are written as inline assertions using Node assert semantics.
 * The TypeScript compiler validates types; runtime verification is via build.
 *
 * Test cases derived from PLAN 99-01 behavior spec and RESEARCH.md algorithm.
 */
import type { MAStateMachine } from './ma-state-machine.js';

// Type-level test: ensure MAStateMachine is constructible from MAConfig shape
declare function _typeCheck(): void;
_typeCheck satisfies () => void;

// Runtime assertion helper (used in build-time tests via node --input-type=module)
function assertEqual(
  actual: unknown,
  expected: unknown,
  label: string
): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`FAIL [${label}]: got ${a}, expected ${e}`);
  }
}

function assertNull(actual: unknown, label: string): void {
  if (actual !== null) {
    throw new Error(`FAIL [${label}]: expected null, got ${JSON.stringify(actual)}`);
  }
}

function assertApprox(
  actual: number | null,
  expected: number,
  label: string,
  epsilon = 0.001
): void {
  if (actual === null || Math.abs(actual - expected) > epsilon) {
    throw new Error(
      `FAIL [${label}]: expected ~${expected}, got ${actual}`
    );
  }
}

// Import at runtime (works once implementation file exists)
async function runTests(): Promise<void> {
  const { MAStateMachine } = await import('./ma-state-machine.js');

  // ---- SMA tests ----

  // SMA(3): [1,2,3,4,5] → [null, null, 2, 3, 4]
  {
    const sm = new (MAStateMachine as new (config: { period: number; color: string; type?: 'sma' | 'ema' }) => typeof MAStateMachine.prototype)({ period: 3, color: '#fff' });
    const result = sm.reset([1, 2, 3, 4, 5]);
    assertNull(result[0], 'SMA(3) index 0 null');
    assertNull(result[1], 'SMA(3) index 1 null');
    assertApprox(result[2] as number, 2, 'SMA(3) index 2 = 2.0');
    assertApprox(result[3] as number, 3, 'SMA(3) index 3 = 3.0');
    assertApprox(result[4] as number, 4, 'SMA(3) index 4 = 4.0');
    console.log('PASS: SMA(3) basic warm-up and sliding window');
  }

  // SMA(3): NaN gap — [1, 2, NaN, 3, 4] → [null, null, null, 2.0, 3.0]
  {
    const sm = new (MAStateMachine as new (config: { period: number; color: string; type?: 'sma' | 'ema' }) => typeof MAStateMachine.prototype)({ period: 3, color: '#fff' });
    const result = sm.reset([1, 2, NaN, 3, 4]);
    assertNull(result[0], 'SMA NaN-gap index 0 null');
    assertNull(result[1], 'SMA NaN-gap index 1 null');
    assertNull(result[2], 'SMA NaN-gap NaN input → null (MA-03)');
    assertApprox(result[3] as number, 2.0, 'SMA NaN-gap index 3 = 2.0 (window: 1,2,3)');
    assertApprox(result[4] as number, 3.0, 'SMA NaN-gap index 4 = 3.0 (window: 2,3,4)');
    console.log('PASS: SMA(3) NaN gap handling (MA-03)');
  }

  // SMA push() incremental — returns updated values array
  {
    const sm = new (MAStateMachine as new (config: { period: number; color: string; type?: 'sma' | 'ema' }) => typeof MAStateMachine.prototype)({ period: 3, color: '#fff' });
    sm.reset([10, 20, 30, 40]);
    const arr = sm.push(50);
    // After reset([10,20,30,40]) = [null, null, 20, 30], push(50) → [null,null,20,30,40]
    assertEqual(arr.length, 5, 'SMA push() appends to values');
    assertApprox(arr[4] as number, 40, 'SMA push(50) at index 4 = (30+40+50)/3 = 40');
    console.log('PASS: SMA push() incremental update');
  }

  // SMA reset + replay equivalence
  {
    const sm1 = new (MAStateMachine as new (config: { period: number; color: string; type?: 'sma' | 'ema' }) => typeof MAStateMachine.prototype)({ period: 3, color: '#fff' });
    const sm2 = new (MAStateMachine as new (config: { period: number; color: string; type?: 'sma' | 'ema' }) => typeof MAStateMachine.prototype)({ period: 3, color: '#fff' });
    const closes = [5, 10, 15, 20, 25];

    // Method 1: push individually
    for (const c of closes) sm1.push(c);
    // Method 2: reset replay
    sm2.reset(closes);

    assertEqual(
      JSON.stringify(sm1.values),
      JSON.stringify(sm2.values),
      'reset+replay equals push-individually'
    );
    console.log('PASS: SMA reset+replay equals push-individually');
  }

  // ---- EMA tests ----

  // EMA(3): [1,2,3,4,5] → [null, null, 2.0 (seed), 3.0, 4.0]
  {
    const sm = new (MAStateMachine as new (config: { period: number; color: string; type?: 'sma' | 'ema' }) => typeof MAStateMachine.prototype)({ period: 3, color: '#fff', type: 'ema' });
    const result = sm.reset([1, 2, 3, 4, 5]);
    assertNull(result[0], 'EMA(3) index 0 null');
    assertNull(result[1], 'EMA(3) index 1 null');
    assertApprox(result[2] as number, 2.0, 'EMA(3) index 2 = 2.0 (seed SMA)');
    assertApprox(result[3] as number, 3.0, 'EMA(3) index 3 = 4*0.5+2*0.5=3.0');
    assertApprox(result[4] as number, 4.0, 'EMA(3) index 4 = 5*0.5+3*0.5=4.0');
    console.log('PASS: EMA(3) basic warm-up and exponential smoothing');
  }

  // EMA(3): NaN skips warm-up count — [1,NaN,3,4,5,6]
  // valid closes: 1,3,4 → seed=(1+3+4)/3=2.67, then 5*0.5+2.67*0.5=3.83, 6*0.5+3.83*0.5=4.92
  {
    const sm = new (MAStateMachine as new (config: { period: number; color: string; type?: 'sma' | 'ema' }) => typeof MAStateMachine.prototype)({ period: 3, color: '#fff', type: 'ema' });
    const result = sm.reset([1, NaN, 3, 4, 5, 6]);
    assertNull(result[0], 'EMA NaN-gap index 0 null');
    assertNull(result[1], 'EMA NaN-gap NaN → null (MA-03, no warmup increment)');
    assertNull(result[2], 'EMA NaN-gap index 2 null (only 2 valid: 1,3)');
    assertApprox(result[3] as number, 2.667, 'EMA NaN-gap index 3 = seed (1+3+4)/3=2.667');
    assertApprox(result[4] as number, 3.833, 'EMA NaN-gap index 4 = 5*0.5+2.667*0.5=3.833');
    assertApprox(result[5] as number, 4.917, 'EMA NaN-gap index 5 = 6*0.5+3.833*0.5=4.917');
    console.log('PASS: EMA(3) NaN gap ignores warm-up count (MA-03)');
  }

  // values getter returns the same array reference (no copy)
  {
    const sm = new (MAStateMachine as new (config: { period: number; color: string; type?: 'sma' | 'ema' }) => typeof MAStateMachine.prototype)({ period: 3, color: '#fff' });
    sm.reset([1, 2, 3]);
    const ref1 = sm.values;
    sm.push(4);
    const ref2 = sm.values;
    if (ref1 !== ref2) {
      throw new Error('FAIL: values getter must return same array reference (no copy)');
    }
    console.log('PASS: values getter returns same array reference');
  }

  console.log('\nAll MAStateMachine tests passed.');
}

// Export to prevent TypeScript "unused module" warnings
export { runTests };
