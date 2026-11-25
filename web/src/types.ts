export interface Profile {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  url: string;
  summary: string;
}

export interface WorkEntry {
  company: string;
  jobTitle: string;
  date: string;
  bullets: string[];
}

export interface EducationEntry {
  school: string;
  degree: string;
  date: string;
  grade: string;
  bullets: string[];
}

export interface ProjectEntry {
  name: string;
  date: string;
  bullets: string[];
}

export interface Referee {
  name: string;
  role: string;
  contact: string;
}

export type SectionKey = "work" | "education" | "projects" | "skills" | "referees";

export interface Settings {
  accent: string;
  font: "Helvetica" | "Times-Roman" | "Courier";
  fontSize: number;
  pageSize: "A4" | "LETTER";
  order: SectionKey[];
  hidden: SectionKey[];
}

export interface Resume {
  profile: Profile;
  work: WorkEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  skills: string[];
  referees: Referee[];
}

export interface CvState {
  resume: Resume;
  settings: Settings;
}

export const SECTION_TITLES: Record<SectionKey, string> = {
  work: "Work experience",
  education: "Education",
  projects: "Projects",
  skills: "Skills",
  referees: "Referees",
};

export const emptyWork = (): WorkEntry => ({ company: "", jobTitle: "", date: "", bullets: [""] });
export const emptyEducation = (): EducationEntry => ({ school: "", degree: "", date: "", grade: "", bullets: [] });
export const emptyProject = (): ProjectEntry => ({ name: "", date: "", bullets: [""] });
export const emptyReferee = (): Referee => ({ name: "", role: "", contact: "" });

export const initialState = (): CvState => ({
  resume: {
    profile: {
      name: "Wanjiku Kamau",
      headline: "Registered Nurse",
      email: "wanjiku@example.com",
      phone: "+254 712 345 678",
      location: "Nairobi, Kenya",
      url: "",
      summary: "Registered nurse with five years in busy medical and surgical wards. Calm under pressure and trusted to lead shifts.",
    },
    work: [
      {
        company: "Nairobi West Hospital",
        jobTitle: "Registered Nurse",
        date: "Jan 2022 to Present",
        bullets: ["Care for up to 12 patients a shift on a 30-bed surgical ward", "Lead the night shift team of four nurses"],
      },
    ],
    education: [
      {
        school: "Kenya Medical Training College",
        degree: "Diploma in Kenya Registered Community Health Nursing",
        date: "2017 to 2020",
        grade: "",
        bullets: [],
      },
    ],
    projects: [],
    skills: ["Patient assessment", "Wound care", "IV therapy", "Infection control"],
    referees: [],
  },
  settings: {
    accent: "#ff6600",
    font: "Helvetica",
    fontSize: 10,
    pageSize: "A4",
    order: ["work", "education", "projects", "skills", "referees"],
    hidden: [],
  },
});
