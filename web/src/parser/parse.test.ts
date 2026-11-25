import { describe, expect, it } from "vitest";
import { groupLines, headingOf, parseLines, type TextItem } from "./parse";

const item = (text: string, y: number, x = 0, size = 10): TextItem => ({ text, x, y, size, page: 1 });

describe("groupLines", () => {
  it("joins items on the same baseline in reading order", () => {
    const lines = groupLines([item("Kamau", 700, 60, 22), item("Wanjiku", 701, 0, 22), item("Nurse", 680)]);
    expect(lines.map((line) => line.text)).toEqual(["Wanjiku Kamau", "Nurse"]);
    expect(lines[0].size).toBe(22);
  });
});

describe("headingOf", () => {
  it("recognises common Kenyan CV headings", () => {
    expect(headingOf("WORK EXPERIENCE")).toBe("work");
    expect(headingOf("Academic Qualifications:")).toBe("education");
    expect(headingOf("Referees")).toBe("referees");
    expect(headingOf("Managed a ward of 30 beds")).toBeNull();
  });
});

describe("parseLines", () => {
  it("builds a resume from a simple CV", () => {
    const resume = parseLines([
      { text: "Wanjiku Kamau", size: 22 },
      { text: "Registered Nurse", size: 12 },
      { text: "wanjiku@example.com | +254 712 345 678", size: 10 },
      { text: "Nairobi, Kenya", size: 10 },
      { text: "Work Experience", size: 12 },
      { text: "Registered Nurse Jan 2022 - Present", size: 10 },
      { text: "Nairobi West Hospital", size: 10 },
      { text: "• Care for up to 12 patients a shift", size: 10 },
      { text: "• Lead the night shift", size: 10 },
      { text: "Education", size: 12 },
      { text: "Kenya Medical Training College 2017 - 2020", size: 10 },
      { text: "Diploma in Nursing", size: 10 },
      { text: "Skills", size: 12 },
      { text: "Wound care, IV therapy • Triage", size: 10 },
      { text: "Referees", size: 12 },
      { text: "Dr. Achieng Otieno", size: 10 },
      { text: "Nursing Officer in Charge", size: 10 },
      { text: "0722 000 000", size: 10 },
    ]);

    expect(resume.profile).toMatchObject({
      name: "Wanjiku Kamau",
      headline: "Registered Nurse",
      email: "wanjiku@example.com",
      phone: "+254 712 345 678",
      location: "Nairobi, Kenya",
    });
    expect(resume.work).toEqual([
      {
        jobTitle: "Registered Nurse",
        company: "Nairobi West Hospital",
        date: "Jan 2022 - Present",
        bullets: ["Care for up to 12 patients a shift", "Lead the night shift"],
      },
    ]);
    expect(resume.education[0]).toMatchObject({
      school: "Kenya Medical Training College",
      degree: "Diploma in Nursing",
      date: "2017 - 2020",
    });
    expect(resume.skills).toEqual(["Wound care", "IV therapy", "Triage"]);
    expect(resume.referees).toEqual([
      { name: "Dr. Achieng Otieno", role: "Nursing Officer in Charge", contact: "0722 000 000" },
    ]);
  });
});
