import { notFound } from "next/navigation";
import { regionById, regions } from "@/lib/travel/catalog";
import { RegionPage } from "@/components/travel/region";
export function generateStaticParams() {
  return regions.map((r) => ({ slug: r.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const r = regionById((await params).slug);
  return { title: `${r?.nameKk ?? "Өңір табылмады"} · QazaqDos` };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const r = regionById((await params).slug);
  if (!r) notFound();
  return <RegionPage key={r.id} region={r} />;
}
