import { Suspense } from "react";
import { OrderDetail } from "./OrderDetail";

async function Detail({ params }: { params: PageProps<"/admin/pedidos/[id]">["params"] }) {
  const { id } = await params;
  return <OrderDetail id={id} />;
}

export default function Page(props: PageProps<"/admin/pedidos/[id]">) {
  return (
    <Suspense fallback={<p className="py-10 italic text-faint">Cargando…</p>}>
      <Detail params={props.params} />
    </Suspense>
  );
}
