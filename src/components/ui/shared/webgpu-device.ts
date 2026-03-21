/// <reference types="@webgpu/types" />
/**
 * WebGPU Device Singleton — WEBGPU-03
 *
 * All chart instances share one GPUDevice to stay within browser device count limits.
 * Pattern mirrors canvas-core.ts's `let _registered = false` guard.
 *
 * Lifecycle:
 * - acquireGpuDevice(): called from BaseChartElement._detectRenderer() when WebGPU is available
 *   Increments _refCount on every call; only calls adapter.requestDevice() on the first call.
 * - getGpuDevice(): called by Phase 101 renderer to obtain the shared device
 * - getGpuAdapter(): called by Phase 101 to pass { adapter, device } to ChartGPU.create()
 * - releaseGpuDevice(): called by Phase 101 disconnectedCallback() cleanup
 *   Decrements _refCount; calls device.destroy() when refcount reaches zero (real teardown).
 *
 * CRITICAL: Do NOT call requestDevice() more than once on the same GPUAdapter.
 * The WebGPU spec marks an adapter as "consumed" after its first requestDevice() call.
 * This module caches the Promise<GPUDevice> — not the adapter — so subsequent
 * acquireGpuDevice() calls with different adapters safely return the cached promise.
 */

/** Active renderer tier — set on BaseChartElement.renderer after detection. */
export type RendererTier = 'webgpu' | 'webgl' | 'canvas';

declare global {
  interface HTMLElementEventMap {
    /**
     * WEBGPU-01: Fired by every chart instance during firstUpdated() once the
     * renderer tier has been determined. detail.renderer is one of RendererTier.
     * Always read renderer from this event — do not poll .renderer synchronously
     * before the event fires (the async GPU probe may not have resolved yet).
     */
    'renderer-selected': CustomEvent<{ renderer: RendererTier }>;
    /** Existing event — redeclared here for completeness alongside renderer-selected. */
    'webgl-unavailable': CustomEvent<{ reason: string }>;
  }
}

let _devicePromise: Promise<GPUDevice> | null = null;
let _adapter: GPUAdapter | null = null;
let _refCount = 0;

/**
 * WEBGPU-03: Acquire or reuse the page-scoped GPUDevice singleton.
 *
 * First call: stores the adapter, calls adapter.requestDevice(), caches the Promise,
 * and sets _refCount to 1.
 * Subsequent calls: increment _refCount and return the cached Promise.
 * The adapter argument on subsequent calls is discarded (NOT consumed by requestDevice).
 *
 * @param adapter - GPUAdapter obtained from navigator.gpu.requestAdapter()
 */
export async function acquireGpuDevice(adapter: GPUAdapter): Promise<GPUDevice> {
  if (_devicePromise) {
    // Shared device already exists — increment refcount and return cached promise.
    // The incoming adapter is intentionally discarded here: calling requestDevice()
    // on it would violate the WebGPU spec (adapter is consumed after first requestDevice).
    _refCount++;
    return _devicePromise;
  }
  // First call only — store adapter so getGpuAdapter() can return it to Plans 02/03.
  _adapter = adapter;
  _refCount = 1;
  // Do NOT call requestDevice() again on any adapter after this point.
  _devicePromise = adapter.requestDevice();
  return _devicePromise;
}

/**
 * Returns the cached GPUDevice promise without creating one.
 * Returns null if acquireGpuDevice() has not been called yet.
 * Used by Phase 101 to access the shared device for WebGPU rendering.
 */
export function getGpuDevice(): Promise<GPUDevice> | null {
  return _devicePromise;
}

/**
 * Returns the stored GPUAdapter from the first acquireGpuDevice() call.
 * Returns null if acquireGpuDevice() has not been called yet.
 * Used by Plans 02 and 03 to pass { adapter, device } to ChartGPU.create().
 */
export function getGpuAdapter(): GPUAdapter | null {
  return _adapter;
}

/**
 * Decrements the refcount for the shared GPUDevice.
 *
 * When _refCount reaches zero: awaits the device and calls device.destroy(),
 * then nulls both _devicePromise and _adapter so a fresh device can be
 * acquired on the next acquireGpuDevice() call.
 *
 * Called by Phase 101's disconnectedCallback() as `void releaseGpuDevice()`
 * (async fire-and-forget from synchronous context — intentional per research).
 *
 * WEBGPU-02: This is the real teardown that prevents memory leaks over
 * repeated create/destroy cycles.
 */
export async function releaseGpuDevice(): Promise<void> {
  if (_refCount <= 0) return;

  _refCount--;

  if (_refCount === 0 && _devicePromise !== null) {
    const device = await _devicePromise;
    device.destroy();
    _devicePromise = null;
    _adapter = null;
  }
}
