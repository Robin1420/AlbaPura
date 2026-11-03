import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderView } from "./OrderView";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false } };

async function Order({ params, searchParams }: { params: PageProps<"/pedido/[id]">["params"]; searchParams: PageProps<"/pedido/[id]">["searchParams"] }) {
  const { id } = await params;
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  return <OrderView id={id} token={one(sp.t)} pago={one(sp.pago)} />;
}

export default function Page(props: PageProps<"/pedido/[id]">) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
      <Order params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
