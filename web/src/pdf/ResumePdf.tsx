import { Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { SECTION_TITLES, type CvState, type SectionKey } from "../types";

const filled = (items: string[]) => items.map((item) => item.trim()).filter(Boolean);

function makeStyles(state: CvState) {
  const { accent, font, fontSize } = state.settings;
  return StyleSheet.create({
    page: { padding: 36, fontFamily: font, fontSize, lineHeight: 1.35, color: "#1a1a1a" },
    topBar: { height: 4, backgroundColor: accent, marginBottom: 14 },
    name: { fontSize: fontSize * 2.2, lineHeight: 1.2, fontWeight: "bold" },
    headline: { fontSize: fontSize * 1.15, lineHeight: 1.3, color: "#444", marginTop: 2 },
    contact: { flexDirection: "row", flexWrap: "wrap", marginTop: 6, color: "#444" },
    contactItem: { marginRight: 12 },
    summary: { marginTop: 10 },
    section: { marginTop: 14 },
    sectionTitle: {
      fontSize: fontSize * 1.1,
      lineHeight: 1.3,
      fontWeight: "bold",
      color: accent,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      borderBottomWidth: 1,
      borderBottomColor: accent,
      paddingBottom: 2,
      marginBottom: 6,
    },
    entry: { marginBottom: 8 },
    entryHead: { flexDirection: "row", justifyContent: "space-between" },
    entryTitle: { fontWeight: "bold" },
    entrySub: { color: "#444" },
    bullet: { flexDirection: "row", marginTop: 2 },
    bulletDot: { width: 10 },
    bulletText: { flex: 1 },
    skills: { flexDirection: "row", flexWrap: "wrap" },
    skill: { marginRight: 10, marginBottom: 3 },
  });
}

type Styles = ReturnType<typeof makeStyles>;

function Bullets({ items, s }: { items: string[]; s: Styles }) {
  return (
    <>
      {filled(items).map((item, i) => (
        <View key={i} style={s.bullet}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{item}</Text>
        </View>
      ))}
    </>
  );
}

function EntryHead({ title, date, sub, s }: { title: string; date: string; sub?: string; s: Styles }) {
  return (
    <>
      <View style={s.entryHead}>
        <Text style={s.entryTitle}>{title}</Text>
        <Text>{date}</Text>
      </View>
      {sub ? <Text style={s.entrySub}>{sub}</Text> : null}
    </>
  );
}

function Section({ keyName, state, s }: { keyName: SectionKey; state: CvState; s: Styles }) {
  const { resume } = state;
  const body = (() => {
    switch (keyName) {
      case "work":
        return resume.work
          .filter((w) => w.company || w.jobTitle)
          .map((w, i) => (
            <View key={i} style={s.entry} wrap={false}>
              <EntryHead title={w.jobTitle} date={w.date} sub={w.company} s={s} />
              <Bullets items={w.bullets} s={s} />
            </View>
          ));
      case "education":
        return resume.education
          .filter((e) => e.school || e.degree)
          .map((e, i) => (
            <View key={i} style={s.entry} wrap={false}>
              <EntryHead title={e.degree} date={e.date} sub={[e.school, e.grade].filter(Boolean).join(", ")} s={s} />
              <Bullets items={e.bullets} s={s} />
            </View>
          ));
      case "projects":
        return resume.projects
          .filter((p) => p.name)
          .map((p, i) => (
            <View key={i} style={s.entry} wrap={false}>
              <EntryHead title={p.name} date={p.date} s={s} />
              <Bullets items={p.bullets} s={s} />
            </View>
          ));
      case "skills": {
        const skills = filled(resume.skills);
        if (!skills.length) return [];
        return [
          <View key="skills" style={s.skills}>
            {skills.map((skill, i) => (
              <Text key={i} style={s.skill}>
                {skill}
                {i < skills.length - 1 ? "  •" : ""}
              </Text>
            ))}
          </View>,
        ];
      }
      case "referees":
        return resume.referees
          .filter((r) => r.name)
          .map((r, i) => (
            <View key={i} style={s.entry} wrap={false}>
              <Text style={s.entryTitle}>{r.name}</Text>
              <Text style={s.entrySub}>{[r.role, r.contact].filter(Boolean).join(", ")}</Text>
            </View>
          ));
    }
  })();

  if (!body.length) return null;
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{SECTION_TITLES[keyName]}</Text>
      {body}
    </View>
  );
}

export function ResumePdf({ state }: { state: CvState }) {
  const s = makeStyles(state);
  const { profile } = state.resume;
  const contact = [profile.email, profile.phone, profile.location].filter(Boolean);

  return (
    <Document title={profile.name ? `${profile.name} CV` : "CV"} creator="Monica CV Maker" producer="Monica CV Maker">
      <Page size={state.settings.pageSize} style={s.page}>
        <View style={s.topBar} />
        <Text style={s.name}>{profile.name}</Text>
        {profile.headline ? <Text style={s.headline}>{profile.headline}</Text> : null}
        <View style={s.contact}>
          {contact.map((item, i) => (
            <Text key={i} style={s.contactItem}>
              {item}
            </Text>
          ))}
          {profile.url ? (
            <Link src={profile.url.startsWith("http") ? profile.url : `https://${profile.url}`} style={s.contactItem}>
              {profile.url}
            </Link>
          ) : null}
        </View>
        {profile.summary ? <Text style={s.summary}>{profile.summary}</Text> : null}
        {state.settings.order
          .filter((key) => !state.settings.hidden.includes(key))
          .map((key) => (
            <Section key={key} keyName={key} state={state} s={s} />
          ))}
      </Page>
    </Document>
  );
}
