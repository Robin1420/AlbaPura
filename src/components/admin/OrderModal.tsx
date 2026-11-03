"use client";

import { Modal } from "@/components/ui/Modal";
import { OrderDetail } from "@/app/admin/pedidos/[id]/OrderDetail";

/** Detalle de un pedido en una ventana: se abre desde la lista o el resumen sin salir de la página. */
export function OrderModal({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  return (
    <Modal open={id !== null} onClose={onClose} size="xl" title={id ? `Pedido ${id}` : "Pedido"}>
      {id && <OrderDetail key={id} id={id} inModal onChanged={onChanged} />}
    </Modal>
  );
}
