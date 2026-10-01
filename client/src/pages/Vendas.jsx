import { useMemo, useState } from 'react';
import { ShoppingCart, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export default function Vendas() {
  const data = useData();
  const [showForm, setShowForm] = useState(false);
  const [itens, setItens]       = useState([]);
  const [loteId, setLoteId]     = useState(0);
  const [qtd, setQtd]           = useState(1);

  const vendas = useMemo(() =>
    [...data.vendas].sort((a, b) => new Date(b.data_venda).getTime() - new Date(a.data_venda).getTime()),
    [data.vendas]
  );

  const totalGeral = useMemo(() =>
    vendas.reduce((s, v) => s + Number(v.valor_total), 0), [vendas]
  );

  const loteSelecionado = data.lotes.find(l => l.id_lote === loteId);
  const loteSelecionadoVencido = loteSelecionado ? data.isLoteVencido(loteSelecionado) : false;

  const adicionarItem = () => {
    if (!loteId || qtd < 1) return alert('Selecione um lote e quantidade válida.');
    const lote = data.lotes.find(l => l.id_lote === loteId);
    if (!lote || lote.quantidade < qtd) return alert('Quantidade insuficiente.');
    if (data.isLoteVencido(lote)) return alert(`Não é possível vender este lote: venceu em ${new Date(lote.data_venci).toLocaleDateString('pt-BR')}.`);
    if (itens.some(i => i.lote_id === loteId)) return alert('Lote já adicionado.');
    setItens(p => [...p, { lote_id: loteId, quantidade: qtd }]);
    setLoteId(0); setQtd(1);
  };

  const totalVenda = useMemo(() =>
    itens.reduce((s, i) => {
      const l = data.lotes.find(l => l.id_lote === i.lote_id);
      return s + (l ? i.quantidade * Number(l.preco_venda) : 0);
    }, 0), [itens, data.lotes]
  );

  const finalizar = async () => {
    if (!itens.length) return alert('Adicione ao menos um item.');
    try { await data.adicionarVenda(itens); setItens([]); setShowForm(false); }
    catch (err) { alert(err instanceof Error ? err.message : 'Erro ao registrar venda.'); }
  };

  return (
    <div className="space-y">
      <div className="page-header">
        <div><h1>Vendas</h1><p>Registro e histórico</p></div>
        <button className="btn btn-primary" onClick={() => { setShowForm(s => !s); setItens([]); }}>
          <Plus size={16} /> Nova Venda
        </button>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-header"><h2>Registrar Venda Manual</h2></div>
          <div className="card-body">
            {/* Adicionar item */}
            <div className="input-row" style={{ marginBottom: 8 }}>
              <div className="form-group">
                <label>Lote</label>
                <select className="input" value={loteId} onChange={e => setLoteId(Number(e.target.value))}
                  style={loteSelecionadoVencido ? { borderColor: 'var(--danger)', color: 'var(--danger)' } : {}}>
                  <option value={0}>Selecione um lote...</option>
                  {data.lotes.filter(l => l.status === 'ATIVO' && l.quantidade > 0).map(l => {
                    const med = data.getMedicamento(l.id_medicamento);
                    const label = med ? data.formatarMedicamento(med) : '—';
                    return (
                      <option key={l.id_lote} value={l.id_lote}>
                        {data.isLoteVencido(l) ? '⚠ VENCIDO — ' : ''}
                        {label} — Lote {l.numero_lote} (Qtd: {l.quantidade})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group">
                <label>Quantidade</label>
                <input className="input" type="number" min={1} value={qtd} onChange={e => setQtd(Number(e.target.value))} />
              </div>
              <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                <label>&nbsp;</label>
                <button type="button" className="btn btn-primary" disabled={loteSelecionadoVencido} onClick={adicionarItem}>
                  <Plus size={15} /> Adicionar
                </button>
              </div>
            </div>

            {loteSelecionadoVencido && loteSelecionado && (
              <div className="alert alert-red" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>
                  Este lote está <b>vencido</b> (venceu em {new Date(loteSelecionado.data_venci).toLocaleDateString('pt-BR')}) e não pode ser vendido.
                </span>
              </div>
            )}

            {/* Lista de itens */}
            {itens.length > 0 && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  {itens.map((item, i) => {
                    const lote = data.lotes.find(l => l.id_lote === item.lote_id);
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)' }}>
                        <div>
                          <span style={{ fontWeight: 600 }}>{data.getMedicamento(lote?.id_medicamento ?? 0)?.nome_comercial}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>Lote {lote?.numero_lote} · {item.quantidade}x · R$ {Number(lote?.preco_venda).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontWeight: 600 }}>R$ {(item.quantidade * Number(lote?.preco_venda)).toFixed(2)}</span>
                          <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setItens(p => p.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex-between" style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginBottom: 12 }}>
                  <span style={{ fontWeight: 600 }}>Total:</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>R$ {totalVenda.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={finalizar}>Finalizar Venda</button>
                  <button className="btn btn-outline" onClick={() => { setShowForm(false); setItens([]); }}>Cancelar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
