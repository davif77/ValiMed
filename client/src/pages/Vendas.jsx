import { useMemo } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export default function Vendas() {
  const data = useData();

  const vendas = useMemo(() =>
    [...data.vendas].sort((a, b) => new Date(b.data_venda).getTime() - new Date(a.data_venda).getTime()),
    [data.vendas]
  );

  const totalGeral = useMemo(() =>
    vendas.reduce((s, v) => s + Number(v.valor_total), 0), [vendas]
  );

  return (
    <div className="space-y">
      <div className="page-header">
        <div><h1>Vendas</h1><p>Registro e histórico</p></div>
      </div>

      {/* Stats */}
      <div className="grid-3">
        {[
          { label: 'Total de Vendas', value: vendas.length },
          { label: 'Itens Vendidos', value: vendas.reduce((t, v) => t + v.itens.length, 0) },
          { label: 'Faturamento Total', value: `R$ ${totalGeral.toFixed(2)}` },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <p className="stat-label">{s.label}</p>
            <p className="stat-value" style={{ fontSize: 22 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Histórico */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShoppingCart size={18} /> Histórico de Vendas</h2>
        </div>
        {vendas.length === 0 ? (
          <div className="empty-state"><ShoppingCart size={40} /><p>Nenhuma venda registrada.</p></div>
        ) : (
          <div>
            {vendas.map(v => (
              <div key={v.id_venda} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                <div className="flex-between" style={{ marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>Venda #{v.id_venda}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 10 }}>
                      {new Date(v.data_venda).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>R$ {Number(v.valor_total).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {v.itens.map((item, i) => {
                    const lote = data.lotes.find(l => l.id_lote === item.lote_id);
                    const med = data.getMedicamento(lote?.id_medicamento ?? 0);
                    const label = med ? data.formatarMedicamento(med) : 'Medicamento';
                    return (
                      <p key={i} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {label} (Lote {lote?.numero_lote ?? item.lote_id}) — {item.quantidade}x · R$ {(item.quantidade * Number(item.preco_unitario)).toFixed(2)}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
