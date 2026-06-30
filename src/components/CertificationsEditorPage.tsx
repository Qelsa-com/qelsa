import {
  useCreateCertificationMutation,
  useDeleteCertificationMutation,
  useGetCertificationsQuery,
  useUpdateCertificationMutation,
} from "@/features/api/certificationsApi";
import { useLazyGetCertificationCatalogQuery, useLazyGetIssuingBodiesQuery, useLazyGetSkillsQuery } from "@/features/api/seedApi";
import { Certification, CertificationCatalog, CertificationPayload, IssuingBody } from "@/types/certification";
import { Skill } from "@/types/userSkill";
import { ArrowLeft, Award, Building2, Calendar, Check, Edit3, ExternalLink, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Autocomplete } from "./ui/autocomplete";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { MultiAutocomplete } from "./ui/multi-autocomplete";
import { Textarea } from "./ui/textarea";

interface CertFormData {
  certification: CertificationCatalog | null;
  issuingOrganization: string;
  // The picked issuing-body option, when chosen from suggestions. Null when the
  // user typed a custom value (which the backend find-or-creates by name).
  issuingBody: IssuingBody | null;
  issueDate: string;
  expirationDate: string;
  doesNotExpire: boolean;
  credentialId: string;
  credentialUrl: string;
  skills: Skill[];
  description: string;
}

const emptyForm: CertFormData = {
  certification: null,
  issuingOrganization: "",
  issuingBody: null,
  issueDate: "",
  expirationDate: "",
  doesNotExpire: true,
  credentialId: "",
  credentialUrl: "",
  skills: [],
  description: "",
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "";
  const [year, month] = dateStr.split("-");
  if (!month) return year;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
};

