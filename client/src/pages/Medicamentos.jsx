import { useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const empty = { nome_comercial: '', cod_barra: '', qtd_caixa: '', dosagem: '', fabricante: '', ativo: true };

export default function Medicamentos() {
  const { medicamentos, adicionarMedicamento, deletarMedicamento, formatarMedicamento } = useData();
  const [form, setForm]   = useState(empty);
  const [busca, setBusca] = useState('');
  const [erro, setErro]   = useState('');

  const filtrados = medicamentos.filter(m =>
    m.nome_comercial.toLowerCase().includes(busca.toLowerCase()) ||
    m.cod_barra.includes(busca) ||
    m.fabricante.toLowerCase().includes(busca.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      await adicionarMedicamento(form);
      setForm(empty);
    } catch {
      setErro('Erro ao cadastrar. Verifique se o código de barras já existe.');
    }
  };

  const handleDeletar = async (id, nome) => {
    if (!confirm(`Remover "${nome}"?`)) return;
    try { await deletarMedicamento(id); }
    catch { alert('Erro ao remover. Pode haver lotes vinculados.'); }
  };

  return (
    <div className="space-y">
      <div className="page-header">
        <div><h1>Medicamentos</h1><p>Cadastro de medicamentos</p></div>
      </div>

      {/* Form */}
      <div className="card">
        <div className="card-header"><h2>Novo Medicamento</h2></div>
        <div className="card-body">
          {erro && <div className="alert alert-red" style={{ marginBottom: 12 }}>{erro}</div>}
          <form onSubmit={handleSubmit}>
            <div className="input-row" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label>Nome Comercial *</label>
                <input className="input" placeholder="Ex: Dipirona" required
                  value={form.nome_comercial} onChange={e => setForm({ ...form, nome_comercial: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Dosagem</label>
                <input className="input" placeholder="Ex: 1g"
                  value={form.dosagem} onChange={e => setForm({ ...form, dosagem: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Quantidade na Caixa</label>
                <input className="input" placeholder="Ex: c/30"
                  value={form.qtd_caixa} onChange={e => setForm({ ...form, qtd_caixa: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Fabricante / Marca</label>
                <input className="input" placeholder="Ex: Prati"
                  value={form.fabricante} onChange={e => setForm({ ...form, fabricante: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Código de Barras *</label>
                <input className="input" placeholder="Ex: 7891234567890" required
                  value={form.cod_barra} onChange={e => setForm({ ...form, cod_barra: e.target.value })} />
              </div>
            </div>

  

            <button type="submit" className="btn btn-primary"><Plus size={16} /> Cadastrar</button>
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
                    <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }}
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
