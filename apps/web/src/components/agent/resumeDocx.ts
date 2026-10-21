import type { AgentResumeDocument } from "./agentArtifacts";

function monthYear(value: number | null) {
  if (value == null) return "";
  return new Date(value).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function dateRange(start: number | null, end: number | null, current: boolean) {
  const left = monthYear(start);
  const right = current ? "Present" : monthYear(end);
  return [left, right].filter(Boolean).join(" – ");
}

export async function renderResumeDocx(resume: AgentResumeDocument): Promise<Blob> {
  const {
    AlignmentType,
    BorderStyle,
    Document,
    Packer,
    Paragraph,
    TextRun,
  } = await import("docx");

  const sectionTitle = (title: string) =>
    new Paragraph({
      spacing: { before: 240, after: 80 },
      border: { bottom: { color: "BDBDBD", space: 1, style: BorderStyle.SINGLE, size: 4 } },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 18,
          characterSpacing: 20,
          color: "111111",
        }),
      ],
    });

  const bullet = (text: string) =>
    new Paragraph({
      spacing: { after: 40 },
      indent: { left: 260, hanging: 160 },
      children: [new TextRun({ text: `• ${text}`, size: 18, color: "222222" })],
    });

  const children: any[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: resume.name, bold: true, size: 40, color: "111111" })],
    }),
  ];
  if (resume.headline) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new TextRun({ text: resume.headline, size: 20, color: "333333" })],
      }),
    );
  }
  const contact = [resume.email, resume.phone, resume.location].filter(Boolean).join("  |  ");
  if (contact) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: contact, size: 17, color: "555555" })],
      }),
    );
  }
  if (resume.links.length) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: resume.links.map((link) => `${link.label}: ${link.url}`).join("  |  "),
            size: 17,
            color: "245B8A",
          }),
        ],
      }),
    );
  }

  children.push(sectionTitle("Summary"));
  children.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: resume.summary, size: 19, color: "222222" })],
    }),
  );

  if (resume.experience.length) {
    children.push(sectionTitle("Experience"));
    for (const role of resume.experience) {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 20 },
          children: [
            new TextRun({ text: `${role.title} · ${role.company}`, bold: true, size: 20, color: "111111" }),
            new TextRun({
              text: `   ${dateRange(role.start_date, role.end_date, role.is_current)}`,
              italics: true,
              size: 17,
              color: "555555",
            }),
          ],
        }),
      );
      for (const item of role.bullets) children.push(bullet(item));
      if (role.skills.length) {
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: `Skills: ${role.skills.join(", ")}`, size: 17, color: "555555" })],
          }),
        );
      }
    }
  }

  if (resume.education.length) {
    children.push(sectionTitle("Education"));
    for (const row of resume.education) {
      children.push(
        new Paragraph({
          spacing: { after: 30 },
          children: [
            new TextRun({ text: row.degree, bold: true, size: 19, color: "111111" }),
            new TextRun({
              text: `  ${[row.field, row.college].filter(Boolean).join(" · ")}`,
              size: 18,
              color: "444444",
            }),
            new TextRun({
              text: `   ${[row.start_year, row.end_year].filter((value) => value != null).join(" – ")}`,
              italics: true,
              size: 17,
              color: "555555",
            }),
          ],
        }),
      );
    }
  }

  if (resume.skills.length) {
    children.push(sectionTitle("Skills"));
    children.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text: resume.skills.join(" · "), size: 18, color: "222222" })],
      }),
    );
  }

  if (resume.projects.length) {
    children.push(sectionTitle("Projects"));
    for (const project of resume.projects) children.push(bullet(project));
  }

  if (resume.certifications.length) {
    children.push(sectionTitle("Certifications"));
    children.push(
      new Paragraph({
        children: [new TextRun({ text: resume.certifications.join(" · "), size: 18, color: "222222" })],
      }),
    );
  }

  const doc = new Document({
    title: `${resume.name} — Resume`,
    creator: "Qelsa",
    sections: [
      {
        properties: {
          page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
        },
        children,
      },
    ],
  });
  return await Packer.toBlob(doc);
}