export function CertificationsEditorPage() {
  const router = useRouter();
  const { data: certifications = [], isLoading } = useGetCertificationsQuery();
  const [createCertification] = useCreateCertificationMutation();
  const [updateCertification] = useUpdateCertificationMutation();
  const [deleteCertification] = useDeleteCertificationMutation();

  const [triggerCertSearch, { data: certCatalog = [] }] = useLazyGetCertificationCatalogQuery();
  const [triggerIssuingSearch, { data: issuingOptions = [] }] = useLazyGetIssuingBodiesQuery();
  const [triggerSkillSearch, { data: skillOptions = [] }] = useLazyGetSkillsQuery();

  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [formData, setFormData] = useState<CertFormData>(emptyForm);
  const [issuingOpen, setIssuingOpen] = useState(false);

  // Debounced search for the issuing-organization suggestions
  useEffect(() => {
    const q = formData.issuingOrganization.trim();
    if (q.length < 2) return;
    const timer = setTimeout(() => triggerIssuingSearch({ search: q }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.issuingOrganization]);

  const handleAddNew = () => {
    setFormData(emptyForm);
    setEditingId("new");
  };

  const handleEdit = (cert: Certification) => {
    setFormData({
      certification: cert.certification ?? null,
      issuingOrganization: cert.issuing_body?.name ?? "",
      issuingBody: cert.issuing_body ?? null,
      issueDate: cert.issue_date ?? "",
      expirationDate: cert.expiration_date ?? "",
      doesNotExpire: cert.does_not_expire,
      credentialId: cert.credential_id ?? "",
      credentialUrl: cert.credential_url ?? "",
      skills: cert.skills ?? [],
      description: cert.description ?? "",
    });
    setEditingId(cert.id);
  };

  const handleDelete = (id: number) => {
    deleteCertification(id)
      .unwrap()
      .then(() => toast.success("Certification deleted"))
      .catch((error) => toast.error(error?.data?.message || "Failed to delete certification"));
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleSave = () => {
    if (!formData.certification) {
      toast.error("Please pick a certification from the catalog");
      return;
    }
    if (!formData.issuingOrganization.trim()) {
      toast.error("Please enter an issuing organization");
      return;
    }
    if (!formData.issueDate) {
      toast.error("Please select an issue date");
      return;
    }
    if (formData.credentialUrl && !/^https?:\/\//i.test(formData.credentialUrl)) {
      toast.error("Credential URL must start with http:// or https://");
      return;
    }

    // Prefer the picked issuing-body id; fall back to the typed name (find-or-create)
    // when the user entered a custom value that doesn't match the selected option.
    const issuingName = formData.issuingOrganization.trim();
    const useBodyId = formData.issuingBody && formData.issuingBody.name === issuingName;

    const payload: CertificationPayload = {
      certification_id: formData.certification.id,
      ...(useBodyId ? { issuing_body_id: formData.issuingBody!.id } : { issuingOrganization: issuingName }),
      issueDate: formData.issueDate,
      expirationDate: formData.doesNotExpire ? null : formData.expirationDate || null,
      doesNotExpire: formData.doesNotExpire,
      credentialId: formData.credentialId.trim() || undefined,
      credentialUrl: formData.credentialUrl.trim() || undefined,
      skills: formData.skills.map((s) => s.id),
      description: formData.description.trim() || undefined,
    };

    const request = editingId === "new" ? createCertification(payload) : updateCertification({ id: editingId as number, data: payload });

    request
      .unwrap()
      .then(() => {
        toast.success(editingId === "new" ? "Certification added" : "Certification updated");
        handleCancel();
      })
      .catch((error) => toast.error(error?.data?.message || "Failed to save certification"));
  };

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-yellow/3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-neon-cyan/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" className="glass hover:glass-strong mb-4" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-neon-yellow to-neon-cyan flex items-center justify-center">
              <Award className="h-8 w-8 text-black" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">
                <span className="bg-gradient-to-r from-neon-yellow to-neon-cyan bg-clip-text text-transparent">Certifications & Licenses</span>
              </h1>
              <p className="text-muted-foreground mt-1">Showcase your professional certifications and credentials</p>
            </div>
          </div>
        </div>

        {/* List View */}
        {!editingId && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                {isLoading ? "Loading..." : `${certifications.length} certification${certifications.length === 1 ? "" : "s"}`}
              </p>
              <Button onClick={handleAddNew} className="bg-gradient-to-r from-neon-yellow to-neon-cyan text-black hover:scale-105 transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Add Certification
              </Button>
            </div>

            <div className="space-y-4">
              {certifications.map((cert) => (
                <Card key={cert.id} className="glass hover:glass-strong p-6 rounded-xl border border-glass-border transition-all hover:border-neon-yellow/40">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-lg">{cert.certification?.name}</h3>
                      <p className="text-neon-yellow">{cert.issuing_body?.name}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Issued {formatDate(cert.issue_date)}
                          {!cert.does_not_expire && cert.expiration_date && ` • Expires ${formatDate(cert.expiration_date)}`}
                          {cert.does_not_expire && " • No Expiration"}
                        </span>
                      </div>
                      {cert.credential_id && <p className="text-xs text-muted-foreground mt-1">Credential ID: {cert.credential_id}</p>}
                      {cert.skills && cert.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {cert.skills.map((skill) => (
                            <Badge key={skill.id} className="bg-neon-purple/20 text-white border-0 text-xs">
                              {skill.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      {cert.credential_url && (
                        <a
                          href={cert.credential_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-9 w-9 rounded-md glass hover:glass-strong text-neon-cyan transition-colors"
                          title="View Credential"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <Button onClick={() => handleEdit(cert)} variant="ghost" size="sm" className="glass hover:glass-strong text-neon-yellow">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleDelete(cert.id)} variant="ghost" size="sm" className="glass hover:glass-strong text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {!isLoading && certifications.length === 0 && (
                <Card className="p-12 glass border-glass-border text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 rounded-full bg-neon-yellow/20 flex items-center justify-center mx-auto mb-4">
                      <Award className="w-8 h-8 text-neon-yellow" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Certifications Yet</h3>
                    <p className="text-muted-foreground mb-6">Add your professional certifications to stand out and demonstrate your expertise</p>
                    <Button onClick={handleAddNew} className="bg-gradient-to-r from-neon-yellow to-neon-cyan text-black">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Certification
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Edit Form */}
        {editingId && (
          <Card className="glass p-8 rounded-2xl border border-glass-border">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-glass-border">
                <h2 className="text-2xl font-bold text-white">{editingId === "new" ? "Add Certification" : "Edit Certification"}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Certification Name (catalog, select-only) */}
                <div className="space-y-2">
                  <Label htmlFor="certification" className="text-white">
                    Certification Name <span className="text-destructive">*</span>
                  </Label>
                  <Autocomplete<CertificationCatalog>
                    id="certification"
                    value={formData.certification}
                    onChange={(c) =>
                      setFormData((prev) => {
                        // Nice UX: auto-fill the issuing org from the catalog entry if empty
                        const autoFill = c?.issuing_body && !prev.issuingOrganization;
                        return {
                          ...prev,
                          certification: c,
                          issuingOrganization: autoFill ? c!.issuing_body!.name : prev.issuingOrganization,
                          issuingBody: autoFill ? c!.issuing_body! : prev.issuingBody,
                        };
                      })
                    }
                    onSearch={(q) => {
                      if (q) triggerCertSearch({ search: q });
                    }}
                    options={certCatalog}
                    placeholder="Search certifications..."
                    icon={<Search className="h-4 w-4" />}
                    getInputLabel={(c) => (c.abbreviation ? `${c.name} (${c.abbreviation})` : c.name)}
                    renderOption={(c) => (
                      <>
                        <span className="text-white">{c.name}</span>
                        {c.abbreviation && <span className="text-muted-foreground ml-2">{c.abbreviation}</span>}
                      </>
                    )}
                    minChars={2}
                    inputClassName="glass border-glass-border focus:border-neon-yellow"
                  />
                  <p className="text-xs text-muted-foreground">Pick from the catalog — custom names aren&apos;t accepted here.</p>
                </div>

                {/* Issuing Organization (search + allow-create) */}
                <div className="space-y-2">
                  <Label htmlFor="issuingOrganization" className="text-white">
                    Issuing Organization <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="issuingOrganization"
                      value={formData.issuingOrganization}
                      onChange={(e) => {
                        // Typing a custom value clears the picked option → falls back to name create
                        setFormData({ ...formData, issuingOrganization: e.target.value, issuingBody: null });
                        setIssuingOpen(true);
                      }}
                      onFocus={() => formData.issuingOrganization.trim().length >= 2 && setIssuingOpen(true)}
                      onBlur={() => setTimeout(() => setIssuingOpen(false), 150)}
                      placeholder="Search or type a new organization..."
                      className="glass border-glass-border focus:border-neon-yellow pl-9"
                    />
                    {issuingOpen && issuingOptions.length > 0 && (
                      <ul className="absolute z-50 mt-1 w-full rounded-lg border border-glass-border bg-gray-900 shadow-xl max-h-52 overflow-y-auto">
                        {issuingOptions.map((o) => (
                          <li
                            key={o.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setFormData({ ...formData, issuingOrganization: o.name, issuingBody: o });
                              setIssuingOpen(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-white cursor-pointer hover:bg-neon-yellow/10 transition-colors"
                          >
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{o.name}</span>
                            {o.country && <span className="text-muted-foreground ml-auto text-xs">{o.country}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Issue Date */}
                <div className="space-y-2">
                  <Label htmlFor="issueDate" className="text-white">
                    Issue Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="glass border-glass-border focus:border-neon-yellow"
                  />
                </div>

                {/* Expiration Date */}
                <div className="space-y-2">
                  <Label htmlFor="expirationDate" className="text-white">
                    Expiration Date
                  </Label>
                  <Input
                    id="expirationDate"
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    disabled={formData.doesNotExpire}
                    className="glass border-glass-border focus:border-neon-yellow disabled:opacity-50"
                  />
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.doesNotExpire}
                      onChange={(e) => setFormData({ ...formData, doesNotExpire: e.target.checked, expirationDate: e.target.checked ? "" : formData.expirationDate })}
                      className="rounded border-glass-border"
                    />
                    This certification does not expire
                  </label>
                </div>

                {/* Credential ID */}
                <div className="space-y-2">
                  <Label htmlFor="credentialId" className="text-white">
                    Credential ID
                  </Label>
                  <Input
                    id="credentialId"
                    value={formData.credentialId}
                    onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
                    placeholder="e.g., ABC123456"
                    className="glass border-glass-border focus:border-neon-yellow"
                  />
                </div>

                {/* Credential URL */}
                <div className="space-y-2">
                  <Label htmlFor="credentialUrl" className="text-white">
                    Credential URL
                  </Label>
                  <Input
                    id="credentialUrl"
                    type="url"
                    value={formData.credentialUrl}
                    onChange={(e) => setFormData({ ...formData, credentialUrl: e.target.value })}
                    placeholder="https://..."
                    className="glass border-glass-border focus:border-neon-yellow"
                  />
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <Label className="text-white">Related Skills</Label>
                <MultiAutocomplete<Skill>
                  value={formData.skills}
                  onChange={(s) => setFormData({ ...formData, skills: s })}
                  onSearch={(q) => {
                    if (q) triggerSkillSearch(q);
                  }}
                  options={skillOptions}
                  placeholder="Search skills..."
                  icon={<Search className="h-4 w-4" />}
                  inputClassName="glass border-glass-border focus:border-neon-yellow"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Briefly describe what this certification covers or what you learned..."
                  className="glass border-glass-border focus:border-neon-yellow min-h-24"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-glass-border">
                <Button variant="outline" onClick={handleCancel} className="glass hover:glass-strong">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-gradient-to-r from-neon-yellow to-neon-cyan text-black hover:scale-105 transition-all">
                  <Check className="h-4 w-4 mr-2" />
                  Save Certification
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
