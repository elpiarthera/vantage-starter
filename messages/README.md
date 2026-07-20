# Translation files — declared divergences

Seven locales ship here: `en`, `de`, `es`, `fr`, `it`, `pt`, `ru`. Key parity across all
seven is enforced by `scripts/check-translations.js` (Control 2) and is not optional.

This file records the places where a translation is **knowingly approximate**. A divergence
that is written down is a decision; a divergence that is silent is a debt. Nothing here is
an excuse to leave it as is — each entry is something to fix, listed so it can be found.

---

## Russian plural agreement in `generative_ui` — approximate, needs a native reader

**What.** The `generative_ui` namespace carries ICU plural forms
(`estimated_minutes`, `after_operations`, `agent_count`). Russian selects between three
plural categories (`one` / `few` / `many`), and the correct form after a preposition such
as «После» is a **genitive** agreement that changes with the category.

**The state of it.** The Russian forms in `ru.json` were written without a Russian speaker.
The plural *categories* are right — `Intl.PluralRules("ru")` drives the selection and the
test suite asserts the correct category is chosen per count. What is **not** verified is
whether the *word forms inside each category* read naturally to a native speaker.

**Why it shipped anyway.** No Russian speaker is available to the team today. Holding the
delivery would have kept six correct locales behind one approximate seventh, on a layer
that until now rendered English to every user in every language.

**How to check it.** Open `/ru/dashboard/architect`, generate a plan with operations that
have dependencies, and read the «После N операций» line at counts 1, 2, 5 and 21 — those
four exercise `one`, `few`, `many` and `one` again respectively.

**What would close this.** A native reader confirming or correcting the forms in
`messages/ru.json` under `generative_ui`. The categories and the test do not need to change;
only the strings might.

---

*Add an entry here rather than shipping an approximation in silence. State what is
uncertain, why it shipped, and what would close it.*
