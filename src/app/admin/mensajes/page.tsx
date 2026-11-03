"use client";

import { Loading, PageTitle } from "@/components/admin/AdminShell";
import { fmtDate, useAdminData } from "@/components/admin/useAdminData";
import { api } from "@/lib/api";

type M = { id: number; name: string; email: string; subject: string | null; message: string; createdAt: string; read: boolean };

export default function Messages() {
  const { data, error, reload } = useAdminData<{ messages: M[] }>("/api/admin/messages");

  async function mark(id: number, read: boolean) {
    await api("/api/admin/messages", { method: "PATCH", body: { id, read } });
    await reload();
  }

  return (
    <>
      <PageTitle sub="Mensajes del formulario de contacto. Responde desde tu correo con el botón.">Mensajes</PageTitle>
      {!data ? <Loading error={error} /> : data.messages.length === 0 ? (
        <p className="py-10 text-[18px] italic text-faint">Todavía no hay mensajes.</p>
      ) : (
        <ul className="grid gap-4">
          {data.messages.map((m) => (
            <li key={m.id} className={`rounded-xl border bg-white p-6 ${m.read ? "border-line" : "border-ink-800"}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="font-display text-[18px] font-medium">{m.subject || "Sin asunto"}{!m.read && <span className="ml-3 rounded-full bg-leaf-500 px-2.5 py-0.5 font-display text-[12px] font-semibold text-ink-900">Nuevo</span>}</p>
                <p className="text-[14px] italic text-faint">{fmtDate(m.createdAt)}</p>
              </div>
              <p className="mt-1 text-[15px] text-muted">{m.name}, {m.email}</p>
              <p className="mt-4 whitespace-pre-wrap text-[18px]">{m.message}</p>
              <div className="mt-5 flex flex-wrap gap-4 text-[15px]">
                <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: " + (m.subject || "Tu mensaje a Alba Pura"))}`} className="font-display font-medium text-leaf-600 underline-offset-4 hover:underline">Responder por correo</a>
                <button onClick={() => void mark(m.id, !m.read)} className="font-display font-medium underline-offset-4 hover:underline">{m.read ? "Marcar como no leído" : "Marcar como leído"}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
