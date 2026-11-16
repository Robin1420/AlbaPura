"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { regions } from "@/lib/checkout";
import { type User, useAccount } from "./AccountProvider";

/** Datos del cliente: se piden una sola vez, después de ingresar con Google, y se reutilizan en la compra. */
export function ProfileForm({ user, next }: { user: User; next?: string }) {
  const router = useRouter();
  const { saveProfile } = useAccount();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [addressLine, setAddressLine] = useState(user.addressLine ?? "");
  const [district, setDistrict] = useState(user.district ?? "");
  const [region, setRegion] = useState(user.region ?? regions[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    const err: Record<string, string> = {};
    if (name.trim().length < 2) err.name = "Escribe tu nombre.";
    if (phone.replace(/\D/g, "").length < 9) err.phone = "Escribe un celular de 9 dígitos.";
    if (addressLine.trim().length < 5) err.addressLine = "Escribe la calle, el número y el departamento si corresponde.";
    if (district.trim().length < 2) err.district = "Escribe tu distrito.";
    setErrors(err);
    if (Object.keys(err).length) return;

    setBusy(true);
    const r = await saveProfile({ name, phone, addressLine, district, region });
    setBusy(false);
    if (!r.ok) {
      setErrors(r.fields);
      setMsg(Object.keys(r.fields).length ? "" : r.error);
      return;
    }
    if (next) router.push(next);
    else setMsg("Datos guardados.");
  }

  return (
    <form onSubmit={submit} noValidate className="grid max-w-xl gap-5">
      <div className="flex items-center gap-4 border-b border-line pb-5">
        {user.picture && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.picture} alt="" width={56} height={56} referrerPolicy="no-referrer" className="size-14 rounded-full" />
        )}
        <div>
          <p className="font-display text-[18px] font-medium">{user.email}</p>
          <p className="text-[15px] italic text-faint">Cuenta de Google</p>
        </div>
      </div>
      <Field label="Nombre completo" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
      <Field label="Celular" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} hint="Para coordinar la entrega." />
      <Field label="Dirección de entrega" name="addressLine" autoComplete="street-address" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} error={errors.addressLine} hint="Calle, número y departamento si corresponde." />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Distrito" name="district" value={district} onChange={(e) => setDistrict(e.target.value)} error={errors.district} />
        <div className="grid gap-1.5">
          <label htmlFor="region" className="font-display text-[14px] font-medium">Zona de reparto</label>
          <select id="region" value={region} onChange={(e) => setRegion(e.target.value)} className="h-12 rounded-md border border-line-strong/60 bg-white px-4 font-text text-[17px] outline-none focus:ring-2 focus:ring-leaf-500/50">
            {regions.map((r) => <option key={r}>{r}</option>)}
          </select>
          {errors.region && <p className="text-[14px] text-danger">{errors.region}</p>}
        </div>
      </div>
      {msg && <p role="status" className="rounded-md bg-leaf-300/50 px-4 py-3 text-[16px]">{msg}</p>}
      <Button type="submit" size="lg" disabled={busy} className="w-fit">{busy ? "Guardando…" : next ? "Guardar y continuar" : "Guardar datos"}</Button>
    </form>
  );
}
