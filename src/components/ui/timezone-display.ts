/**
 * TimezoneDisplay - Multi-timezone time display component
 *
 * Renders the selected time converted to multiple IANA timezones, showing
 * formatted time with timezone abbreviations separated by pipes.
 * Uses Intl.DateTimeFormat exclusively for timezone conversion and formatting.
 *
 * This is an internal composition component used by the main time-picker.
 *
 * @element lui-timezone-display
 */

import { html, css, nothing, type CSSResultGroup } from 'lit';
import { property } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';
import { type TimeValue } from './time-utils.js';

/** Formatted timezone entry with display time and abbreviation. */
interface TimezoneEntry {
  /** Formatted time string (e.g., "2:30 PM") */
  time: string;
  /** Timezone abbreviation (e.g., "EST", "PST") */
  tzName: string;
}

/**
 * Internal timezone display component that shows time in multiple timezones.
 *
 * @example
 * ```ts
 * const tz = document.createElement('lui-timezone-display');
 * tz.value = { hour: 14, minute: 30, second: 0 };
 * tz.primaryTimezone = 'America/New_York';
 * tz.additionalTimezones = ['America/Los_Angeles', 'Europe/London'];
 * tz.hour12 = true;
 * ```
 */
export class TimezoneDisplay extends TailwindElement {
  static styles: CSSResultGroup = [
    tailwindBaseStyles,
    css`
      :host {
        display: block;
      }

      .timezone-display {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: var(--ui-time-picker-timezone-text, var(--ui-input-placeholder));
        padding: 0.25rem 0;
      }

      .tz-separator {
        color: var(--ui-time-picker-timezone-separator);
      }

      .tz-entry {
        display: inline-flex;
        align-items: baseline;
        gap: 0.25rem;
      }

      .tz-time {
        font-variant-numeric: tabular-nums;
      }

      .tz-name {
        font-size: 0.625rem;
        text-transform: uppercase;
        opacity: 0.8;
      }

    `,
  ];

  /** Current time value to display across timezones. */
  @property({ attribute: false })
  value: TimeValue | null = null;

  /** BCP 47 locale tag for time formatting. */
  @property()
  locale: string = 'en-US';

  /** Whether to use 12-hour format (true) or 24-hour format (false). */
  @property({ type: Boolean })
  hour12: boolean = false;

  /** Primary IANA timezone identifier. Empty string means local browser timezone. */
  @property()
  primaryTimezone: string = '';

  /** Additional IANA timezone identifiers to display alongside the primary. */
  @property({ attribute: false })
  additionalTimezones: string[] = [];

  /**
   * Format a TimeValue in a specific IANA timezone.
   * Returns the formatted time string and timezone abbreviation.
   */
  private formatTimeInTimezone(time: TimeValue, timezone: string): TimezoneEntry {
    try {
      const date = new Date(2000, 0, 1, time.hour, time.minute, time.second);

      const timeFormatter = new Intl.DateTimeFormat(this.locale, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: this.hour12,
        timeZone: timezone,
      });
      const formattedTime = timeFormatter.format(date);

      // Extract timezone abbreviation via formatToParts
      const tzFormatter = new Intl.DateTimeFormat(this.locale, {
        timeZoneName: 'short',
        hour: 'numeric',
        timeZone: timezone,
      });
      const parts = tzFormatter.formatToParts(date);
      const tzPart = parts.find((p) => p.type === 'timeZoneName');
      const abbreviation = tzPart?.value ?? timezone;

      return { time: formattedTime, tzName: abbreviation };
    } catch {
      // Invalid IANA timezone identifier
      return { time: '?', tzName: timezone };
    }
  }

  /** Build the array of timezone entries to render. */
  private get timezoneEntries(): TimezoneEntry[] {
    if (!this.value) return [];

    const entries: TimezoneEntry[] = [];

    // Primary timezone (local browser timezone if empty)
    const primaryTz = this.primaryTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    entries.push(this.formatTimeInTimezone(this.value, primaryTz));

    // Additional timezones
    for (const tz of this.additionalTimezones) {
      entries.push(this.formatTimeInTimezone(this.value, tz));
    }

    return entries;
  }

  protected render() {
    const entries = this.timezoneEntries;
    if (entries.length === 0) return nothing;

    return html`
      <div class="timezone-display" role="status" aria-label="Time in multiple timezones">
        ${entries.map(
          (entry, i) => html`
            ${i > 0 ? html`<span class="tz-separator" aria-hidden="true">|</span>` : ''}
            <span class="tz-entry">
              <span class="tz-time">${entry.time}</span>
              <span class="tz-name">${entry.tzName}</span>
            </span>
          `,
        )}
      </div>
    `;
  }
}

// Safe custom element registration for internal component
if (typeof customElements !== 'undefined') {
  if (!customElements.get('lui-timezone-display')) {
    customElements.define('lui-timezone-display', TimezoneDisplay);
  }
}
