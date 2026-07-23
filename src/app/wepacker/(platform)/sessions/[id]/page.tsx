import Link from "next/link";
import { notFound } from "next/navigation";
import { getMySessionCallView } from "@/lib/wepacker/actions/session-media";
import { getMyPublishedSessionDocuments } from "@/lib/wepacker/actions/session-result-document";
import { requirePageUser } from "@/lib/wepacker/page-guards";

export const dynamic = "force-dynamic";

export default async function MySessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageUser();
  const { id } = await params;
  const pageData = await Promise.all([
      getMySessionCallView(id),
      getMyPublishedSessionDocuments(id),
    ]).catch(() => null);
  if (!pageData) notFound();
  const [session, documents] = pageData;
  if (session.isOrganizer) notFound();
  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-barlow text-2xl font-bold text-wepac-white">
        Session
      </h1>
      <p className="mt-2 text-sm text-wepac-text-tertiary">
        {new Date(session.scheduledAt).toLocaleString("pt-PT")}
      </p>
      <Link
        href={`/wepacker/sessions/${id}/call`}
        className="mt-6 inline-block bg-wepac-white px-4 py-2 text-sm font-bold text-wepac-black"
      >
        Entrar na chamada autenticada
      </Link>
      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-widest text-wepac-text-tertiary">
          Documentos partilhados pelo mentor
        </h2>
        {documents.length === 0 ? (
          <p className="mt-3 text-sm text-wepac-text-tertiary">
            Ainda não há documentos partilhados.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {documents.map((document) => (
              <a
                key={document.id}
                href={`/api/wepacker/session-media/documents/${document.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-wepac-border bg-wepac-card p-4 text-sm text-wepac-white hover:border-wepac-white/30"
              >
                Documento v{document.version} ·{" "}
                {document.publishedAt.toLocaleDateString("pt-PT")}
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
