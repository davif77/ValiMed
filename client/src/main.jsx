import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Medicamentos from './pages/Medicamentos';
import Lotes from './pages/Lotes';
import Clientes from './pages/Clientes';
import VendaPDV from './pages/VendaPDV';
import Vendas from './pages/Vendas';
import Relatorios from './pages/Relatorios';
import './index.css';

function LoadingScreen() {
  return (
    <main className="auth-loading">
      <div className="icon-box"><span className="loading-pulse">✚</span></div>
      <p>Verificando seu acesso...</p>
    </main>
  );
}

function ProtectedApplication() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <DataProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/medicamentos" element={<Medicamentos />} />
          <Route path="/lotes" element={<Lotes />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/venda-pdv" element={<VendaPDV />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Layout>
    </DataProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <ProtectedApplication />
    </AuthProvider>
  </BrowserRouter>
);
