/**
 * lui-select - A customizable select/dropdown component
 *
 * Features (Phase 32+):
 * - Single select with dropdown
 * - Multi-select with checkbox indicators (Phase 34)
 * - Keyboard navigation
 * - Form participation via ElementInternals
 * - SSR compatible
 * - Slotted lui-option and lui-option-group support (Phase 33)
 *
 * @example
 * ```html
 * <lui-select placeholder="Select an option">
 *   <lui-option value="1">Option 1</lui-option>
 * </lui-select>
 * ```
 *
 * @example Multi-select
 * ```html
 * <lui-select multiple placeholder="Select options">
 *   <lui-option value="1">Option 1</lui-option>
 *   <lui-option value="2">Option 2</lui-option>
 * </lui-select>
 * ```
 *
 * @example
 * ```html
 * <lui-select placeholder="Select a food">
 *   <lui-option-group label="Fruits">
 *     <lui-option value="apple">Apple</lui-option>
 *   </lui-option-group>
 *   <lui-option-group label="Vegetables">
 *     <lui-option value="carrot">Carrot</lui-option>
 *   </lui-option-group>
 * </lui-select>
 * ```
 */

import { html, css, isServer, nothing, TemplateResult } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';
// Import Floating UI for dropdown positioning
import { computePosition, flip, shift, offset, size } from '@floating-ui/dom';
// Import virtual scrolling for large option lists
// Import Task for async state management
import { Task } from '@lit/task';

import { VirtualizerController } from '@tanstack/lit-virtual';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { Option } from './option.js';

/**
 * Select size types for padding and font sizing
 */
export type SelectSize = 'sm' | 'md' | 'lg';

/**
 * Custom filter function signature.
 * Returns true if the option should be included in filtered results.
 */
export type FilterFunction = (option: SelectOption, query: string) => boolean;

/**
 * Async search function signature.
 * Called with search query and AbortSignal for cancellation.
 */
export type AsyncSearchFunction = (
  query: string,
  signal: AbortSignal
) => Promise<SelectOption[]>;

/**
 * Option data interface for programmatic options
 */
export interface SelectOption {
  /** The value submitted when this option is selected */
  value: string;
  /** Display label for the option (falls back to value if not provided) */
  label: string;
  /** Whether this option is disabled and cannot be selected */
  disabled?: boolean;
}

/**
 * Filter match result with match indices for highlighting
 */
export interface FilterMatch {
  /** The matched option */
  option: SelectOption;
  /** Original index in the effectiveOptions array */
  originalIndex: number;
  /** Array of [start, end] tuples indicating match positions */
  matchIndices: [number, number][];
}

/**
 * A customizable select component with dropdown.
 * Supports form participation via ElementInternals.
 * Form participation is client-side only (guarded with isServer check).
 *
 * @slot default - Options to display in the dropdown (lui-option elements)
 */
export class Select extends TailwindElement {
  /**
   * Enable form association for this custom element.
   * This allows the select to participate in form submission.
   */
  static formAssociated = true;

  /**
   * ElementInternals for form participation.
   * Null during SSR since attachInternals() is not available.
   */
  private internals: ElementInternals | null = null;

  /**
   * The size of the select affecting padding and font size.
   * @default 'md'
   */
  @property({ type: String })
  size: SelectSize = 'md';

  /**
   * Placeholder text displayed when no option is selected.
   * @default 'Select an option'
   */
  @property({ type: String })
  placeholder = 'Select an option';

  /**
   * The name of the select for form submission.
   * @default ''
   */
  @property({ type: String })
  name = '';

  /**
   * The current value of the select.
   * Returns string in single-select mode, string[] in multi-select mode.
   */
  @property({ type: String })
  get value(): string | string[] {
    if (this.multiple) {
      return Array.from(this.selectedValues);
    }
    return this._value;
  }

  set value(val: string | string[]) {
    if (this.multiple && Array.isArray(val)) {
      this.selectedValues = new Set(val);
      this.updateFormValue();
      this.requestUpdate();
    } else if (!this.multiple && typeof val === 'string') {
      const oldValue = this._value;
      this._value = val;
      this.requestUpdate('value', oldValue);
      this.updateFormValue();
    } else if (typeof val === 'string') {
      // Setting string value on multiple - clear and set single
      this.selectedValues = new Set([val]);
      this.updateFormValue();
      this.requestUpdate();
    }
  }

  /**
   * Whether the select is disabled.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether the select is required for form submission.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Whether to show a clear button when a value is selected.
   * @default false
   */
  @property({ type: Boolean })
  clearable = false;

  /**
   * Whether multi-select mode is enabled.
   * In multi-select mode, users can select multiple options.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  multiple = false;

  /**
   * Maximum number of selections allowed in multi-select mode.
   * When reached, additional options cannot be selected.
   * @default undefined (no limit)
   */
  @property({ type: Number })
  maxSelections?: number;

  /**
   * Whether to show select all / clear all button in dropdown.
   * Only applies to multi-select mode.
   * @default false
   */
  @property({ type: Boolean })
  showSelectAll = false;

  /**
   * Whether searchable mode is enabled.
   * In searchable mode, the trigger becomes a text input for filtering options.
   * @default false
   */
  @property({ type: Boolean })
  searchable = false;

  /**
   * Custom filter function for filtering options.
   * If provided, overrides the default case-insensitive contains matching.
   * @example
   * // Filter by value instead of label
   * customFilter={(opt, q) => opt.value.toLowerCase().includes(q.toLowerCase())}
   */
  @property({ attribute: false })
  customFilter?: FilterFunction;

  /**
   * Whether users can create new options by typing values not in the list.
   * When enabled, shows a "Create 'xyz'" option when the filter query
   * doesn't exactly match any existing option.
   * @default false
   */
  @property({ type: Boolean })
  creatable = false;

  /**
   * Debounce delay in milliseconds for async search.
   * Only applies when asyncSearch is provided.
   * @default 300
   */
  @property({ type: Number })
  debounceDelay = 300;

  /**
   * Minimum characters before triggering async search.
   * Below this threshold, shows default/empty options.
   * @default 0
   */
  @property({ type: Number })
  minSearchLength = 0;

  /**
   * Async search function. Called with search query and returns Promise of options.
   * When provided, enables async search mode for searchable selects.
   * The AbortSignal should be used to cancel in-flight requests.
   *
   * @example
   * ```typescript
   * asyncSearch={(query, signal) =>
   *   fetch(`/api/search?q=${query}`, { signal })
   *     .then(res => res.json())
   * }
   * ```
   */
  @property({ attribute: false })
  asyncSearch?: AsyncSearchFunction;

  /**
   * Callback to load more options for infinite scroll.
   * Called when user scrolls near the bottom of the option list.
   * Return additional options to append, or empty array when no more data.
   *
   * @example
   * ```typescript
   * let page = 1;
   * loadMore={async () => {
   *   const res = await fetch(`/api/options?page=${++page}`);
   *   return res.json();
   * }}
   * ```
   */
  @property({ attribute: false })
  loadMore?: () => Promise<SelectOption[]>;

  /**
   * Message displayed when no options match the filter query.
   * @default 'No results found'
   */
  @property({ type: String })
  noResultsMessage = 'No results found';

  /**
   * Label text displayed above the select.
   * @default ''
   */
  @property({ type: String })
  label = '';

  /**
   * Array of options to display in the dropdown.
   * Can be a static array OR a Promise that resolves to options.
   * When a Promise is provided, component shows loading state until resolved.
   * @default []
   */
  @property({ attribute: false })
  options: SelectOption[] | Promise<SelectOption[]> = [];

  /**
   * Whether the dropdown is currently open.
   */
  @state()
  private open = false;

  /**
   * Index of the currently active (keyboard-focused) option.
   */
  @state()
  private activeIndex = -1;

  /**
   * Slotted lui-option elements (from direct children or inside groups).
   * These take precedence over the options property if present.
   */
  @state()
  private slottedOptions: Option[] = [];

  /**
   * Whether the user has interacted with the select.
   */
  @state()
  private touched = false;

  /**
   * Whether to show validation error state.
   */
  @state()
  private showError = false;

  /**
   * Set of selected values for multi-select mode.
   */
  @state()
  private selectedValues: Set<string> = new Set();

  /**
   * Number of visible tags before overflow indicator.
   * Infinity means show all tags.
   */
  @state()
  private visibleTagCount: number = Infinity;

  /**
   * Current filter query for searchable mode.
   */
  @state()
  private filterQuery = '';

  /**
   * Whether the create option is currently active (keyboard-focused).
   */
  @state()
  private createOptionActive = false;

  /**
   * Whether async search is currently loading.
   */
  @state()
  private _searchLoading = false;

  /**
   * Error from async search.
   */
  @state()
  private _searchError: Error | null = null;

  /**
   * Options loaded from async search.
   */
  @state()
  private _searchResults: SelectOption[] | null = null;

  /**
   * Options loaded from async source (Promise).
   * Used internally to track resolved async options.
   */
  @state()
  private _loadedAsyncOptions: SelectOption[] | null = null;

  /**
   * Whether async options are currently loading.
   */
  @state()
  private _asyncLoading = false;

  /**
   * Error from async options loading.
   */
  @state()
  private _asyncError: Error | null = null;

  /**
   * Whether there are more options to load.
   * Set to false when loadMore returns empty array.
   */
  @state()
  private _hasMore = true;

  /**
   * Whether currently loading more options.
   */
  @state()
  private _loadingMore = false;

  /**
   * Internal storage for single-select value.
   */
  private _value = '';

  /**
   * Reference to the trigger element.
   */
  @query('.trigger')
  private triggerEl!: HTMLElement;

  /**
   * Reference to the listbox element.
   */
  @query('.listbox')
  private listboxEl!: HTMLElement;

  /**
   * Unique ID for ARIA references.
   */
  private selectId = `lui-select-${Math.random().toString(36).substr(2, 9)}`;

  /**
   * Type-ahead search string accumulator.
   */
  private typeaheadString = '';

  /**
   * Timeout handle for resetting type-ahead string.
   */
  private typeaheadTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Time in milliseconds before type-ahead string resets.
   */
  private static readonly TYPEAHEAD_RESET_MS = 500;

  /**
   * Mutation observer for detecting dynamically added options inside groups.
   */
  private mutationObserver: MutationObserver | null = null;

  /**
   * ResizeObserver for tracking tag container width changes.
   */
  private resizeObserver: ResizeObserver | null = null;

  /**
   * Timeout handle for search debounce.
   */
  private _searchDebounceTimeout?: ReturnType<typeof setTimeout>;

  /**
   * AbortController for cancelling in-flight search requests.
   */
  private _searchAbortController?: AbortController;

