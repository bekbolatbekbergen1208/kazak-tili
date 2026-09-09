import { notFound } from "next/navigation";
import { NationalScreen } from "@/components/national/screens";
export default async function Page({
  params,
}: {
  params: Promise<{ screen: string }>;
}) {
  const { screen } = await params;
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
