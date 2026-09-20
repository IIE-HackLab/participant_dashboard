"use client";

import { useEffect, useState, useCallback } from "react";
import Loader from "@/components/ui/Loader";
import { useAuth } from "@/hooks/useAuth";
import type { Hackathon } from "@/types/hackathon";
import { API_BASE_URL } from "@/lib/site";
import { getCleanViewUrl } from "@/lib/cloudinaryUtils";

type SubmissionResponse = {
  projectName?: string;
  repoLink?: string;
  demoLink?: string;
  description?: string;
  [key: string]: unknown;
};

type TeamFormationResponse = {
  teamName?: string;
};

interface Evaluation {
  judgeEmail?: string | null;
  scores?: Record<string, number>;
  feedback?: string;
}

interface Registration {
  _id: string;
  userId: string;
  user: { name: string; email: string };
  responses: Record<string, unknown>;
  evaluations?: Evaluation[];
}

function getSubmission(registration: Registration | null) {
  return registration?.responses?.phase_3_submissions as
    | SubmissionResponse
    | undefined;
}

function getTeamFormation(registration: Registration) {
  return registration.responses?.phase_2_team_formation as
    | TeamFormationResponse
    | undefined;
}

export default function JudgePanel({ hackathon }: { hackathon: Hackathon }) {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTeams = useCallback(async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/registrations/${hackathon.id}`, {
        headers: {
          "Authorization": `Bearer ${idToken}`
        }
      });
      if (!res.ok) return;

      const data = await res.json();
      const withSubmissions = (data as Registration[]).filter((registration) =>
        Boolean(getSubmission(registration)),
      );
      setTeams(withSubmissions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [hackathon.id, user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const run = async () => {
      try {
        const idToken = await user.getIdToken();
        const res = await fetch(
          `${API_BASE_URL}/registrations/${hackathon.id}`,
          { headers: { Authorization: `Bearer ${idToken}` } },
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const withSubmissions = (data as Registration[]).filter((r) =>
          Boolean(getSubmission(r)),
        );
        if (!cancelled) {
          setTeams(withSubmissions);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setLoading(false);
        }
      }
    };
    run();
    return () => { cancelled = true; };
  }, [hackathon.id, user]);


  const handleScoreChange = (param: string, value: number) => {
    setScores(prev => ({ ...prev, [param]: value }));
  };

  const submitEvaluation = async () => {
    if (!selectedReg || !user) return;
    setSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/registrations/evaluate/${selectedReg._id}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          judgeEmail: user.email,
          scores,
          feedback
        })
      });
      if (res.ok) {
        setSelectedReg(null);
        setScores({});
        setFeedback("");
        await fetchTeams();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectTeam = (reg: Registration) => {
    setSelectedReg(reg);
    // pre-fill if already evaluated
    const existingEval = reg.evaluations?.find(e => e.judgeEmail === user?.email);
    if (existingEval) {
      setScores(existingEval.scores || {});
      setFeedback(existingEval.feedback || "");
    } else {
      setScores({});
      setFeedback("");
    }
  };

  if (loading) return <Loader text="Loading teams..." />;

  const params = hackathon.judgingParameters || [];
  const selectedSubmission = getSubmission(selectedReg);

  return (
    <div className="glass-card p-6 md:p-10 border border-[#00f5ff]/20">
      <h2 className="text-2xl font-black text-white font-orbitron uppercase tracking-widest mb-8 border-b border-[#00f5ff]/20 pb-4">
        Judging Panel
      </h2>

      {selectedReg ? (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => setSelectedReg(null)}
              className="text-[#00f5ff] hover:text-white font-orbitron text-xs uppercase tracking-widest transition-colors"
            >
              ← Back to Teams
            </button>
            <h3 className="text-lg font-bold text-white font-orbitron">
              Evaluating: {selectedSubmission?.projectName || 'Unnamed Project'}
            </h3>
          </div>
          
          <div className="bg-[#020617]/50 p-4 border border-slate-800 rounded">
            <p className="text-xs text-slate-400 font-mono mb-2">Project Details:</p>
            <div className="flex gap-4">
              {selectedSubmission?.repoLink && (
                <a href={selectedSubmission.repoLink} target="_blank" className="text-[#00f5ff] hover:underline text-sm font-mono">Repository</a>
              )}
              {selectedSubmission?.demoLink && (
                <a href={selectedSubmission.demoLink} target="_blank" className="text-[#00f5ff] hover:underline text-sm font-mono">Live Demo</a>
              )}
              {/* Add file links (PDFs, PPTs, etc) */}
              {Object.entries(selectedSubmission || {}).map(([key, val]) => {
                if (typeof val === 'string' && val.includes('cloudinary.com') && key !== 'banner') {
                  const isDoc = val.includes('/raw/upload/') || /\.(pdf|ppt|pptx|doc|docx)$/i.test(val);
                  return (
                    <a
                      key={key}
                      href={getCleanViewUrl(val)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00f5ff] hover:underline text-sm font-mono"
                    >
                      {isDoc ? 'View PDF/PPT ↗' : 'Project Asset ↗'}
                    </a>
                  );
                }
                return null;
              })}
            </div>
            {selectedSubmission?.description && (
              <p className="text-sm text-slate-300 mt-3">{selectedSubmission.description}</p>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-[#00f5ff] uppercase tracking-widest">Scoring Parameters</h4>
            {params.length > 0 ? (
              params.map(p => (
                <div key={p.name} className="flex flex-col gap-2">
                  <label className="text-xs text-slate-400 font-mono">{p.name} (Max: {p.maxScore})</label>
                  <input 
                    type="number" 
                    min="0" 
                    max={p.maxScore}
                    value={scores[p.name] || ""}
                    onChange={(e) => handleScoreChange(p.name, Number(e.target.value))}
                    className="bg-[#020617] border border-slate-700 text-white p-2 w-full max-w-xs font-mono"
                  />
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm italic">No judging parameters configured by admin.</p>
            )}
            
            <div className="flex flex-col gap-2 pt-4 border-t border-slate-800">
              <label className="text-xs text-slate-400 font-mono">Feedback (Optional)</label>
              <textarea 
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                className="bg-[#020617] border border-slate-700 text-white p-2 w-full h-24 font-mono"
              />
            </div>

            <button 
              onClick={submitEvaluation}
              disabled={submitting || params.length === 0}
              className="mt-6 w-full py-3 bg-[rgba(0,245,255,0.1)] hover:bg-[rgba(0,245,255,0.2)] border border-[#00f5ff]/50 text-[#00f5ff] font-orbitron font-bold uppercase tracking-widest transition-all"
            >
              {submitting ? "Submitting..." : "Submit Evaluation"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {teams.length === 0 ? (
            <p className="text-slate-500 font-mono text-sm">No submissions available for judging yet.</p>
          ) : (
            <div className="grid gap-3">
              {teams.map(t => {
                const submission = getSubmission(t);
                const teamFormation = getTeamFormation(t);
                const isEvaluated = t.evaluations?.some(e => e.judgeEmail === user?.email);
                return (
                  <button 
                    key={t._id} 
                    onClick={() => handleSelectTeam(t)}
                    className={`flex justify-between items-center p-4 bg-[#020617]/50 border transition-all text-left ${
                      isEvaluated ? 'border-emerald-500/30 hover:border-emerald-500/60' : 'border-[#00f5ff]/20 hover:border-[#00f5ff]/50'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-white font-orbitron">
                        {submission?.projectName || 'Unnamed Project'}
                      </p>
                      <p className="text-xs text-slate-500 font-mono mt-1">
                        Team: {teamFormation?.teamName || 'Solo'}
                      </p>
                    </div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${
                      isEvaluated ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {isEvaluated ? 'Evaluated' : 'Pending'}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
