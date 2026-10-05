import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { isCorpusAdmin } from "@/lib/literary/admin";
import CorpusAdmin from "@/components/literary/admin-panel";
export default async function Page() {
  const {
    data: { user },
  } = await createClient(await cookies()).auth.getUser();
  if (!user || !isCorpusAdmin(user))
    return (
      <main className="page lit-page">
        <h1>Корпусты басқару</h1>
        <p>Бұл бөлім уәкілетті әкімшіге арналған.</p>
        <Link className="btn primary" href="/login">
          Аккаунтқа кіру
        </Link>
      </main>
    );
  return <CorpusAdmin />;
}
