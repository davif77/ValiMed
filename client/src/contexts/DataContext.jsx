import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const API = '/api';
const Ctx = createContext(undefined);

export function DataProvider({ children }) {
  const [medicamentos, setMedicamentos] = useState([]);
  const [lotes, setLotes]               = useState([]);
  const [vendas, setVendas]             = useState([]);
  const [clientes, setClientes]         = useState([]);
  const [loading, setLoading]           = useState(true);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const [m, l, c, v] = await Promise.all([
        axios.get(`${API}/medicamentos`).catch(() => ({ data: [] })),
        axios.get(`${API}/lotes`).catch(() => ({ data: [] })),
        axios.get(`${API}/clientes`).catch(() => ({ data: [] })),
        axios.get(`${API}/vendas`).catch(() => ({ data: [] })),
      ]);
      setMedicamentos(m.data);
      setLotes(l.data);
      setClientes(c.data);
      setVendas(v.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  // ── Medicamentos ──
  const adicionarMedicamento = async (med) => {
    const { data } = await axios.post(`${API}/medicamentos`, med);
    setMedicamentos(p => [...p, { ...med, id_medicamento: data.id_medicamento }]);
  };

  // helper: formata medicamento para exibição no PDV
  const formatarMedicamento = (m) =>
    [m.nome_comercial, m.dosagem, m.qtd_caixa, m.fabricante].filter(Boolean).join(' · ');

  const deletarMedicamento = async (id) => {
    await axios.delete(`${API}/medicamentos/${id}`);
    setMedicamentos(p => p.filter(m => m.id_medicamento !== id));
  };

  const getMedicamento = (id) => medicamentos.find(m => m.id_medicamento === id);
  const getMedicamentoPorCodBarra = (cod) => medicamentos.find(m => m.cod_barra === cod);

  // ── Lotes ──
  const adicionarLote = async (lote) => {
    const { data } = await axios.post(`${API}/lotes`, lote);
    setLotes(p => [...p, { ...lote, id_lote: data.id_lote }]);
  };

  const atualizarLote = async (id, lote) => {
    await axios.put(`${API}/lotes/${id}`, lote);
    setLotes(p => p.map(l => l.id_lote === id ? { ...l, ...lote } : l));
  };

  const deletarLote = async (id) => {
    await axios.delete(`${API}/lotes/${id}`);
    setLotes(p => p.filter(l => l.id_lote !== id));
  };

  const getLotesPorMedicamento = (id) => lotes.filter(l => l.id_medicamento === id);

  const getLotesPorVencer = (dias) => {
    const hoje  = new Date(); hoje.setHours(0, 0, 0, 0);
    const limit = new Date(hoje.getTime() + dias * 86400000);
    return lotes.filter(l => {
      const v = new Date(l.data_venci);
      return l.status === 'ATIVO' && v > hoje && v <= limit;
    });
  };

  const getLotesVencidos = () => {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    return lotes.filter(l => new Date(l.data_venci) < hoje);
  };

  const isLoteVencido = (lote) => {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    return new Date(lote.data_venci) < hoje;
  };

  // ── Vendas ──
  const adicionarVenda = async (itens, cliente_id) => {
    let valor_total = 0;
    const itensEnriquecidos = itens.map(item => {
      const lote = lotes.find(l => l.id_lote === item.lote_id);
      const preco_unitario = Number(lote?.preco_venda ?? 0);
      valor_total += item.quantidade * preco_unitario;
      return { ...item, preco_unitario };
    });
    try {
      await axios.post(`${API}/vendas`, { itens: itensEnriquecidos, cliente_id, valor_total });
      await carregarDados();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : null;
      throw new Error(msg || 'Erro ao processar venda.');
    }
  };

  // ── Clientes ──
  const adicionarCliente = async (c) => {
    const { data } = await axios.post(`${API}/clientes`, c);
    setClientes(p => [...p, { ...c, id_cliente: data.id_cliente, data_cadastro: new Date().toISOString() }]);
  };

  const atualizarCliente = async (id, c) => {
    await axios.put(`${API}/clientes/${id}`, c);
    setClientes(p => p.map(cl => cl.id_cliente === id ? { ...cl, ...c } : cl));
  };

  const deletarCliente = async (id) => {
    await axios.delete(`${API}/clientes/${id}`);
    setClientes(p => p.filter(c => c.id_cliente !== id));
  };

  const getCliente = (id) => clientes.find(c => c.id_cliente === id);

  // ── Stats ──
  const totalMedicamentos = () => medicamentos.filter(m => m.ativo).length;
  const totalLotes        = () => lotes.filter(l => l.status === 'ATIVO').length;
  const totalItensEstoque = () => lotes.reduce((t, l) => t + (l.status === 'ATIVO' ? Number(l.quantidade) : 0), 0);
  const valorEstoque      = () => lotes.reduce((t, l) => t + (l.status === 'ATIVO' ? Number(l.quantidade) * Number(l.preco_compra) : 0), 0);
  const lotesComAlerta    = () => {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const em30 = new Date(hoje.getTime() + 30 * 86400000);
    return lotes.filter(l => l.status === 'ATIVO' && new Date(l.data_venci) <= em30 && new Date(l.data_venci) >= hoje);
  };

  return (
    <Ctx.Provider value={{
      medicamentos, lotes, vendas, clientes, loading, carregarDados,
      adicionarMedicamento, deletarMedicamento, getMedicamento, getMedicamentoPorCodBarra, formatarMedicamento,
      adicionarLote, atualizarLote, deletarLote, getLotesPorMedicamento, getLotesPorVencer, getLotesVencidos, isLoteVencido,
      adicionarVenda,
      adicionarCliente, atualizarCliente, deletarCliente, getCliente,
      totalMedicamentos, totalLotes, totalItensEstoque, valorEstoque, lotesComAlerta,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useData deve ser usado dentro de DataProvider');
  return ctx;
}
