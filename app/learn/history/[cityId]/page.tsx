import { notFound } from "next/navigation";
import { historyCity } from "@/lib/history/catalog";
import { HistoryCityLevel } from "@/components/history/city";
export default async function Page({
  params,
}: {
  params: Promise<{ cityId: string }>;
}) {
  const { cityId } = await params;
  const city = historyCity(cityId);
  if (!city) notFound();
  return <HistoryCityLevel city={city} key={city.id} />;
}
