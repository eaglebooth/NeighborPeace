import { PageIntro } from "@/components/PageIntro";
import { ReportDetail } from "@/components/ReportDetail";
export default async function ReportPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <><PageIntro eyebrow={`Case file #${id}`} title="One report, every stage." description="The case timeline below is read directly from NeighborPeace V2. Available actions change with the on-chain status."/><ReportDetail id={id}/></>}
