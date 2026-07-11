export type Member = { member_id: string; unit_name: string; owner: string; bond: string; violations: string };

export type Report = {
  report_id: string;
  reporter_id: string;
  target_id: string;
  violation_type: "NOISE" | "LITTER";
  incident_ref: string;
  evidence_url: string;
  response_url: string;
  appeal_url: string;
  status: string;
  verdict: string;
  reason: string;
  confidence: string;
  fine: string;
  compensation: string;
  treasury_fee: string;
  policy_version: string;
  appealed: string;
  finalized: string;
};

export type ActionState = { tone: "idle" | "busy" | "success" | "error"; message: string; hash?: string };
