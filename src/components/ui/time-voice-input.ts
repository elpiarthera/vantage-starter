/**
 * TimeVoiceInput - Voice input handler wrapping the Web Speech API
 *
 * Progressive enhancement component that renders a microphone button only when
 * the Web Speech API (SpeechRecognition) is available. Hidden on Firefox, SSR,
 * and any environment without speech recognition support.
 *
 * Parses spoken time patterns ("3 PM", "3:30 PM", "15:30", "three thirty PM")
 * into TimeValue objects. Date references like "tomorrow" are ignored.
 *
 * This is an internal component composed by the main time-picker.
 *
 * @element lui-time-voice-input
 * @fires ui-voice-time-select - Dispatched when a valid time is recognized, with { value: TimeValue, transcript: string }
 */

import { html, css, svg, nothing, isServer, type CSSResultGroup } from 'lit';
import { property, state } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';
import type { TimeValue } from './time-utils.js';

/**
 * Internal voice input component for hands-free time selection.
 *
 * @example
 * ```ts
 * const voice = document.createElement('lui-time-voice-input');
 * voice.locale = 'en-US';
 * voice.addEventListener('ui-voice-time-select', (e) => {
 *   console.log(e.detail.value); // { hour: 15, minute: 30, second: 0 }
 * });
 * ```
 */
export class TimeVoiceInput extends TailwindElement {
  static styles: CSSResultGroup = [
    tailwindBaseStyles,
    css`
      :host {
        display: inline-block;
      }

      .voice-input-wrapper {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
      }

      .voice-btn {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border: 1px solid var(--ui-time-picker-voice-border);
        border-radius: 50%;
        background: var(--ui-time-picker-voice-bg);
        color: var(--ui-time-picker-voice-text);
        cursor: pointer;
        transition: border-color 150ms, color 150ms;
      }

      .voice-btn:hover:not(:disabled) {
        border-color: var(--ui-time-picker-voice-hover-border);
        color: var(--ui-time-picker-voice-hover-text);
      }

      .voice-btn:focus-visible {
        outline: 2px solid var(--ui-time-picker-voice-focus-ring);
        outline-offset: 2px;
      }

      .voice-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .voice-btn.listening {
        border-color: var(--ui-time-picker-voice-listening);
        color: var(--ui-time-picker-voice-listening);
      }

      .voice-icon {
        width: 1rem;
        height: 1rem;
      }

      .listening-pulse {
        position: absolute;
        inset: -3px;
        border: 2px solid var(--ui-time-picker-voice-listening);
        border-radius: 50%;
        animation: pulse 1.5s ease-in-out infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 0;
          transform: scale(1);
        }
        50% {
          opacity: 0.5;
          transform: scale(1.15);
        }
      }

      .voice-error {
        font-size: 0.75rem;
        color: var(--ui-time-picker-error);
      }
    `,
  ];

  /** Recognition language for speech input */
  @property() locale = 'en-US';

  /** Whether the voice input button is disabled */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Whether speech recognition is currently active */
  @state() private _listening = false;

  /** Error message from last recognition attempt */
  @state() private _error = '';

  /** Current SpeechRecognition instance */
  private _recognition: any = null;

  /** SVG microphone icon */
  private _micIcon = svg`
    <path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z"
          stroke="currentColor" stroke-width="2" fill="none"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"
          stroke="currentColor" stroke-width="2" fill="none"
          stroke-linecap="round"/>
    <line x1="12" y1="19" x2="12" y2="23"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round"/>
    <line x1="8" y1="23" x2="16" y2="23"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round"/>
  `;

  /**
   * Check if the Web Speech API is available in the current environment.
   * Returns false on SSR and in browsers without SpeechRecognition support.
   */
  private get _speechAvailable(): boolean {
    if (isServer) return false;
    return (
      'SpeechRecognition' in window ||
      'webkitSpeechRecognition' in window
    );
  }

  /**
   * Start speech recognition. Creates a new SpeechRecognition instance,
   * configures it for single-result time input, and begins listening.
   */
  private _startListening(): void {
    if (isServer || !this._speechAvailable || this._listening || this.disabled)
      return;

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = this.locale;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const parsed = this._parseVoiceTranscript(transcript);
      if (parsed) {
        this._error = '';
        this.dispatchEvent(
          new CustomEvent('ui-voice-time-select', {
            bubbles: true,
            composed: true,
            detail: { value: parsed, transcript },
          }),
        );
      } else {
        this._error = 'Could not understand time';
      }
      this._listening = false;
      this._recognition = null;
    };

