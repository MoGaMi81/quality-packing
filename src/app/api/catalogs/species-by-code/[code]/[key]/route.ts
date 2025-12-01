import { NextResponse } from "next/server";
import speciesCodes from "@/../data/species_codes.json";
import species from "@/../data/species.json";
import sizes from "@/../data/sizes.json";
import forms from "@/../data/forms.json";

export function GET(
  req: Request,
  { params }: { params: { key: string } }
) {
  const code = params.key.toUpperCase();

  const row = speciesCodes.find((x) => x.code.toUpperCase() === code);
  if (!row) {
    return NextResponse.json({ error: "Species not found" }, { status: 404 });
  }

  const sp = species.find((s) => s.id === row.species_id);
  const size = sizes.find((s) => s.id === row.size_id);
  const form = forms.find((f) => f.id === row.form_id);

  return NextResponse.json({
    species: sp,
    size,
    form,
  });
}
