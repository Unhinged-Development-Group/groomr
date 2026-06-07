import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDisputeForParty } from "@/app/actions/disputes";
import { DisputeResponseClient } from "./_components/DisputeResponseClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dispute — Groomr",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DisputePage({ params }: Props) {
  const user = await currentUser();
  if (!user) redirect("/sign-in?redirect_url=" + encodeURIComponent("/disputes/" + (await params).id));

  const { id } = await params;
  const result = await getDisputeForParty(id);

  if ("error" in result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-2">
          <p className="font-fredoka text-2xl text-deep-slate">Dispute not found</p>
          <p className="text-sm text-pebble-grey">{result.error}</p>
        </div>
      </div>
    );
  }

  return <DisputeResponseClient dispute={result.data} />;
}
