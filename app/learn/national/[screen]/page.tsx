import { notFound } from "next/navigation";
import { NationalScreen } from "@/components/national/screens";
import { worldGame } from "@/lib/national/world-catalog";
import { WorldGame } from "@/components/national/world";
export default async function Page({
  params,
}: {
  params: Promise<{ screen: string }>;
}) {
  const { screen } = await params;
  if (screen === "classic-asyk" || screen === "classic-arqan")
    return <NationalScreen screen={screen.slice(8)} />;
  const game = worldGame(screen);
  if (game) return <WorldGame kind={game.id} />;
  if (
    ![
      "asyk",
      "arqan",
      "character",
      "upgrade",
      "shop",
      "rewards",
      "result",
      "daily",
    ].includes(screen)
  )
    notFound();
  return <NationalScreen screen={screen} />;
}
