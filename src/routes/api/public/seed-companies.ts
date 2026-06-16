import { createFileRoute } from "@tanstack/react-router";
import seedData from "@/data/companies-seed.json";

export const Route = createFileRoute("/api/public/seed-companies")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("x-seed-token");
        if (token !== "seed-once-2026") return new Response("forbidden", { status: 403 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("companies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        const rows = seedData as Array<Record<string, unknown>>;
        const chunkSize = 200;
        let inserted = 0;
        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);
          const { error } = await supabaseAdmin.from("companies").insert(chunk);
          if (error) return new Response(`error at ${i}: ${error.message}`, { status: 500 });
          inserted += chunk.length;
        }
        return new Response(JSON.stringify({ inserted }), { headers: { "content-type": "application/json" } });
      },
    },
  },
});