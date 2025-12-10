export default function EditPacking({ params }: { params: { invoice: string }}) {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">Editar Packing {params.invoice}</h1>
      <p>Editor en construcción…</p>
    </main>
  );
}
