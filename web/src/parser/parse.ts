import { emptyEducation, emptyReferee, emptyWork, type Resume } from "../types";

export interface TextItem {
  text: string;
  x: number;
  y: number;
  size: number;
  page: number;
}

export interface Line {
  text: string;
  size: number;
}

type Heading = "summary" | "work" | "education" | "projects" | "skills" | "referees";

const HEADINGS: [Heading, RegExp][] = [
  ["summary", /^(summary|profile|professional summary|career objective|objective|about me|personal statement)$/i],
  ["work", /^(work experience|experience|professional experience|employment history|employment|work history|career history)$/i],
  ["education", /^(education|academic qualifications|education and training|qualifications|academic background)$/i],
  ["projects", /^(projects|key projects|personal projects)$/i],
  ["skills", /^(skills|key skills|core competencies|competencies|technical skills|skills and abilities)$/i],
  ["referees", /^(referees|references)$/i],
];

const BULLET = /^[•▪●◦‣\-*–]\s*/;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;
const PHONE = /(\+?\d[\d\s()-]{7,}\d)/;
const URL = /((https?:\/\/)?(www\.)?[\w-]+\.(com|org|net|io|dev|co\.ke|ke|me)(\/\S*)?)/i;
const DATE = /((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(19|20)\d{2}(\s*(-|–|to)\s*(((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(19|20)\d{2}|present|current|date|now))?/i;
const SCHOOL = /(university|college|school|institute|academy|polytechnic|kmtc|tvet)/i;

export function groupLines(items: TextItem[]): Line[] {
  const sorted = items
    .filter((item) => item.text.trim())
    .sort((a, b) => a.page - b.page || b.y - a.y || a.x - b.x);
  const lines: { page: number; y: number; size: number; parts: TextItem[] }[] = [];
  for (const item of sorted) {
    const last = lines[lines.length - 1];
    if (last && last.page === item.page && Math.abs(last.y - item.y) < Math.max(item.size, last.size) * 0.5) {
      last.parts.push(item);
      last.size = Math.max(last.size, item.size);
    } else {
      lines.push({ page: item.page, y: item.y, size: item.size, parts: [item] });
    }
  }
  return lines.map((line) => ({
    text: line.parts
      .sort((a, b) => a.x - b.x)
      .map((part) => part.text.trim())
      .join(" ")
      .replace(/\s+/g, " ")
      .trim(),
    size: line.size,
  }));
}

export function headingOf(text: string): Heading | null {
  const clean = text.replace(/[:|]/g, "").trim();
  for (const [key, pattern] of HEADINGS) if (pattern.test(clean)) return key;
  return null;
}

function splitSections(lines: Line[]) {
  const sections: Record<Heading | "top", Line[]> = {
    top: [], summary: [], work: [], education: [], projects: [], skills: [], referees: [],
  };
  let current: Heading | "top" = "top";
  for (const line of lines) {
    const heading = headingOf(line.text);
    if (heading) current = heading;
    else sections[current].push(line);
  }
  return sections;
}

function groupEntries(lines: Line[]) {
  const entries: { head: string[]; bullets: string[] }[] = [];
  for (const { text } of lines) {
    const last = entries[entries.length - 1];
    if (BULLET.test(text)) {
      if (!last) entries.push({ head: [], bullets: [text.replace(BULLET, "")] });
      else last.bullets.push(text.replace(BULLET, ""));
    } else if (last && last.bullets.length && /^[a-z]/.test(text)) {
      last.bullets[last.bullets.length - 1] += ` ${text}`;
    } else if (!last || last.bullets.length) {
      entries.push({ head: [text], bullets: [] });
    } else {
      last.head.push(text);
    }
  }
  return entries;
}

function takeDate(head: string[]) {
  let date = "";
  const rest: string[] = [];
  for (const line of head) {
    const match = !date ? line.match(DATE) : null;
    if (match) {
      date = match[0].trim();
      const left = line.replace(match[0], "").replace(/[|,–-]\s*$/, "").replace(/^\s*[|,–-]/, "").trim();
      if (left) rest.push(left);
    } else {
      rest.push(line);
    }
  }
  return { date, rest };
}

function parseProfile(top: Line[], summary: Line[]) {
  const profile = { name: "", headline: "", email: "", phone: "", location: "", url: "", summary: "" };
  const unused: string[] = [];
  const biggest = top.reduce<Line | null>((best, line) => (!best || line.size > best.size ? line : best), null);
  for (const line of top) {
    let text = line.text;
    if (line === biggest) {
      profile.name = text;
      continue;
    }
    const email = text.match(EMAIL);
    if (email) {
      profile.email ||= email[0];
      text = text.replace(email[0], "");
    }
    const phone = text.match(PHONE);
    if (phone) {
      profile.phone ||= phone[0].trim();
      text = text.replace(phone[0], "");
    }
    const url = text.match(URL);
    if (url && !email) {
      profile.url ||= url[0];
      text = text.replace(url[0], "");
    }
    text = text.replace(/^[\s|,•]+|[\s|,•]+$/g, "").trim();
    if (!text) continue;
    if (!profile.location && /^[A-Z][\w\s]+,\s*[A-Z][\w\s]+$/.test(text)) profile.location = text;
    else unused.push(text);
  }
  if (unused.length && unused[0].split(" ").length <= 6) profile.headline = unused.shift()!;
  profile.summary = [...unused, ...summary.map((line) => line.text)].join(" ").trim();
  return profile;
}

export function parseLines(lines: Line[]): Resume {
  const sections = splitSections(lines);

  const work = groupEntries(sections.work).map(({ head, bullets }) => {
    const { date, rest } = takeDate(head);
    return { ...emptyWork(), jobTitle: rest[0] ?? "", company: rest.slice(1).join(", "), date, bullets };
  });

  const education = groupEntries(sections.education).map(({ head, bullets }) => {
    const { date, rest } = takeDate(head);
    const school = rest.find((line) => SCHOOL.test(line)) ?? "";
    const degree = rest.filter((line) => line !== school).join(", ");
    return { ...emptyEducation(), school, degree, date, bullets };
  });

  const projects = groupEntries(sections.projects).map(({ head, bullets }) => {
    const { date, rest } = takeDate(head);
    return { name: rest.join(", "), date, bullets };
  });

  const skills = sections.skills
    .flatMap((line) => line.text.replace(BULLET, "").split(/\s*[,•|;]\s*/))
    .map((skill) => skill.trim())
    .filter(Boolean);

  const referees = [];
  let referee = emptyReferee();
  for (const { text } of sections.referees) {
    if (EMAIL.test(text) || PHONE.test(text)) {
      referee.contact = [referee.contact, text].filter(Boolean).join(", ");
    } else if (!referee.name) {
      referee.name = text;
    } else if (referee.contact) {
      referees.push(referee);
      referee = { ...emptyReferee(), name: text };
    } else {
      referee.role = [referee.role, text].filter(Boolean).join(", ");
    }
  }
  if (referee.name) referees.push(referee);

  return {
    profile: parseProfile(sections.top, sections.summary),
    work,
    education,
    projects,
    skills,
    referees,
  };
}
