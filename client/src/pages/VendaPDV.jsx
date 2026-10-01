import { useState, useMemo } from 'react';
import { Search, Plus, Trash2, X, User, CreditCard, AlertTriangle } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export default function VendaPDV() {
  const data = useData();
  const [busca, setBusca]       = useState('');
  const [carrinho, setCarrinho] = useState([]);
  const [cliente, setCliente]   = useState(null);
  const [modalCliente, setModalCliente] = useState(false);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [modalLotes, setModalLotes]     = useState(null);

  const medDoModal = data.medicamentos.find(m => m.id_medicamento === modalLotes);

  const medicamentos = useMemo(() =>
    data.medicamentos.filter(m => m.ativo && (
      m.nome_comercial.toLowerCase().includes(busca.toLowerCase()) ||
      m.cod_barra.includes(busca)
    )), [data.medicamentos, busca]);

  const clientesFiltrados = data.clientes.filter(c =>
    c.ativo && (c.nome.toLowerCase().includes(buscaCliente.toLowerCase()) || c.cpf.includes(buscaCliente))
  );

  const lotesDisponiveis = useMemo(() =>
    data.lotes
      .filter(l => l.id_medicamento === modalLotes && l.status === 'ATIVO' && l.quantidade > 0)
      .sort((a, b) => new Date(a.data_venci).getTime() - new Date(b.data_venci).getTime()),
    [data.lotes, modalLotes]
  );

  const total = carrinho.reduce((s, i) => s + i.quantidade * Number(i.lote.preco_venda), 0);

  const adicionarLote = (lote) => {
    if (data.isLoteVencido(lote)) {
      alert(`Não é possível vender este lote: venceu em ${new Date(lote.data_venci).toLocaleDateString('pt-BR')}.`);
      return;
    }
    setCarrinho(prev => {
      const ex = prev.find(i => i.lote.id_lote === lote.id_lote);
      if (ex) {
        if (ex.quantidade >= lote.quantidade) { alert('Limite de estoque atingido.'); return prev; }
        return prev.map(i => i.lote.id_lote === lote.id_lote ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { lote, quantidade: 1 }];
    });
    setModalLotes(null);
  };

  const finalizar = async () => {
    if (!carrinho.length) return alert('Carrinho vazio.');
    try {
      await data.adicionarVenda(
        carrinho.map(i => ({ lote_id: i.lote.id_lote, quantidade: i.quantidade })),
        cliente?.id_cliente
      );
      setCarrinho([]);
      setCliente(null);
      alert('Venda realizada com sucesso!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao processar venda.');
    }
  };

  return (
    <div className="pdv-layout">

      {/* Catálogo */}
      <div className="pdv-catalog">
        <h1 style={{ marginBottom: 16, fontSize: 20, fontWeight: 700 }}>Venda de Medicamentos</h1>
        <div className="search-bar" style={{ marginBottom: 20, maxWidth: 400 }}>
          <Search size={16} />
          <input placeholder="Buscar por nome ou código de barras..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>

        {medicamentos.length === 0 ? (
          <div className="empty-state"><p>Nenhum medicamento encontrado.</p></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {medicamentos.map(m => {
              const disponiveis = data.lotes.filter(l => l.id_medicamento === m.id_medicamento && l.status === 'ATIVO' && l.quantidade > 0 && !data.isLoteVencido(l));
              const qtdTotal = disponiveis.reduce((t, l) => t + Number(l.quantidade), 0);
              return (
                <button
                  key={m.id_medicamento}
                  className="btn"
                  style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, padding: '14px', textAlign: 'left', border: '1px solid var(--border)', background: 'white' }}
                  onClick={() => setModalLotes(m.id_medicamento)}
                  disabled={qtdTotal === 0}
                >
                  <span style={{ fontWeight: 600 }}>{m.nome_comercial}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{data.formatarMedicamento(m)}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: qtdTotal > 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {qtdTotal > 0 ? `${qtdTotal} un. disponíveis` : 'Sem estoque disponível'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        </div>

      {/* Carrinho */}
      <div className="pdv-cart">
        <div className="card-header">
          <h2>Carrinho</h2>
          {carrinho.length > 0 && (
            <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setCarrinho([])}><Trash2 size={16} /></button>
          )}
        </div>

        {/* Itens */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {carrinho.length === 0 ? (
            <div className="empty-state"><p>Nenhum item no carrinho.</p></div>
          ) : carrinho.map((item, i) => {
            const med = data.getMedicamento(item.lote.id_medicamento);
            return (
              <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{med?.nome_comercial}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Lote {item.lote.numero_lote} · x{item.quantidade}</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>R$ {(item.quantidade * Number(item.lote.preco_venda)).toFixed(2)}</p>
                </div>
                <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }}
                  onClick={() => setCarrinho(p => p.filter((_,j) => j !== i))}><X size={14} /></button>
              </div>
            );
          })}
        </div>

        {/* Cliente */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
            Cliente (opcional)
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8, fontSize: 11 }} onClick={() => setModalCliente(true)}>
              {cliente ? 'Trocar' : 'Selecionar'}
            </button>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px' }}>
            <User size={16} color={cliente ? 'var(--success)' : 'var(--text-muted)'} />
            <span style={{ fontSize: 13, color: cliente ? 'var(--text)' : 'var(--text-muted)' }}>
              {cliente ? cliente.nome : 'Consumidor Final (Venda Avulsa)'}
            </span>
          </div>
        </div>

        {/* Total + botão */}
        <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <span style={{ color: 'var(--text-muted)' }}>Total</span>
            <span style={{ fontSize: 24, fontWeight: 700 }}>R$ {total.toFixed(2)}</span>
          </div>
          <button className="btn btn-success" style={{ width: '100%', padding: '12px', fontSize: 15, justifyContent: 'center' }}
            disabled={!carrinho.length} onClick={finalizar}>
            <CreditCard size={18} /> Finalizar Venda
          </button>
        </div>
      </div>

      {/* Modal: escolher lote */}
      {modalLotes !== null && (
        <div className="modal-overlay" onClick={() => setModalLotes(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Escolher Lote</h3>
                {medDoModal && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                    {data.formatarMedicamento(medDoModal)}
                  </p>
                )}
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModalLotes(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lotesDisponiveis.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>Nenhum lote disponível.</p>
              ) : lotesDisponiveis.map(l => {
                const vencido = data.isLoteVencido(l);
                return (
                  <button
                    key={l.id_lote}
                    className="btn"
                    style={{
                      flexDirection: 'column', alignItems: 'flex-start', gap: 4, padding: '12px 14px',
                      background: vencido ? '#fef2f2' : 'white',
                      border: vencido ? '1px solid #fca5a5' : '1px solid var(--border)',
                      cursor: vencido ? 'not-allowed' : 'pointer',
                    }}
                    onClick={() => adicionarLote(l)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, color: vencido ? 'var(--danger)' : 'var(--text)' }}>Lote: {l.numero_lote}</span>
                      {vencido && <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={11} /> Vencido</span>}
                    </div>
                    <span style={{ fontSize: 12, color: vencido ? 'var(--danger)' : 'var(--text-muted)', fontWeight: vencido ? 600 : 400 }}>
                      Validade: {new Date(l.data_venci).toLocaleDateString('pt-BR')} · Disponível: {l.quantidade} un.
                    </span>
                    {vencido && (
                      <span style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>
                        ⚠ Este lote está vencido e não pode ser vendido.
                      </span>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 700, color: vencido ? 'var(--danger)' : 'var(--success)' }}>R$ {Number(l.preco_venda).toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: cliente */}
      {modalCliente && (
        <div className="modal-overlay" onClick={() => setModalCliente(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Selecionar Cliente</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModalCliente(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="search-bar" style={{ marginBottom: 12 }}>
                <Search size={15} />
                <input placeholder="Nome ou CPF..." value={buscaCliente} onChange={e => setBuscaCliente(e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button className="btn btn-outline" style={{ justifyContent: 'flex-start', color: 'var(--text-muted)', fontStyle: 'italic' }}
                  onClick={() => { setCliente(null); setModalCliente(false); }}>
                  Venda Avulsa (sem cliente)
                </button>
                {clientesFiltrados.map(c => (
                  <button key={c.id_cliente} className="btn btn-outline" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}
                    onClick={() => { setCliente(c); setModalCliente(false); }}>
                    <span style={{ fontWeight: 600 }}>{c.nome}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>CPF: {c.cpf}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
