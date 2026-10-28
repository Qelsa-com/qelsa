"use client";

import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import type { AgentResumeDocument } from "./agentArtifacts";

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingHorizontal: 38,
    paddingBottom: 34,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#161616",
    lineHeight: 1.35,
  },
  // `lineHeight` inherits from the page, where it resolves against the 9pt base
  // font. At 20pt that produced a ~12pt line box, so the headline drew over the
  // name. Pin an explicit line height on both header lines.
  name: { fontSize: 20, fontFamily: "Helvetica-Bold", letterSpacing: 0.2, lineHeight: 1.2 },
  headline: { fontSize: 10.5, color: "#333333", marginTop: 2, lineHeight: 1.3 },
  contact: { fontSize: 8.5, color: "#555555", marginTop: 5 },
  section: { marginTop: 14 },
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "#111111",
    borderBottomWidth: 0.7,
    borderBottomColor: "#bdbdbd",
    paddingBottom: 3,
    marginBottom: 6,
  },
  summary: { fontSize: 9, lineHeight: 1.45 },
  roleHeader: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  roleTitle: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  roleMeta: { fontSize: 8.5, color: "#555555" },
  bulletRow: { flexDirection: "row", marginTop: 2.5, paddingRight: 2 },
  bullet: { width: 9, fontSize: 9, color: "#444444" },
  bulletText: { flex: 1, fontSize: 9, lineHeight: 1.4 },
  skillLine: { fontSize: 9, lineHeight: 1.45 },
  educationRow: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 3 },
  small: { fontSize: 8.5, color: "#555555" },
  link: { color: "#245b8a", textDecoration: "underline" },
});

function dateRange(start: number | null, end: number | null, current: boolean) {
  const fmt = (value: number) =>
    new Date(value).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  if (!start && !end && !current) return "";
  return [start ? fmt(start) : null, current ? "Present" : end ? fmt(end) : null].filter(Boolean).join(" – ");
}

export function ResumePdfDocument({ resume }: { resume: AgentResumeDocument }) {
  const contact = [resume.email, resume.phone, resume.location].filter(Boolean).join("  |  ");
  return (
    <Document title={`${resume.name} — Resume`} author={resume.name} subject="Resume">
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{resume.name}</Text>
        {resume.headline && <Text style={styles.headline}>{resume.headline}</Text>}
        {contact && <Text style={styles.contact}>{contact}</Text>}
        {resume.links.length > 0 && (
          <Text style={styles.contact}>
            {resume.links.map((link, index) => (
              <Text key={`${link.url}-${index}`}>
                {index > 0 ? "  |  " : ""}
                {link.label}: {link.url}
              </Text>
            ))}
          </Text>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.summary}>{resume.summary}</Text>
        </View>

        {resume.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {resume.experience.map((role, index) => (
              <View key={`${role.company}-${role.title}-${index}`} style={{ marginBottom: 8 }}>
                <View style={styles.roleHeader}>
                  <Text style={styles.roleTitle}>
                    {role.title} · {role.company}
                  </Text>
                  <Text style={styles.roleMeta}>{dateRange(role.start_date, role.end_date, role.is_current)}</Text>
                </View>
                {role.bullets.map((bullet, bulletIndex) => (
                  <View key={`${index}-${bulletIndex}`} style={styles.bulletRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {resume.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {resume.education.map((row, index) => (
              <View key={`${row.college}-${row.degree}-${index}`} style={styles.educationRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roleTitle}>{row.degree}</Text>
                  <Text style={styles.roleMeta}>
                    {[row.field, row.college].filter(Boolean).join(" · ")}
                  </Text>
                </View>
                <Text style={styles.roleMeta}>
                  {[row.start_year, row.end_year].filter((value) => value != null).join(" – ")}
                </Text>
              </View>
            ))}
          </View>
        )}

        {resume.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.skillLine}>{resume.skills.join(" · ")}</Text>
          </View>
        )}

        {resume.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {resume.projects.map((project) => (
              <View key={project} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{project}</Text>
              </View>
            ))}
          </View>
        )}

        {resume.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            <Text style={styles.skillLine}>{resume.certifications.join(" · ")}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function renderResumePdf(resume: AgentResumeDocument): Promise<Blob> {
  return await pdf(<ResumePdfDocument resume={resume} />).toBlob();
}
