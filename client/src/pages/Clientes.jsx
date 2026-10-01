import { useState } from 'react';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const empty = { nome: '', cpf: '', telefone: '', email: '', endereco: '', ativo: true };

export default function Clientes() {
  const data = useData();
  const [form, setForm]     = useState(empty);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [busca, setBusca]   = useState('');

  const filtrados = data.clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.cpf.includes(busca) ||
    c.email.toLowerCase().includes(busca.toLowerCase())
  );

  const abrirEditar = (c) => {
    setForm({ nome: c.nome, cpf: c.cpf, telefone: c.telefone, email: c.email, endereco: c.endereco, ativo: c.ativo });
    setEditId(c.id_cliente); setShowForm(true);
  };

  const fecharForm = () => { setShowForm(false); setEditId(null); setForm(empty); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) await data.atualizarCliente(editId, form);
      else        await data.adicionarCliente(form);
      fecharForm();
    } catch { alert('Erro ao salvar cliente.'); }
  };

  return (
    <div className="space-y">
      <div className="page-header">
        <div><h1>Clientes</h1><p>Cadastro e gerenciamento</p></div>
        <button className="btn btn-primary" onClick={() => { fecharForm(); setShowForm(s => !s); }}>
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-header"><h2>{editId ? 'Editar Cliente' : 'Novo Cliente'}</h2></div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="input-row" style={{ marginBottom: 12 }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Nome *</label>
                  <input className="input" placeholder="Ex: João Silva" required value={form.nome}
                    onChange={e => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>CPF *</label>
                  <input className="input" placeholder="123.456.789-00" required value={form.cpf}
                    onChange={e => setForm({ ...form, cpf: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Telefone</label>
                  <input className="input" placeholder="(11) 98765-4321" value={form.telefone}
                    onChange={e => setForm({ ...form, telefone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>E-mail</label>
                  <input className="input" type="email" placeholder="joao@email.com" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Endereço</label>
                  <input className="input" placeholder="Rua A, 123" value={form.endereco}
                    onChange={e => setForm({ ...form, endereco: e.target.value })} />
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="ativo" checked={form.ativo} onChange={e => setForm({ ...form, ativo: e.target.checked })} />
                  <label htmlFor="ativo" style={{ marginBottom: 0 }}>Ativo</label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary">{editId ? 'Atualizar' : 'Cadastrar'}</button>
                <button type="button" className="btn btn-outline" onClick={fecharForm}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>Clientes ({filtrados.length})</h2>
          <div className="search-bar" style={{ width: 280 }}>
            <Search size={15} />
            <input placeholder="Buscar nome, CPF ou e-mail..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Nome</th><th>CPF</th><th>Telefone</th><th>E-mail</th><th className="text-center">Status</th><th className="text-center">Ações</th></tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={6} className="text-center" style={{ padding: 32, color: 'var(--text-muted)' }}>Nenhum cliente encontrado.</td></tr>
              ) : filtrados.map(c => (
                <tr key={c.id_cliente}>
                  <td style={{ fontWeight: 600 }}>{c.nome}</td>
                  <td>{c.cpf}</td>
                  <td>{c.telefone}</td>
                  <td>{c.email}</td>
                  <td className="text-center">
                    <span className={c.ativo ? 'badge badge-green' : 'badge badge-gray'}>{c.ativo ? 'Ativo' : 'Inativo'}</span>
                  </td>
                  <td className="text-center">
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button className="btn btn-ghost btn-icon" style={{ color: 'var(--primary)' }} onClick={() => abrirEditar(c)}><Edit2 size={15} /></button>
                      <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }}
                        onClick={() => confirm(`Remover "${c.nome}"?`) && data.deletarCliente(c.id_cliente)}><Trash2 size={15} /></button>
                    </div>
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
