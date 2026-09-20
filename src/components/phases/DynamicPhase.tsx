"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { commitPhase } from "@/store/hackathonStore";
import { useAuth } from "@/hooks/useAuth";
import type { Phase, Hackathon } from "@/types/hackathon";
import ErrorAlert from "@/components/ui/ErrorAlert";
import Loader from "@/components/ui/Loader";
import { API_BASE_URL } from "@/lib/site";
import PdfPreviewModal from "@/components/ui/PdfPreviewModal";
import { downloadFile } from "@/lib/cloudinaryUtils";

interface Props {
  hackathon: Hackathon;
  phase: Phase;
  existingResponse: Record<string, string | boolean | number> | null;
  onComplete: () => void;
}

function isHackathonActive(h: Hackathon) {
  const now = new Date();
  if (h.startDate && new Date(h.startDate) > now)
    return {
      active: false,
      reason: `Opens on ${new Date(h.startDate).toLocaleString()}.`,
    };
  if (h.endDate && new Date(h.endDate) < now)
    return {
      active: false,
      reason: `Ended on ${new Date(h.endDate).toLocaleString()}.`,
    };
  return { active: true };
}

function isPhaseActive(phase: Phase) {
  const now = new Date();
  if (phase.startDate && new Date(phase.startDate) > now)
    return {
      active: false,
      reason: `Opens on ${new Date(phase.startDate).toLocaleString()}.`,
    };
  if (phase.endDate && new Date(phase.endDate) < now)
    return {
      active: false,
      reason: `Closed on ${new Date(phase.endDate).toLocaleString()}.`,
    };
  return { active: true };
}

