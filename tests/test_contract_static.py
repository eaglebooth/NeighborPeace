import ast
import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "contracts" / "NeighborPeace.py"


class NeighborPeaceContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = CONTRACT.read_text(encoding="utf-8")
        cls.tree = ast.parse(cls.source)

    def test_required_runtime_header(self):
        lines = self.source.splitlines()
        self.assertEqual(lines[0], "# v0.2.16")
        self.assertEqual(
            lines[1],
            '# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }',
        )

    def test_subjective_reviews_use_comparative_consensus(self):
        self.assertNotIn("gl.eq_principle.strict_eq", self.source)
        self.assertIn("gl.eq_principle.prompt_comparative(run_review, principle)", self.source)
        self.assertIn("gl.eq_principle.prompt_comparative(run_appeal, principle)", self.source)

    def test_owner_is_derived_from_message_sender(self):
        self.assertIn("owner = gl.message.sender_address", self.source)
        self.assertIn('return "NOT_REPORTER_OWNER"', self.source)
        self.assertIn('return "NOT_TARGET_OWNER"', self.source)
        self.assertIn('raise gl.vm.UserError("NOT_MEMBER_OWNER")', self.source)

    def test_bonds_are_real_payable_value(self):
        self.assertGreaterEqual(self.source.count("@gl.public.write.payable"), 2)
        self.assertIn("bond = gl.message.value", self.source)
        self.assertIn("amount = gl.message.value", self.source)
        self.assertIn("total_bonded", self.source)
        register = self.source[self.source.index("def register_unit"):self.source.index("def deposit_bond")]
        deposit = self.source[self.source.index("def deposit_bond"):self.source.index("def file_report")]
        self.assertIn("raise gl.vm.UserError", register)
        self.assertIn("raise gl.vm.UserError", deposit)

    def test_settlement_emits_real_value(self):
        self.assertIn("@gl.evm.contract_interface", self.source)
        self.assertIn("emit_transfer(value=compensation)", self.source)
        self.assertIn("emit_transfer(value=treasury_fee)", self.source)

    def test_only_target_can_waive_response(self):
        self.assertIn('return "ONLY_TARGET_CAN_WAIVE_RESPONSE"', self.source)
        close_method = self.source[self.source.index("def close_response_window"):self.source.index("def _parse_ruling")]
        self.assertIn("target_id = self.report_target_units[report_id]", close_method)
        self.assertNotIn("reporter_id =", close_method)

    def test_appeal_rereads_complete_record(self):
        appeal_method = self.source[self.source.index("def evaluate_appeal"):self.source.index("def finalize_report")]
        self.assertIn("evidence_url", appeal_method)
        self.assertIn("response_url", appeal_method)
        self.assertIn("appeal_url", appeal_method)
        self.assertIn("COMPLAINT:", appeal_method)
        self.assertIn("COUNTER-EVIDENCE:", appeal_method)

    def test_dispute_lifecycle_methods_exist(self):
        methods = {
            node.name
            for node in ast.walk(self.tree)
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
        }
        expected = {
            "register_unit",
            "deposit_bond",
            "file_report",
            "submit_response",
            "close_response_window",
            "evaluate_report",
            "appeal_report",
            "evaluate_appeal",
            "finalize_report",
            "get_member",
            "get_report",
        }
        self.assertTrue(expected.issubset(methods))

    def test_settlement_is_guarded_against_double_finalize(self):
        self.assertIn('return "ALREADY_FINALIZED"', self.source)
        self.assertIn('self.report_finalized[report_id] = u256(1)', self.source)
        self.assertIn('self.report_statuses[report_id] = "FINALIZED"', self.source)

    def test_replay_and_web_failure_guards_exist(self):
        self.assertIn('return "INCIDENT_ALREADY_FILED"', self.source)
        self.assertGreaterEqual(self.source.count('"verdict": "NEEDS_EVIDENCE"'), 2)
        self.assertIn('return "INVALID_AI_RESPONSE"', self.source)

    def test_public_signatures_use_supported_types(self):
        forbidden = {"int", "float", "bool", "list", "dict", "tuple"}
        for node in ast.walk(self.tree):
            if not isinstance(node, ast.FunctionDef):
                continue
            is_public = any(
                isinstance(decorator, ast.Attribute)
                and isinstance(decorator.value, ast.Attribute)
                and decorator.value.attr == "public"
                for decorator in node.decorator_list
            )
            if not is_public:
                continue
            annotations = [arg.annotation for arg in node.args.args if arg.annotation]
            if node.returns:
                annotations.append(node.returns)
            rendered = {ast.unparse(annotation) for annotation in annotations}
            self.assertTrue(forbidden.isdisjoint(rendered), f"Forbidden type in {node.name}: {rendered}")


if __name__ == "__main__":
    unittest.main()
