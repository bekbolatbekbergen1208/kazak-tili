import { notFound } from "next/navigation";
import QLevelHub from "@/components/q-level/hub";
export default async function Page({
  params,
}: {
  params: Promise<{ screen: string }>;
}) {
  const { screen } = await params;
  if (
    !["quick", "full", "passport", "progress", "leaderboard"].includes(screen)
  )
    notFound();
  return <QLevelHub screen={screen} />;
}
