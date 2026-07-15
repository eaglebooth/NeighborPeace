# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import typing
import json


@gl.evm.contract_interface
class _Recipient:
    class View:
        pass

    class Write:
        pass


class NeighborPeace(gl.Contract):
    member_count: u256
    report_count: u256
    policy_version: u256
    total_bonded: u256
    total_compensated: u256
    total_treasury_fees: u256
    treasury_owner: str

    member_units: TreeMap[u256, str]
    member_owners: TreeMap[u256, str]
    member_bonds: TreeMap[u256, u256]
    member_violations: TreeMap[u256, u256]
    member_id_by_owner: TreeMap[u256, u256]

    report_reporter_units: TreeMap[u256, u256]
    report_target_units: TreeMap[u256, u256]
    report_types: TreeMap[u256, str]
    report_incident_refs: TreeMap[u256, str]
    report_incident_keys: TreeMap[u256, u256]
    incident_key_registered: TreeMap[u256, u256]
    report_evidence_urls: TreeMap[u256, str]
    report_response_urls: TreeMap[u256, str]
    report_appeal_urls: TreeMap[u256, str]
    report_appeal_owners: TreeMap[u256, str]
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
    report_response_deadlines: TreeMap[u256, u256]
    report_appeal_deadlines: TreeMap[u256, u256]
    report_evidence_revisions: TreeMap[u256, u256]

    def __init__(self):
        self.member_count = u256(0)
        self.report_count = u256(0)
        self.policy_version = u256(3)
        self.total_bonded = u256(0)
        self.total_compensated = u256(0)
        self.total_treasury_fees = u256(0)
        self.treasury_owner = gl.message.sender_address.as_hex

    @gl.public.write.payable
    def register_unit(self, unit_name: str) -> typing.Any:
        bond = gl.message.value
        if len(unit_name) == 0:
            raise gl.vm.UserError("INVALID_UNIT_NAME")
        if len(unit_name) > 80:
            raise gl.vm.UserError("UNIT_NAME_TOO_LONG")
        if bond < u256(20000000000000000000):
            raise gl.vm.UserError("INSUFFICIENT_INITIAL_BOND")

        owner = gl.message.sender_address.as_hex
        owner_key = self._address_key(owner)
        if self.member_id_by_owner[owner_key] != u256(0):
            raise gl.vm.UserError("WALLET_ALREADY_REGISTERED")

        member_id = self.member_count
        self.member_units[member_id] = unit_name
        self.member_owners[member_id] = owner
        self.member_bonds[member_id] = bond
        self.member_violations[member_id] = u256(0)
        self.member_id_by_owner[owner_key] = member_id + u256(1)
        self.total_bonded = self.total_bonded + bond
        self.member_count = member_id + u256(1)
        return str(member_id)

    @gl.public.write.payable
    def deposit_bond(self, member_id: u256) -> typing.Any:
        if member_id >= self.member_count:
            raise gl.vm.UserError("INVALID_MEMBER_ID")
        if self.member_owners[member_id] != gl.message.sender_address.as_hex:
            raise gl.vm.UserError("NOT_MEMBER_OWNER")
        amount = gl.message.value
        if amount == u256(0):
            raise gl.vm.UserError("INVALID_AMOUNT")

        self.member_bonds[member_id] = self.member_bonds[member_id] + amount
        self.total_bonded = self.total_bonded + amount
        return "DEPOSITED"

    @gl.public.write
    def file_report(
        self,
        reporter_id: u256,
        target_id: u256,
        violation_type: str,
        evidence_url: str,
        incident_ref: str,
        incident_key: u256,
    ) -> typing.Any:
        if reporter_id >= self.member_count:
            return "INVALID_REPORTER_ID"
        if target_id >= self.member_count:
            return "INVALID_TARGET_ID"
        if self.member_owners[reporter_id] != gl.message.sender_address.as_hex:
            return "NOT_REPORTER_OWNER"
        if reporter_id == target_id:
            return "SELF_REPORTING_NOT_ALLOWED"
        if not self._valid_violation_type(violation_type):
            return "INVALID_VIOLATION_TYPE"
        if len(evidence_url) == 0:
            return "INVALID_EVIDENCE_URL"
        if not evidence_url.startswith("https://"):
            return "EVIDENCE_MUST_USE_HTTPS"
        if len(incident_ref) == 0:
            return "INVALID_INCIDENT_REF"
        if incident_key == u256(0):
            return "INVALID_INCIDENT_KEY"
        if len(evidence_url) > 500 or len(incident_ref) > 120:
            return "INPUT_TOO_LONG"

        if self.incident_key_registered[incident_key] == u256(1):
            return "INCIDENT_ALREADY_FILED"

        report_id = self.report_count
        self.report_reporter_units[report_id] = reporter_id
        self.report_target_units[report_id] = target_id
        self.report_types[report_id] = violation_type
        self.report_incident_refs[report_id] = incident_ref
        self.report_incident_keys[report_id] = incident_key
        self.incident_key_registered[incident_key] = u256(1)
        self.report_evidence_urls[report_id] = evidence_url
        self.report_response_urls[report_id] = ""
        self.report_appeal_urls[report_id] = ""
        self.report_statuses[report_id] = "AWAITING_RESPONSE"
        self.report_verdicts[report_id] = "UNDECIDED"
        self.report_reasons[report_id] = "Awaiting the accused unit's response or waiver."
        self.report_confidences[report_id] = u256(0)
        self.report_fines[report_id] = u256(0)
        self.report_compensations[report_id] = u256(0)
        self.report_treasury_fees[report_id] = u256(0)
        self.report_policy_versions[report_id] = self.policy_version
        self.report_appealed[report_id] = u256(0)
        self.report_finalized[report_id] = u256(0)
        self.report_response_deadlines[report_id] = gl.get_block_timestamp() + u256(86400)
        self.report_appeal_deadlines[report_id] = u256(0)
        self.report_evidence_revisions[report_id] = u256(0)
        self.report_count = report_id + u256(1)
        return str(report_id)

    @gl.public.write
    def submit_response(self, report_id: u256, response_url: str) -> typing.Any:
        if report_id >= self.report_count:
            return "INVALID_REPORT_ID"
        if self.report_statuses[report_id] != "AWAITING_RESPONSE":
            return "RESPONSE_WINDOW_CLOSED"
        if gl.get_block_timestamp() > self.report_response_deadlines[report_id]:
            return "RESPONSE_DEADLINE_PASSED"
        target_id = self.report_target_units[report_id]
        if self.member_owners[target_id] != gl.message.sender_address.as_hex:
            return "NOT_TARGET_OWNER"
        if len(response_url) == 0:
            return "INVALID_RESPONSE_URL"
        if not response_url.startswith("https://"):
            return "RESPONSE_MUST_USE_HTTPS"
        if len(response_url) > 500:
            return "RESPONSE_URL_TOO_LONG"

        self.report_response_urls[report_id] = response_url
        self.report_statuses[report_id] = "READY_FOR_REVIEW"
        self.report_reasons[report_id] = "Both parties submitted immutable evidence."
        return "RESPONSE_SUBMITTED"

    @gl.public.write
    def close_response_window(self, report_id: u256) -> typing.Any:
        if report_id >= self.report_count:
            return "INVALID_REPORT_ID"
        if self.report_statuses[report_id] != "AWAITING_RESPONSE":
            return "RESPONSE_WINDOW_ALREADY_CLOSED"
        target_id = self.report_target_units[report_id]
        reporter_id = self.report_reporter_units[report_id]
        sender = gl.message.sender_address.as_hex
        if self.member_owners[target_id] != sender:
            if gl.get_block_timestamp() <= self.report_response_deadlines[report_id]:
                return "RESPONSE_WINDOW_OPEN"
            if self.member_owners[reporter_id] != sender:
                return "NOT_CASE_PARTY"

        self.report_statuses[report_id] = "READY_FOR_REVIEW"
        self.report_reasons[report_id] = "Counter-evidence was waived or the response deadline expired."
        return "RESPONSE_WAIVED"

    @gl.public.write
    def resubmit_evidence(self, report_id: u256, new_evidence_url: str) -> typing.Any:
        if report_id >= self.report_count:
            return "INVALID_REPORT_ID"
        if self.report_statuses[report_id] != "NEEDS_EVIDENCE":
            return "EVIDENCE_NOT_REQUESTED"
        if self.report_evidence_revisions[report_id] >= u256(2):
            return "EVIDENCE_REVISION_LIMIT"
        if len(new_evidence_url) == 0 or len(new_evidence_url) > 500:
            return "INVALID_EVIDENCE_URL"
        if not new_evidence_url.startswith("https://"):
            return "EVIDENCE_MUST_USE_HTTPS"

        reporter_id = self.report_reporter_units[report_id]
        target_id = self.report_target_units[report_id]
        sender = gl.message.sender_address.as_hex
        if self.member_owners[reporter_id] == sender:
            self.report_evidence_urls[report_id] = new_evidence_url
        elif self.member_owners[target_id] == sender:
            self.report_response_urls[report_id] = new_evidence_url
        else:
            return "NOT_CASE_PARTY"

        self.report_evidence_revisions[report_id] = self.report_evidence_revisions[report_id] + u256(1)
        self.report_verdicts[report_id] = "UNDECIDED"
        self.report_reasons[report_id] = "Updated party evidence is ready for another review."
        self.report_confidences[report_id] = u256(0)
        self.report_fines[report_id] = u256(0)
        self.report_statuses[report_id] = "READY_FOR_REVIEW"
        return "EVIDENCE_RESUBMITTED"

    def _parse_ruling(self, result: str) -> typing.Any:
        try:
            data = json.loads(result)
        except Exception:
            return None
        verdict = str(data.get("verdict", "NEEDS_EVIDENCE")).upper()
        severity = str(data.get("severity", "NONE")).upper()
        reason = str(data.get("reason", "No usable jury reason was returned."))[:900]
        try:
            confidence_int = int(data.get("confidence", 0))
        except Exception:
            confidence_int = 0
        if confidence_int < 0:
            confidence_int = 0
        if confidence_int > 100:
            confidence_int = 100
        if verdict not in ("GUILTY", "NOT_GUILTY", "NEEDS_EVIDENCE"):
            verdict = "NEEDS_EVIDENCE"
        if severity not in ("LOW", "MEDIUM", "HIGH"):
            severity = "NONE"
        if verdict == "GUILTY" and confidence_int < 70:
            verdict = "NEEDS_EVIDENCE"
        if verdict != "GUILTY":
            severity = "NONE"
        return (verdict, severity, reason, confidence_int)

    def _fine_for(self, verdict: str, severity: str) -> u256:
        if verdict == "GUILTY" and severity == "LOW":
            return u256(5000000000000000000)
        if verdict == "GUILTY" and severity == "MEDIUM":
            return u256(10000000000000000000)
        if verdict == "GUILTY" and severity == "HIGH":
            return u256(15000000000000000000)
        return u256(0)

    def _valid_violation_type(self, violation_type: str) -> typing.Any:
        return (
            violation_type == "NOISE"
            or violation_type == "LITTER"
            or violation_type == "PARKING"
            or violation_type == "PET"
            or violation_type == "SMOKE_ODOR"
            or violation_type == "PROPERTY_DAMAGE"
            or violation_type == "SAFETY_OBSTRUCTION"
            or violation_type == "COMMON_AREA_MISUSE"
        )

    def _address_key(self, address_hex: str) -> u256:
        return u256(int(address_hex, 16))

    def _policy_for(self, violation_type: str) -> str:
        if violation_type == "NOISE":
            return "Require credible time, sound-level or repeated-disturbance evidence and reliable attribution to the accused unit."
        if violation_type == "LITTER":
            return "Require evidence of waste in a shared area and reliable attribution to the accused unit."
        if violation_type == "PARKING":
            return "Require location and timing evidence showing unauthorized parking or blocked resident, emergency, or accessibility access."
        if violation_type == "PET":
            return "Require evidence of repeated nuisance, unsanitary conditions, leash/control failure, or a credible safety risk attributable to the unit."
        if violation_type == "SMOKE_ODOR":
            return "Require repeated or independently supported smoke or odor intrusion beyond ordinary incidental exposure and attributable to the unit."
        if violation_type == "PROPERTY_DAMAGE":
            return "Require before/after, witness, repair, or incident evidence tying damage to shared property to the accused unit."
        if violation_type == "SAFETY_OBSTRUCTION":
            return "Require evidence that a fire exit, corridor, alarm, utility access, or other safety route was materially obstructed or impaired."
        return "Require evidence that reserved shared facilities were materially misused, monopolized, contaminated, or left unusable, with reliable attribution."

    @gl.public.write
    def evaluate_report(self, report_id: u256) -> typing.Any:
        if report_id >= self.report_count:
            return "INVALID_REPORT_ID"
        if self.report_statuses[report_id] != "READY_FOR_REVIEW":
            return "REPORT_NOT_READY"

        target_id = self.report_target_units[report_id]
        target_unit = self.member_units[target_id]
        violation_type = self.report_types[report_id]
        violation_policy = self._policy_for(violation_type)
        evidence_url = self.report_evidence_urls[report_id]
        response_url = self.report_response_urls[report_id]

        def run_review() -> str:
            try:
                complaint = gl.nondet.web.get(evidence_url)
                complaint_evidence = complaint.body.decode("utf-8")[:4000]
            except Exception:
                return json.dumps({"verdict": "NEEDS_EVIDENCE", "severity": "NONE", "confidence": 0, "reason": "Complaint evidence was unreadable."}, sort_keys=True, separators=(",", ":"))
            response_evidence = "THE ACCUSED UNIT WAIVED A RESPONSE"
            if len(response_url) > 0:
                try:
                    response = gl.nondet.web.get(response_url)
                    response_evidence = response.body.decode("utf-8")[:4000]
                except Exception:
                    return json.dumps({"verdict": "NEEDS_EVIDENCE", "severity": "NONE", "confidence": 0, "reason": "Counter-evidence was unreadable."}, sort_keys=True, separators=(",", ":"))
            prompt = f"""You are an impartial GenLayer neighborhood mediation jury.
Policy version: 3
Accused unit: {target_unit}
Violation type: {violation_type}

COMPLAINT EVIDENCE:
{complaint_evidence}

ACCUSED RESPONSE:
{response_evidence}

APPLICABLE POLICY:
{violation_policy}
Distinguish a material violation from ordinary residential inconvenience, one-off accidents, reasonable use, or unsupported allegations.
GUILTY requires confidence >= 70. Weak, contradictory, or unreadable evidence requires NEEDS_EVIDENCE.
Return ONLY JSON with verdict, severity, confidence, and one concise reason.
Verdict: GUILTY|NOT_GUILTY|NEEDS_EVIDENCE. Severity: NONE|LOW|MEDIUM|HIGH."""
            return gl.nondet.exec_prompt(prompt)

        principle = "Verdict and severity must match exactly because severity determines a GEN settlement. Attribution and the confidence threshold outcome must match. Reason wording may differ but must rely on compatible evidence."
        parsed = self._parse_ruling(gl.eq_principle.prompt_comparative(run_review, principle))
        if parsed is None:
            return "INVALID_AI_RESPONSE"
        verdict, severity, reason, confidence_int = parsed
        self.report_verdicts[report_id] = verdict
        self.report_reasons[report_id] = reason
        self.report_confidences[report_id] = u256(confidence_int)
        self.report_fines[report_id] = self._fine_for(verdict, severity)
        self.report_statuses[report_id] = "NEEDS_EVIDENCE" if verdict == "NEEDS_EVIDENCE" else "RULING_PROPOSED"
        if verdict != "NEEDS_EVIDENCE":
            self.report_appeal_deadlines[report_id] = gl.get_block_timestamp() + u256(86400)
        return self.get_report(report_id)

    @gl.public.write
    def appeal_report(self, report_id: u256, appeal_url: str) -> typing.Any:
        if report_id >= self.report_count:
            return "INVALID_REPORT_ID"
        if self.report_statuses[report_id] != "RULING_PROPOSED":
            return "RULING_NOT_APPEALABLE"
        if self.report_appealed[report_id] != u256(0):
            return "APPEAL_ALREADY_USED"
        if gl.get_block_timestamp() > self.report_appeal_deadlines[report_id]:
            return "APPEAL_WINDOW_CLOSED"
        reporter_id = self.report_reporter_units[report_id]
        target_id = self.report_target_units[report_id]
        sender = gl.message.sender_address.as_hex
        if self.member_owners[reporter_id] != sender and self.member_owners[target_id] != sender:
            return "NOT_CASE_PARTY"
        if len(appeal_url) == 0:
            return "INVALID_APPEAL_URL"
        if not appeal_url.startswith("https://"):
            return "APPEAL_MUST_USE_HTTPS"
        if len(appeal_url) > 500:
            return "APPEAL_URL_TOO_LONG"

        self.report_appeal_urls[report_id] = appeal_url
        self.report_appeal_owners[report_id] = sender
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
        violation_policy = self._policy_for(violation_type)
        original_verdict = self.report_verdicts[report_id]
        original_reason = self.report_reasons[report_id]
        evidence_url = self.report_evidence_urls[report_id]
        response_url = self.report_response_urls[report_id]
        appeal_url = self.report_appeal_urls[report_id]

        def run_appeal() -> str:
            try:
                complaint = gl.nondet.web.get(evidence_url).body.decode("utf-8")[:3000]
                response = "NO RESPONSE"
                if len(response_url) > 0:
                    response = gl.nondet.web.get(response_url).body.decode("utf-8")[:3000]
                appeal = gl.nondet.web.get(appeal_url).body.decode("utf-8")[:3000]
            except Exception:
                return json.dumps({"verdict": "NEEDS_EVIDENCE", "severity": "NONE", "confidence": 0, "reason": "The complete appeal record could not be read."}, sort_keys=True, separators=(",", ":"))
            prompt = f"""You are the NeighborPeace appeal jury. Read the complete record.
Violation: {violation_type}
Applicable policy: {violation_policy}
Original verdict: {original_verdict}
Original reason: {original_reason}
COMPLAINT: {complaint}
COUNTER-EVIDENCE: {response}
NEW APPEAL EVIDENCE: {appeal}
Apply the original policy. GUILTY requires confidence >= 70. Return ONLY JSON with verdict, severity, confidence, and one concise reason."""
            return gl.nondet.exec_prompt(prompt)

        principle = "Final verdict and severity must match exactly because they control settlement. Attribution and confidence threshold outcome must match. Reason wording may differ but must be grounded in the full original and appeal record."
        parsed = self._parse_ruling(gl.eq_principle.prompt_comparative(run_appeal, principle))
        if parsed is None:
            return "INVALID_AI_RESPONSE"
        verdict, severity, reason, confidence_int = parsed
        self.report_verdicts[report_id] = verdict
        self.report_reasons[report_id] = reason
        self.report_confidences[report_id] = u256(confidence_int)
        self.report_fines[report_id] = self._fine_for(verdict, severity)
        self.report_statuses[report_id] = "NEEDS_EVIDENCE" if verdict == "NEEDS_EVIDENCE" else "APPEAL_RULING"
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
        if status == "RULING_PROPOSED" and gl.get_block_timestamp() <= self.report_appeal_deadlines[report_id]:
            return "APPEAL_WINDOW_OPEN"

        reporter_id = self.report_reporter_units[report_id]
        target_id = self.report_target_units[report_id]
        fine = self.report_fines[report_id]
        compensation = u256(0)
        treasury_fee = u256(0)
        if self.report_verdicts[report_id] == "GUILTY":
            target_bond = self.member_bonds[target_id]
            if fine > target_bond:
                fine = target_bond
            if fine == u256(5000000000000000000):
                compensation = u256(4000000000000000000)
                treasury_fee = u256(1000000000000000000)
            elif fine == u256(10000000000000000000):
                compensation = u256(8000000000000000000)
                treasury_fee = u256(2000000000000000000)
            elif fine == u256(15000000000000000000):
                compensation = u256(12000000000000000000)
                treasury_fee = u256(3000000000000000000)
            else:
                compensation = fine

            self.member_bonds[target_id] = target_bond - fine
            self.total_bonded = self.total_bonded - fine
            self.total_compensated = self.total_compensated + compensation
            self.total_treasury_fees = self.total_treasury_fees + treasury_fee
            self.member_violations[target_id] = self.member_violations[target_id] + u256(1)

        self.report_fines[report_id] = fine
        self.report_compensations[report_id] = compensation
        self.report_treasury_fees[report_id] = treasury_fee
        self.report_finalized[report_id] = u256(1)
        self.report_statuses[report_id] = "FINALIZED"

        if compensation > u256(0):
            _Recipient(Address(self.member_owners[reporter_id])).emit_transfer(value=compensation)
        if treasury_fee > u256(0):
            _Recipient(Address(self.treasury_owner)).emit_transfer(value=treasury_fee)
        return self.get_report(report_id)

    @gl.public.view
    def get_member_count(self) -> u256:
        return self.member_count

    @gl.public.view
    def get_report_count(self) -> u256:
        return self.report_count

    @gl.public.view
    def get_contract_state(self) -> str:
        return json.dumps({"contract_balance": str(self.balance), "member_count": str(self.member_count), "policy_version": str(self.policy_version), "report_count": str(self.report_count), "total_bonded": str(self.total_bonded), "total_compensated": str(self.total_compensated), "total_treasury_fees": str(self.total_treasury_fees), "treasury_owner": self.treasury_owner}, sort_keys=True, separators=(",", ":"))

    @gl.public.view
    def get_member_id_by_owner(self, owner_address: str) -> str:
        encoded_id = self.member_id_by_owner[self._address_key(Address(owner_address).as_hex)]
        if encoded_id == u256(0):
            return ""
        return str(encoded_id - u256(1))

    @gl.public.view
    def get_member(self, member_id: u256) -> str:
        if member_id >= self.member_count:
            return json.dumps({"error": "INVALID_MEMBER_ID"}, sort_keys=True, separators=(",", ":"))
        return json.dumps({"bond": str(self.member_bonds[member_id]), "member_id": str(member_id), "owner": self.member_owners[member_id], "unit_name": self.member_units[member_id], "violations": str(self.member_violations[member_id])}, sort_keys=True, separators=(",", ":"))

    @gl.public.view
    def get_report(self, report_id: u256) -> str:
        if report_id >= self.report_count:
            return json.dumps({"error": "INVALID_REPORT_ID"}, sort_keys=True, separators=(",", ":"))
        return json.dumps({"appeal_deadline": str(self.report_appeal_deadlines[report_id]), "appeal_owner": self.report_appeal_owners[report_id], "appeal_url": self.report_appeal_urls[report_id], "appealed": str(self.report_appealed[report_id]), "compensation": str(self.report_compensations[report_id]), "confidence": str(self.report_confidences[report_id]), "evidence_revisions": str(self.report_evidence_revisions[report_id]), "evidence_url": self.report_evidence_urls[report_id], "finalized": str(self.report_finalized[report_id]), "fine": str(self.report_fines[report_id]), "incident_key": str(self.report_incident_keys[report_id]), "incident_ref": self.report_incident_refs[report_id], "policy_version": str(self.report_policy_versions[report_id]), "reason": self.report_reasons[report_id], "report_id": str(report_id), "reporter_id": str(self.report_reporter_units[report_id]), "response_deadline": str(self.report_response_deadlines[report_id]), "response_url": self.report_response_urls[report_id], "status": self.report_statuses[report_id], "target_id": str(self.report_target_units[report_id]), "treasury_fee": str(self.report_treasury_fees[report_id]), "verdict": self.report_verdicts[report_id], "violation_type": self.report_types[report_id]}, sort_keys=True, separators=(",", ":"))
