import { Suspense } from "react";
import { FriendsHub } from "@/components/friends/hub";
import "./friends.css";
export default function Page() {
  return (
    <Suspense fallback={<main className="fs-page">Жүктелуде…</main>}>
      <FriendsHub />
    </Suspense>
  );
}
