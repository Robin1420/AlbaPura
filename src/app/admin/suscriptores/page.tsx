"use client";

import { Loading, PageTitle } from "@/components/admin/AdminShell";
import { fmtDate, useAdminData } from "@/components/admin/useAdminData";

export default function Subscribers() {
  const { data, error } = useAdminData<{ subscribers: { email: string; createdAt: string }[] }>("/api/admin/subscribers");
  return (
    <>
      <PageTitle sub={data ? `${data.subscribers.length} personas reciben el aviso de cada cosecha.` : undefined}>Suscriptores</PageTitle>
      {!data ? <Loading error={error} /> : (
        <>
          <a href="/api/admin/subscribers?format=csv" download className="mb-6 inline-flex h-11 items-center rounded-full bg-ink-800 px-6 font-display text-[15px] font-semibold text-dew-50 hover:bg-ink-700">Descargar CSV</a>
          {data.subscribers.length === 0 ? <p className="py-6 text-[18px] italic text-faint">Todavía no hay suscriptores.</p> : (
            <ul className="divide-y divide-line rounded-xl border border-line bg-white">
              {data.subscribers.map((s) => (
                <li key={s.email} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <span className="font-display text-[16px] font-medium break-all">{s.email}</span>
                  <span className="shrink-0 text-[14px] italic text-faint">{fmtDate(s.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