    recognition.onerror = (event: any) => {
      this._error =
        event.error === 'no-speech'
          ? 'No speech detected'
          : 'Recognition error';
      this._listening = false;
      this._recognition = null;
    };

    recognition.onend = () => {
      this._listening = false;
      this._recognition = null;
    };

    this._recognition = recognition;
    this._listening = true;
    this._error = '';
    recognition.start();
  }

  /**
   * Stop and abort current speech recognition session.
   */
  private _stopListening(): void {
    if (this._recognition) {
      this._recognition.abort();
    }
    this._listening = false;
    this._recognition = null;
  }

  /**
   * Parse a voice transcript string into a TimeValue.
   * Handles numeric patterns ("3:30 PM", "15:30", "3 PM") and
   * basic word numbers ("three thirty PM", "three PM").
   * Date references like "tomorrow" are ignored (time-only parsing).
   */
  private _parseVoiceTranscript(text: string): TimeValue | null {
    const normalized = text.toLowerCase().trim();

    // Pattern 1: "3:30 PM", "3 30 PM", "15:30", "3:30"
    const colonPattern =
      /(\d{1,2})[:\s](\d{2})\s*(am|pm|a\.m\.|p\.m\.)?/i;
    const colonMatch = normalized.match(colonPattern);
    if (colonMatch) {
      return this._buildTimeValue(
        parseInt(colonMatch[1], 10),
        parseInt(colonMatch[2], 10),
        colonMatch[3],
      );
    }

    // Pattern 2: "3 PM", "3 AM", "15"
    const hourOnlyPattern = /(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)?(?:\s|$)/i;
    const hourMatch = normalized.match(hourOnlyPattern);
    if (hourMatch) {
      return this._buildTimeValue(
        parseInt(hourMatch[1], 10),
        0,
        hourMatch[2],
      );
    }

    // Pattern 3: Word numbers "three thirty PM" -- basic support
    const wordMap: Record<string, number> = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
      eleven: 11,
      twelve: 12,
      thirteen: 13,
      fourteen: 14,
      fifteen: 15,
      twenty: 20,
      thirty: 30,
      forty: 40,
      'forty-five': 45,
      fifty: 50,
    };

    // Match "three thirty PM" or "three PM"
    const words = normalized.split(/\s+/);
    const hourWord = words.find(
      (w) => wordMap[w] !== undefined && wordMap[w] <= 12,
    );
    if (hourWord) {
      const hour = wordMap[hourWord];
      const minuteWord = words.find(
        (w) => wordMap[w] !== undefined && wordMap[w] >= 15,
      );
      const minute = minuteWord ? wordMap[minuteWord] : 0;
      const period = words.find((w) => /^(am|pm)$/i.test(w));
      return this._buildTimeValue(hour, minute, period);
    }

    return null;
  }

  /**
   * Build a validated TimeValue from parsed hour, minute, and optional period.
   * Converts 12-hour format to 24-hour internally. Returns null for invalid values.
   */
  private _buildTimeValue(
    hour: number,
    minute: number,
    period: string | undefined,
  ): TimeValue | null {
    if (minute < 0 || minute > 59) return null;

    if (period) {
      const p = period.replace(/\./g, '').toUpperCase();
      if (p === 'PM' && hour < 12) hour += 12;
      if (p === 'AM' && hour === 12) hour = 0;
    }

    if (hour < 0 || hour > 23) return null;
    return { hour, minute, second: 0 };
  }

  /**
   * Clean up speech recognition on disconnect to prevent memory leaks.
   */
  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._stopListening();
  }

  protected render() {
    if (!this._speechAvailable) return nothing;

    return html`
      <div class="voice-input-wrapper">
        <button
          type="button"
          class="voice-btn ${this._listening ? 'listening' : ''}"
          aria-label=${this._listening
            ? 'Listening... tap to cancel'
            : 'Voice input'}
          ?disabled=${this.disabled}
          @click=${this._listening ? this._stopListening : this._startListening}
        >
          <svg viewBox="0 0 24 24" class="voice-icon" aria-hidden="true">
            ${this._micIcon}
          </svg>
          ${this._listening
            ? html`<span class="listening-pulse"></span>`
            : nothing}
        </button>
        ${this._error
          ? html`<span class="voice-error" role="alert">${this._error}</span>`
          : nothing}
      </div>
    `;
  }
}

// Safe custom element registration for internal component
if (typeof customElements !== 'undefined') {
  if (!customElements.get('lui-time-voice-input')) {
    customElements.define('lui-time-voice-input', TimeVoiceInput);
  }
}
