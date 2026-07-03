# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import typing
import json

class NeighborPeace(gl.Contract):
    member_count: u256
    report_count: u256
    treasury_balance: u256
    
    member_units: TreeMap[u256, str]
    member_owners: TreeMap[u256, str]
    member_bonds: TreeMap[u256, u256]
    member_violations: TreeMap[u256, u256]
    
    report_reporter_units: TreeMap[u256, u256]
    report_target_units: TreeMap[u256, u256]
    report_types: TreeMap[u256, str]
    report_evidence_urls: TreeMap[u256, str]
    report_statuses: TreeMap[u256, str]
    report_reasons: TreeMap[u256, str]
    report_confidences: TreeMap[u256, u256]

    def __init__(self):
        self.member_count = u256(0)
        self.report_count = u256(0)
        self.treasury_balance = u256(0)

    @gl.public.write
    def register_unit(self, unit_name: str, owner_address: str, initial_deposit: u256) -> typing.Any:
        if len(unit_name) == 0:
            return "INVALID_UNIT_NAME"
        if len(owner_address) == 0:
            return "INVALID_OWNER_ADDRESS"
        if initial_deposit < u256(50):
            return "INSUFFICIENT_INITIAL_BOND"
            
        # Check duplicate unit_name
        i = u256(0)
        while i < self.member_count:
            if self.member_units[i] == unit_name:
                return "ALREADY_REGISTERED"
            i = i + u256(1)
            
        member_id = self.member_count
        self.member_units[member_id] = unit_name
        self.member_owners[member_id] = owner_address
        self.member_bonds[member_id] = initial_deposit
        self.member_violations[member_id] = u256(0)
        
        self.member_count = member_id + u256(1)
        return "REGISTERED"

    @gl.public.write
    def deposit_bond(self, member_id: u256, amount: u256) -> typing.Any:
        if member_id >= self.member_count:
            return "INVALID_MEMBER_ID"
        if amount == u256(0):
            return "INVALID_AMOUNT"
        
        self.member_bonds[member_id] = self.member_bonds[member_id] + amount
        return "DEPOSITED"

    @gl.public.write
    def file_report(self, reporter_id: u256, target_id: u256, violation_type: str, evidence_url: str) -> typing.Any:
        if reporter_id >= self.member_count:
            return "INVALID_REPORTER_ID"
        if target_id >= self.member_count:
            return "INVALID_TARGET_ID"
        if reporter_id == target_id:
            return "SELF_REPORTING_NOT_ALLOWED"
        if violation_type != "NOISE" and violation_type != "LITTER":
            return "INVALID_VIOLATION_TYPE"
        if len(evidence_url) == 0:
            return "INVALID_EVIDENCE_URL"
            
        report_id = self.report_count
        self.report_reporter_units[report_id] = reporter_id
        self.report_target_units[report_id] = target_id
        self.report_types[report_id] = violation_type
        self.report_evidence_urls[report_id] = evidence_url
        self.report_statuses[report_id] = "PENDING"
        self.report_reasons[report_id] = "Report filed. Awaiting subjective AI adjudication."
        self.report_confidences[report_id] = u256(0)
        
        self.report_count = report_id + u256(1)
        return str(report_id)

    @gl.public.write
    def evaluate_report(self, report_id: u256) -> typing.Any:
        if report_id >= self.report_count:
            return "INVALID_REPORT_ID"
        if self.report_statuses[report_id] != "PENDING":
            return "ALREADY_EVALUATED"
            
        reporter_id = self.report_reporter_units[report_id]
        target_id = self.report_target_units[report_id]
        v_type = self.report_types[report_id]
        evidence_url = self.report_evidence_urls[report_id]
        
        target_unit_name = self.member_units[target_id]
        
        def run() -> str:
            web_data = ""
            try:
                resp = gl.nondet.web.get(evidence_url)
                web_data = resp.body.decode("utf-8")[:4000]
            except Exception as e:
                web_data = f"Failed to fetch evidence URL due to error: {str(e)}"
                
            prompt = f"""
You are the Neighborhood Subjective Arbitrator, checking a resident dispute.
Report Details:
- Violation Type: {v_type}
- Accused Resident Unit: {target_unit_name}
- Evidence Text/Log Content:
---
{web_data}
---

Decide if the accused unit is GUILTY or NOT_GUILTY based on the evidence rules:
1. For NOISE: Check if the log/proof confirms sound levels exceeded 70dB and occurred after 10:00 PM.
2. For LITTER: Check if the text/log/metadata/photo description confirms public littering and clearly attributes it to unit {target_unit_name} (e.g. name, mail envelope, unit tag, or visual log).

Respond with ONLY this JSON format, no other text:
{{{{
  "verdict": "GUILTY" or "NOT_GUILTY",
  "confidence": <integer between 0 and 100>,
  "reason": "<detailed reason describing what the evidence proved or failed to prove>"
}}}}
"""
            return gl.nondet.exec_prompt(prompt)
            
        result = gl.eq_principle.strict_eq(run)
        
        data = json.loads(result)
        verdict = str(data.get("verdict", "NOT_GUILTY"))
        reason = str(data.get("reason", "Unknown AI error"))
        confidence_int = int(data.get("confidence", 0))
        
        self.report_statuses[report_id] = verdict
        self.report_reasons[report_id] = reason
        self.report_confidences[report_id] = u256(confidence_int)
        
        if verdict == "GUILTY":
            fine = u256(50)
            target_bond = self.member_bonds[target_id]
            
            if target_bond >= fine:
                self.member_bonds[target_id] = target_bond - fine
                self.member_bonds[reporter_id] = self.member_bonds[reporter_id] + u256(40)
                self.treasury_balance = self.treasury_balance + u256(10)
            else:
                self.member_bonds[target_id] = u256(0)
                self.member_bonds[reporter_id] = self.member_bonds[reporter_id] + target_bond
                
            self.member_violations[target_id] = self.member_violations[target_id] + u256(1)
            
        return result

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
    def get_member(self, member_id: u256) -> str:
        if member_id >= self.member_count:
            return json.dumps({"error": "INVALID_MEMBER_ID"}, sort_keys=True, separators=(",", ":"))
        obj = {
            "member_id": str(member_id),
            "unit_name": self.member_units[member_id],
            "owner": self.member_owners[member_id],
            "bond": str(self.member_bonds[member_id]),
            "violations": str(self.member_violations[member_id])
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
            "evidence_url": self.report_evidence_urls[report_id],
            "status": self.report_statuses[report_id],
            "reason": self.report_reasons[report_id],
            "confidence": str(self.report_confidences[report_id])
        }
        return json.dumps(obj, sort_keys=True, separators=(",", ":"))
