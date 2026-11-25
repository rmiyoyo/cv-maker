import type { ReactNode } from "react";

export function TextField({
  label,
  value,
  onChange,
  wide,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  wide?: boolean;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <label className={wide ? "field wide" : "field"}>
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} rows={4} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

export function Card({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="card">
      <header className="card-head">
        <h2>{title}</h2>
        <div className="card-actions">{actions}</div>
      </header>
      {children}
    </section>
  );
}

type Entry = object & { bullets?: string[] };

export interface FieldSpec<T> {
  key: Exclude<keyof T, "bullets"> & string;
  label: string;
  wide?: boolean;
}

export function EntryList<T extends Entry>({
  items,
  fields,
  make,
  onChange,
  addLabel,
  bulletsLabel = "Achievements, one per line",
}: {
  items: T[];
  fields: FieldSpec<T>[];
  make: () => T;
  onChange: (items: T[]) => void;
  addLabel: string;
  bulletsLabel?: string;
}) {
  const update = (index: number, patch: Partial<T>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const move = (index: number, by: number) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    onChange(next);
  };

  return (
    <div className="entries">
      {items.map((item, index) => (
        <div className="entry" key={index}>
          <div className="grid">
            {fields.map((field) => (
              <TextField
                key={field.key}
                label={field.label}
                wide={field.wide}
                value={String(item[field.key] ?? "")}
                onChange={(value) => update(index, { [field.key]: value } as Partial<T>)}
              />
            ))}
            {item.bullets ? (
              <TextField
                label={bulletsLabel}
                wide
                multiline
                value={item.bullets.join("\n")}
                onChange={(value) => update(index, { bullets: value.split("\n") } as Partial<T>)}
              />
            ) : null}
          </div>
          <div className="entry-actions">
            <button type="button" disabled={index === 0} onClick={() => move(index, -1)}>Up</button>
            <button type="button" disabled={index === items.length - 1} onClick={() => move(index, 1)}>Down</button>
            <button type="button" className="danger" onClick={() => onChange(items.filter((_, i) => i !== index))}>Remove</button>
          </div>
        </div>
      ))}
      <button type="button" className="add" onClick={() => onChange([...items, make()])}>{addLabel}</button>
    </div>
  );
}
