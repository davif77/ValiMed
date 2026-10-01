-- ================================================
-- BANCO DE DADOS: farmacia_validade
-- Este é o schema que você já está usando.
-- Mantido aqui apenas como referência / backup.
-- ================================================

DROP DATABASE IF EXISTS farmacia_validade;
CREATE DATABASE farmacia_validade;
USE farmacia_validade;

-- 1. Tabela de Medicamentos
CREATE TABLE medicamentos (
    id_medicamento INT AUTO_INCREMENT PRIMARY KEY,
    nome_comercial VARCHAR(100) NOT NULL,
    cod_barra VARCHAR(50) UNIQUE NOT NULL,
    principio_ativo VARCHAR(100),
    dosagem VARCHAR(50),
    fabricante VARCHAR(100),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Clientes
CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    telefone VARCHAR(15),
    email VARCHAR(100),
    endereco TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Lotes
CREATE TABLE lotes (
    id_lote INT AUTO_INCREMENT PRIMARY KEY,
    id_medicamento INT NOT NULL,
    numero_lote VARCHAR(50) NOT NULL,
    data_fabri DATE,
    data_venci DATE NOT NULL,
    quantidade INT NOT NULL DEFAULT 0,
    preco_compra DECIMAL(10,2),
    preco_venda DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('ATIVO', 'VENCIDO', 'DESCARTADO') DEFAULT 'ATIVO',
    CONSTRAINT fk_lote_medicamento FOREIGN KEY (id_medicamento)
        REFERENCES medicamentos(id_medicamento) ON DELETE CASCADE
);

-- 4. Tabela de Vendas
CREATE TABLE vendas (
    id_venda INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NULL,
    valor_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_venda_cliente FOREIGN KEY (id_cliente)
        REFERENCES clientes(id_cliente) ON DELETE SET NULL
);

-- 5. Tabela de Itens da Venda
CREATE TABLE itens_venda (
    id_item INT AUTO_INCREMENT PRIMARY KEY,
    id_venda INT NOT NULL,
    id_lote INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_item_venda FOREIGN KEY (id_venda) REFERENCES vendas(id_venda) ON DELETE CASCADE,
    CONSTRAINT fk_item_lote FOREIGN KEY (id_lote) REFERENCES lotes(id_lote)
);

-- Dados de exemplo (opcional)
INSERT INTO medicamentos (nome_comercial, cod_barra, principio_ativo, dosagem, fabricante) VALUES
  ('Dipirona 500mg',    '7891234567890', 'Dipirona Sódica', '500mg', 'EMS'),
  ('Amoxicilina 500mg', '7891234567891', 'Amoxicilina',     '500mg', 'Medley'),
  ('Omeprazol 20mg',    '7891234567892', 'Omeprazol',       '20mg',  'Neo Química');
