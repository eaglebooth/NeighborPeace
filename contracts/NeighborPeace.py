# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import typing
import json


class NeighborPeace(gl.Contract):
    member_count: u256
    report_count: u256
    treasury_balance: u256
    policy_version: u256

    member_units: TreeMap[u256, str]
    member_owners: TreeMap[u256, str]
    member_bonds: TreeMap[u256, u256]
    member_violations: TreeMap[u256, u256]

    report_reporter_units: TreeMap[u256, u256]
    report_target_units: TreeMap[u256, u256]
    report_types: TreeMap[u256, str]
    report_incident_refs: TreeMap[u256, str]
    report_evidence_urls: TreeMap[u256, str]
    report_response_urls: TreeMap[u256, str]
    report_appeal_urls: TreeMap[u256, str]
    report_statuses: TreeMap[u256, str]
    report_verdicts: TreeMap[u256, str]
    report_reasons: TreeMap[u256, str]
    report_confidences: TreeMap[u256, u256]
    report_fines: TreeMap[u256, u256]
    report_compensations: TreeMap[u256, u256]
    report_treasury_fees: TreeMap[u256, u256]
    report_policy_versions: TreeMap[u256, u256]
    report_appealed: TreeMap[u256, u256]
    report_finalized: TreeMap[u256, u256]

    def __init__(self):
        self.member_count = u256(0)
        self.report_count = u256(0)
        self.treasury_balance = u256(0)
        self.policy_version = u256(1)

    @gl.public.write
    def register_unit(self, unit_name: str, initial_bond: u256) -> typing.Any:
        if len(unit_name) == 0:
            return "INVALID_UNIT_NAME"
        if len(unit_name) > 80:
            return "UNIT_NAME_TOO_LONG"
        if initial_bond < u256(50):
            return "INSUFFICIENT_INITIAL_BOND"

        owner = gl.message.sender_address
        i = u256(0)
        while i < self.member_count:
            if self.member_units[i] == unit_name:
                return "UNIT_ALREADY_REGISTERED"
            if self.member_owners[i] == owner:
                return "WALLET_ALREADY_REGISTERED"
            i = i + u256(1)

        member_id = self.member_count
        self.member_units[member_id] = unit_name
        self.member_owners[member_id] = owner
        self.member_bonds[member_id] = initial_bond
        self.member_violations[member_id] = u256(0)
        self.member_count = member_id + u256(1)
        return str(member_id)

    @gl.public.write
    def deposit_bond(self, member_id: u256, amount: u256) -> typing.Any:
        if member_id >= self.member_count:
            return "INVALID_MEMBER_ID"
        if self.member_owners[member_id] != gl.message.sender_address:
            return "NOT_MEMBER_OWNER"
        if amount == u256(0):
            return "INVALID_AMOUNT"

        self.member_bonds[member_id] = self.member_bonds[member_id] + amount
        return "DEPOSITED"

    @gl.public.write
    def file_report(
        self,
        reporter_id: u256,
        target_id: u256,
        violation_type: str,
        evidence_url: str,
        incident_ref: str,
    ) -> typing.Any:
        if reporter_id >= self.member_count:
            return "INVALID_REPORTER_ID"
        if target_id >= self.member_count:
            return "INVALID_TARGET_ID"
        if self.member_owners[reporter_id] != gl.message.sender_address:
            return "NOT_REPORTER_OWNER"
        if reporter_id == target_id:
            return "SELF_REPORTING_NOT_ALLOWED"
        if violation_type != "NOISE" and violation_type != "LITTER":
            return "INVALID_VIOLATION_TYPE"
        if len(evidence_url) == 0:
            return "INVALID_EVIDENCE_URL"
        if len(incident_ref) == 0:
            return "INVALID_INCIDENT_REF"
        if len(evidence_url) > 500 or len(incident_ref) > 120:
            return "INPUT_TOO_LONG"

        i = u256(0)
        while i < self.report_count:
            if self.report_incident_refs[i] == incident_ref:
                return "INCIDENT_ALREADY_FILED"
            i = i + u256(1)

        report_id = self.report_count
        self.report_reporter_units[report_id] = reporter_id
        self.report_target_units[report_id] = target_id
        self.report_types[report_id] = violation_type
        self.report_incident_refs[report_id] = incident_ref
        self.report_evidence_urls[report_id] = evidence_url
        self.report_response_urls[report_id] = ""
        self.report_appeal_urls[report_id] = ""
        self.report_statuses[report_id] = "AWAITING_RESPONSE"
        self.report_verdicts[report_id] = "UNDECIDED"
        self.report_reasons[report_id] = "Awaiting the accused unit's response."
        self.report_confidences[report_id] = u256(0)
        self.report_fines[report_id] = u256(0)
        self.report_compensations[report_id] = u256(0)
        self.report_treasury_fees[report_id] = u256(0)
        self.report_policy_versions[report_id] = self.policy_version
        self.report_appealed[report_id] = u256(0)
        self.report_finalized[report_id] = u256(0)
        self.report_count = report_id + u256(1)
        return str(report_id)

    @gl.public.write
    def submit_response(self, report_id: u256, response_url: str) -> typing.Any:
        if report_id >= self.report_count:
            return "INVALID_REPORT_ID"
        if self.report_statuses[report_id] != "AWAITING_RESPONSE":
            return "RESPONSE_WINDOW_CLOSED"
        target_id = self.report_target_units[report_id]
        if self.member_owners[target_id] != gl.message.sender_address:
            return "NOT_TARGET_OWNER"
        if len(response_url) == 0:
            return "INVALID_RESPONSE_URL"
        if len(response_url) > 500:
            return "RESPONSE_URL_TOO_LONG"

        self.report_response_urls[report_id] = response_url
        self.report_statuses[report_id] = "READY_FOR_REVIEW"
        self.report_reasons[report_id] = "Both parties submitted evidence. Ready for AI review."
        return "RESPONSE_SUBMITTED"

    @gl.public.write
    def close_response_window(self, report_id: u256) -> typing.Any:
        if report_id >= self.report_count:
            return "INVALID_REPORT_ID"
        if self.report_statuses[report_id] != "AWAITING_RESPONSE":
            return "RESPONSE_WINDOW_ALREADY_CLOSED"
        reporter_id = self.report_reporter_units[report_id]
        if self.member_owners[reporter_id] != gl.message.sender_address:
            return "NOT_REPORTER_OWNER"

        self.report_statuses[report_id] = "READY_FOR_REVIEW"
        self.report_reasons[report_id] = "Response window closed without counter-evidence."
        return "READY_FOR_REVIEW"

    @gl.public.write
    def evaluate_report(self, report_id: u256) -> typing.Any:
        if report_id >= self.report_count:
            return "INVALID_REPORT_ID"
        if self.report_statuses[report_id] != "READY_FOR_REVIEW":
            return "REPORT_NOT_READY"

        target_id = self.report_target_units[report_id]
        violation_type = self.report_types[report_id]
        target_unit = self.member_units[target_id]
        evidence_url = self.report_evidence_urls[report_id]
        response_url = self.report_response_urls[report_id]

        def run_review() -> str:
            complaint_evidence = ""
            response_evidence = "NO_RESPONSE_SUBMITTED"
            try:
                complaint = gl.nondet.web.get(evidence_url)
                complaint_evidence = complaint.body.decode("utf-8")[:4000]
            except Exception:
                return json.dumps(
                    {
                        "verdict": "NEEDS_EVIDENCE",
                        "severity": "NONE",
                        "confidence": 0,
                        "reason": "The complaint evidence URL could not be read.",
                    },
                    sort_keys=True,
                    separators=(",", ":"),
                )

            if len(response_url) > 0:
                try:
                    response = gl.nondet.web.get(response_url)
                    response_evidence = response.body.decode("utf-8")[:4000]
                except Exception:
                    response_evidence = "RESPONSE_URL_UNREADABLE"

            prompt = f"""You are an impartial GenLayer neighborhood mediation jury.

Policy version: 1
Accused unit: {target_unit}
Violation type: {violation_type}

COMPLAINT EVIDENCE:
{complaint_evidence}

ACCUSED RESPONSE:
{response_evidence}

Apply these rules:
- NOISE is substantiated only when credible evidence shows sound above 70 dB after 10:00 PM and attributes it to the accused unit.
- LITTER is substantiated only when credible evidence shows litter in a shared area and directly attributes it to the accused unit.
- GUILTY requires reliable attribution and a confidence of at least 70.
- NOT_GUILTY means the evidence affirmatively fails to establish the violation.
- NEEDS_EVIDENCE is required for unreadable, missing, contradictory, or weak evidence.
- Severity is LOW, MEDIUM, or HIGH only for GUILTY; otherwise NONE.

Respond with ONLY this JSON, no markdown:
{{
  "verdict": "GUILTY|NOT_GUILTY|NEEDS_EVIDENCE",
  "severity": "NONE|LOW|MEDIUM|HIGH",
  "confidence": 0,
  "reason": "one concise sentence identifying the decisive evidence"
}}"""
            return gl.nondet.exec_prompt(prompt)

        principle = """Two NeighborPeace rulings are equivalent when they reach the same substantive verdict
among GUILTY, NOT_GUILTY, or NEEDS_EVIDENCE; agree on whether the accused unit is reliably attributed to the
incident; use the same severity or an adjacent severity band that produces the same settlement bucket; and have
similar confidence bands. Ignore wording, punctuation, JSON key order, and harmless phrasing differences in the
reason. Reject equivalence if one ruling penalizes the accused while the other does not, if they disagree about
attribution, or if their severity changes the proposed fine."""

        result = gl.eq_principle.prompt_comparative(run_review, principle)
        try:
            data = json.loads(result)
        except Exception:
            return "INVALID_AI_RESPONSE"

        verdict = str(data.get("verdict", "NEEDS_EVIDENCE")).upper()
        severity = str(data.get("severity", "NONE")).upper()
        reason = str(data.get("reason", "The jury did not provide a usable reason."))[:900]
        try:
            confidence_int = int(data.get("confidence", 0))
        except Exception:
            confidence_int = 0
        if confidence_int < 0:
            confidence_int = 0
        if confidence_int > 100:
            confidence_int = 100

        if verdict != "GUILTY" and verdict != "NOT_GUILTY" and verdict != "NEEDS_EVIDENCE":
            verdict = "NEEDS_EVIDENCE"
        if severity != "LOW" and severity != "MEDIUM" and severity != "HIGH":
            severity = "NONE"
        if verdict == "GUILTY" and confidence_int < 70:
            verdict = "NEEDS_EVIDENCE"
            severity = "NONE"
        if verdict != "GUILTY":
            severity = "NONE"

        fine = u256(0)
        if verdict == "GUILTY" and severity == "LOW":
            fine = u256(25)
        if verdict == "GUILTY" and severity == "MEDIUM":
            fine = u256(50)
        if verdict == "GUILTY" and severity == "HIGH":
            fine = u256(75)

        self.report_verdicts[report_id] = verdict
        self.report_reasons[report_id] = reason
        self.report_confidences[report_id] = u256(confidence_int)
        self.report_fines[report_id] = fine
        if verdict == "NEEDS_EVIDENCE":
            self.report_statuses[report_id] = "NEEDS_EVIDENCE"
        else:
            self.report_statuses[report_id] = "RULING_PROPOSED"
        return self.get_report(report_id)

    @gl.public.write
    def appeal_report(self, report_id: u256, appeal_url: str) -> typing.Any:
        if report_id >= self.report_count:
            return "INVALID_REPORT_ID"
        if self.report_statuses[report_id] != "RULING_PROPOSED":
            return "RULING_NOT_APPEALABLE"
        if self.report_appealed[report_id] != u256(0):
            return "APPEAL_ALREADY_USED"
        reporter_id = self.report_reporter_units[report_id]
        target_id = self.report_target_units[report_id]
        sender = gl.message.sender_address
        if self.member_owners[reporter_id] != sender and self.member_owners[target_id] != sender:
            return "NOT_CASE_PARTY"
        if len(appeal_url) == 0:
            return "INVALID_APPEAL_URL"
        if len(appeal_url) > 500:
            return "APPEAL_URL_TOO_LONG"

        self.report_appeal_urls[report_id] = appeal_url
        self.report_appealed[report_id] = u256(1)
        self.report_statuses[report_id] = "APPEAL_PENDING"
        return "APPEAL_OPENED"

    @gl.public.write
    def evaluate_appeal(self, report_id: u256) -> typing.Any:
        if report_id >= self.report_count:
            return "INVALID_REPORT_ID"
        if self.report_statuses[report_id] != "APPEAL_PENDING":
            return "APPEAL_NOT_PENDING"

        violation_type = self.report_types[report_id]
        original_verdict = self.report_verdicts[report_id]
        original_reason = self.report_reasons[report_id]
        appeal_url = self.report_appeal_urls[report_id]

        def run_appeal() -> str:
            try:
                response = gl.nondet.web.get(appeal_url)
                appeal_evidence = response.body.decode("utf-8")[:4000]
            except Exception:
                return json.dumps(
                    {
                        "verdict": "NEEDS_EVIDENCE",
                        "severity": "NONE",
                        "confidence": 0,
                        "reason": "The appeal evidence URL could not be read.",
                    },
                    sort_keys=True,
                    separators=(",", ":"),
                )

            prompt = f"""You are the NeighborPeace appeal jury. Reconsider the original ruling using new evidence.

Violation type: {violation_type}
Original verdict: {original_verdict}
Original reason: {original_reason}
NEW APPEAL EVIDENCE:
{appeal_evidence}

Use the same 70 dB after 10:00 PM rule for NOISE and direct attribution rule for LITTER.
Uphold or reverse based on substantive new evidence. GUILTY requires confidence >= 70.

Respond with ONLY this JSON, no markdown:
{{
  "verdict": "GUILTY|NOT_GUILTY|NEEDS_EVIDENCE",
  "severity": "NONE|LOW|MEDIUM|HIGH",
  "confidence": 0,
  "reason": "one concise sentence explaining whether the new evidence changes the ruling"
}}"""
            return gl.nondet.exec_prompt(prompt)

        principle = """Two appeal rulings are equivalent when they agree on whether the original ruling is
upheld or reversed, the final verdict, the evidence attribution, and the settlement-producing severity bucket.
Confidence must be in a similar band. Ignore wording and JSON formatting differences. Reject equivalence when one
ruling penalizes the accused and the other clears them, or when the proposed fine changes."""

        result = gl.eq_principle.prompt_comparative(run_appeal, principle)
        try:
            data = json.loads(result)
        except Exception:
            return "INVALID_AI_RESPONSE"

        verdict = str(data.get("verdict", "NEEDS_EVIDENCE")).upper()
        severity = str(data.get("severity", "NONE")).upper()
        reason = str(data.get("reason", "The appeal jury did not provide a usable reason."))[:900]
        try:
            confidence_int = int(data.get("confidence", 0))
        except Exception:
            confidence_int = 0
        if confidence_int < 0:
            confidence_int = 0
        if confidence_int > 100:
            confidence_int = 100

        if verdict != "GUILTY" and verdict != "NOT_GUILTY" and verdict != "NEEDS_EVIDENCE":
            verdict = "NEEDS_EVIDENCE"
        if severity != "LOW" and severity != "MEDIUM" and severity != "HIGH":
            severity = "NONE"
        if verdict == "GUILTY" and confidence_int < 70:
            verdict = "NEEDS_EVIDENCE"
            severity = "NONE"
        if verdict != "GUILTY":
            severity = "NONE"

        fine = u256(0)
        if verdict == "GUILTY" and severity == "LOW":
            fine = u256(25)
        if verdict == "GUILTY" and severity == "MEDIUM":
            fine = u256(50)
        if verdict == "GUILTY" and severity == "HIGH":
            fine = u256(75)

        self.report_verdicts[report_id] = verdict
        self.report_reasons[report_id] = reason
        self.report_confidences[report_id] = u256(confidence_int)
        self.report_fines[report_id] = fine
        if verdict == "NEEDS_EVIDENCE":
            self.report_statuses[report_id] = "NEEDS_EVIDENCE"
        else:
            self.report_statuses[report_id] = "APPEAL_RULING"
        return self.get_report(report_id)

    @gl.public.write
    def finalize_report(self, report_id: u256) -> typing.Any:
        if report_id >= self.report_count:
            return "INVALID_REPORT_ID"
        status = self.report_statuses[report_id]
        if status != "RULING_PROPOSED" and status != "APPEAL_RULING":
            return "RULING_NOT_FINAL"
        if self.report_finalized[report_id] != u256(0):
            return "ALREADY_FINALIZED"

        reporter_id = self.report_reporter_units[report_id]
        target_id = self.report_target_units[report_id]
        fine = self.report_fines[report_id]
        compensation = u256(0)
        treasury_fee = u256(0)

        if self.report_verdicts[report_id] == "GUILTY":
            target_bond = self.member_bonds[target_id]
            if fine > target_bond:
                fine = target_bond
                compensation = target_bond
            else:
                if fine == u256(25):
                    compensation = u256(20)
                    treasury_fee = u256(5)
                if fine == u256(50):
                    compensation = u256(40)
                    treasury_fee = u256(10)
                if fine == u256(75):
                    compensation = u256(60)
                    treasury_fee = u256(15)

            self.member_bonds[target_id] = target_bond - fine
            self.member_bonds[reporter_id] = self.member_bonds[reporter_id] + compensation
            self.treasury_balance = self.treasury_balance + treasury_fee
            self.member_violations[target_id] = self.member_violations[target_id] + u256(1)

        self.report_fines[report_id] = fine
        self.report_compensations[report_id] = compensation
        self.report_treasury_fees[report_id] = treasury_fee
        self.report_finalized[report_id] = u256(1)
        self.report_statuses[report_id] = "FINALIZED"
        return self.get_report(report_id)

    @gl.public.view
    def get_member_count(self) -> u256:
        return self.member_count

    @gl.public.view
    def get_report_count(self) -> u256:
        return self.report_count

    @gl.public.view
    def get_treasury_balance(self) -> u256:
        return self.treasury_balance

    @gl.public.view
    def get_member_id_by_owner(self, owner_address: str) -> str:
        i = u256(0)
        while i < self.member_count:
            if self.member_owners[i] == owner_address:
                return str(i)
            i = i + u256(1)
        return ""

    @gl.public.view
    def get_member(self, member_id: u256) -> str:
        if member_id >= self.member_count:
            return json.dumps({"error": "INVALID_MEMBER_ID"}, sort_keys=True, separators=(",", ":"))
        obj = {
            "member_id": str(member_id),
            "unit_name": self.member_units[member_id],
            "owner": self.member_owners[member_id],
            "bond": str(self.member_bonds[member_id]),
            "violations": str(self.member_violations[member_id]),
        }
        return json.dumps(obj, sort_keys=True, separators=(",", ":"))

    @gl.public.view
    def get_report(self, report_id: u256) -> str:
        if report_id >= self.report_count:
            return json.dumps({"error": "INVALID_REPORT_ID"}, sort_keys=True, separators=(",", ":"))
        obj = {
            "report_id": str(report_id),
            "reporter_id": str(self.report_reporter_units[report_id]),
            "target_id": str(self.report_target_units[report_id]),
            "violation_type": self.report_types[report_id],
            "incident_ref": self.report_incident_refs[report_id],
            "evidence_url": self.report_evidence_urls[report_id],
            "response_url": self.report_response_urls[report_id],
            "appeal_url": self.report_appeal_urls[report_id],
            "status": self.report_statuses[report_id],
            "verdict": self.report_verdicts[report_id],
            "reason": self.report_reasons[report_id],
            "confidence": str(self.report_confidences[report_id]),
            "fine": str(self.report_fines[report_id]),
            "compensation": str(self.report_compensations[report_id]),
            "treasury_fee": str(self.report_treasury_fees[report_id]),
            "policy_version": str(self.report_policy_versions[report_id]),
            "appealed": str(self.report_appealed[report_id]),
            "finalized": str(self.report_finalized[report_id]),
        }
        return json.dumps(obj, sort_keys=True, separators=(",", ":"))
