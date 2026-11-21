import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, AlertCircle, X, PackageX } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const emptyForm = { id_medicamento: 0, numero_lote: '', data_fabri: '', data_venci: '', quantidade: 0, preco_compra: 0, preco_venda: 0 };

function diasParaVencer(data) {
  const [ano, mes, dia] = String(data).slice(0, 10).split('-').map(Number);
  const hoje = new Date();
  // Compara dias de calendário, evitando diferenças de horário/fuso e horário de verão.
  return Math.round((Date.UTC(ano, mes - 1, dia) -
    Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) / 86400000);
}

function situacaoLote(lote) {
  if (lote.status === 'DESCARTADO') return { codigo: 'DESCARTADO', cls: 'badge badge-gray', txt: 'Descartado' };
  const dias = diasParaVencer(lote.data_venci);
  if (lote.status === 'VENCIDO' || dias < 0) return { codigo: 'VENCIDO', cls: 'badge badge-red', txt: 'Vencido' };
  if (dias <= 7) return { codigo: 'CRITICO', cls: 'badge badge-red', txt: 'Crítico' };
  if (dias <= 30) return { codigo: 'AVISO', cls: 'badge badge-yellow', txt: 'Aviso' };
  return { codigo: 'ATIVO', cls: 'badge badge-green', txt: 'Ativo' };
}

