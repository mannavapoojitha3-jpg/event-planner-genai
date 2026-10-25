import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { parseEventForm, LIMITS, type EventFormValues } from '../engine/validate';
import type { EventInput, FormErrors } from '../engine/types';
import { todayIso } from '../engine/dates';

interface EventFormProps {
  initial?: EventInput;
  onSubmit: (input: EventInput) => void;
  onCancel?: () => void;
}

const EMPTY_VALUES: EventFormValues = {
  type: 'wedding',
  name: '',
  date: '',
  location: '',
  guests: '',
  budget: '',
  theme: '',
  preferences: '',
};

const EVENT_OPTIONS = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'community', label: 'Community event' },
] as const;

function toFormValues(input?: EventInput): EventFormValues {
  if (!input) return EMPTY_VALUES;
  return {
    type: input.type,
    name: input.name,
    date: input.date,
    location: input.location,
    guests: String(input.guests),
    budget: String(input.budget),
    theme: input.theme,
    preferences: input.preferences,
  };
}

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

/** A labelled field with an associated hint and error message. */
function Field({ id, label, error, hint, children }: FieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && (
        <p id={hintId} className="hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function EventForm({ initial, onSubmit, onCancel }: EventFormProps) {
  const [values, setValues] = useState<EventFormValues>(() => toFormValues(initial));
  const [errors, setErrors] = useState<FormErrors>({});
  const formId = useId();
  const today = todayIso();
  const errorCount = Object.keys(errors).length;

  function update<K extends keyof EventFormValues>(field: K, value: EventFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parseEventForm(values, today);
    if (result.ok) {
      setErrors({});
      onSubmit(result.input);
    } else {
      setErrors(result.errors);
    }
  }

  /** Builds aria-describedby from the ids that Field renders for hints and errors. */
  const describe = (field: keyof FormErrors, hasHint: boolean): string | undefined => {
    const ids: string[] = [];
    if (errors[field]) ids.push(`${field}-error`);
    if (hasHint) ids.push(`${field}-hint`);
    return ids.length ? ids.join(' ') : undefined;
  };

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate aria-labelledby={`${formId}-heading`}>
      <h2 id={`${formId}-heading`}>Tell us about your event</h2>
      {errorCount > 0 && (
        <div className="error-summary" role="alert">
          Please fix {errorCount} {errorCount === 1 ? 'field' : 'fields'} below.
        </div>
      )}

      <fieldset className="field">
        <legend>Event type</legend>
        <div className="radio-group">
          {EVENT_OPTIONS.map((option) => (
            <label key={option.value} className="radio">
              <input
                type="radio"
                name="event-type"
                value={option.value}
                checked={values.type === option.value}
                onChange={() => update('type', option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
        {errors.type && <p className="error" role="alert">{errors.type}</p>}
      </fieldset>

      <div className="form__grid">
        <Field id="name" label="Event name" error={errors.name}>
          <input
            id="name"
            type="text"
            value={values.name}
            maxLength={LIMITS.nameMax}
            autoComplete="off"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describe('name', false)}
            onChange={(e) => update('name', e.target.value)}
          />
        </Field>

        <Field id="date" label="Event date" error={errors.date} hint="Must be today or later.">
          <input
            id="date"
            type="date"
            value={values.date}
            min={today}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={describe('date', true)}
            onChange={(e) => update('date', e.target.value)}
          />
        </Field>

        <Field id="location" label="Location" error={errors.location} hint="City or neighbourhood is enough.">
          <input
            id="location"
            type="text"
            value={values.location}
            maxLength={LIMITS.locationMax}
            aria-invalid={Boolean(errors.location)}
            aria-describedby={describe('location', true)}
            onChange={(e) => update('location', e.target.value)}
          />
        </Field>

        <Field id="guests" label="Expected guests" error={errors.guests} hint={`Between ${LIMITS.minGuests} and ${LIMITS.maxGuests}.`}>
          <input
            id="guests"
            type="text"
            inputMode="numeric"
            value={values.guests}
            aria-invalid={Boolean(errors.guests)}
            aria-describedby={describe('guests', true)}
            onChange={(e) => update('guests', e.target.value)}
          />
        </Field>

        <Field id="budget" label="Total budget (₹)" error={errors.budget} hint="Examples: 5,00,000 or 5 lakh.">
          <input
            id="budget"
            type="text"
            inputMode="numeric"
            value={values.budget}
            aria-invalid={Boolean(errors.budget)}
            aria-describedby={describe('budget', true)}
            onChange={(e) => update('budget', e.target.value)}
          />
        </Field>

        <Field id="theme" label="Theme or style (optional)">
          <input
            id="theme"
            type="text"
            value={values.theme}
            maxLength={LIMITS.themeMax}
            placeholder="e.g. monsoon garden, vintage"
            onChange={(e) => update('theme', e.target.value)}
          />
        </Field>
      </div>

      <Field id="preferences" label="Preferences and special requirements (optional)">
        <textarea
          id="preferences"
          rows={3}
          value={values.preferences}
          maxLength={LIMITS.preferencesMax}
          placeholder="e.g. vegetarian menu, step-free access, outdoor space"
          onChange={(e) => update('preferences', e.target.value)}
        />
      </Field>

      <div className="form__actions">
        {onCancel && (
          <button type="button" className="button" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="button button--primary">
          {initial ? 'Update plan' : 'Create my plan'}
        </button>
      </div>
    </form>
  );
}
