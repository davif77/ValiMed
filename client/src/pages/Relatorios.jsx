import { useMemo } from 'react';
import { TrendingUp, AlertTriangle, BarChart3, DollarSign } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export default function Relatorios() {
  const data = useData();

  const hoje     = new Date(); hoje.setHours(0,0,0,0);
  const em7      = new Date(hoje.getTime() + 7  * 86400000);
  const em30     = new Date(hoje.getTime() + 30 * 86400000);
  const inicioSem = new Date(hoje.getTime() - 7 * 86400000);
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const estoque = useMemo(() => ({
    criticos: data.lotes.filter(l => { const d = new Date(l.data_venci); return l.status==='ATIVO' && d > hoje && d <= em7; }),
    avisos:   data.lotes.filter(l => { const d = new Date(l.data_venci); return l.status==='ATIVO' && d > em7  && d <= em30; }),
    vencidos: data.getLotesVencidos(),
  }), [data]);

  const vendas = useMemo(() => {
    const vs = data.vendas;
    const filtrar = (de, ate) => vs.filter(v => { const d = new Date(v.data_venda); return d >= de && d <= ate; });
    const soma    = (arr) => arr.reduce((t, v) => t + Number(v.valor_total), 0);
    const hj      = filtrar(hoje, new Date());
    const sem     = filtrar(inicioSem, new Date());
    const mes     = filtrar(inicioMes, new Date());
    return { hj, sem, mes, totalHj: soma(hj), totalSem: soma(sem), totalMes: soma(mes) };
  }, [data.vendas]);

  const maisVendidos = useMemo(() => {
    const map = {};
    data.vendas.forEach(v => v.itens.forEach(item => {
      const lote = data.lotes.find(l => l.id_lote === item.lote_id);
      if (!lote) return;
      const med = data.getMedicamento(lote.id_medicamento);
      if (!med) return;
      if (!map[lote.id_medicamento]) map[lote.id_medicamento] = { nome: med.nome_comercial, qtd: 0, valor: 0 };
      map[lote.id_medicamento].qtd   += item.quantidade;
      map[lote.id_medicamento].valor += item.quantidade * Number(item.preco_unitario);
    }));
    return Object.values(map).sort((a, b) => b.qtd - a.qtd).slice(0, 10);
  }, [data]);

  const baixoEstoque = useMemo(() => {
    const map = {};
    data.lotes.filter(l => l.status === 'ATIVO').forEach(l => {
      const med = data.getMedicamento(l.id_medicamento);
      if (!med) return;
      if (!map[l.id_medicamento]) map[l.id_medicamento] = { nome: med.nome_comercial, qtd: 0 };
      map[l.id_medicamento].qtd += Number(l.quantidade);
    });
    return Object.values(map).filter(m => m.qtd < 20).sort((a, b) => a.qtd - b.qtd);
  }, [data]);

  const Section = ({ icon, title, children }) => (
    <div>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 700, marginBottom: 12 }}>{icon}{title}</h2>
      {children}
    </div>
  );

  return (
    <div className="space-y">
      <div><h1>Relatórios</h1><p style={{ color: 'var(--text-muted)' }}>Análises e indicadores</p></div>

      <Section icon={<TrendingUp size={18} />} title="Resumo de Vendas">
        <div className="grid-3">
          {[
            { label: 'Hoje', count: vendas.hj.length, total: vendas.totalHj },
            { label: 'Esta Semana', count: vendas.sem.length, total: vendas.totalSem },
            { label: 'Este Mês', count: vendas.mes.length, total: vendas.totalMes },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <p className="stat-label">Vendas — {s.label}</p>
              <p className="stat-value">{s.count}</p>
              <p style={{ color: 'var(--primary)', fontWeight: 600, marginTop: 4 }}>R$ {s.total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={<AlertTriangle size={18} />} title="Alertas de Estoque">
        <div className="grid-3">
          {[
            { label: 'Crítico (≤7 dias)', count: estoque.criticos.length, itens: estoque.criticos.reduce((t,l) => t+l.quantidade,0), cor: 'var(--danger)' },
            { label: 'Aviso (≤30 dias)', count: estoque.avisos.length,   itens: estoque.avisos.reduce((t,l) => t+l.quantidade,0),   cor: 'var(--warning)' },
            { label: 'Vencidos',          count: estoque.vencidos.length, itens: estoque.vencidos.reduce((t,l) => t+l.quantidade,0), cor: '#7c3aed' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ borderLeft: `4px solid ${s.cor}` }}>
              <p className="stat-label">{s.label}</p>
              <p className="stat-value" style={{ color: s.cor }}>{s.count}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.itens} itens</p>
            </div>
          ))}
        </div>
      </Section>

      {maisVendidos.length > 0 && (
        <Section icon={<BarChart3 size={18} />} title="Produtos Mais Vendidos">
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Medicamento</th><th className="text-right">Qtd. Vendida</th><th className="text-right">Faturamento</th></tr></thead>
                <tbody>
                  {maisVendidos.map((p, i) => (
                    <tr key={i}><td style={{ fontWeight: 600 }}>{p.nome}</td><td className="text-right">{p.qtd}</td><td className="text-right">R$ {p.valor.toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>
      )}

      {baixoEstoque.length > 0 && (
        <Section icon={<DollarSign size={18} />} title="Baixo Estoque (menos de 20 unidades)">
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Medicamento</th><th className="text-right">Quantidade</th></tr></thead>
                <tbody>
                  {baixoEstoque.map((m, i) => (
                    <tr key={i}><td style={{ fontWeight: 600 }}>{m.nome}</td><td className="text-right"><span className="badge badge-yellow">{m.qtd}</span></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>
      )}

      {maisVendidos.length === 0 && baixoEstoque.length === 0 && (
        <div className="card"><div className="empty-state"><p>Nenhum dado disponível para relatórios ainda.</p></div></div>
      )}
    </div>
  );
}