  /**
   * Reference to the listbox scroll container for virtual scrolling.
   */
  private _listboxRef: Ref<HTMLDivElement> = createRef();

  /**
   * Reference to the load-more sentinel element.
   */
  private _sentinelRef: Ref<HTMLDivElement> = createRef();

  /**
   * IntersectionObserver for infinite scroll trigger.
   */
  private _loadMoreObserver?: IntersectionObserver;

  /**
   * VirtualizerController for rendering large option lists efficiently.
   * Only initialized in async mode where virtual scrolling is always enabled.
   */
  private _virtualizer?: VirtualizerController<HTMLDivElement, Element>;

  /**
   * Whether virtualization is currently active.
   * Virtual scrolling is always enabled for async modes (Promise options, async search).
   */
  private get _isVirtualized(): boolean {
    return this._isAsyncMode || this._isAsyncSearchMode;
  }

  /**
   * Standard option height in pixels for virtualizer estimation.
   */
  private static readonly OPTION_HEIGHT = 36;

  /**
   * Number of extra items to render outside visible area.
   */
  private static readonly VIRTUALIZER_OVERSCAN = 5;

  /**
   * X-circle icon SVG for clear button.
   */
  private xCircleIcon = html`
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
    <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `;

  constructor() {
    super();
    // Only attach internals on client (not during SSR)
    if (!isServer) {
      this.internals = this.attachInternals();
    }
  }

