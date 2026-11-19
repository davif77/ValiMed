import { useState, useRef } from 'react';
import { Plus, Trash2, Search, Edit2, Save } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const empty = { nome_comercial: '', cod_barra: '', qtd_caixa: '', dosagem: '', fabricante: '', ativo: true };

export default function Medicamentos() {
  const { medicamentos, adicionarMedicamento, atualizarMedicamento, deletarMedicamento, formatarMedicamento } = useData();
  const [form, setForm]   = useState(empty);
  const [busca, setBusca] = useState('');
  const [erro, setErro]   = useState('');
  const [editId, setEditId] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const nomeInput = useRef(null);

  const limparForm = () => {
    setForm(empty);
    setEditId(null);
    setErro('');
  };

  const abrirEdicao = (med) => {
    setForm({
      nome_comercial: med.nome_comercial ?? '',
      cod_barra: med.cod_barra ?? '',
      qtd_caixa: med.qtd_caixa ?? '',
      dosagem: med.dosagem ?? '',
      fabricante: med.fabricante ?? '',
      ativo: med.ativo,
    });
    setEditId(med.id_medicamento);
    setErro('');
    nomeInput.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    nomeInput.current?.focus({ preventScroll: true });
  };

  const filtrados = medicamentos.filter(m =>
    m.nome_comercial.toLowerCase().includes(busca.toLowerCase()) ||
    m.cod_barra.includes(busca) ||
    (m.fabricante ?? '').toLowerCase().includes(busca.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (salvando) return;
    setErro('');
    const dados = {
      ...form,
      nome_comercial: form.nome_comercial.trim(),
      cod_barra: form.cod_barra.trim(),
    };
    if (!dados.nome_comercial || !dados.cod_barra) {
      setErro('Nome comercial e código de barras são obrigatórios.');
      return;
    }
    setSalvando(true);
    try {
      if (editId !== null) await atualizarMedicamento(editId, dados);
      else await adicionarMedicamento(dados);
      limparForm();
    } catch (err) {
      setErro(err?.response?.data?.error || 'Erro ao salvar medicamento. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = async (id, nome) => {
    if (!confirm(`Remover "${nome}"?`)) return;
    try { await deletarMedicamento(id); if (editId === id) limparForm(); }
    catch { alert('Erro ao remover. Pode haver lotes vinculados.'); }
  };

  return (
    <div className="space-y">
      <div className="page-header">
        <div><h1>Medicamentos</h1><p>Cadastro de medicamentos</p></div>
      </div>

      {/* Form */}
      <div className="card">
        <div className="card-header"><h2>{editId !== null ? 'Editar Medicamento' : 'Novo Medicamento'}</h2></div>
        <div className="card-body">
          {erro && <div className="alert alert-red" style={{ marginBottom: 12 }}>{erro}</div>}
          <form onSubmit={handleSubmit}>
            <fieldset disabled={salvando} style={{ border: 0, padding: 0, minWidth: 0 }}>
            <div className="input-row" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label>Nome Comercial *</label>
                <input className="input" placeholder="Ex: Dipirona" required maxLength={100} ref={nomeInput}
                  value={form.nome_comercial} onChange={e => setForm({ ...form, nome_comercial: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Dosagem</label>
                <input className="input" placeholder="Ex: 1g" maxLength={50}
                  value={form.dosagem} onChange={e => setForm({ ...form, dosagem: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Quantidade na Caixa</label>
                <input className="input" placeholder="Ex: c/30" maxLength={50}
                  value={form.qtd_caixa} onChange={e => setForm({ ...form, qtd_caixa: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Fabricante / Marca</label>
                <input className="input" placeholder="Ex: Prati" maxLength={100}
                  value={form.fabricante} onChange={e => setForm({ ...form, fabricante: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Código de Barras *</label>
                <input className="input" placeholder="Ex: 7891234567890" required maxLength={50}
                  value={form.cod_barra} onChange={e => setForm({ ...form, cod_barra: e.target.value })} />
              </div>
            </div>

  

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary">
                {editId !== null ? <Save size={16} /> : <Plus size={16} />}
                {salvando ? 'Salvando...' : editId !== null ? 'Salvar alterações' : 'Cadastrar'}
              </button>
              {editId !== null && (
                <button type="button" className="btn btn-outline" onClick={limparForm}>Cancelar edição</button>
              )}
            </div>
            </fieldset>
          </form>
        </div>
      </div>

      {/* List */}
      <div className="card">
        <div className="card-header">
          <h2>Medicamentos Cadastrados ({filtrados.length})</h2>
          <div className="search-bar" style={{ width: 280 }}>
            <Search size={16} />
            <input placeholder="Buscar nome, fabricante ou código..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Medicamento</th>
                <th>Dosagem</th>
                <th>Qtd. Caixa</th>
                <th>Fabricante / Marca</th>
                <th>Código de Barras</th>
                <th className="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={6} className="text-center" style={{ padding: 32, color: 'var(--text-muted)' }}>Nenhum medicamento encontrado.</td></tr>
              ) : filtrados.map(m => (
                <tr key={m.id_medicamento}>
                  <td>
                    <span style={{ fontWeight: 600 }}>{m.nome_comercial}</span>
                    <br />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatarMedicamento(m)}</span>
                  </td>
                  <td>{m.dosagem}</td>
                  <td>{m.qtd_caixa}</td>
                  <td>{m.fabricante}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{m.cod_barra}</td>
                  <td className="text-center">
                    <button type="button" className="btn btn-ghost btn-icon"
                      style={{ color: 'var(--primary)' }} disabled={salvando}
                      title="Editar medicamento" aria-label={`Editar ${m.nome_comercial}`}
                      onClick={() => abrirEdicao(m)}>
                      <Edit2 size={16} />
                    </button>
                    <button type="button" className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }}
                      disabled={salvando} title="Excluir medicamento" aria-label={`Excluir ${m.nome_comercial}`}
                      onClick={() => handleDeletar(m.id_medicamento, m.nome_comercial)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
