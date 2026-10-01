import { useState, useMemo } from 'react';
import { Package, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';

function diasParaVencer(dataVenci) {
  return Math.ceil((new Date(dataVenci).getTime() - Date.now()) / 86400000);
}

function statusBadge(dias) {
  if (dias < 0)   return { cls: 'badge badge-red',    txt: 'Vencido' };
  if (dias <= 7)  return { cls: 'badge badge-red',    txt: 'Crítico' };
  if (dias <= 30) return { cls: 'badge badge-yellow', txt: 'Aviso' };
  return              { cls: 'badge badge-green',  txt: 'Ativo' };
}

export default function Dashboard() {
  const data = useData();
  const [filtro, setFiltro] = useState('todos');

  const alerta30 = useMemo(() => data.lotesComAlerta(), [data]);
  const vencidos = useMemo(() => data.getLotesVencidos(), [data]);

  const alertasFiltrados = useMemo(() => {
    if (filtro === 'critico') return alerta30.filter(l => diasParaVencer(l.data_venci) <= 7);
    if (filtro === 'aviso')   return alerta30.filter(l => diasParaVencer(l.data_venci) > 7);
    return alerta30;
  }, [alerta30, filtro]);

  return (
    <div className="space-y">
      <div>
        <h1>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Visão geral do estoque</p>
      </div>

      {/* Stat cards */}
      <div className="grid-4">
        {[
  { label: 'Medicamentos', value: data.totalMedicamentos(), icon: <Pill /> },
  { label: 'Lotes Ativos', value: data.totalLotes(), icon: <TrendingUp size={20} /> },
  { label: 'Itens em Estoque', value: data.totalItensEstoque(), icon: <Package size={20} /> },
  { label: 'Valor do Estoque', value: `R$ ${data.valorEstoque().toFixed(2)}`, icon: <DollarSign size={20} /> },
].map(s => (
          <div key={s.label} className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="stat-label">{s.label}</p>
              <p className="stat-value">{s.value}</p>
            </div>
            <div className="stat-icon">{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Alert banner */}
      {vencidos.length > 0 && (
        <div className="alert alert-red" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span><b>{vencidos.length} lote(s) vencido(s)</b> devem ser descartados.</span>
        </div>
      )}

      {/* Alertas de vencimento */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={18} color="var(--danger)" /> Alertas de Vencimento
          </h2>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{alerta30.length} lote(s) com alerta</span>
        </div>

        <div className="card-body">
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['todos', 'critico', 'aviso'].map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`btn btn-sm ${filtro === f ? (f === 'critico' ? 'btn-danger' : f === 'aviso' ? '' : 'btn-primary') : 'btn-outline'}`}
                style={filtro === f && f === 'aviso' ? { background: '#a16207', color: 'white' } : {}}
              >
                {f === 'todos' ? `Todos (${alerta30.length})` : f === 'critico' ? `Crítico ≤7 dias` : 'Aviso ≤30 dias'}
              </button>
            ))}
          </div>

          {alertasFiltrados.length === 0 ? (
            <div className="empty-state"><p>Nenhum alerta para este filtro.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
              {alertasFiltrados.map(lote => {
                const dias = diasParaVencer(lote.data_venci);
                const s = statusBadge(dias);
                const med = data.getMedicamento(lote.id_medicamento);
                return (
                  <div key={lote.id_lote} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600 }}>{med?.nome_comercial ?? '—'}</span>
                        <span className={s.cls}>{s.txt}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Lote {lote.numero_lote} · Vence {new Date(lote.data_venci).toLocaleDateString('pt-BR')} · {dias} dias · Qtd: {lote.quantidade}
                      </p>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>
                      R$ {(Number(lote.quantidade) * Number(lote.preco_compra)).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Pill() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>; }
