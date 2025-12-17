import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import { createClient } from "@supabase/supabase-js";

// ----------------------------------------------
// CONFIG SUPABASE
// ----------------------------------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ----------------------------------------------
// LEER CSV
// ----------------------------------------------
const filePath = path.join(process.cwd(), "imports", "species.csv");
const fileContent = fs.readFileSync(filePath, "utf8");

interface Row {
  code: string;
  name_en: string;
  size: string;
  form: string;
  scientific_name: string;
}

async function run() {
  console.log("📦 Importando species...");

  const rows: Row[] = [];

  parse(
    fileContent,
    {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    },
    async (err, records: Row[]) => {
      if (err) {
        console.error("Error leyendo CSV:", err);
        return;
      }

      rows.push(...records);

      // Sets para eliminar duplicados
      const speciesSet = new Map<string, string>(); // name_en -> scientific_name
      const sizesSet = new Set<string>();
      const formsSet = new Set<string>();

      for (const r of rows) {
        speciesSet.set(r.name_en.trim(), r.scientific_name.trim());
        sizesSet.add(r.size.trim());
        formsSet.add(r.form.trim());
      }

      // ----------------------------------------------
      // 1) INSERTAR species
      // ----------------------------------------------
      console.log("🧬 Insertando species...");
      const species_ids = new Map<string, string>(); // name_en -> uuid

      for (const [name_en, sci] of speciesSet.entries()) {
        const { data, error } = await supabase
          .from("species")
          .upsert(
            { name_en, scientific_name: sci },
            { onConflict: "name_en" }
          )
          .select("id")
          .single();

        if (error) console.error("Error species:", error);
        else species_ids.set(name_en, data.id);
      }

      // ----------------------------------------------
      // 2) INSERTAR sizes
      // ----------------------------------------------
      console.log("📏 Insertando sizes...");
      const size_ids = new Map<string, string>();

      for (const sz of sizesSet) {
        const { data, error } = await supabase
          .from("sizes")
          .upsert({ name: sz }, { onConflict: "name" })
          .select("id")
          .single();

        if (error) console.error("Error sizes:", error);
        else size_ids.set(sz, data.id);
      }

      // ----------------------------------------------
      // 3) INSERTAR forms
      // ----------------------------------------------
      console.log("📄 Insertando forms...");
      const form_ids = new Map<string, string>();

      for (const f of formsSet) {
        const { data, error } = await supabase
          .from("forms")
          .upsert({ name: f }, { onConflict: "name" })
          .select("id")
          .single();

        if (error) console.error("Error forms:", error);
        else form_ids.set(f, data.id);
      }

      // ----------------------------------------------
      // 4) INSERTAR species_codes
      // ----------------------------------------------
      console.log("🔑 Insertando species_codes...");

      for (const r of rows) {
        const species_id = species_ids.get(r.name_en.trim());
        const size_id = size_ids.get(r.size.trim());
        const form_id = form_ids.get(r.form.trim());

        if (!species_id || !size_id || !form_id) {
          console.error("❌ ERROR: referencia faltante", r);
          continue;
        }

        const { error } = await supabase.from("species_codes").upsert(
          {
            code: r.code.trim(),
            species_id,
            size_id,
            form_id,
            scientific_name: r.scientific_name.trim(),
          },
          { onConflict: "code" }
        );

        if (error) console.error("Error species_codes:", error);
      }

      console.log("🎉 IMPORTACIÓN COMPLETA");
    }
  );
}

run();
