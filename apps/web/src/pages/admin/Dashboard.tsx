import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { fetchJSON } from "../../lib/api";

type Counts = { users: number; orders: number; suppliers: number };

function KpiBox(props: { title: string; value: string | number; hint: string }) {
  return (
    <Card className="border-2">
      <CardContent>
        <div className="flex items-center justify-between">
          <span>{props.title}</span>
          <Badge intent="info">{props.hint}</Badge>
        </div>
        <div className="text-3xl font-bold mt-2">{props.value}</div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [counts, setCounts] = useState<Counts>({ users: 0, orders: 12, suppliers: 15 });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchJSON<{ count: number }>("/users/count");
        setCounts((c) => ({ ...c, users: res.count }));
      } catch (e) {
        console.error("users fetch failed", e);
      }
    })();
  }, []);

  return (
    <div className="min-h-dvh bg-powder/20 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Clarus — Admin Dashboard</h1>
          <div className="flex gap-2">
            <Badge intent="success">online</Badge>
            <Badge>multi-tenant</Badge>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiBox title="Ordens abertas"   value={counts.orders}    hint="Hoje" />
          <KpiBox title="Clientes ativos"  value={counts.users}     hint={"Mês"} />
          <KpiBox title="Fornecedores"     value={counts.suppliers} hint="Base" />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="col-span-2">
            <CardContent>
              <div className="flex items-center gap-2 mb-2">Atividade recente</div>
              <ul className="text-sm space-y-2">
                <li>• OS #1023 criada por <strong>admin@clarus</strong></li>
                <li>• Material “Cabo 2,5mm” atualizado</li>
                <li>• Cliente “Agro XYZ” cadastrado</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-sm">
              <div className="flex justify-between py-1"><span>OWNER</span><span>1</span></div>
              <div className="flex justify-between py-1"><span>ADMIN</span><span>2</span></div>
              <div className="flex justify-between py-1"><span>EDITOR</span><span>6</span></div>
              <div className="flex justify-between py-1"><span>VIEWER</span><span>12</span></div>
            </CardContent>
          </Card>
        </section>

        <footer className="opacity-70 text-xs">
          Paleta oficial aplicada • Layout base aprovado
        </footer>
      </div>
    </div>
  );
}