export default function Lotes() {
  const data = useData();
  const [form, setForm]         = useState(emptyForm);
  const [editId, setEditId]     = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filtroMed, setFiltroMed] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [processandoId, setProcessandoId] = useState(null);

  const lotesFiltrados = useMemo(() => {
    const base = data.lotes.filter(l =>
      (filtroMed === 'todos' || l.id_medicamento === filtroMed) &&
      (filtroStatus === 'todos' || situacaoLote(l).codigo === filtroStatus)
    );
    return [...base].sort((a, b) => new Date(a.data_venci).getTime() - new Date(b.data_venci).getTime());
  }, [data.lotes, filtroMed, filtroStatus]);

  const abrirEditar = (l) => {
    if (l.status === 'DESCARTADO') return;
    setForm({ id_medicamento: l.id_medicamento, numero_lote: l.numero_lote, data_fabri: l.data_fabri?.slice(0, 10) ?? '', data_venci: l.data_venci.slice(0, 10), quantidade: l.quantidade, preco_compra: l.preco_compra, preco_venda: l.preco_venda });
    setEditId(l.id_lote);
    setShowForm(true);
  };

  const fecharForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id_medicamento) return alert('Selecione um medicamento');
    try {
      if (editId) await data.atualizarLote(editId, {
        ...form, status: data.lotes.find(l => l.id_lote === editId)?.status || 'ATIVO',
      });
      else        await data.adicionarLote({ ...form, status: 'ATIVO' });
      fecharForm();
    } catch (err) { alert(err?.response?.data?.error || 'Erro ao salvar lote.'); }
  };

  const handleDescartar = async (lote) => {
    const medicamento = data.getMedicamento(lote.id_medicamento);
    if (!confirm(`Descartar o lote ${lote.numero_lote} de ${medicamento?.nome_comercial ?? 'medicamento'}? O saldo atual será zerado. O cadastro e as vendas serão preservados. Esta ação não pode ser desfeita pela edição.`)) return;
    setProcessandoId(lote.id_lote);
    try {
      await data.descartarLote(lote.id_lote);
      if (editId === lote.id_lote) fecharForm();
    } catch (err) {
      alert(err?.response?.data?.error || 'Erro ao descartar lote.');
    } finally {
      setProcessandoId(null);
    }
  };

  const handleExcluir = async (lote) => {
    if (!confirm(`Excluir permanentemente o cadastro do lote ${lote.numero_lote}? Para registrar descarte de estoque, utilize Descartar lote.`)) return;
    setProcessandoId(lote.id_lote);
    try {
      await data.deletarLote(lote.id_lote);
      if (editId === lote.id_lote) fecharForm();
    } catch (err) {
      alert(err?.response?.data?.error || 'Erro ao excluir lote.');
    } finally {
      setProcessandoId(null);
    }
  };

  const totalValor = lotesFiltrados.reduce((t, l) => t + Number(l.quantidade) * Number(l.preco_compra), 0);

  return (
    <div className="space-y">
      <div className="page-header">
        <div><h1>Lotes</h1><p>Gerenciamento de lotes e validade</p></div>
        <button className="btn btn-primary" onClick={() => { fecharForm(); setShowForm(s => !s); }}>
          <Plus size={16} /> Novo Lote
        </button>
      </div>

      {/* Modal: Novo/Editar Lote */}
      {showForm && (
        <div className="modal-overlay" onClick={fecharForm}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Editar Lote' : 'Novo Lote'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={fecharForm}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <form id="form-lote" onSubmit={handleSubmit}>
                <div className="input-row" style={{ marginBottom: 12 }}>
                  <div className="form-group">
                    <label>Medicamento *</label>
                    <select className="input" required value={form.id_medicamento}
                      onChange={e => setForm({ ...form, id_medicamento: Number(e.target.value) })}>
                      <option value={0}>Selecione...</option>
                      {data.medicamentos.filter(m => m.ativo).sort((a, b) => a.nome_comercial.localeCompare(b.nome_comercial, 'pt-BR', { sensitivity: 'base', numeric: true }) || data.formatarMedicamento(a).localeCompare(data.formatarMedicamento(b), 'pt-BR', { sensitivity: 'base', numeric: true })).map(m => (
                        <option key={m.id_medicamento} value={m.id_medicamento}>{data.formatarMedicamento(m)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Nº do Lote *</label>
                    <input className="input" placeholder="Ex: L001" required value={form.numero_lote}
                      onChange={e => setForm({ ...form, numero_lote: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Data de Fabricação</label>
                    <input className="input" type="date" value={form.data_fabri}
                      onChange={e => setForm({ ...form, data_fabri: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Data de Vencimento *</label>
                    <input className="input" type="date" required value={form.data_venci}
                      onChange={e => setForm({ ...form, data_venci: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Quantidade</label>
                    <input className="input" type="number" min={0} value={form.quantidade}
                      onChange={e => setForm({ ...form, quantidade: Number(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label>Preço de Compra (R$)</label>
                    <input className="input" type="number" step="0.01" min={0} value={form.preco_compra}
                      onChange={e => setForm({ ...form, preco_compra: Number(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label>Preço de Venda (R$)</label>
                    <input className="input" type="number" step="0.01" min={0} value={form.preco_venda}
                      onChange={e => setForm({ ...form, preco_venda: Number(e.target.value) })} />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={fecharForm}>Cancelar</button>
              <button type="submit" form="form-lote" className="btn btn-primary">{editId ? 'Atualizar' : 'Cadastrar'}</button>
            </div>
          </div>
        </div>
      )}


      {/* Filtro + stats */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="form-group" style={{ minWidth: 220 }}>
          <label htmlFor="filtro-medicamento">Filtrar por medicamento</label>
          <select id="filtro-medicamento" className="input" value={filtroMed}
            onChange={e => setFiltroMed(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}>
            <option value="todos">Todos</option>
            {data.medicamentos.filter(m => m.ativo).sort((a, b) => a.nome_comercial.localeCompare(b.nome_comercial, 'pt-BR', { sensitivity: 'base', numeric: true }) || data.formatarMedicamento(a).localeCompare(data.formatarMedicamento(b), 'pt-BR', { sensitivity: 'base', numeric: true })).map(m => (
              <option key={m.id_medicamento} value={m.id_medicamento}>{data.formatarMedicamento(m)}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ minWidth: 200 }}>
          <label htmlFor="filtro-status">Filtrar por status</label>
          <select id="filtro-status" className="input" value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}>
            <option value="todos">Todos os status</option>
            <option value="ATIVO">Ativo (sem alerta)</option>
            <option value="CRITICO">Crítico (até 7 dias)</option>
            <option value="AVISO">Aviso (8 a 30 dias)</option>
            <option value="VENCIDO">Vencido</option>
            <option value="DESCARTADO">Descartado</option>
          </select>
        </div>
        <div className="grid-3" style={{ flex: 1 }}>
          {[
            { label: 'Total de Lotes', value: lotesFiltrados.length },
            { label: 'Itens', value: lotesFiltrados.reduce((t, l) => t + Number(l.quantidade), 0) },
            { label: 'Valor Total', value: `R$ ${totalValor.toFixed(2)}` },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ padding: '12px 16px' }}>
              <p className="stat-label">{s.label}</p>
              <p style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Medicamento</th><th>Lote</th><th>Vencimento</th><th className="text-center">Status</th>
                <th className="text-right">Qtd</th><th className="text-right">Pr. Compra</th>
                <th className="text-right">Pr. Venda</th><th className="text-right">Total</th>
                <th className="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lotesFiltrados.length === 0 ? (
                <tr><td colSpan={9} className="text-center" style={{ padding: 32, color: 'var(--text-muted)' }}>Nenhum lote encontrado.</td></tr>
              ) : lotesFiltrados.map(l => {
                const s = situacaoLote(l);
                return (
                  <tr key={l.id_lote}>
                    <td style={{ fontWeight: 600 }}>
                      {(() => { const m = data.getMedicamento(l.id_medicamento); return m ? data.formatarMedicamento(m) : '—'; })()}
                    </td>
                    <td>{l.numero_lote}</td>
                    <td>{new Date(l.data_venci).toLocaleDateString('pt-BR')}</td>
                    <td className="text-center">
                      <span className={s.cls} style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                        {s.codigo === 'CRITICO' && <AlertCircle size={11} />}{s.txt}
                      </span>
                    </td>
                    <td className="text-right">{l.quantidade}</td>
                    <td className="text-right">R$ {Number(l.preco_compra).toFixed(2)}</td>
                    <td className="text-right">R$ {Number(l.preco_venda).toFixed(2)}</td>
                    <td className="text-right">R$ {(Number(l.quantidade) * Number(l.preco_compra)).toFixed(2)}</td>
                    <td className="text-center">
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button type="button" className="btn btn-ghost btn-icon"
                          style={{ color: 'var(--primary)' }} onClick={() => abrirEditar(l)}
                          disabled={processandoId !== null || l.status === 'DESCARTADO'}
                          title="Editar lote" aria-label={`Editar lote ${l.numero_lote}`}>
                          <Edit2 size={15} />
                        </button>
                        <button type="button" className="btn btn-outline btn-sm"
                          style={{ color: 'var(--warning)' }} onClick={() => handleDescartar(l)}
                          disabled={processandoId !== null || l.status === 'DESCARTADO'}
                          title="Zera o estoque e preserva o cadastro"
                          aria-label={`Descartar lote ${l.numero_lote}`}>
                          <PackageX size={15} /> Descartar
                        </button>
                        <button type="button" className="btn btn-ghost btn-icon"
                          style={{ color: 'var(--danger)' }} onClick={() => handleExcluir(l)}
                          disabled={processandoId !== null}
                          title="Excluir cadastro" aria-label={`Excluir cadastro do lote ${l.numero_lote}`}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
