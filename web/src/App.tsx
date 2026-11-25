import { useEffect, useRef, useState } from "react";
import { Card, EntryList, TextField } from "./components/fields";
import { Preview, renderPdfBlob } from "./components/Preview";
import { accentFromParams, isEmbedded, notifyParent } from "./embed/bridge";
import { parsePdf } from "./parser/pdfjs";
import { useCvState } from "./store";
import {
  emptyEducation,
  emptyProject,
  emptyReferee,
  emptyWork,
  initialState,
  SECTION_TITLES,
  type Profile,
  type Resume,
  type SectionKey,
  type Settings,
} from "./types";

const PROFILE_FIELDS: { key: keyof Profile; label: string; wide?: boolean; multiline?: boolean }[] = [
  { key: "name", label: "Full name" },
  { key: "headline", label: "Job title" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "location", label: "Location" },
  { key: "url", label: "Website or LinkedIn" },
  { key: "summary", label: "Summary", wide: true, multiline: true },
];

export function App() {
  const [state, setState] = useCvState();
  const [status, setStatus] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const { resume, settings } = state;

  useEffect(() => {
    const accent = accentFromParams();
    if (accent) setState((s) => ({ ...s, settings: { ...s.settings, accent } }));
  }, [setState]);

  useEffect(() => {
    const timer = setTimeout(() => notifyParent({ type: "monica-cv:change", resume }), 500);
    return () => clearTimeout(timer);
  }, [resume]);

  const setResume = <K extends keyof Resume>(key: K, value: Resume[K]) =>
    setState((s) => ({ ...s, resume: { ...s.resume, [key]: value } }));
  const setSettings = (patch: Partial<Settings>) =>
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const setProfile = (key: keyof Profile, value: string) => setResume("profile", { ...resume.profile, [key]: value });

  const moveSection = (index: number, by: number) => {
    const order = [...settings.order];
    const [key] = order.splice(index, 1);
    order.splice(index + by, 0, key);
    setSettings({ order });
  };
  const toggleSection = (key: SectionKey) =>
    setSettings({
      hidden: settings.hidden.includes(key) ? settings.hidden.filter((k) => k !== key) : [...settings.hidden, key],
    });

  const download = async () => {
    const name = resume.profile.name.trim() || "My";
    const url = URL.createObjectURL(await renderPdfBlob(state));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name} CV.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    notifyParent({ type: "monica-cv:download", name });
  };

  const importPdf = async (file: File | undefined) => {
    if (!file) return;
    setStatus("Reading your CV...");
    try {
      const parsed = await parsePdf(file);
      setState((s) => ({ ...s, resume: parsed }));
      setStatus("Imported. Check each section, the reader is not perfect.");
    } catch {
      setStatus("We could not read that PDF. Try another file or fill the form.");
    }
  };

  const reset = () => {
    if (confirm("Start again with an empty sample CV?")) setState(initialState());
  };

  return (
    <div className={isEmbedded ? "app embedded" : "app"}>
      <header className="topbar">
        {isEmbedded ? null : (
          <a className="brand" href="https://monicahr.com" target="_blank" rel="noopener">
            Monica <span>CV Maker</span>
          </a>
        )}
        <div className="topbar-actions">
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf"
            hidden
            onChange={(e) => importPdf(e.target.files?.[0])}
          />
          <button type="button" onClick={() => fileInput.current?.click()}>Import PDF</button>
          <button type="button" onClick={reset}>Reset</button>
          <button type="button" className="primary" onClick={download}>Download PDF</button>
        </div>
      </header>
      {status ? <p className="status">{status}</p> : null}

      <main className="layout">
        <div className="forms">
          <Card title="Your details">
            <div className="grid">
              {PROFILE_FIELDS.map((field) => (
                <TextField
                  key={field.key}
                  label={field.label}
                  wide={field.wide}
                  multiline={field.multiline}
                  value={resume.profile[field.key]}
                  onChange={(value) => setProfile(field.key, value)}
                />
              ))}
            </div>
          </Card>

          <Card title={SECTION_TITLES.work}>
            <EntryList
              items={resume.work}
              make={emptyWork}
              onChange={(items) => setResume("work", items)}
              addLabel="Add a job"
              fields={[
                { key: "jobTitle", label: "Job title" },
                { key: "company", label: "Employer" },
                { key: "date", label: "Dates", wide: true },
              ]}
            />
          </Card>

          <Card title={SECTION_TITLES.education}>
            <EntryList
              items={resume.education}
              make={emptyEducation}
              onChange={(items) => setResume("education", items)}
              addLabel="Add a school"
              bulletsLabel="Details, one per line"
              fields={[
                { key: "degree", label: "Course or qualification" },
                { key: "school", label: "School" },
                { key: "date", label: "Dates" },
                { key: "grade", label: "Grade" },
              ]}
            />
          </Card>

          <Card title={SECTION_TITLES.projects}>
            <EntryList
              items={resume.projects}
              make={emptyProject}
              onChange={(items) => setResume("projects", items)}
              addLabel="Add a project"
              bulletsLabel="What you did, one per line"
              fields={[
                { key: "name", label: "Project" },
                { key: "date", label: "Dates" },
              ]}
            />
          </Card>

          <Card title={SECTION_TITLES.skills}>
            <TextField
              label="Skills, separated by commas"
              wide
              multiline
              value={resume.skills.join(", ")}
              onChange={(value) => setResume("skills", value.split(/\s*,\s*/))}
            />
          </Card>

          <Card title={SECTION_TITLES.referees}>
            <EntryList
              items={resume.referees}
              make={emptyReferee}
              onChange={(items) => setResume("referees", items)}
              addLabel="Add a referee"
              fields={[
                { key: "name", label: "Name" },
                { key: "role", label: "Position and organisation" },
                { key: "contact", label: "Phone or email", wide: true },
              ]}
            />
          </Card>

          <Card title="Design">
            <div className="grid">
              <label className="field">
                <span>Colour</span>
                <input type="color" value={settings.accent} onChange={(e) => setSettings({ accent: e.target.value })} />
              </label>
              <label className="field">
                <span>Font</span>
                <select value={settings.font} onChange={(e) => setSettings({ font: e.target.value as Settings["font"] })}>
                  <option value="Helvetica">Sans serif</option>
                  <option value="Times-Roman">Serif</option>
                  <option value="Courier">Monospace</option>
                </select>
              </label>
              <label className="field">
                <span>Font size</span>
                <input
                  type="number"
                  min={8}
                  max={13}
                  step={0.5}
                  value={settings.fontSize}
                  onChange={(e) => setSettings({ fontSize: Number(e.target.value) || 10 })}
                />
              </label>
              <label className="field">
                <span>Paper</span>
                <select
                  value={settings.pageSize}
                  onChange={(e) => setSettings({ pageSize: e.target.value as Settings["pageSize"] })}
                >
                  <option value="A4">A4</option>
                  <option value="LETTER">US Letter</option>
                </select>
              </label>
            </div>
            <ol className="order">
              {settings.order.map((key, index) => (
                <li key={key}>
                  <label>
                    <input type="checkbox" checked={!settings.hidden.includes(key)} onChange={() => toggleSection(key)} />
                    {SECTION_TITLES[key]}
                  </label>
                  <span>
                    <button type="button" disabled={index === 0} onClick={() => moveSection(index, -1)}>Up</button>
                    <button type="button" disabled={index === settings.order.length - 1} onClick={() => moveSection(index, 1)}>
                      Down
                    </button>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <aside className="preview-col">
          <Preview state={state} />
        </aside>
      </main>
    </div>
  );
}