function Md({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ ...p }) => (
          <p
            className="text-[rgba(224,247,255,0.45)] font-mono-cc text-xs leading-relaxed mb-2"
            {...p}
          />
        ),
        strong: ({ ...p }) => (
          <strong className="text-[rgba(224,247,255,0.75)]" {...p} />
        ),
        a: ({ ...p }) => (
          <a
            className="text-[#00f5ff] underline"
            target="_blank"
            rel="noopener noreferrer"
            {...p}
          />
        ),
        ul: ({ ...p }) => (
          <ul
            className="list-disc list-inside text-[rgba(224,247,255,0.45)] font-mono-cc text-xs space-y-1 mb-2"
            {...p}
          />
        ),
        ol: ({ ...p }) => (
          <ol
            className="list-decimal list-inside text-[rgba(224,247,255,0.45)] font-mono-cc text-xs space-y-1 mb-2"
            {...p}
          />
        ),
        h1: ({ ...p }) => (
          <h1
            className="text-white font-orbitron font-bold text-sm uppercase tracking-wider mb-2"
            {...p}
          />
        ),
        h2: ({ ...p }) => (
          <h2
            className="text-[rgba(224,247,255,0.8)] font-orbitron font-bold text-xs uppercase tracking-wider mb-2"
            {...p}
          />
        ),
        blockquote: ({ ...p }) => (
          <blockquote
            className="border-l-2 border-[rgba(0,245,255,0.3)] pl-3 text-[rgba(224,247,255,0.4)] font-mono-cc text-xs italic mb-2"
            {...p}
          />
        ),
        code: ({ ...p }) => (
          <code
            className="bg-[rgba(255,255,255,0.05)] text-[#00f5ff] font-mono-cc text-xs px-1 py-0.5"
            {...p}
          />
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

function FieldLabel({ label, required }: { label: string; required: boolean }) {
  return (
    <span className="input-label">
      <ReactMarkdown
        components={{
          p: ({ ...p }) => <span {...p} />,
          strong: ({ ...p }) => (
            <strong className="text-[rgba(224,247,255,0.8)]" {...p} />
          ),
          code: ({ ...p }) => (
            <code className="text-[#00f5ff] font-mono-cc" {...p} />
          ),
          a: ({ ...p }) => (
            <a
              className="text-[#00f5ff] underline"
              target="_blank"
              rel="noopener noreferrer"
              {...p}
            />
          ),
        }}
      >
        {label}
      </ReactMarkdown>
      {required && <span className="text-[#00f5ff] ml-1">*</span>}
    </span>
  );
}

export default function DynamicPhase({
  hackathon,
  phase,
  existingResponse,
  onComplete,
}: Props) {
  const { user } = useAuth();

  const getInitial = () => {
    if (existingResponse) return existingResponse;

    // Check for draft in localStorage
    if (typeof window !== "undefined" && user) {
      const draftKey = `draft_${hackathon.id}_${user.uid}_${phase.id}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          return JSON.parse(savedDraft);
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
    }

    const s: Record<string, string | boolean | number> = {};
    phase.fields?.forEach((f) => {
      if ((f.type as string) === "content") return;
      s[f.id] = f.type === "checkbox" ? false : "";
      if (phase.id === "phase_1_registration" && user) {
        if (f.id === "name" && user.displayName) s[f.id] = user.displayName;
        if (f.id === "email" && user.email) s[f.id] = user.email;
        if (f.id === "github") s[f.id] = ""; // Initialize placeholder
        if (f.id === "linkedin") s[f.id] = ""; // Initialize placeholder
      }
    });
    return s;
  };

  const [form, setForm] =
    useState<Record<string, string | boolean | number>>(getInitial());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [systemError, setSystemError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [invitationStatus, setInvitationStatus] = useState<
    Record<string, { status: string; loading?: boolean }>
  >({});
  const [acceptedTeam, setAcceptedTeam] = useState<string | null>(null);
  const [checkingAccepted, setCheckingAccepted] = useState(true);
  const [uploadCounts, setUploadCounts] = useState<Record<string, number>>({});
  const [previewingUrl, setPreviewingUrl] = useState<string | null>(null);

  // Refs to avoid unnecessary effect triggers
  const formRef = useRef(form);
  const statusRef = useRef(invitationStatus);

  // Sync form when existingResponse changes (e.g. teammate submitted and polling picked it up)
  const [prevExistingResponse, setPrevExistingResponse] = useState(existingResponse);
  if (existingResponse !== prevExistingResponse) {
    setPrevExistingResponse(existingResponse);
    if (existingResponse) {
      setForm(existingResponse);
    }
  }

  useEffect(() => {
    formRef.current = form;
  }, [form]);
  useEffect(() => {
    statusRef.current = invitationStatus;
  }, [invitationStatus]);

  const checkInvitationStatus = useCallback(
    async (email: string, memberId: string) => {
      if (!email || !email.includes("@")) return;
      const teamName = form.teamName as string;
      if (!teamName) return;

      try {
        const res = await fetch(
          `${API_BASE_URL}/invitations/status/${hackathon.id}/${encodeURIComponent(teamName)}/${encodeURIComponent(email)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setInvitationStatus((prev) => {
            // Only update if the status has actually changed to avoid unnecessary renders
            if (prev[memberId]?.status === data.status) return prev;
            return { ...prev, [memberId]: { status: data.status } };
          });
        }
      } catch (err) {
        console.error("Failed to check status", err);
      }
    },
    [hackathon.id, form.teamName],
  );

  const handleInvite = useCallback(
    async (email: string, memberId: string) => {
      if (!user || !user.email) return;
      const teamName = form.teamName as string;
      if (!teamName) {
        setErrors((prev) => ({
          ...prev,
          [memberId]: "Please enter a Team Name first",
        }));
        return;
      }

      setInvitationStatus((prev) => ({
        ...prev,
        [memberId]: { ...prev[memberId], loading: true },
      }));
      try {
        const res = await fetch(`${API_BASE_URL}/invitations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hackathonId: hackathon.id,
            teamName,
            inviterEmail: user.email,
            inviteeEmail: email,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setInvitationStatus((prev) => ({
            ...prev,
            [memberId]: {
              status: data.invitation?.status || "pending",
              loading: false,
            },
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            [memberId]: data.message || "Failed to invite",
          }));
          setInvitationStatus((prev) => ({
            ...prev,
            [memberId]: { ...prev[memberId], loading: false },
          }));
        }
      } catch (err) {
        console.error("Invite error", err);
        setErrors((prev) => ({ ...prev, [memberId]: "Network error" }));
        setInvitationStatus((prev) => ({
          ...prev,
          [memberId]: { ...prev[memberId], loading: false },
        }));
      }
    },
    [user, hackathon.id, form.teamName],
  );

  useEffect(() => {
    const fetchProfile = async () => {
      if (!existingResponse && phase.id === "phase_1_registration" && user) {
        try {
          const res = await fetch(`${API_BASE_URL}/users/${user.uid}`);
          if (res.ok) {
            const data = await res.json();
            setForm((prev) => ({
              ...prev,
              name:
                (prev.name as string) || data.name || user.displayName || "",
              email: (prev.email as string) || user.email || "",
              phone: data.phone || "",
              year: data.year || "",
              branch: data.branch || "",
              gender: data.gender || "",
              collegeName: data.collegeName || "",
              github: data.github || "",
              linkedin: data.linkedin || "",
            }));
          } else {
            // fallback if fetch fails
            setForm((prev) => ({
              ...prev,
              name: (prev.name as string) || user.displayName || "",
              email: (prev.email as string) || user.email || "",
            }));
          }
        } catch (err) {
          console.error("Failed to fetch profile", err);
          // fallback
          setForm((prev) => ({
            ...prev,
            name: (prev.name as string) || user.displayName || "",
            email: (prev.email as string) || user.email || "",
          }));
        }
      }
    };

    const fetchAcceptedTeam = async () => {
      if (
        !existingResponse &&
        phase.id === "phase_2_team_formation" &&
        user?.email
      ) {
        try {
          const res = await fetch(
            `${API_BASE_URL}/invitations/accepted/${hackathon.id}/${encodeURIComponent(user.email)}`,
          );
          if (res.ok) {
            const data = await res.json();
            if (data.found && data.invitation) {
              setAcceptedTeam(data.invitation.teamName);
            }
          }
        } catch (err) {
          console.error("Failed to check accepted team", err);
        }
      }
      setCheckingAccepted(false);
    };

    const fetchRegistration = async () => {
      if (user) {
        try {
          const res = await fetch(
            `${API_BASE_URL}/registrations/${hackathon.id}/user/${user.uid}`,
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.uploadCounts) {
              setUploadCounts(data.uploadCounts);
            }
          }
        } catch (err) {
          console.error("Failed to fetch registration for counts", err);
        }
      }
    };

    fetchProfile();
    fetchAcceptedTeam();
    fetchRegistration();
  }, [user, phase.id, existingResponse, hackathon.id]);

  const isCompleted = !!existingResponse;
  const isDirty = JSON.stringify(form) !== JSON.stringify(getInitial());
  const phases = hackathon.phases || [];
  const isLastPhase =
    phases.length > 0 && phases[phases.length - 1].id === phase.id;

  // Persist form to localStorage as a draft (even for completed phases if they are being edited)
  useEffect(() => {
    if (user && (!isCompleted || isDirty)) {
      const draftKey = `draft_${hackathon.id}_${user.uid}_${phase.id}`;
      localStorage.setItem(draftKey, JSON.stringify(form));
    }
  }, [form, user, hackathon.id, phase.id, isCompleted, isDirty]);

  const hStatus = isHackathonActive(hackathon);
  const pStatus = isPhaseActive(phase);
  const isLocked = !hStatus.active || !pStatus.active;
  const lockReason = !hStatus.active
    ? (hStatus as { reason?: string }).reason
    : (pStatus as { reason?: string }).reason || "Access restricted.";

  const validate = () => {
    if (acceptedTeam) return true; // Bypass validation for accepted members

    const e: Record<string, string> = {};
    phase.fields?.forEach((f) => {
      if ((f.type as string) === "content") return;
      if (f.required) {
        if (f.type === "checkbox" && !form[f.id]) e[f.id] = "Required";
        else if (f.type !== "checkbox" && !String(form[f.id] ?? "").trim())
          e[f.id] = `${f.label} is required`;
      }

      // Add dynamic member email validation
      if (f.id === "teamSize" && Number(form[f.id]) > 1) {
        for (let i = 1; i < Number(form[f.id]); i++) {
          const memberId = `memberEmail_${i}`;
          if (!String(form[memberId] ?? "").trim()) {
            e[memberId] = `Member ${i + 1} Gmail is required`;
          } else if (!String(form[memberId]).includes("@")) {
            e[memberId] = "Invalid email format";
          }
        }
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  useEffect(() => {
    if (
      phase.id === "phase_2_team_formation" &&
      Number(formRef.current.teamSize) > 1
    ) {
      const timer = setTimeout(() => {
        const currentForm = formRef.current;
        const currentStatus = statusRef.current;
        for (let i = 1; i < Number(currentForm.teamSize); i++) {
          const memberId = `memberEmail_${i}`;
          const email = String(currentForm[memberId] ?? "");
          if (
            email.includes("@") &&
            email.includes(".") &&
            (!currentStatus[memberId] ||
              currentStatus[memberId].status === "none")
          ) {
            checkInvitationStatus(email, memberId);
          }
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [phase.id, checkInvitationStatus]); // Only trigger on mount or phase change

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (
      phase.id === "phase_2_team_formation" &&
      Number(formRef.current.teamSize) > 1
    ) {
      interval = setInterval(() => {
        const currentForm = formRef.current;
        const currentStatus = statusRef.current;
        for (let i = 1; i < Number(currentForm.teamSize); i++) {
          const memberId = `memberEmail_${i}`;
          const email = String(currentForm[memberId] ?? "");
          if (
            email.includes("@") &&
            currentStatus[memberId]?.status === "pending"
          ) {
            checkInvitationStatus(email, memberId);
          }
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [phase.id, checkInvitationStatus]); // Stable polling interval

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Enforce invitation acceptance
    if (
      !acceptedTeam &&
      phase.id === "phase_2_team_formation" &&
      Number(form.teamSize) > 1
    ) {
      for (let i = 1; i < Number(form.teamSize); i++) {
        const memberId = `memberEmail_${i}`;
        const statusObj = invitationStatus[memberId];
        if (!statusObj || statusObj.status !== "accepted") {
          setSystemError(
            `Cannot proceed until all invited squad members have accepted their invitations (Member ${i + 1} is pending/rejected).`,
          );
          return;
        }
      }
    }

    setSaving(true);
    setSystemError(null);
    try {
      if (!user) throw new Error("Authentication node not found.");

      let submissionData = { ...form };
      if (acceptedTeam) {
        submissionData = { teamName: acceptedTeam };
      }

      const res = await commitPhase(
        hackathon.id,
        user.uid,
        phase.id,
        submissionData,
      );
      if (!res.ok)
        throw new Error(res.message || "Protocol rejection from server.");

      // Clear draft on success
      const draftKey = `draft_${hackathon.id}_${user.uid}_${phase.id}`;
      localStorage.removeItem(draftKey);

      if (isLastPhase) window.location.href = "/dashboard";
      else onComplete();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to commit data.";
      setSystemError(msg);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string | boolean | number) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));

    // Check status dynamically if email changes
    if (
      field.startsWith("memberEmail_") &&
      typeof value === "string" &&
      value.includes("@") &&
      value.includes(".")
    ) {
      checkInvitationStatus(value, field);
    } else if (field.startsWith("memberEmail_")) {
      // reset status if invalid
      setInvitationStatus((prev) => {
        const newStatus = { ...prev };
        delete newStatus[field];
        return newStatus;
      });
    }
  };

  const uploadPDF = async (fieldId: string, file: File) => {
    if (file.type !== "application/pdf") {
      setErrors((e) => ({ ...e, [fieldId]: "Only PDF files are allowed." }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors((e) => ({ ...e, [fieldId]: "File exceeds 10MB." }));
      return;
    }

    const countKey = `${phase.id}_${fieldId}`;
    const currentCount = uploadCounts[countKey] || 0;
    if (currentCount >= 3) {
      setErrors((e) => ({
        ...e,
        [fieldId]: "Upload limit reached (3/3). Transmission locked.",
      }));
      return;
    }

    setUploadingField(fieldId);
    setErrors((e) => ({ ...e, [fieldId]: "" }));
    const cn = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const up = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cn || !up) {
      setErrors((e) => ({ ...e, [fieldId]: "Cloudinary config missing." }));
      setUploadingField(null);
      return;
    }
    const isImage = file.type.startsWith("image/");
    const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const fixedFile = isPDF
      ? new File([file], file.name, { type: "application/pdf" })
      : file;

    const fd = new FormData();
    fd.append("file", fixedFile);
    fd.append("upload_preset", up);

    const resourceType = isImage ? "image" : "raw";
    fd.append("resource_type", resourceType);
    fd.append("folder", `hackathons/${hackathon.id}/submissions`);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cn}/${resourceType}/upload`,
        {
          method: "POST",
          body: fd,
        },
      );
      const data = await res.json();
      if (data.secure_url) {
        // Increment count on backend
        try {
          const countRes = await fetch(
            `${API_BASE_URL}/registrations/upload-count`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-uid": user?.uid || "",
              },
              body: JSON.stringify({
                userId: user?.uid,
                hackathonId: hackathon.id,
                phaseId: phase.id,
                fieldId: fieldId,
              }),
            },
          );
          if (countRes.ok) {
            const countData = await countRes.json();
            setUploadCounts((prev) => ({
              ...prev,
              [countKey]: countData.count,
            }));
          }
        } catch (err) {
          console.error("Failed to sync upload count", err);
        }

        updateField(fieldId, data.secure_url);
      } else throw new Error(data.error?.message || "Upload failed");
    } catch (err: unknown) {
      console.error("PDF upload error:", err);
      setErrors((e) => ({ ...e, [fieldId]: "Upload failed. Try again." }));
    } finally {
      setUploadingField(null);
    }
  };

  const phaseIdx = phases.findIndex((p) => p.id === phase.id);

  if (
    checkingAccepted &&
    phase.id === "phase_2_team_formation" &&
    !existingResponse
  ) {
    return (
      <div className="w-full flex items-center justify-center p-12">
        <Loader text="VERIFYING SQUAD CREDENTIALS..." />
      </div>
    );
  }

  return (
    <>
    <div className="w-full animate-fade-up">
      {/* Phase Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="font-mono-cc text-[9px] text-[rgba(241,240,255,0.4)] uppercase tracking-[0.25em]">
            Phase {String(phaseIdx + 1).padStart(2, "0")}
          </span>
          <span className="flex-1 h-px bg-purple-500/10" />
          <span
            className={`font-mono-cc text-[9.5px] uppercase tracking-widest font-semibold ${
              isLocked
                ? "text-rose-400"
                : isCompleted
                  ? "text-emerald-400"
                  : "text-amber-400"
            }`}
          >
            {isLocked ? "● Locked" : isCompleted ? "● Completed" : "● Active"}
          </span>
        </div>

        <h2 className="text-2.5xl lg:text-3xl font-orbitron font-black text-white uppercase tracking-tight leading-tight">
          <ReactMarkdown components={{ p: ({ ...p }) => <span {...p} /> }}>
            {phase.name}
          </ReactMarkdown>
        </h2>

        {phase.description && (
          <div className="mt-3 max-w-xl">
            <Md>{phase.description}</Md>
          </div>
        )}
      </div>

      {/* Locked Banner */}
      {isLocked && (
        <div className="mb-6 flex items-start gap-3 p-4 border border-rose-500/20 bg-rose-500/5 rounded-xl">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2.5"
            className="shrink-0 mt-0.5 text-rose-400"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <div>
            <p className="font-orbitron font-bold text-[10px] text-rose-400 uppercase tracking-widest mb-1">
              Phase Locked
            </p>
            <p className="font-mono-cc text-[11px] text-[rgba(241,240,255,0.55)] leading-relaxed">
              {lockReason}
            </p>
          </div>
        </div>
      )}

      {/* System Error */}
      {systemError && (
        <div className="mb-6">
          <ErrorAlert
            title="Submission Error"
            message={systemError}
            onRetry={() => setSystemError(null)}
          />
        </div>
      )}

      {/* Completed Banner */}
      {isCompleted && (
        <div className="mb-6 flex items-start gap-3 p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-xl">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            className="shrink-0 mt-0.5 text-emerald-400"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <div>
            <p className="font-orbitron font-bold text-[10px] text-emerald-400 uppercase tracking-widest mb-1">
              Response Logged
            </p>
            <p className="font-mono-cc text-[11px] text-[rgba(241,240,255,0.55)] leading-relaxed">
              Your submission has been recorded. You may update your information
              at any time until the phase deadline.
            </p>
          </div>
        </div>
      )}

      {/* Accepted Team Read-Only View */}
      {isLocked && !isCompleted ? null : acceptedTeam && !isCompleted ? (
        <div className="space-y-6">
          <div className="glass-card p-6 border-emerald-500/20 bg-emerald-950/10 rounded-2xl">
            <h3 className="text-lg font-orbitron font-bold text-emerald-400 mb-2 uppercase tracking-widest flex items-center gap-2">
              <svg
                className="w-5 h-5 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Squad Assignment Confirmed
            </h3>
            <p className="text-sm font-mono text-slate-300">
              You have successfully accepted the invitation to join squad:{" "}
              <span className="font-bold text-white text-base ml-1">
                {acceptedTeam}
              </span>
              .
            </p>
            <p className="text-xs font-mono text-slate-500 mt-4">
              No further formation data is required. Click proceed to formalize
              your registry and link your profile to this squad.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="pt-4 flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? (
                  <Loader text="COMMITTING..." />
                ) : (
                  "PROCEED TO NEXT PHASE"
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Form */
        <form onSubmit={handleSubmit}>
          <div className="glass-card p-6 lg:p-8 space-y-7 rounded-2xl border-purple-500/10">
            {/* Form Fields */}
            {(() => {
              const displayFields = [...(phase.fields || [])];

              return (
                <div className="space-y-7">
                  {displayFields.map((field) => (
                    <div key={field.id}>
                      {/* Content block */}
                      {(field.type as string) === "content" ? (
                        <div className="relative p-5 border border-purple-500/15 bg-purple-500/[0.02] overflow-hidden rounded-xl">
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-purple-500/40" />
                          <div className="pl-2">
                            <ReactMarkdown
                              components={{
                                p: ({ ...p }) => (
                                  <p
                                    className="mb-2 last:mb-0 font-mono-cc text-xs text-[rgba(241,240,255,0.5)] leading-relaxed"
                                    {...p}
                                  />
                                ),
                                a: ({ ...p }) => (
                                  <a
                                    className="text-purple-300 underline hover:text-purple-200"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    {...p}
                                  />
                                ),
                                strong: ({ ...p }) => (
                                  <strong
                                    className="text-[rgba(241,240,255,0.8)] font-semibold"
                                    {...p}
                                  />
                                ),
                              }}
                            >
                              {field.label}
                            </ReactMarkdown>
                          </div>
                        </div>
                      ) : field.type === "checkbox" ? (
                        <label
                          className={`flex items-start gap-3 cursor-pointer group ${isLocked ? "opacity-40 pointer-events-none" : ""}`}
                        >
                          <div className="relative shrink-0 mt-0.5">
                            <input
                              type="checkbox"
                              checked={!!form[field.id]}
                              onChange={(e) =>
                                updateField(field.id, e.target.checked)
                              }
                              className="sr-only"
                              disabled={isLocked}
                            />
                            <div
                              className={`w-5 h-5 rounded border transition-all duration-200 flex items-center justify-center ${
                                form[field.id]
                                  ? "bg-purple-500 border-purple-500"
                                  : "border-[rgba(241,240,255,0.2)] group-hover:border-purple-400/50"
                              }`}
                            >
                              {form[field.id] && (
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#ffffff"
                                  strokeWidth="3.5"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <span className="font-mono-cc text-sm text-[rgba(241,240,255,0.7)] group-hover:text-[rgba(241,240,255,0.9)] transition-colors leading-relaxed">
                            <ReactMarkdown
                              components={{
                                p: ({ ...p }) => <span {...p} />,
                                a: ({ ...p }) => (
                                  <a
                                    className="text-purple-300 underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    {...p}
                                  />
                                ),
                                strong: ({ ...p }) => (
                                  <strong className="text-white font-semibold" {...p} />
                                ),
                              }}
                            >
                              {field.label}
                            </ReactMarkdown>
                            {field.required && (
                              <span className="text-purple-400 ml-1">*</span>
                            )}
                          </span>
                        </label>
                      ) : field.type === "textarea" ? (
                        <>
                          <FieldLabel
                            label={field.label}
                            required={field.required}
                          />
                          <textarea
                            value={String(form[field.id] ?? "")}
                            onChange={(e) =>
                              updateField(field.id, e.target.value)
                            }
                            className="input-field min-h-[110px] resize-y"
                            disabled={isLocked}
                            placeholder="Enter your response..."
                          />
                        </>
                      ) : field.type === "select" ? (
                        <>
                          <FieldLabel
                            label={field.label}
                            required={field.required}
                          />
                          <select
                            value={String(form[field.id] ?? "")}
                            onChange={(e) =>
                              updateField(field.id, e.target.value)
                            }
                            className="input-field"
                            disabled={isLocked}
                          >
                            <option value="">Select an option</option>
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </>
                      ) : field.type === "radio" ? (
                        <>
                          <FieldLabel
                            label={field.label}
                            required={field.required}
                          />
                          <div className="mt-3 space-y-2.5">
                            {field.options?.map((opt) => (
                              <label
                                key={opt}
                                className={`flex items-center gap-3 cursor-pointer group ${isLocked ? "opacity-40 pointer-events-none" : ""}`}
                              >
                                <div className="relative shrink-0">
                                  <input
                                    type="radio"
                                    name={field.id}
                                    checked={form[field.id] === opt}
                                    onChange={() => updateField(field.id, opt)}
                                    className="sr-only"
                                    disabled={isLocked}
                                  />
                                  <div
                                    className={`w-4 h-4 rounded-full border transition-all flex items-center justify-center ${
                                      form[field.id] === opt
                                        ? "border-purple-500"
                                        : "border-[rgba(241,240,255,0.2)] group-hover:border-purple-400/50"
                                    }`}
                                  >
                                    {form[field.id] === opt && (
                                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                                    )}
                                  </div>
                                </div>
                                <span className="font-mono-cc text-sm text-[rgba(241,240,255,0.7)] group-hover:text-[rgba(241,240,255,0.9)] transition-colors">
                                  {opt}
                                </span>
                              </label>
                            ))}
                          </div>
                        </>
                      ) : field.type === "file" ? (
                        <>
                          <FieldLabel
                            label={field.label}
                            required={field.required}
                          />
                          <div className="mt-2 relative group">
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) uploadPDF(field.id, f);
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                              disabled={
                                isLocked ||
                                !!uploadingField ||
                                (uploadCounts[`${phase.id}_${field.id}`] ||
                                  0) >= 3
                              }
                            />
                            <div
                              className={`w-full border border-dashed rounded-xl transition-all py-8 flex flex-col items-center justify-center gap-2.5 ${
                                uploadingField === field.id
                                  ? "border-purple-500 bg-purple-500/5"
                                  : "border-purple-500/20 group-hover:border-purple-500/40 group-hover:bg-purple-500/[0.02]"
                              }`}
                            >
                              {uploadingField === field.id ? (
                                <>
                                  <div className="scale-50 h-6 flex items-center justify-center">
                                    <Loader text="" />
                                  </div>
                                  <span className="font-mono-cc text-[10px] text-purple-400 uppercase tracking-widest animate-pulse">
                                    Uploading...
                                  </span>
                                </>
                              ) : form[field.id] ? (
                                <div className="flex flex-col items-center gap-3 relative z-20">
                                  <div className="flex items-center gap-2">
                                    <svg
                                      width="18"
                                      height="18"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="#10b981"
                                      strokeWidth="2.5"
                                    >
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    <span className="font-mono-cc text-[10px] text-[#10b981] uppercase tracking-widest font-bold">
                                      Packet_Received
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewingUrl(String(form[field.id]));
                                      }}
                                      className="px-4 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-[#10b981] border border-emerald-500/20 font-orbitron font-bold text-[9px] uppercase tracking-widest transition-all"
                                    >
                                      Preview File
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadFile(String(form[field.id]));
                                      }}
                                      className="px-2.5 py-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-orbitron font-bold text-[9px] uppercase transition-all"
                                      title="Download Raw File"
                                    >
                                      ⬇
                                    </button>
                                    <span className="font-mono-cc text-[9.5px] text-[rgba(241,240,255,0.3)]">
                                      |{" "}
                                      {3 -
                                        (uploadCounts[
                                          `${phase.id}_${field.id}`
                                        ] || 0)}{" "}
                                      attempts left
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <svg
                                    width="22"
                                    height="22"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="rgba(192, 132, 252, 0.4)"
                                    strokeWidth="2"
                                    className="group-hover:stroke-purple-400 transition-colors"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
                                    />
                                  </svg>
                                  <span className="font-mono-cc text-xs text-[rgba(241,240,255,0.5)]">
                                    {(uploadCounts[`${phase.id}_${field.id}`] ||
                                      0) >= 3
                                      ? "Transmission Locked"
                                      : "Upload PDF Document"}
                                  </span>
                                  <span className="font-mono-cc text-[9px] text-[rgba(241,240,255,0.3)] uppercase tracking-wider">
                                    Max 10MB • Attempts:{" "}
                                    {uploadCounts[`${phase.id}_${field.id}`] ||
                                      0}
                                    /3
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <FieldLabel
                            label={field.label}
                            required={field.required}
                          />
                          <input
                            type={field.type}
                            value={String(form[field.id] ?? "")}
                            onChange={(e) =>
                              updateField(field.id, e.target.value)
                            }
                            className={`input-field ${phase.id === "phase_1_registration" && field.id === "email" ? "opacity-50 cursor-not-allowed" : ""}`}
                            disabled={isLocked}
                            readOnly={
                              phase.id === "phase_1_registration" &&
                              field.id === "email"
                            }
                            placeholder={`Enter ${field.label.toLowerCase()}...`}
                          />
                        </>
                      )}

                      {errors[field.id] && (
                        <p className="font-mono-cc text-[10.5px] text-rose-400 mt-1.5 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-rose-400 shrink-0" />
                          {errors[field.id]}
                        </p>
                      )}

                      {/* Dynamic Member Emails */}
                      {field.id === "teamSize" &&
                        Number(form[field.id]) > 1 && (
                          <div className="mt-6 space-y-6 pl-4 border-l border-purple-500/20 animate-fade-up">
                            <p className="font-orbitron font-bold text-[10px] text-purple-400 uppercase tracking-widest mb-4">
                              Squad Member Authentication
                            </p>
                            {Array.from({
                              length: Number(form[field.id]) - 1,
                            }).map((_, i) => {
                              const memberId = `memberEmail_${i + 1}`;
                              return (
                                <div key={memberId}>
                                  <FieldLabel
                                    label={`Member ${i + 2} Gmail`}
                                    required={true}
                                  />
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="email"
                                      value={String(form[memberId] ?? "")}
                                      onChange={(e) =>
                                        updateField(memberId, e.target.value)
                                      }
                                      className="input-field flex-1"
                                      disabled={isLocked}
                                      placeholder={`Enter member ${i + 2}'s gmail...`}
                                    />
                                    {String(form[memberId]).includes("@") && (
                                      <div className="shrink-0 flex items-center">
                                        {!invitationStatus[memberId] ||
                                        invitationStatus[memberId].status ===
                                          "none" ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleInvite(
                                                String(form[memberId]),
                                                memberId,
                                              )
                                            }
                                            disabled={
                                              invitationStatus[memberId]
                                                ?.loading || isLocked
                                            }
                                            className="px-4 py-2 rounded-lg bg-purple-500/10 text-purple-300 font-semibold font-orbitron text-[10px] uppercase tracking-wider border border-purple-500/20 hover:bg-purple-500/20 transition-all disabled:opacity-50"
                                          >
                                            {invitationStatus[memberId]?.loading
                                              ? "Sending..."
                                              : "Invite"}
                                          </button>
                                        ) : invitationStatus[memberId]
                                            .status === "accepted" ? (
                                          <div className="px-4 py-2 border rounded-lg font-bold font-orbitron text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                            accepted
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleInvite(
                                                String(form[memberId]),
                                                memberId,
                                              )
                                            }
                                            disabled={
                                              invitationStatus[memberId]
                                                ?.loading || isLocked
                                            }
                                            className={`px-4 py-2 rounded-lg font-semibold font-orbitron text-[10px] uppercase tracking-wider border transition-colors disabled:opacity-50 ${
                                              invitationStatus[memberId]
                                                .status === "rejected"
                                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                                                : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                                            }`}
                                          >
                                            {invitationStatus[memberId]?.loading
                                              ? "Resending..."
                                              : "Resend"}
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  {errors[memberId] && (
                                    <p className="font-mono-cc text-[10.5px] text-rose-400 mt-1.5 flex items-center gap-1.5">
                                      <span className="w-1 h-1 rounded-full bg-rose-400 shrink-0" />
                                      {errors[memberId]}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Action Buttons */}
            <div className="pt-5 border-t border-white/[0.05] flex items-center justify-end gap-3">
              {isCompleted && !isLastPhase && (
                <button
                  type="button"
                  onClick={onComplete}
                  className="btn-secondary py-2! px-5!"
                >
                  Next Phase
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              )}

              {(!isCompleted ||
                isDirty ||
                (isCompleted && !isLocked && isLastPhase)) && (
                <button
                  type="submit"
                  disabled={saving || isLocked}
                  className="btn-primary py-2! px-6!"
                >
                  {saving ? (
                    <>
                      <div className="scale-50 h-5 w-5 flex items-center justify-center">
                        <Loader text="" />
                      </div>
                      Transmitting...
                    </>
                  ) : isLastPhase ? (
                    <>
                      Final Submit{" "}
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  ) : isCompleted ? (
                    "Update Data"
                  ) : (
                    <>
                      Submit{" "}
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
    {previewingUrl && (
      <PdfPreviewModal
        url={previewingUrl}
        onClose={() => setPreviewingUrl(null)}
      />
    )}
    </>
  );
}
