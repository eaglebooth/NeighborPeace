import Link from "next/link";
import { Plus } from "lucide-react";
import { OnchainList } from "@/components/OnchainLists";
import { PageIntro } from "@/components/PageIntro";
export default function ReportsPage(){return <><PageIntro eyebrow="Public case register" title="Follow every state change." description="Reports move from response to AI review, optional appeal, and final settlement. No sample cases are mixed with contract records."/><div className="page-wrap -mt-12 mb-12"><Link className="button-primary" href="/reports/new"><Plus size={17}/> File a report</Link></div><OnchainList kind="reports"/></>}
