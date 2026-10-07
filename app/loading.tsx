import { RouteState } from "@/components/ui/route-state";
export default function Loading() {
  return (
    <RouteState title="Оқу әлемі ашылып жатыр…" loading>
      <p>Бір сәт күте тұр.</p>
    </RouteState>
  );
}
