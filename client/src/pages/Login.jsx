import { useState } from 'react';
import logo from './logo.png';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';


function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [enviando, setEnviando] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setErro('');
        setEnviando(true);

        try {
            const autenticado = await login(usuario, senha);
            if (autenticado !== false) {
                navigate('/', { replace: true });
            } else {
                setErro('Usuário ou senha inválidos.');
            }
        } catch (error) {
            setErro(error?.response?.data?.error || 'Não foi possível realizar o login.');
        } finally {
            setEnviando(false);
        }
    }

    return (
        <main className="login-container">
            <div className="logo-container">
                  <img src={logo} alt="ValiMeD" />
            </div>

            <section className="login-card">
                <h1>Login</h1>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="usuario">Usuário :</label>
                        <input
                            type="text"
                            id="usuario"
                            name="usuario"
                            value={usuario}
                            onChange={(event) => setUsuario(event.target.value)}
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="senha">Senha :</label>
                        <input
                            type="password"
                            id="senha"
                            name="senha"
                            value={senha}
                            onChange={(event) => setSenha(event.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {erro && <p className="login-error" role="alert">{erro}</p>}

                    <button type="submit" disabled={enviando}>
                        {enviando ? 'ENTRANDO...' : 'ENTRAR'}
                    </button>
                </form>
            </section>
        </main>
    );
}

export default Login;