  /**
   * Task controller for loading async options.
   * Handles Promise-based options with proper state management.
   */
  private _optionsTask = new Task(this, {
    task: async ([optionsProp], { signal }) => {
      // Sync array - return immediately
      if (Array.isArray(optionsProp)) {
        this._loadedAsyncOptions = null;
        this._asyncLoading = false;
        this._asyncError = null;
        return optionsProp;
      }

      // Promise - track loading state
      this._asyncLoading = true;
      this._asyncError = null;

      try {
        const resolved = await optionsProp;
        signal.throwIfAborted();
        this._loadedAsyncOptions = resolved;
        this._asyncLoading = false;
        // Reset hasMore when options reload
        this._hasMore = true;
        // Schedule virtualizer update after render
        this.updateComplete.then(() => {
          if (this._isVirtualized && this.open) {
            this.updateVirtualizer();
          }
        });
        return resolved;
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          throw err; // Let Task handle abort
        }
        this._asyncLoading = false;
        this._asyncError = err as Error;
        // Clear selection on error (per CONTEXT.md decision)
        if (this.multiple) {
          this.selectedValues.clear();
        } else {
          this._value = '';
        }
        this.updateFormValue();
        throw err;
      }
    },
    args: () => [this.options] as const,
  });

  /**
   * Check if component is in async options mode (Promise-based options).
   */
  private get _isAsyncMode(): boolean {
    return this.options instanceof Promise || this._loadedAsyncOptions !== null;
  }

  /**
   * Check if component is in async search mode.
   */
  private get _isAsyncSearchMode(): boolean {
    return this.searchable && !!this.asyncSearch;
  }

  /**
   * Check if infinite scroll is enabled.
   */
  private get _isInfiniteScrollEnabled(): boolean {
    return !!this.loadMore && this._hasMore;
  }

  /**
   * Execute async search with debounce and AbortController.
   * Cancels previous requests to prevent race conditions.
   */
  private async executeAsyncSearch(query: string): Promise<void> {
    // Clear previous debounce timeout
    if (this._searchDebounceTimeout) {
      clearTimeout(this._searchDebounceTimeout);
      this._searchDebounceTimeout = undefined;
    }

    // Abort previous request
    if (this._searchAbortController) {
      this._searchAbortController.abort();
      this._searchAbortController = undefined;
    }

    // Check minimum length threshold
    if (query.length < this.minSearchLength) {
      // Below threshold - clear search results and show default options
      this._searchResults = null;
      this._searchLoading = false;
      this._searchError = null;
      this.requestUpdate();
      return;
    }

    // Show loading immediately for user feedback
    this._searchLoading = true;
    this._searchError = null;
    this.requestUpdate();

    // Debounce the actual API call
    this._searchDebounceTimeout = setTimeout(async () => {
      this._searchAbortController = new AbortController();

      try {
        const results = await this.asyncSearch!(
          query,
          this._searchAbortController.signal
        );

        // Update results only if not aborted
        this._searchResults = results;
        this._searchLoading = false;
        // Reset hasMore for new search
        this._hasMore = true;

        // Reset active index to first enabled result
        if (results.length > 0) {
          const firstEnabled = results.findIndex((o) => !o.disabled);
          this.activeIndex = firstEnabled >= 0 ? firstEnabled : 0;
        } else {
          this.activeIndex = -1;
        }

        this.requestUpdate();
        // Update virtualizer with new options count
        this.updateComplete.then(() => {
          if (this._isVirtualized && this.open) {
            this.updateVirtualizer();
          }
        });
      } catch (err) {
        // Ignore AbortError - expected when request is cancelled
        if ((err as Error).name === 'AbortError') {
          return;
        }

        // Handle actual errors
        this._searchError = err as Error;
        this._searchLoading = false;
        this._searchResults = null;
        this.requestUpdate();
      }
    }, this.debounceDelay);
  }

  /**
   * Fetch default options when search is cleared.
   * Calls asyncSearch with empty string if provided.
   */
  private async fetchDefaultOptions(): Promise<void> {
    if (!this.asyncSearch) return;

    // Abort any pending search
    if (this._searchAbortController) {
      this._searchAbortController.abort();
      this._searchAbortController = undefined;
    }

    // Clear debounce
    if (this._searchDebounceTimeout) {
      clearTimeout(this._searchDebounceTimeout);
      this._searchDebounceTimeout = undefined;
    }

    this._searchLoading = true;
    this._searchError = null;
    this._searchAbortController = new AbortController();

    try {
      const results = await this.asyncSearch('', this._searchAbortController.signal);
      this._searchResults = results;
      this._searchLoading = false;
      this.requestUpdate();
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        this._searchError = err as Error;
        this._searchLoading = false;
      }
      this.requestUpdate();
    }
  }

  /**
   * Validate the select and sync validity state to ElementInternals.
   * @returns true if valid, false if invalid
   */
  private validate(): boolean {
    if (!this.internals) return true;

    const hasValue = this.multiple
      ? this.selectedValues.size > 0
      : !!this._value;

    if (this.required && !hasValue) {
      this.internals.setValidity(
        { valueMissing: true },
        this.multiple
          ? 'Please select at least one option'
          : 'Please select an option',
        this.triggerEl
      );
      return false;
    }

    // Clear validity when valid
    this.internals.setValidity({});
    return true;
  }

  /**
   * Update the form value based on current selection(s).
   * Uses FormData.append() for multi-select to allow getAll().
   */
  private updateFormValue(): void {
    if (!this.internals) return;

    if (this.multiple) {
      const formData = new FormData();
      for (const val of this.selectedValues) {
        formData.append(this.name, val);
      }
      this.internals.setFormValue(formData);
    } else {
      this.internals.setFormValue(this._value);
    }
  }

  /**
   * Toggle selection of an option in multi-select mode.
   * @param index The index of the option to toggle
   */
  private toggleSelection(index: number): void {
    const opts = this.effectiveOptions;
    const option = opts[index];
    if (!option || option.disabled) return;

    const value = option.value;

    if (this.selectedValues.has(value)) {
      // Remove from selection
      this.selectedValues.delete(value);
    } else {
      // Check maxSelections limit
      if (
        this.maxSelections !== undefined &&
        this.selectedValues.size >= this.maxSelections
      ) {
        return; // At limit, don't add
      }
      // Add to selection
      this.selectedValues.add(value);
    }

    // Sync slotted option states
    this.syncSlottedOptionStates();

    // Reset visible tag count for recalculation
    this.visibleTagCount = Infinity;

    this.updateFormValue();
    this.requestUpdate();

    // Dispatch change event
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: Array.from(this.selectedValues) },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Select all enabled options in multi-select mode.
   * Respects maxSelections limit if set.
   */
  private selectAll(): void {
    const enabledOptions = this.effectiveOptions.filter((o) => !o.disabled);

    // Respect maxSelections limit
    if (this.maxSelections && this.maxSelections > 0) {
      const toSelect = enabledOptions.slice(0, this.maxSelections);
      this.selectedValues = new Set(toSelect.map((o) => o.value));
    } else {
      this.selectedValues = new Set(enabledOptions.map((o) => o.value));
    }

    this.visibleTagCount = Infinity;
    this.updateFormValue();
    this.syncSlottedOptionStates();
    this.requestUpdate();

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: Array.from(this.selectedValues) },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Deselect all options in multi-select mode.
   */
  private deselectAll(): void {
    this.selectedValues.clear();
    this.visibleTagCount = Infinity;
    this.updateFormValue();
    this.syncSlottedOptionStates();
    this.requestUpdate();

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: [] },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle tag removal in multi-select mode.
   * Removes the selection without opening the dropdown.
   */
  private handleTagRemove(e: Event, value: string): void {
    e.stopPropagation(); // Don't open/close dropdown
    e.preventDefault();

    this.selectedValues.delete(value);

    // Reset visible tag count for recalculation
    this.visibleTagCount = Infinity;

    this.updateFormValue();
    this.requestUpdate();

    // Sync slotted option states
    this.syncSlottedOptionStates();

    // Dispatch change event
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: Array.from(this.selectedValues) },
        bubbles: true,
        composed: true,
      })
    );

    // Focus trigger after removal
    this.triggerEl?.focus();
  }

  /**
   * Calculate how many tags are visible based on container width.
   * Uses requestAnimationFrame to avoid layout thrashing.
   */
  private calculateVisibleTags(containerWidth: number): void {
    if (!this.multiple || this.selectedValues.size === 0) {
      this.visibleTagCount = Infinity;
      return;
    }

    const tags = this.shadowRoot?.querySelectorAll('.tag:not(.tag-overflow)');
    if (!tags || tags.length === 0) {
      this.visibleTagCount = Infinity;
      return;
    }

    const moreButtonWidth = 60; // Reserve space for "+N more"
    const gap = 4; // Gap between tags
    let totalWidth = 0;
    let count = 0;

    for (const tag of tags) {
      const tagWidth = tag.getBoundingClientRect().width + gap;
      if (totalWidth + tagWidth + moreButtonWidth > containerWidth && count > 0) {
        break;
      }
      totalWidth += tagWidth;
      count++;
    }

    // Use requestAnimationFrame to avoid layout thrashing
    requestAnimationFrame(() => {
      if (count !== this.visibleTagCount && count > 0) {
        this.visibleTagCount = count;
      }
    });
  }

  /**
   * Get comma-separated list of hidden selection labels for tooltip.
   */
  private getHiddenSelectionsList(hiddenOptions: SelectOption[]): string {
    return hiddenOptions.map((o) => o.label).join(', ');
  }

  /**
   * Get the current validation error message.
   */
  private get errorMessage(): string {
    return this.internals?.validationMessage || '';
  }

  /**
   * Form lifecycle callback: reset the select to initial state.
   */
  formResetCallback(): void {
    if (this.multiple) {
      this.selectedValues.clear();
    } else {
      this._value = '';
    }
    this.touched = false;
    this.showError = false;
    this.syncSlottedOptionStates();
    this.internals?.setFormValue('');
    this.internals?.setValidity({});
    this.requestUpdate();
  }

  /**
   * Form lifecycle callback: handle disabled state from form.
   */
  formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  /**
   * Handle blur events for validation display timing.
   */
  private handleBlur(): void {
    this.touched = true;
    const isValid = this.validate();
    this.showError = !isValid;
  }

  /**
   * Handle clear button click - reset value without opening dropdown.
   */
  private handleClear(e: Event): void {
    e.stopPropagation(); // Don't open dropdown
    e.preventDefault();

    if (this.multiple) {
      this.selectedValues.clear();
    } else {
      this._value = '';
    }

    // Reset selected state on slotted options
    if (this.slottedOptions.length > 0) {
      this.slottedOptions.forEach((opt) => {
        opt.selected = false;
      });
    }

    // Update form value
    this.updateFormValue();

    // Validate after clearing
    if (this.touched) {
      const isValid = this.validate();
      this.showError = !isValid;
    }

    // Dispatch change and clear events
    this.dispatchEvent(
      new CustomEvent('clear', {
        bubbles: true,
        composed: true,
      })
    );
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.multiple ? [] : '' },
        bubbles: true,
        composed: true,
      })
    );

    // Focus trigger after clearing
    this.triggerEl?.focus();
    this.requestUpdate();
  }

  /**
   * Handle input events in searchable mode.
   * Applies filter and updates dropdown.
   * Uses async search when asyncSearch prop is provided.
   */
  private handleInput(e: InputEvent): void {
    const input = e.target as HTMLInputElement;
    const query = input.value;

    // Update filter query for display
    this.filterQuery = query;

    // Use async search if available
    if (this._isAsyncSearchMode) {
      this.executeAsyncSearch(query);
      return;
    }

    // Otherwise use local filtering (existing behavior)
    this.applyFilter(query);
  }

  /**
   * Handle focus on searchable input.
   * Opens dropdown and selects input text for easy replacement.
   */
  private handleInputFocus(): void {
    if (!this.open) {
      this.openDropdown();
    }
  }

  /**
   * Get the display value for the searchable input.
   * When open: shows filterQuery (what user is typing)
   * When closed: shows selected option's label
   */
  private getInputDisplayValue(): string {
    if (this.open) {
      return this.filterQuery;
    }
    return this.getSelectedLabel();
  }

  /**
   * Render the clear button if clearable and value is set.
   */
  private renderClearButton() {
    const hasValue = this.multiple
      ? this.selectedValues.size > 0
      : !!this._value;
    if (!this.clearable || !hasValue || this.disabled) return nothing;

    return html`
      <button
        type="button"
        class="clear-button"
        aria-label="Clear selection"
        tabindex="-1"
        @click=${this.handleClear}
        @mousedown=${(e: MouseEvent) => e.preventDefault()}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" class="clear-icon">
          ${this.xCircleIcon}
        </svg>
      </button>
    `;
  }

  /**
   * Render tags for multi-select mode.
   * Shows selected items as removable pill-shaped tags.
   * Respects visibleTagCount and shows overflow indicator.
   */
  private renderTags() {
    if (!this.multiple || this.selectedValues.size === 0) {
      return nothing;
    }

    const selectedOptions = this.effectiveOptions.filter((o) =>
      this.selectedValues.has(o.value)
    );

    const visibleOptions =
      this.visibleTagCount < selectedOptions.length
        ? selectedOptions.slice(0, this.visibleTagCount)
        : selectedOptions;

    const hiddenCount = selectedOptions.length - visibleOptions.length;

    return html`
      <div class="tag-container">
        ${visibleOptions.map(
          (opt) => html`
            <span class="tag" title="${opt.label}">
              <span class="tag-label">${opt.label}</span>
              <button
                type="button"
                class="tag-remove"
                aria-label="Remove ${opt.label}"
                tabindex="-1"
                @click=${(e: Event) => this.handleTagRemove(e, opt.value)}
                @mousedown=${(e: MouseEvent) => e.preventDefault()}
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    d="M4 4l8 8M12 4l-8 8"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </span>
          `
        )}
        ${hiddenCount > 0
          ? html`
              <span
                class="tag tag-overflow"
                title="${this.getHiddenSelectionsList(
                  selectedOptions.slice(this.visibleTagCount)
                )}"
              >
                +${hiddenCount} more
              </span>
            `
          : nothing}
      </div>
    `;
  }

  /**
   * Render select all / clear all actions in dropdown.
   * Only rendered in multi-select mode when showSelectAll is true.
   */
  private renderSelectAllActions() {
    if (!this.multiple || !this.showSelectAll) return nothing;

    const enabledCount = this.effectiveOptions.filter((o) => !o.disabled).length;
    const allSelected =
      this.selectedValues.size === enabledCount ||
      (this.maxSelections !== undefined &&
        this.selectedValues.size >= this.maxSelections);

    return html`
      <div class="select-all-actions">
        <button
          type="button"
          class="select-all-btn"
          @click=${allSelected ? this.deselectAll : this.selectAll}
          @mousedown=${(e: MouseEvent) => e.preventDefault()}
        >
          ${allSelected ? 'Clear all' : 'Select all'}
        </button>
      </div>
    `;
  }

  /**
   * Handle document clicks for closing dropdown when clicking outside.
   * Uses composedPath() to work correctly with Shadow DOM.
   */
  private handleDocumentClick = (e: MouseEvent): void => {
    if (!e.composedPath().includes(this)) {
      this.closeDropdown();
    }
  };

  /**
   * Handle slot change events to collect slotted options.
   * Detects lui-option children and options inside lui-option-group elements.
   */
  private handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const assigned = slot.assignedElements({ flatten: true });

    // Collect options - both direct children and inside groups
    const options: Option[] = [];

    for (const el of assigned) {
      if (el.tagName === 'LUI-OPTION') {
        options.push(el as Option);
      } else if (el.tagName === 'LUI-OPTION-GROUP') {
        // Find options inside the group
        const groupOptions = el.querySelectorAll('lui-option');
        groupOptions.forEach((opt) => options.push(opt as Option));
      }
    }

    this.slottedOptions = options;

    // Attach click handlers to slotted options
    // Only update attributes if changed to avoid triggering MutationObserver loops
    this.slottedOptions.forEach((opt, index) => {
      opt.removeEventListener('click', this.handleSlottedOptionClick);
      opt.addEventListener('click', this.handleSlottedOptionClick);
      // Store index as data attribute for click handling (only if changed)
      const indexStr = String(index);
      if (opt.dataset.optionIndex !== indexStr) {
        opt.dataset.optionIndex = indexStr;
      }
    });

    this.syncSlottedOptionStates();
    this.requestUpdate();
  }

  /**
   * Handle click on a slotted option element.
   */
  private handleSlottedOptionClick = (e: Event): void => {
    const target = e.currentTarget as Option;
    const index = parseInt(target.dataset.optionIndex || '0', 10);
    e.stopPropagation();
    this.selectOption(index);
  };

  /**
   * Sync selected state to slotted option elements.
   * Also sets multiselect attribute for checkbox display.
   * Only updates if values have changed to avoid triggering MutationObserver loops.
   */
  private syncSlottedOptionStates(): void {
    for (const opt of this.slottedOptions) {
      // Only update if changed to avoid triggering mutations
      if (opt.multiselect !== this.multiple) {
        opt.multiselect = this.multiple;
      }
      const isSelected = this.multiple
        ? this.selectedValues.has(opt.value)
        : opt.value === this._value;
      if (opt.selected !== isSelected) {
        opt.selected = isSelected;
      }
    }
  }

  /**
   * Update active visual state on slotted options.
   */
  private syncSlottedActiveState(): void {
    this.slottedOptions.forEach((opt, idx) => {
      if (idx === this.activeIndex) {
        opt.setAttribute('data-active', 'true');
      } else {
        opt.removeAttribute('data-active');
      }
    });
  }

  /**
   * Get the effective options list.
   * Resolves async options, search results, or slotted options.
   * Returns array of objects with value, label, disabled.
   */
  private get effectiveOptions(): SelectOption[] {
    // Async search results take highest precedence
    if (this._searchResults !== null) {
      return this._searchResults;
    }
    // Loaded async options next (when options is a Promise)
    if (this._loadedAsyncOptions !== null) {
      return this._loadedAsyncOptions;
    }
    // Static options property (backwards compatible)
    if (Array.isArray(this.options) && this.options.length > 0) {
      return this.options;
    }
    // Otherwise use slotted options
    return this.slottedOptions.map((opt) => ({
      value: opt.value,
      label: opt.getLabel(),
      disabled: opt.disabled,
    }));
  }

  /**
   * Check if using slotted mode (no options property, has slotted children).
   */
  private get isSlottedMode(): boolean {
    const hasStaticOptions = Array.isArray(this.options) && this.options.length > 0;
    const hasAsyncOptions = this._loadedAsyncOptions !== null && this._loadedAsyncOptions.length > 0;
    return !hasStaticOptions && !hasAsyncOptions && this.slottedOptions.length > 0;
  }

  /**
   * Find all occurrences of query in text (case-insensitive).
   * Returns array of [start, end] tuples for ALL matches.
   * @example findAllMatches("Banana", "an") returns [[1, 3], [3, 5]]
   */
  private findAllMatches(text: string, query: string): [number, number][] {
    if (!query) return [];

    const matches: [number, number][] = [];
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    let startIndex = 0;

    while (startIndex < lowerText.length) {
      const foundIndex = lowerText.indexOf(lowerQuery, startIndex);
      if (foundIndex === -1) break;

      matches.push([foundIndex, foundIndex + lowerQuery.length]);
      startIndex = foundIndex + 1; // Allow overlapping matches
    }

    return matches;
  }

  /**
   * Get filtered options based on filterQuery.
   * Returns FilterMatch[] with match indices for highlighting.
   * In async search mode, returns effectiveOptions directly (server filters).
   * Uses customFilter if provided, otherwise case-insensitive contains matching.
   */
  private get filteredOptions(): FilterMatch[] {
    const options = this.effectiveOptions;

    // In async search mode, server handles filtering - return all options
    if (this._isAsyncSearchMode && this._searchResults !== null) {
      return options.map((option, index) => ({
        option,
        originalIndex: index,
        matchIndices: [], // No highlighting for async results (server filtered)
      }));
    }

    // Return all options with empty matchIndices if not searchable or filter is empty
    if (!this.searchable || !this.filterQuery) {
      return options.map((option, index) => ({
        option,
        originalIndex: index,
        matchIndices: [],
      }));
    }

    // Use custom filter if provided (no highlighting for custom filters)
    if (this.customFilter) {
      return options
        .map((option, index) => ({
          option,
          originalIndex: index,
          matchIndices: [] as [number, number][],
        }))
        .filter((fm) => this.customFilter!(fm.option, this.filterQuery));
    }

    // Default: case-insensitive contains matching on label with match indices
    const results: FilterMatch[] = [];

    for (let index = 0; index < options.length; index++) {
      const option = options[index];
      const searchText = option.label || option.value;
      const matchIndices = this.findAllMatches(searchText, this.filterQuery);

      if (matchIndices.length > 0) {
        results.push({
          option,
          originalIndex: index,
          matchIndices,
        });
      }
    }

    return results;
  }

  /**
   * Render label with highlighted matches.
   * @param label The full label text
   * @param matchIndices Array of [start, end] tuples for match positions
   * @returns Template with highlighted portions
   */
  private renderHighlightedLabel(label: string, matchIndices: [number, number][]) {
    if (matchIndices.length === 0) {
      return label;
    }

    // Sort and merge overlapping matches
    const sorted = [...matchIndices].sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [];

    for (const [start, end] of sorted) {
      if (merged.length === 0 || start > merged[merged.length - 1][1]) {
        merged.push([start, end]);
      } else {
        // Merge overlapping
        merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], end);
      }
    }

    // Build segments
    const segments: Array<{ text: string; highlighted: boolean }> = [];
    let lastEnd = 0;

    for (const [start, end] of merged) {
      // Non-matching text before this match
      if (start > lastEnd) {
        segments.push({ text: label.slice(lastEnd, start), highlighted: false });
      }
      // Matching text
      segments.push({ text: label.slice(start, end), highlighted: true });
      lastEnd = end;
    }

    // Remaining text after last match
    if (lastEnd < label.length) {
      segments.push({ text: label.slice(lastEnd), highlighted: false });
    }

    return html`${segments.map((seg) =>
      seg.highlighted
        ? html`<strong class="highlight">${seg.text}</strong>`
        : seg.text
    )}`;
  }

  /**
   * Initialize or update the virtualizer based on current options count.
   * Called when options change or async mode becomes active.
   */
  private updateVirtualizer(): void {
    if (!this._isVirtualized) {
      this._virtualizer = undefined;
      return;
    }

    const scrollElement = this._listboxRef.value;
    if (!scrollElement) return;

    const optionCount = this.effectiveOptions.length;

    // Always recreate virtualizer when count changes to avoid partial options issue
    // VirtualizerController manages its own lifecycle efficiently
    this._virtualizer = new VirtualizerController(this, {
      getScrollElement: () => this._listboxRef.value ?? null,
      count: optionCount,
      estimateSize: () => Select.OPTION_HEIGHT,
      overscan: Select.VIRTUALIZER_OVERSCAN,
    });
  }

  /**
   * Set up IntersectionObserver for infinite scroll.
   * Triggers loadMore when sentinel enters 80% threshold.
   */
  private setupLoadMoreObserver(): void {
    if (this._loadMoreObserver || !this.loadMore) return;

    const scrollContainer = this._listboxRef.value;
    if (!scrollContainer) return;

    this._loadMoreObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          this._hasMore &&
          !this._loadingMore &&
          !this._asyncLoading &&
          !this._searchLoading
        ) {
          this.handleLoadMore();
        }
      },
      {
        root: scrollContainer,
        // Trigger when sentinel is 20% from the bottom (80% scroll)
        rootMargin: '0px 0px 20% 0px',
        threshold: 0,
      }
    );

    // Observe sentinel element
    const sentinel = this._sentinelRef.value;
    if (sentinel) {
      this._loadMoreObserver.observe(sentinel);
    }
  }

  /**
   * Handle load more trigger.
   * Calls loadMore callback and appends results.
   */
  private async handleLoadMore(): Promise<void> {
    if (!this.loadMore || this._loadingMore || !this._hasMore) return;

    this._loadingMore = true;
    this.requestUpdate();

    try {
      const moreOptions = await this.loadMore();

      if (moreOptions.length === 0) {
        // No more data
        this._hasMore = false;
      } else {
        // Append to existing options
        if (this._searchResults !== null) {
          this._searchResults = [...this._searchResults, ...moreOptions];
        } else if (this._loadedAsyncOptions !== null) {
          this._loadedAsyncOptions = [...this._loadedAsyncOptions, ...moreOptions];
        }

        // Update virtualizer with new count
        this.updateComplete.then(() => {
          if (this._isVirtualized) {
            this.updateVirtualizer();
          }
        });
      }
    } catch (err) {
      console.error('Failed to load more options:', err);
      // Don't set error state for load-more failures - user can scroll again to retry
    } finally {
      this._loadingMore = false;
      this.requestUpdate();
    }
  }

  /**
   * Clean up the load more IntersectionObserver.
   */
  private cleanupLoadMoreObserver(): void {
    if (this._loadMoreObserver) {
      this._loadMoreObserver.disconnect();
      this._loadMoreObserver = undefined;
    }
  }

  /**
   * Apply a filter query and update state.
   * Auto-opens dropdown if query is not empty.
   * Resets activeIndex to first filtered option or -1 if no matches.
   */
  private applyFilter(query: string): void {
    this.filterQuery = query;

    // Auto-open dropdown when typing starts
    if (!this.open && query) {
      this.open = true;
      this.requestUpdate();
      this.updateComplete.then(() => {
        this.positionDropdown(this.triggerEl, this.listboxEl);
      });
    }

    // Reset active index based on filtered results
    const filtered = this.filteredOptions;
    if (filtered.length > 0) {
      this.activeIndex = filtered.findIndex((fm) => !fm.option.disabled);
      if (this.activeIndex < 0) this.activeIndex = 0;
    } else {
      this.activeIndex = -1;
    }

    // Clear create option active when filter changes
    this.createOptionActive = false;

    this.requestUpdate();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!isServer) {
      document.addEventListener('click', this.handleDocumentClick);
      // Sync initial value to form
      if (this.multiple && this.selectedValues.size > 0) {
        this.updateFormValue();
      } else if (!this.multiple && this._value) {
        this.updateFormValue();
      }

      // Observe for dynamic option changes inside groups
      this.mutationObserver = new MutationObserver(() => {
        this.updateComplete.then(() => {
          // Re-query slotted options when children change
          const slot = this.shadowRoot?.querySelector(
            'slot:not([name])'
          ) as HTMLSlotElement;
          if (slot) {
            this.handleSlotChange({ target: slot } as unknown as Event);
          }
        });
      });
      this.mutationObserver.observe(this, { childList: true, subtree: true });

      // Add ResizeObserver for tag overflow calculation
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          this.calculateVisibleTags(entry.contentRect.width);
        }
      });
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (!isServer) {
      document.removeEventListener('click', this.handleDocumentClick);
      // Clear typeahead timeout
      if (this.typeaheadTimeout !== null) {
        clearTimeout(this.typeaheadTimeout);
        this.typeaheadTimeout = null;
      }
      // Disconnect mutation observer
      this.mutationObserver?.disconnect();
      this.mutationObserver = null;

      // Disconnect resize observer
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;

      // Clean up virtualizer
      this._virtualizer = undefined;

      // Clean up load more observer
      this.cleanupLoadMoreObserver();

      // Clear search debounce timeout
      if (this._searchDebounceTimeout) {
        clearTimeout(this._searchDebounceTimeout);
        this._searchDebounceTimeout = undefined;
      }

      // Abort pending search request
      if (this._searchAbortController) {
        this._searchAbortController.abort();
        this._searchAbortController = undefined;
      }
    }
  }

  override updated(): void {
    // Start observing tag container for overflow
    if (this.multiple && this.selectedValues.size > 0) {
      const tagContainer = this.shadowRoot?.querySelector('.tag-container');
      if (tagContainer && this.resizeObserver) {
        this.resizeObserver.observe(tagContainer);
      }
    }

    // Initialize or update virtualizer when options change or dropdown opens
    if (this._isVirtualized && this.open) {
      this.updateVirtualizer();
    }

    // Re-observe sentinel after render if needed
    if (this.loadMore && this._hasMore && this.open && this._loadMoreObserver) {
      const sentinel = this._sentinelRef.value;
      if (sentinel) {
        this._loadMoreObserver.disconnect();
        this._loadMoreObserver.observe(sentinel);
      }
    }
  }

  /**
   * Static styles for the select component.
   * Uses CSS custom properties from Phase 31 tokens.
   */
  static override styles = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: inline-block;
      }

      :host([disabled]) {
        pointer-events: none;
      }

      /* Trigger button - the clickable select display */
      .trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        width: 100%;
        border-radius: var(--ui-select-radius);
        border-width: var(--ui-select-border-width);
        border-style: solid;
        border-color: var(--ui-select-border);
        background-color: var(--ui-select-bg);
        color: var(--ui-select-text);
        cursor: pointer;
        transition: border-color var(--ui-select-transition);
      }

      .trigger:focus {
        outline: none;
        border-color: var(--ui-select-border-focus);
      }

      .trigger:focus-visible {
        outline: 2px solid var(--ui-select-ring);
        outline-offset: 2px;
      }

      /* Size variants */
      .trigger-sm {
        padding: var(--ui-select-padding-y-sm) var(--ui-select-padding-x-sm);
        font-size: var(--ui-select-font-size-sm);
      }

      .trigger-md {
        padding: var(--ui-select-padding-y-md) var(--ui-select-padding-x-md);
        font-size: var(--ui-select-font-size-md);
      }

      .trigger-lg {
        padding: var(--ui-select-padding-y-lg) var(--ui-select-padding-x-lg);
        font-size: var(--ui-select-font-size-lg);
      }

      /* Disabled state */
      .trigger-disabled {
        background-color: var(--ui-select-bg-disabled);
        color: var(--ui-select-text-disabled);
        border-color: var(--ui-select-border-disabled);
        cursor: not-allowed;
      }

      /* Placeholder text */
      .placeholder {
        color: var(--ui-select-placeholder);
      }

      /* Selected value text */
      .selected-value {
        color: var(--ui-select-text);
      }

      /* Chevron icon */
      .chevron {
        flex-shrink: 0;
        width: 1em;
        height: 1em;
        opacity: 0.5;
        transition: transform 150ms;
      }

      /* Chevron rotation when open */
      .chevron-open {
        transform: rotate(180deg);
      }

      /* Listbox dropdown */
      .listbox {
        position: fixed;
        z-index: var(--ui-select-z-index, 50);
        max-height: var(--ui-select-dropdown-max-height, 240px);
        overflow-y: auto;
        border-radius: var(--ui-select-radius);
        border: 1px solid var(--ui-select-dropdown-border);
        background-color: var(--ui-select-dropdown-bg);
        box-shadow: var(--ui-select-dropdown-shadow);
      }

      .listbox[hidden] {
        display: none;
      }

      /* Option items */
      .option {
        display: flex;
        align-items: center;
        padding: var(--ui-select-option-padding-y, 0.5rem)
          var(--ui-select-option-padding-x, 0.75rem);
        cursor: pointer;
        color: var(--ui-select-option-text);
        transition: background-color 150ms;
      }

      .option:hover:not(.option-disabled) {
        background-color: var(--ui-select-option-bg-hover);
      }

      .option-active {
        background-color: var(--ui-select-option-bg-active);
      }

      .option-selected {
        font-weight: 500;
      }

      .option-disabled {
        opacity: 0.5;
        cursor: not-allowed;
        color: var(--ui-select-option-text-disabled);
      }

      .check-icon {
        width: 1em;
        height: 1em;
        margin-right: 0.5rem;
        display: none;
        color: var(--ui-select-option-check);
      }

      .option-selected .check-icon {
        display: inline-block;
      }

      /* Checkbox indicator for multi-select mode */
      .checkbox-indicator {
        width: 1em;
        height: 1em;
        flex-shrink: 0;
        border: 2px solid var(--ui-select-checkbox-border, var(--color-border));
        border-radius: var(--radius-sm, 0.25rem);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 0.5rem;
        background-color: transparent;
        transition:
          background-color 150ms,
          border-color 150ms;
      }

      .checkbox-indicator.checked {
        background-color: var(
          --ui-select-checkbox-bg-checked,
          var(--color-primary)
        );
        border-color: var(
          --ui-select-checkbox-bg-checked,
          var(--color-primary)
        );
      }

      .checkbox-indicator svg {
        width: 0.75em;
        height: 0.75em;
        color: var(--ui-select-checkbox-check, white);
      }

      /* Slotted option active state */
      ::slotted([data-active='true']) {
        background-color: var(--ui-select-option-bg-active);
      }

      /* Select wrapper for label structure */
      .select-wrapper {
        display: flex;
        flex-direction: column;
      }

      /* Label styling - scales with size */
      .select-label {
        font-weight: 500;
        color: var(--ui-select-text);
        margin-bottom: 0.25rem;
      }

      .label-sm {
        font-size: var(--ui-select-font-size-sm);
      }

      .label-md {
        font-size: var(--ui-select-font-size-md);
      }

      .label-lg {
        font-size: var(--ui-select-font-size-lg);
      }

      .required-indicator {
        color: var(--ui-select-text-error, var(--color-destructive));
        margin-left: 0.125rem;
      }

      /* Error state */
      .trigger-error {
        border-color: var(--ui-select-border-error);
      }

      .trigger-error:focus {
        border-color: var(--ui-select-border-error);
      }

      /* Error text below select */
      .error-text {
        font-size: 0.875em;
        color: var(--ui-select-text-error, var(--color-destructive));
        margin-top: 0.25rem;
      }

      /* Visually hidden for screen reader only text */
      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* Clear button styling */
      .clear-button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.125rem;
        border: none;
        background: transparent;
        color: var(--ui-select-placeholder);
        cursor: pointer;
        border-radius: var(--radius-sm, 0.25rem);
        transition:
          color 150ms,
          background-color 150ms;
        flex-shrink: 0;
      }

      .clear-button:hover {
        color: var(--ui-select-text);
        background-color: var(--color-muted, rgba(0, 0, 0, 0.05));
      }

      .clear-button:focus-visible {
        outline: 2px solid var(--ui-select-ring);
        outline-offset: 1px;
      }

      .clear-icon {
        width: 1em;
        height: 1em;
      }

      /* Trigger actions container */
      .trigger-actions {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        flex-shrink: 0;
      }

      /* Tag container for multi-select */
      .tag-container {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ui-select-tag-gap, 0.25rem);
        align-items: center;
        min-height: 1.5em;
        flex: 1;
        min-width: 0;
      }

      /* Individual tag/chip styling - Gmail-style pill */
      .tag {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: var(--ui-select-tag-padding-y, 0.125rem) var(--ui-select-tag-padding-x, 0.5rem);
        background-color: var(--ui-select-tag-bg);
        color: var(--ui-select-tag-text);
        border-radius: var(--radius-full, 9999px);
        font-size: 0.875em;
        max-width: 100%;
        overflow: hidden;
      }

      .tag-label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .tag-remove {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: none;
        background: transparent;
        color: currentColor;
        cursor: pointer;
        opacity: 0.7;
        flex-shrink: 0;
        border-radius: var(--radius-full, 9999px);
        width: 1em;
        height: 1em;
      }

      .tag-remove:hover {
        opacity: 1;
        background-color: rgba(0, 0, 0, 0.1);
      }

      .tag-remove svg {
        width: 0.75em;
        height: 0.75em;
      }

      /* Overflow indicator tag */
      .tag-overflow {
        background-color: var(--ui-select-option-bg-hover, var(--color-accent));
        cursor: default;
        flex-shrink: 0;
      }

      /* Select all actions container */
      .select-all-actions {
        padding: 0.5rem 0.75rem;
        border-bottom: 1px solid var(--ui-select-dropdown-border);
      }

      .select-all-btn {
        font-size: 0.875em;
        color: var(--color-primary, var(--ui-color-primary));
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
      }

      .select-all-btn:hover {
        text-decoration: underline;
      }

      /* Searchable trigger input styling */
      .trigger-input {
        flex: 1;
        border: none;
        background: transparent;
        outline: none;
        font-size: inherit;
        color: inherit;
        padding: 0;
        min-width: 0;
      }

      .trigger-input::placeholder {
        color: var(--ui-select-placeholder);
      }

      .trigger-input:disabled {
        cursor: not-allowed;
      }

      /* Empty state when filter has no matches */
      .empty-state {
        padding: var(--ui-select-option-padding-y, 0.5rem)
          var(--ui-select-option-padding-x, 0.75rem);
        color: var(--ui-select-placeholder);
        text-align: center;
        font-style: italic;
      }

      /* Error state styling */
      .error-state {
        padding: var(--ui-select-option-padding-y, 0.5rem)
          var(--ui-select-option-padding-x, 0.75rem);
        text-align: center;
      }

      .error-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        color: var(--ui-select-text-error, var(--color-destructive));
      }

      .error-message {
        font-size: 0.875em;
      }

      .retry-link {
        color: var(--color-primary);
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.875em;
        text-decoration: underline;
        padding: 0;
      }

      .retry-link:hover {
        text-decoration: none;
      }

      .retry-link:focus-visible {
        outline: 2px solid var(--ui-select-ring);
        outline-offset: 2px;
        border-radius: var(--radius-sm, 0.25rem);
      }

      /* Match highlight for searchable mode */
      .highlight {
        font-weight: var(--ui-select-highlight-weight, 600);
        color: var(--ui-select-highlight-text, inherit);
      }

      /* Create option styling for creatable mode */
      .option-create {
        border-top: 1px solid var(--ui-select-dropdown-border);
      }

      .create-icon {
        width: 1em;
        height: 1em;
        margin-right: 0.5rem;
        flex-shrink: 0;
      }

      /* Skeleton loading placeholders */
      .option-skeleton {
        display: flex;
        align-items: center;
        padding: var(--ui-select-option-padding-y, 0.5rem)
          var(--ui-select-option-padding-x, 0.75rem);
        gap: 0.5rem;
      }

      .skeleton-indicator {
        width: 1rem;
        height: 1rem;
        border-radius: var(--radius-sm, 0.25rem);
        background: var(--ui-select-skeleton-bg, hsl(200, 20%, 88%));
        animation: skeleton-pulse 1.5s ease-in-out infinite;
        flex-shrink: 0;
      }

      .skeleton-text {
        height: 1rem;
        border-radius: var(--radius-sm, 0.25rem);
        background: var(--ui-select-skeleton-bg, hsl(200, 20%, 88%));
        animation: skeleton-pulse 1.5s ease-in-out infinite;
      }

      /* Vary skeleton text widths for natural appearance */
      .skeleton-text-1 { width: 70%; }
      .skeleton-text-2 { width: 55%; }
      .skeleton-text-3 { width: 80%; }
      .skeleton-text-4 { width: 60%; }

      @keyframes skeleton-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      /* Infinite scroll sentinel and loading */
      .load-more-sentinel {
        height: 1px;
        width: 100%;
      }

      .loading-more-container {
        padding: 0;
      }

      /* Virtualized listbox container */
      .listbox-virtual {
        position: relative;
        overflow-y: auto;
      }

      .listbox-virtual-content {
        position: relative;
        width: 100%;
      }

      .option-virtual {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
      }
    `,
  ];

  /**
   * Get the CSS classes for the trigger element.
   */
  private getTriggerClasses(): string {
    const classes = ['trigger', `trigger-${this.size}`];
    if (this.disabled) {
      classes.push('trigger-disabled');
    }
    if (this.showError) {
      classes.push('trigger-error');
    }
    return classes.join(' ');
  }

  /**
   * Position the dropdown relative to the trigger using Floating UI.
   */
  protected async positionDropdown(
    trigger: HTMLElement,
    dropdown: HTMLElement
  ): Promise<void> {
    // Skip during SSR - dropdown isn't visible anyway
    if (isServer) return;

    // Get trigger width to match dropdown width
    const triggerWidth = trigger.offsetWidth;

    const { x, y } = await computePosition(trigger, dropdown, {
      placement: 'bottom-start',
      strategy: 'fixed',
      middleware: [
        offset(4),
        flip({ fallbackPlacements: ['top-start'] }),
        shift({ padding: 8 }),
        size({
          apply({ availableHeight, elements }) {
            Object.assign(elements.floating.style, {
              maxHeight: `${Math.min(availableHeight, 240)}px`,
            });
          },
        }),
      ],
    });

    Object.assign(dropdown.style, {
      left: `${x}px`,
      top: `${y}px`,
      minWidth: `${triggerWidth}px`,
      width: 'auto',
    });
  }

  /**
   * Open the dropdown.
   */
  private openDropdown(): void {
    if (this.disabled || this.open) return;

    this.open = true;

    // Set active to selected option or first enabled
    const opts = this.effectiveOptions;
    let selectedIdx = -1;
    if (this.multiple) {
      // In multi-select, focus first selected or first enabled
      selectedIdx = opts.findIndex((o) => this.selectedValues.has(o.value));
    } else {
      selectedIdx = opts.findIndex((o) => o.value === this._value);
    }
    this.activeIndex =
      selectedIdx >= 0 ? selectedIdx : this.findFirstEnabledIndex();

    this.requestUpdate();

    // Position after render and initialize virtualizer for async mode
    this.updateComplete.then(() => {
      this.positionDropdown(this.triggerEl, this.listboxEl);
      // Sync active state for slotted options
      if (this.isSlottedMode) {
        this.syncSlottedActiveState();
      }
      // Initialize virtualizer for async mode
      if (this._isVirtualized) {
        this.updateVirtualizer();
      }
      // Set up infinite scroll observer
      if (this._isInfiniteScrollEnabled) {
        this.setupLoadMoreObserver();
      }
    });
  }

  /**
   * Close the dropdown.
   */
  private closeDropdown(): void {
    if (!this.open) return;

    this.open = false;
    this.activeIndex = -1;
    this.createOptionActive = false;

    // Clear filter query when closing (reset for next open)
    if (this.searchable) {
      this.filterQuery = '';
    }

    // Clear async search state when closing
    if (this._isAsyncSearchMode) {
      this._searchResults = null;
      this._searchLoading = false;
      this._searchError = null;
    }

    // Clean up infinite scroll
    this.cleanupLoadMoreObserver();
    this._loadingMore = false;

    // Clear active state on slotted options
    if (this.isSlottedMode) {
      this.slottedOptions.forEach((opt) => opt.removeAttribute('data-active'));
    }

    this.triggerEl?.focus();
  }

  /**
   * Find the index of the first enabled option.
   */
  private findFirstEnabledIndex(): number {
    return this.effectiveOptions.findIndex((o) => !o.disabled);
  }

  /**
   * Handle trigger click to toggle dropdown.
   */
  private handleTriggerClick(): void {
    if (this.open) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  /**
   * Handle keydown events for keyboard navigation following W3C APG.
   * In searchable mode, allows text input while maintaining option navigation.
   */
  private handleKeydown(e: KeyboardEvent): void {
    const key = e.key;

    // Handle searchable mode differently
    if (this.searchable) {
      this.handleSearchableKeydown(e);
      return;
    }

    // Handle closed state (non-searchable)
    if (!this.open) {
      switch (key) {
        case 'ArrowDown':
        case 'ArrowUp':
        case 'Enter':
        case ' ':
          e.preventDefault();
          this.openDropdown();
          if (key === 'ArrowUp') {
            this.focusLastEnabledOption();
          } else {
            this.focusFirstEnabledOption();
          }
          break;
        case 'Home':
          e.preventDefault();
          this.openDropdown();
          this.focusFirstEnabledOption();
          break;
        case 'End':
          e.preventDefault();
          this.openDropdown();
          this.focusLastEnabledOption();
          break;
        case 'Delete':
        case 'Backspace':
          // Clear selection via keyboard if clearable is enabled
          {
            const hasValue = this.multiple
              ? this.selectedValues.size > 0
              : !!this._value;
            if (this.clearable && hasValue) {
              e.preventDefault();
              this.handleClear(e);
            }
          }
          break;
        default:
          // Printable character - type-ahead
          if (this.isPrintableCharacter(key)) {
            e.preventDefault();
            this.openDropdown();
            this.handleTypeahead(key);
          }
      }
      return;
    }

    // Handle open state (non-searchable)
    switch (key) {
      case 'ArrowDown':
        e.preventDefault();
        this.focusNextEnabledOption();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.focusPreviousEnabledOption();
        break;
      case 'Home':
        e.preventDefault();
        this.focusFirstEnabledOption();
        break;
      case 'End':
        e.preventDefault();
        this.focusLastEnabledOption();
        break;
      case 'Enter':
        e.preventDefault();
        if (this.multiple) {
          // Multi-select: Enter closes dropdown (W3C APG pattern)
          this.closeDropdown();
        } else if (this.activeIndex >= 0) {
          // Single-select: Enter selects and closes
          this.selectOption(this.activeIndex);
        }
        break;
      case ' ':
        e.preventDefault();
        if (this.activeIndex >= 0) {
          // Space always toggles/selects current option
          this.selectOption(this.activeIndex);
        }
        break;
      case 'Escape':
        e.preventDefault();
        this.closeDropdown();
        break;
      case 'Tab':
        // Tab closes dropdown; in single-select also selects current
        if (!this.multiple && this.activeIndex >= 0) {
          this.selectOption(this.activeIndex);
        } else {
          this.closeDropdown();
        }
        break;
      default:
        // Printable character - type-ahead
        if (this.isPrintableCharacter(key)) {
          e.preventDefault();
          this.handleTypeahead(key);
        }
    }
  }

  /**
   * Handle keydown events in searchable mode.
   * Allows text input while maintaining option navigation.
   */
  private handleSearchableKeydown(e: KeyboardEvent): void {
    const key = e.key;

    // Handle closed state in searchable mode
    if (!this.open) {
      switch (key) {
        case 'ArrowDown':
        case 'ArrowUp':
          e.preventDefault();
          this.openDropdown();
          if (key === 'ArrowUp') {
            this.focusLastEnabledOption();
          } else {
            this.focusFirstEnabledOption();
          }
          break;
        case 'Enter':
          // In searchable closed state, Enter opens dropdown
          e.preventDefault();
          this.openDropdown();
          break;
        case 'Escape':
          // If there's a filter, clear it; otherwise do nothing
          if (this.filterQuery) {
            e.preventDefault();
            this.filterQuery = '';
            this.requestUpdate();
          }
          break;
        // Let all other keys (including Space, printable chars) go to input
        // The input event handler will apply the filter
      }
      return;
    }

    // Handle open state in searchable mode
    switch (key) {
      case 'ArrowDown':
        e.preventDefault();
        this.focusNextEnabledOption();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.focusPreviousEnabledOption();
        break;
      case 'Home':
        // Let input handle cursor movement unless Ctrl/Cmd is pressed
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.focusFirstEnabledOption();
        }
        // Otherwise let input move cursor to start
        break;
      case 'End':
        // Let input handle cursor movement unless Ctrl/Cmd is pressed
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.focusLastEnabledOption();
        }
        // Otherwise let input move cursor to end
        break;
      case 'Enter':
        e.preventDefault();
        // Handle create option selection
        if (this.createOptionActive) {
          this.fireCreateEvent();
          break;
        }
        if (this.multiple) {
          // Multi-select: Enter closes dropdown
          this.closeDropdown();
        } else if (this.activeIndex >= 0) {
          // Single-select: Enter selects and closes
          this.selectOption(this.activeIndex);
        } else {
          // No active option - just close
          this.closeDropdown();
        }
        break;
      case ' ':
        // Handle create option selection via Space
        if (this.createOptionActive) {
          e.preventDefault();
          this.fireCreateEvent();
          break;
        }
        // In searchable mode, Space goes to input (for typing)
        // But in multi-select, if we have an active option, toggle it
        if (this.multiple && this.activeIndex >= 0) {
          e.preventDefault();
          this.selectOption(this.activeIndex);
        }
        // Otherwise let space go to input
        break;
      case 'Escape':
        e.preventDefault();
        this.closeDropdown();
        break;
      case 'Tab':
        // Tab closes dropdown
        if (!this.multiple && this.activeIndex >= 0) {
          this.selectOption(this.activeIndex);
        } else {
          this.closeDropdown();
        }
        break;
      // Let all other keys (Backspace, Delete, ArrowLeft, ArrowRight,
      // printable characters) go to input for text editing
    }
  }

  /**
   * Check if a key is a printable character (for type-ahead).
   */
  private isPrintableCharacter(key: string): boolean {
    return key.length === 1 && !key.match(/[\x00-\x1f\x7f]/);
  }

  /**
   * Handle type-ahead character input.
   * Accumulates characters for 500ms then resets.
   * Repeated same character cycles through matches.
   */
  private handleTypeahead(char: string): void {
    // Clear previous timeout
    if (this.typeaheadTimeout !== null) {
      clearTimeout(this.typeaheadTimeout);
    }

    // Append character to search string
    this.typeaheadString += char.toLowerCase();

    // Find matching option
    const matchIndex = this.findTypeaheadMatch(this.typeaheadString);
    if (matchIndex >= 0) {
      this.setActiveIndex(matchIndex);
    }

    // Set timeout to reset string after 500ms
    this.typeaheadTimeout = setTimeout(() => {
      this.typeaheadString = '';
      this.typeaheadTimeout = null;
    }, Select.TYPEAHEAD_RESET_MS);
  }

  /**
   * Find an option matching the type-ahead search string.
   * If repeating the same character (e.g., "aaa"), cycles through matches.
   */
  private findTypeaheadMatch(searchString: string): number {
    // Get enabled options with their original indices
    const opts = this.effectiveOptions;
    const enabledOptions = opts
      .map((opt, idx) => ({ opt, idx }))
      .filter(({ opt }) => !opt.disabled);

    if (enabledOptions.length === 0) return -1;

    // If repeating same character (e.g., "aaa"), cycle through matches
    const isRepeatedChar =
      searchString.length > 1 &&
      searchString.split('').every((c) => c === searchString[0]);

    if (isRepeatedChar) {
      const char = searchString[0];
      const matches = enabledOptions.filter(({ opt }) =>
        (opt.label || opt.value).toLowerCase().startsWith(char)
      );

      if (matches.length > 0) {
        // Find current position in matches
        const currentMatchIdx = matches.findIndex(
          ({ idx }) => idx === this.activeIndex
        );
        // Move to next match (wrap around)
        const nextMatchIdx = (currentMatchIdx + 1) % matches.length;
        return matches[nextMatchIdx].idx;
      }
      return -1;
    }

    // Otherwise find first match for full string
    const match = enabledOptions.find(({ opt }) =>
      (opt.label || opt.value).toLowerCase().startsWith(searchString)
    );

    return match?.idx ?? -1;
  }

  /**
   * Get the options list for navigation (filtered if searchable, all otherwise).
   * Extracts SelectOption from FilterMatch when in searchable mode.
   */
  private get navigationOptions(): SelectOption[] {
    if (this.searchable) {
      return this.filteredOptions.map((fm) => fm.option);
    }
    return this.effectiveOptions;
  }

  /**
   * Focus the first enabled option.
   */
  private focusFirstEnabledOption(): void {
    const opts = this.navigationOptions;
    const index = opts.findIndex((o) => !o.disabled);
    if (index >= 0) {
      this.setActiveIndex(index);
    }
  }

  /**
   * Focus the last enabled option.
   */
  private focusLastEnabledOption(): void {
    const opts = this.navigationOptions;
    for (let i = opts.length - 1; i >= 0; i--) {
      if (!opts[i].disabled) {
        this.setActiveIndex(i);
        return;
      }
    }
  }

  /**
   * Focus the next enabled option (wraps to first).
   * If create option is visible and we're at the last option, focus create option.
   */
  private focusNextEnabledOption(): void {
    // If create option is active, wrap to first option
    if (this.createOptionActive) {
      this.setCreateOptionActive(false);
      this.focusFirstEnabledOption();
      return;
    }

    const opts = this.navigationOptions;
    for (let i = this.activeIndex + 1; i < opts.length; i++) {
      if (!opts[i].disabled) {
        this.setActiveIndex(i);
        return;
      }
    }

    // At end of options - check if create option should be focused
    if (this.shouldShowCreateOption()) {
      this.setCreateOptionActive(true);
      // Scroll create option into view
      this.updateComplete.then(() => {
        const createEl = this.shadowRoot?.getElementById(
          `${this.selectId}-create-option`
        );
        createEl?.scrollIntoView({ block: 'nearest' });
      });
      return;
    }

    // Wrap to first if at end
    this.focusFirstEnabledOption();
  }

  /**
   * Focus the previous enabled option (wraps to last).
   * If create option is active, focus last regular option instead.
   */
  private focusPreviousEnabledOption(): void {
    // If create option is active, go to last regular option
    if (this.createOptionActive) {
      this.setCreateOptionActive(false);
      this.focusLastEnabledOption();
      return;
    }

    const opts = this.navigationOptions;
    for (let i = this.activeIndex - 1; i >= 0; i--) {
      if (!opts[i].disabled) {
        this.setActiveIndex(i);
        return;
      }
    }

    // At beginning - if create option visible, go to it; otherwise wrap to last
    if (this.shouldShowCreateOption()) {
      this.setCreateOptionActive(true);
      this.updateComplete.then(() => {
        const createEl = this.shadowRoot?.getElementById(
          `${this.selectId}-create-option`
        );
        createEl?.scrollIntoView({ block: 'nearest' });
      });
      return;
    }

    // Wrap to last if at beginning
    this.focusLastEnabledOption();
  }

  /**
   * Set the active option index and scroll into view.
   * Uses virtualizer.scrollToIndex when virtualized, otherwise native scrollIntoView.
   * Clears createOptionActive when setting a regular option active.
   */
  private setActiveIndex(index: number): void {
    this.activeIndex = index;
    // Clear create option active when selecting a regular option
    this.createOptionActive = false;

    // Use virtualizer scrollToIndex when virtualized
    if (this._isVirtualized && this._virtualizer) {
      this._virtualizer.getVirtualizer().scrollToIndex(index, {
        align: 'auto',
        behavior: 'auto',
      });
      return;
    }

    // Sync active state for slotted options
    if (this.isSlottedMode) {
      this.syncSlottedActiveState();
      // Scroll slotted option into view
      const opt = this.slottedOptions[index];
      opt?.scrollIntoView({ block: 'nearest' });
    } else {
      // Scroll property-based option into view
      this.updateComplete.then(() => {
        const optionEl = this.shadowRoot?.getElementById(
          `${this.selectId}-option-${index}`
        );
        optionEl?.scrollIntoView({ block: 'nearest' });
      });
    }
  }

  /**
   * Select an option by index.
   * In searchable mode, index refers to the filtered options list.
   * In multi-select mode, toggles selection without closing.
   * In single-select mode, sets value and closes dropdown.
   */
  private selectOption(index: number): void {
    // In searchable mode, get option from filtered list (extract from FilterMatch)
    let option: SelectOption | undefined;
    if (this.searchable) {
      const fm = this.filteredOptions[index];
      option = fm?.option;
    } else {
      option = this.effectiveOptions[index];
    }
    if (!option || option.disabled) return;

    if (this.multiple) {
      // Multi-select: find original index and toggle
      const originalIndex = this.effectiveOptions.findIndex(
        (o) => o.value === option.value
      );
      if (originalIndex >= 0) {
        this.toggleSelection(originalIndex);
      }
      return;
    }

    // Single-select: set value and close
    this._value = option.value;

    // Update form value
    this.updateFormValue();

    // Sync slotted option states
    this.syncSlottedOptionStates();

    // Validate after selection
    if (this.touched) {
      const isValid = this.validate();
      this.showError = !isValid;
    }

    this.closeDropdown();

    // Dispatch change event
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this._value },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle option click to select it.
   */
  private handleOptionClick(e: MouseEvent, index: number): void {
    e.stopPropagation();
    this.selectOption(index);
  }

  /**
   * Get the display label for the currently selected value(s).
   * In multi-select mode, returns comma-separated labels or count.
   */
  private getSelectedLabel(): string {
    const opts = this.effectiveOptions;

    if (this.multiple) {
      if (this.selectedValues.size === 0) return '';
      const selectedLabels = opts
        .filter((o) => this.selectedValues.has(o.value))
        .map((o) => o.label || o.value);
      // Show up to 3 labels, then "N selected"
      if (selectedLabels.length <= 3) {
        return selectedLabels.join(', ');
      }
      return `${selectedLabels.length} selected`;
    }

    const selected = opts.find((o) => o.value === this._value);
    return selected?.label || selected?.value || '';
  }

  /**
   * Get the label of the currently active option for ARIA live region.
   */
  private getActiveOptionLabel(): string {
    if (this.searchable) {
      const filtered = this.filteredOptions;
      if (this.activeIndex < 0 || this.activeIndex >= filtered.length) {
        return '';
      }
      const fm = filtered[this.activeIndex];
      return fm.option.label || fm.option.value;
    }
    const opts = this.effectiveOptions;
    if (this.activeIndex < 0 || this.activeIndex >= opts.length) {
      return '';
    }
    const option = opts[this.activeIndex];
    return option.label || option.value;
  }

  /**
   * Get the count of enabled options (uses filtered list in searchable mode).
   */
  private getEnabledOptionsCount(): number {
    if (this.searchable) {
      return this.filteredOptions.filter((fm) => !fm.option.disabled).length;
    }
    return this.effectiveOptions.filter((o) => !o.disabled).length;
  }

  /**
   * Render the selection indicator (checkbox for multi, checkmark for single).
   */
  private renderSelectionIndicator(isSelected: boolean) {
    if (this.multiple) {
      return html`
        <span class="checkbox-indicator ${isSelected ? 'checked' : ''}">
          ${isSelected
            ? html`
                <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path
                    d="M3 8l4 4 6-7"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    fill="none"
                  />
                </svg>
              `
            : nothing}
        </span>
      `;
    }
    // Single-select checkmark
    return html`
      <svg
        class="check-icon"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          d="M3 8l4 4 6-7"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    `;
  }

  /**
   * Render an individual option.
   * @param filterMatch The FilterMatch containing option and match indices
   * @param index The index in the filtered/displayed list
   */
  private renderOption(filterMatch: FilterMatch, index: number) {
    const { option, matchIndices } = filterMatch;
    const isActive = index === this.activeIndex;
    const isSelected = this.multiple
      ? this.selectedValues.has(option.value)
      : option.value === this._value;
    const classes = ['option'];
    if (isActive) classes.push('option-active');
    if (isSelected) classes.push('option-selected');
    if (option.disabled) classes.push('option-disabled');

    // Use highlighted label when filtering, plain label otherwise
    const label = option.label || option.value;
    const labelContent =
      this.searchable && this.filterQuery && matchIndices.length > 0
        ? this.renderHighlightedLabel(label, matchIndices)
        : label;

    return html`
      <div
        id="${this.selectId}-option-${index}"
        role="option"
        aria-selected=${isSelected ? 'true' : 'false'}
        aria-disabled=${option.disabled ? 'true' : 'false'}
        class=${classes.join(' ')}
        @click=${(e: MouseEvent) => this.handleOptionClick(e, index)}
        @mouseenter=${() => this.setCreateOptionActive(false)}
      >
        ${this.renderSelectionIndicator(isSelected)}
        <span>${labelContent}</span>
      </div>
    `;
  }

  /**
   * Render options using virtual scrolling.
   * Only renders visible items plus overscan for smooth scrolling.
   * Accounts for loading-more skeleton height.
   */
  private renderVirtualizedOptions(): TemplateResult {
    if (!this._virtualizer) {
      return html``;
    }

    const virtualizer = this._virtualizer.getVirtualizer();
    const virtualItems = virtualizer.getVirtualItems();
    const totalSize = virtualizer.getTotalSize();
    const options = this.effectiveOptions;

    // Add extra height for loading-more skeletons
    const loadingMoreHeight = this._loadingMore ? 3 * Select.OPTION_HEIGHT : 0;

    return html`
      <div
        class="listbox-virtual-content"
        style="height: ${totalSize + loadingMoreHeight}px;"
      >
        ${virtualItems.map((virtualItem) => {
          const option = options[virtualItem.index];
          if (!option) return nothing;

          const isActive = virtualItem.index === this.activeIndex;
          const isSelected = this.multiple
            ? this.selectedValues.has(option.value)
            : option.value === this._value;
          const classes = ['option', 'option-virtual'];
          if (isActive) classes.push('option-active');
          if (isSelected) classes.push('option-selected');
          if (option.disabled) classes.push('option-disabled');

          return html`
            <div
              id="${this.selectId}-option-${virtualItem.index}"
              role="option"
              aria-selected=${isSelected ? 'true' : 'false'}
              aria-disabled=${option.disabled ? 'true' : 'false'}
              class=${classes.join(' ')}
              style="transform: translateY(${virtualItem.start}px); height: ${virtualItem.size}px;"
              @click=${(e: MouseEvent) => this.handleOptionClick(e, virtualItem.index)}
            >
              ${this.renderSelectionIndicator(isSelected)}
              <span>${option.label || option.value}</span>
            </div>
          `;
        })}
      </div>
    `;
  }

  /**
   * Check if the create option should be shown.
   * Returns true when searchable+creatable, filter has value, and no exact match exists.
   */
  private shouldShowCreateOption(): boolean {
    if (!this.searchable || !this.creatable) return false;
    if (!this.filterQuery || !this.filterQuery.trim()) return false;

    // Check if any option's label or value matches exactly (case-insensitive)
    const lowerQuery = this.filterQuery.toLowerCase().trim();
    const exactMatch = this.effectiveOptions.some(
      (opt) =>
        (opt.label || opt.value).toLowerCase() === lowerQuery ||
        opt.value.toLowerCase() === lowerQuery
    );

    return !exactMatch;
  }

  /**
   * Set the create option active state.
   * When active, deselects regular options.
   */
  private setCreateOptionActive(active: boolean): void {
    this.createOptionActive = active;
    if (active) {
      this.activeIndex = -1;
      // Clear active state on slotted options
      if (this.isSlottedMode) {
        this.slottedOptions.forEach((opt) => opt.removeAttribute('data-active'));
      }
    }
  }

  /**
   * Render the empty state when no options match the filter.
   * Includes ARIA live region for screen reader announcement.
   */
  private renderEmptyState() {
    return html`
      <div class="empty-state" role="status" aria-live="polite">
        ${this.noResultsMessage}
      </div>
    `;
  }

  /**
   * Render error state with retry action.
   * Handles both async options errors and search errors.
   * Supports error slot for full customization.
   */
  private renderErrorState() {
    const errorMessage = this._asyncError?.message || this._searchError?.message || 'Failed to load options';
    const handleRetry = this._asyncError ? this.handleRetry : this.handleSearchRetry;

    return html`
      <div class="error-state" role="alert">
        <slot name="error">
          <div class="error-content">
            <span class="error-message">${errorMessage}</span>
            <button
              type="button"
              class="retry-link"
              @click=${handleRetry}
            >
              Try again
            </button>
          </div>
        </slot>
      </div>
    `;
  }

  /**
   * Handle retry button click to re-fetch async options.
   */
  private handleRetry(): void {
    this._asyncError = null;
    this._asyncLoading = true;
    this._optionsTask.run();
  }

  /**
   * Handle retry for async search error.
   */
  private handleSearchRetry(): void {
    this._searchError = null;
    this.executeAsyncSearch(this.filterQuery);
  }

  /**
   * Render the create option for creatable mode.
   */
  private renderCreateOption() {
    if (!this.shouldShowCreateOption()) return nothing;

    const isActive = this.createOptionActive;
    return html`
      <div
        id="${this.selectId}-create-option"
        class="option option-create ${isActive ? 'option-active' : ''}"
        role="option"
        aria-selected="false"
        @click=${this.handleCreateClick}
        @mouseenter=${() => this.setCreateOptionActive(true)}
      >
        <svg class="create-icon" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>Create "${this.filterQuery}"</span>
      </div>
    `;
  }

  /**
   * Render skeleton loading placeholders.
   * Used during initial async load, search loading, and load-more.
   * @param count Number of skeleton rows to render (default 4)
   */
  private renderSkeletonOptions(count = 4) {
    // Rotate through text widths for natural appearance
    const textWidths = ['skeleton-text-1', 'skeleton-text-2', 'skeleton-text-3', 'skeleton-text-4'];

    return html`
      ${Array.from({ length: count }).map((_, index) => html`
        <div class="option-skeleton" role="presentation" aria-hidden="true">
          ${this.multiple ? html`
            <div class="skeleton-indicator"></div>
          ` : nothing}
          <div class="skeleton-text ${textWidths[index % textWidths.length]}"></div>
        </div>
      `)}
    `;
  }

  /**
   * Render the load-more sentinel and loading indicator.
   * Sentinel triggers IntersectionObserver when visible.
   */
  private renderLoadMoreSentinel(): TemplateResult | typeof nothing {
    if (!this.loadMore || !this._hasMore) return nothing;

    return html`
      <div class="loading-more-container">
        ${this._loadingMore ? this.renderSkeletonOptions(3) : nothing}
        <div
          ${ref(this._sentinelRef)}
          class="load-more-sentinel"
          aria-hidden="true"
        ></div>
      </div>
    `;
  }

  /**
   * Handle click on the create option.
   */
  private handleCreateClick(): void {
    this.fireCreateEvent();
  }

  /**
   * Fire the create event and reset state.
   */
  private fireCreateEvent(): void {
    const value = this.filterQuery.trim();
    if (!value) return;

    this.dispatchEvent(
      new CustomEvent('create', {
        detail: { value },
        bubbles: true,
        composed: true,
      })
    );

    // Clear filter and close dropdown after create
    this.filterQuery = '';
    this.createOptionActive = false;
    this.closeDropdown();
  }

  /**
   * Get the aria-activedescendant value based on current state.
   * Handles both regular options and create option.
   */
  private getAriaActiveDescendant(): string {
    if (!this.open) return '';

    // Create option is active
    if (this.createOptionActive) {
      return `${this.selectId}-create-option`;
    }

    // Regular option is active
    if (this.activeIndex >= 0) {
      if (this.isSlottedMode) {
        return this.slottedOptions[this.activeIndex]?.getId() || '';
      }
      return `${this.selectId}-option-${this.activeIndex}`;
    }

    return '';
  }

  /**
   * Render the searchable trigger (text input mode).
   * Used when searchable prop is true.
   */
  private renderSearchableTrigger(listboxId: string) {
    return html`
      <div class=${this.getTriggerClasses()}>
        <input
          type="text"
          id=${this.selectId}
          class="trigger-input"
          role="combobox"
          aria-expanded=${this.open ? 'true' : 'false'}
          aria-haspopup="listbox"
          aria-controls=${listboxId}
          aria-autocomplete="list"
          aria-activedescendant=${this.getAriaActiveDescendant()}
          aria-invalid=${this.showError ? 'true' : nothing}
          placeholder=${this.placeholder}
          .value=${this.getInputDisplayValue()}
          ?disabled=${this.disabled}
          @input=${this.handleInput}
          @keydown=${this.handleKeydown}
          @focus=${this.handleInputFocus}
          @blur=${this.handleBlur}
        />
        <div class="trigger-actions">
          ${this.renderClearButton()}
          <svg
            class="chevron ${this.open ? 'chevron-open' : ''}"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              d="M4 6l4 4 4-4"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>
    `;
  }

  /**
   * Render the default trigger (button-like div mode).
   * Used when searchable prop is false.
   */
  private renderDefaultTrigger(listboxId: string, selectedLabel: string) {
    return html`
      <div
        id=${this.selectId}
        class=${this.getTriggerClasses()}
        role="combobox"
        aria-expanded=${this.open ? 'true' : 'false'}
        aria-haspopup="listbox"
        aria-controls=${listboxId}
        aria-activedescendant=${this.getAriaActiveDescendant()}
        aria-disabled=${this.disabled ? 'true' : 'false'}
        aria-invalid=${this.showError ? 'true' : nothing}
        tabindex=${this.disabled ? '-1' : '0'}
        @click=${this.handleTriggerClick}
        @keydown=${this.handleKeydown}
        @blur=${this.handleBlur}
      >
        ${this.multiple && this.selectedValues.size > 0
          ? this.renderTags()
          : selectedLabel
            ? html`<span class="selected-value">${selectedLabel}</span>`
            : html`<span class="placeholder">${this.placeholder}</span>`}
        <div class="trigger-actions">
          ${this.renderClearButton()}
          <svg
            class="chevron ${this.open ? 'chevron-open' : ''}"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              d="M4 6l4 4 4-4"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>
    `;
  }

  override render() {
    const selectedLabel = this.getSelectedLabel();
    const listboxId = `${this.selectId}-listbox`;

    // Get options to render as FilterMatch[]
    // When searchable, use filteredOptions (already FilterMatch[])
    // When not searchable, convert effectiveOptions to FilterMatch[]
    const effective = this.effectiveOptions;
    let optionsToRender: FilterMatch[];
    if (this.searchable) {
      optionsToRender = this.filteredOptions;
    } else if (effective.length > 0) {
      optionsToRender = effective.map((option, index) => ({
        option,
        originalIndex: index,
        matchIndices: [],
      }));
    } else {
      optionsToRender = [];
    }

    return html`
      <div class="select-wrapper">
        ${this.label
          ? html`
              <label for=${this.selectId} class="select-label label-${this.size}">
                ${this.label}
                ${this.required
                  ? html`<span class="required-indicator">*</span>`
                  : nothing}
              </label>
            `
          : nothing}

        ${this.searchable
          ? this.renderSearchableTrigger(listboxId)
          : this.renderDefaultTrigger(listboxId, selectedLabel)}

        <!-- Dropdown listbox -->
        <div
          id=${listboxId}
          class="listbox ${this._isVirtualized ? 'listbox-virtual' : ''}"
          role="listbox"
          aria-labelledby=${this.selectId}
          aria-multiselectable=${this.multiple ? 'true' : nothing}
          ?hidden=${!this.open}
          ${this._isVirtualized ? ref(this._listboxRef) : nothing}
        >
          ${this.renderSelectAllActions()}
          ${this._asyncLoading || this._searchLoading
            ? this.renderSkeletonOptions(4)
            : this._asyncError || this._searchError
              ? this.renderErrorState()
              : this._isVirtualized && optionsToRender.length > 0
                ? html`
                    ${this.renderVirtualizedOptions()}
                    ${this.renderLoadMoreSentinel()}
                  `
                : optionsToRender.length > 0
                  ? html`
                      ${optionsToRender.map((filterMatch, index) =>
                        this.renderOption(filterMatch, index)
                      )}
                      ${this.renderLoadMoreSentinel()}
                    `
                  : this.searchable && this.filterQuery
                    ? this.renderEmptyState()
                    : nothing}
          <!-- Always render slot to keep it in DOM, hide when rendering programmatic options -->
          <div style=${optionsToRender.length > 0 || (this.searchable && this.filterQuery) || this._asyncLoading || this._asyncError || this._searchLoading || this._searchError || this._isVirtualized ? 'display:none' : ''}>
            <slot @slotchange=${this.handleSlotChange}></slot>
          </div>
          ${this.renderCreateOption()}
        </div>

        ${this.showError && this.errorMessage
          ? html`<span class="error-text" role="alert">${this.errorMessage}</span>`
          : nothing}
      </div>

      <!-- ARIA live region -->
      <div role="status" aria-live="polite" aria-atomic="true" class="visually-hidden">
        ${this.open && this.activeIndex >= 0
          ? `${this.getActiveOptionLabel()}, ${this.activeIndex + 1} of ${this.getEnabledOptionsCount()}`
          : ''}
      </div>
    `;
  }
}
