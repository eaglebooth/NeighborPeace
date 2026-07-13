import { PageIntro } from "@/components/PageIntro";
import { ContractVerifier } from "@/components/ContractVerifier";

export default function ActivityPage() {
  return <><PageIntro eyebrow="Deployment evidence" title="Verify the live contract." description="Read V3 state directly from Studionet and inspect the deployed address before starting a case."/><ContractVerifier/></>;
}
