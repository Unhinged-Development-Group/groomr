import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getPortfolioPhotos } from "@/app/actions/portfolio";
import { PortfolioClient } from "./_components/PortfolioClient";

export default async function PortfolioPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const photos = await getPortfolioPhotos();

  return <PortfolioClient initialPhotos={photos} />;
}
