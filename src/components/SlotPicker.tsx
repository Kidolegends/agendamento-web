import type { Slot } from '../lib/types';

interface Props {
  slots: Slot[];
  value: string;
  onChange: (startsAt: string) => void;
}

/** A grid of radio buttons, one per free slot. Value is the slot's ISO start instant. */
export function SlotPicker({ slots, value, onChange }: Props) {
  return (
    <div className="slots" role="radiogroup" aria-label="Horários livres">
      {slots.map((slot) => (
        <label key={slot.startsAt} className={`slot ${value === slot.startsAt ? 'selected' : ''}`}>
          <input
            type="radio"
            name="slot"
            value={slot.startsAt}
            checked={value === slot.startsAt}
            onChange={() => onChange(slot.startsAt)}
          />
          {slot.time}
        </label>
      ))}
    </div>
  );
}
