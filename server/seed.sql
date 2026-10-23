-- ValiMed: dados FICTÍCIOS de demonstração, sem valor clínico/comercial.
-- Execute schema.sql antes e este arquivo INTEIRO na mesma conexão.
-- 15 medicamentos, 10 clientes, 45 lotes e 10 vendas.
-- As datas são relativas ao dia da primeira importação.
-- Reexecutar preserva os dados: se houver qualquer código VALIMED-DEMO-,
-- a carga inteira será ignorada para não duplicar vendas nem repor estoque.
-- Requer CREATE ROUTINE (normalmente disponível no MySQL local com root).
SET NAMES utf8mb4;
USE farmacia_validade;

DELIMITER $$
DROP PROCEDURE IF EXISTS valimed_carregar_demo$$
CREATE PROCEDURE valimed_carregar_demo()
carga: BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    IF EXISTS (
        SELECT 1 FROM medicamentos WHERE cod_barra LIKE 'VALIMED-DEMO-%'
    ) THEN
        ROLLBACK;
        SELECT 'Carga ignorada: já existem medicamentos VALIMED-DEMO-. Os registros foram preservados.' AS resultado;
        LEAVE carga;
    END IF;

    -- Medicamentos: códigos e fabricantes fictícios.
    INSERT INTO medicamentos (nome_comercial, cod_barra, qtd_caixa, dosagem, fabricante)
    VALUES
    ('Dipirona', 'VALIMED-DEMO-001', 'c/30', '1g', 'Fabricante fictício'),
    ('Amoxicilina', 'VALIMED-DEMO-002', 'c/21', '500mg', 'Fabricante fictício'),
    ('Omeprazol', 'VALIMED-DEMO-003', 'c/28', '20mg', 'Fabricante fictício'),
    ('Paracetamol', 'VALIMED-DEMO-004', 'c/20', '750mg', 'Fabricante fictício'),
    ('Ibuprofeno', 'VALIMED-DEMO-005', 'c/20', '400mg', 'Fabricante fictício'),
    ('Losartana Potássica', 'VALIMED-DEMO-006', 'c/30', '50mg', 'Fabricante fictício'),
    ('Metformina', 'VALIMED-DEMO-007', 'c/30', '850mg', 'Fabricante fictício'),
    ('Dorflex', 'VALIMED-DEMO-008', 'c/36', 'comp.', 'Fabricante fictício'),
    ('Buscopan', 'VALIMED-DEMO-009', 'c/20', 'comp.', 'Fabricante fictício'),
    ('Neosaldina', 'VALIMED-DEMO-010', 'c/20', 'comp.', 'Fabricante fictício'),
    ('Loratadina', 'VALIMED-DEMO-011', 'c/12', '10mg', 'Fabricante fictício'),
    ('Cetoconazol Creme', 'VALIMED-DEMO-012', 'bisnaga 30g', '2%', 'Fabricante fictício'),
    ('Vitamina C', 'VALIMED-DEMO-013', 'c/60', '1g', 'Fabricante fictício'),
    ('Azitromicina', 'VALIMED-DEMO-014', 'c/3', '500mg', 'Fabricante fictício'),
    ('Insulina NPH', 'VALIMED-DEMO-015', 'frasco 10ml', '100UI/ml', 'Fabricante fictício');

    SET @m1 = (SELECT id_medicamento FROM medicamentos WHERE cod_barra = 'VALIMED-DEMO-001');
    SET @m2 = (SELECT id_medicamento FROM medicamentos WHERE cod_barra = 'VALIMED-DEMO-002');
    SET @m3 = (SELECT id_medicamento FROM medicamentos WHERE cod_barra = 'VALIMED-DEMO-003');
    SET @m4 = (SELECT id_medicamento FROM medicamentos WHERE cod_barra = 'VALIMED-DEMO-004');
    SET @m5 = (SELECT id_medicamento FROM medicamentos WHERE cod_barra = 'VALIMED-DEMO-005');
    SET @m6 = (SELECT id_medicamento FROM medicamentos WHERE cod_barra = 'VALIMED-DEMO-006');
    SET @m7 = (SELECT id_medicamento FROM medicamentos WHERE cod_barra = 'VALIMED-DEMO-007');
    SET @m8 = (SELECT id_medicamento FROM medicamentos WHERE cod_barra = 'VALIMED-DEMO-008');
    SET @m9 = (SELECT id_medicamento FROM medicamentos WHERE cod_barra = 'VALIMED-DEMO-009');
    SET @m10 = (SELECT id_medicamento FROM medicamentos WHERE cod_barra = 'VALIMED-DEMO-010');
    SET @m11 = (SELECT id_medicamento FROM medicamentos WHERE cod_barra = 'VALIMED-DEMO-011');
    SET @m12 = (SELECT id_medicamento FROM medicamentos WHERE cod_barra = 'VALIMED-DEMO-012');
    SET @m13 = (SELECT id_medicamento FROM medicamentos WHERE cod_barra = 'VALIMED-DEMO-013');
    SET @m14 = (SELECT id_medicamento FROM medicamentos WHERE cod_barra = 'VALIMED-DEMO-014');
    SET @m15 = (SELECT id_medicamento FROM medicamentos WHERE cod_barra = 'VALIMED-DEMO-015');

    -- Clientes: nomes e CPFs fictícios; e-mails reservados para exemplos.
    INSERT INTO clientes (nome, cpf, telefone, email, endereco)
    VALUES
    ('João Teste', '000.000.001-00', NULL, 'cliente1@example.com', 'Rua de Teste, 100'),
    ('Maria Teste', '000.000.002-00', NULL, 'cliente2@example.com', 'Rua de Teste, 200'),
    ('Carlos Teste', '000.000.003-00', NULL, 'cliente3@example.com', 'Rua de Teste, 300'),
    ('Ana Teste', '000.000.004-00', NULL, 'cliente4@example.com', 'Rua de Teste, 400'),
    ('Pedro Teste', '000.000.005-00', NULL, 'cliente5@example.com', 'Rua de Teste, 500'),
    ('Juliana Teste', '000.000.006-00', NULL, 'cliente6@example.com', 'Rua de Teste, 600'),
    ('Fernando Teste', '000.000.007-00', NULL, 'cliente7@example.com', 'Rua de Teste, 700'),
    ('Patrícia Teste', '000.000.008-00', NULL, 'cliente8@example.com', 'Rua de Teste, 800'),
    ('Ricardo Teste', '000.000.009-00', NULL, 'cliente9@example.com', 'Rua de Teste, 900'),
    ('Beatriz Teste', '000.000.010-00', NULL, 'cliente10@example.com', 'Rua de Teste, 1000');

    SET @c1 = (SELECT id_cliente FROM clientes WHERE cpf = '000.000.001-00');
    SET @c2 = (SELECT id_cliente FROM clientes WHERE cpf = '000.000.002-00');
    SET @c3 = (SELECT id_cliente FROM clientes WHERE cpf = '000.000.003-00');
    SET @c4 = (SELECT id_cliente FROM clientes WHERE cpf = '000.000.004-00');
    SET @c5 = (SELECT id_cliente FROM clientes WHERE cpf = '000.000.005-00');
    SET @c6 = (SELECT id_cliente FROM clientes WHERE cpf = '000.000.006-00');
    SET @c7 = (SELECT id_cliente FROM clientes WHERE cpf = '000.000.007-00');
    SET @c8 = (SELECT id_cliente FROM clientes WHERE cpf = '000.000.008-00');

    -- Quantidades representam o saldo atual, já após as vendas abaixo.
    -- Inserções SQL não passam pela baixa de estoque da API.
    -- A: vencido ou descartado; B: próximo; C: válido.
    INSERT INTO lotes
    (id_medicamento, numero_lote, data_fabri, data_venci,
     quantidade, preco_compra, preco_venda, status)
    VALUES
    (@m1, 'VALIMED-DEMO-001-A', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_SUB(CURDATE(), INTERVAL 60 DAY), 50, 3.50, 6.90, 'VENCIDO'),
    (@m1, 'VALIMED-DEMO-001-B', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 120, 3.50, 6.90, 'ATIVO'),
    (@m1, 'VALIMED-DEMO-001-C', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 365 DAY), 200, 3.50, 7.40, 'ATIVO'),
    (@m2, 'VALIMED-DEMO-002-A', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_SUB(CURDATE(), INTERVAL 60 DAY), 0, 8.00, 22.00, 'DESCARTADO'),
    (@m2, 'VALIMED-DEMO-002-B', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 60, 8.00, 22.00, 'ATIVO'),
    (@m2, 'VALIMED-DEMO-002-C', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 365 DAY), 150, 8.00, 22.50, 'ATIVO'),
    (@m3, 'VALIMED-DEMO-003-A', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_SUB(CURDATE(), INTERVAL 60 DAY), 20, 6.00, 15.50, 'VENCIDO'),
    (@m3, 'VALIMED-DEMO-003-B', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 60, 6.00, 15.50, 'ATIVO'),
    (@m3, 'VALIMED-DEMO-003-C', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 365 DAY), 300, 6.00, 16.00, 'ATIVO'),
    (@m4, 'VALIMED-DEMO-004-A', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_SUB(CURDATE(), INTERVAL 60 DAY), 15, 2.20, 5.50, 'VENCIDO'),
    (@m4, 'VALIMED-DEMO-004-B', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 1 DAY), 80, 2.20, 5.50, 'ATIVO'),
    (@m4, 'VALIMED-DEMO-004-C', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 365 DAY), 0, 2.20, 6.00, 'ATIVO'),
    (@m5, 'VALIMED-DEMO-005-A', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_SUB(CURDATE(), INTERVAL 60 DAY), 25, 5.00, 12.00, 'VENCIDO'),
    (@m5, 'VALIMED-DEMO-005-B', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 10 DAY), 45, 5.00, 12.00, 'ATIVO'),
    (@m5, 'VALIMED-DEMO-005-C', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 365 DAY), 130, 5.00, 12.50, 'ATIVO'),
    (@m6, 'VALIMED-DEMO-006-A', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_SUB(CURDATE(), INTERVAL 60 DAY), 0, 4.00, 18.90, 'DESCARTADO'),
    (@m6, 'VALIMED-DEMO-006-B', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 20 DAY), 2, 4.00, 18.90, 'ATIVO'),
    (@m6, 'VALIMED-DEMO-006-C', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 365 DAY), 400, 4.00, 19.40, 'ATIVO'),
    (@m7, 'VALIMED-DEMO-007-A', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_SUB(CURDATE(), INTERVAL 60 DAY), 30, 3.10, 12.30, 'VENCIDO'),
    (@m7, 'VALIMED-DEMO-007-B', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 25 DAY), 55, 3.10, 12.30, 'ATIVO'),
    (@m7, 'VALIMED-DEMO-007-C', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 365 DAY), 220, 3.10, 12.80, 'ATIVO'),
    (@m8, 'VALIMED-DEMO-008-A', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_SUB(CURDATE(), INTERVAL 60 DAY), 12, 4.50, 9.90, 'VENCIDO'),
    (@m8, 'VALIMED-DEMO-008-B', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 0 DAY), 90, 4.50, 9.90, 'ATIVO'),
    (@m8, 'VALIMED-DEMO-008-C', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 365 DAY), 300, 4.50, 10.40, 'ATIVO'),
    (@m9, 'VALIMED-DEMO-009-A', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_SUB(CURDATE(), INTERVAL 60 DAY), 8, 6.50, 14.20, 'VENCIDO'),
    (@m9, 'VALIMED-DEMO-009-B', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 5 DAY), 35, 6.50, 14.20, 'ATIVO'),
    (@m9, 'VALIMED-DEMO-009-C', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 365 DAY), 150, 6.50, 14.70, 'ATIVO'),
    (@m10, 'VALIMED-DEMO-010-A', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_SUB(CURDATE(), INTERVAL 60 DAY), 0, 3.80, 7.80, 'DESCARTADO'),
    (@m10, 'VALIMED-DEMO-010-B', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 12 DAY), 60, 3.80, 7.80, 'ATIVO'),
    (@m10, 'VALIMED-DEMO-010-C', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 365 DAY), 1, 3.80, 8.30, 'ATIVO'),
    (@m11, 'VALIMED-DEMO-011-A', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_SUB(CURDATE(), INTERVAL 60 DAY), 5, 4.20, 8.50, 'VENCIDO'),
    (@m11, 'VALIMED-DEMO-011-B', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 18 DAY), 0, 4.20, 8.50, 'ATIVO'),
    (@m11, 'VALIMED-DEMO-011-C', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 365 DAY), 100, 4.20, 9.00, 'ATIVO'),
    (@m12, 'VALIMED-DEMO-012-A', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_SUB(CURDATE(), INTERVAL 60 DAY), 6, 9.00, 17.50, 'VENCIDO'),
    (@m12, 'VALIMED-DEMO-012-B', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 22 DAY), 25, 9.00, 17.50, 'ATIVO'),
    (@m12, 'VALIMED-DEMO-012-C', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 365 DAY), 60, 9.00, 18.00, 'ATIVO'),
    (@m13, 'VALIMED-DEMO-013-A', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_SUB(CURDATE(), INTERVAL 60 DAY), 10, 10.00, 25.00, 'VENCIDO'),
    (@m13, 'VALIMED-DEMO-013-B', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 28 DAY), 70, 10.00, 25.00, 'ATIVO'),
    (@m13, 'VALIMED-DEMO-013-C', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 365 DAY), 500, 10.00, 25.50, 'ATIVO'),
    (@m14, 'VALIMED-DEMO-014-A', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_SUB(CURDATE(), INTERVAL 60 DAY), 0, 14.00, 32.00, 'DESCARTADO'),
    (@m14, 'VALIMED-DEMO-014-B', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 14 DAY), 20, 14.00, 32.00, 'ATIVO'),
    (@m14, 'VALIMED-DEMO-014-C', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 365 DAY), 90, 14.00, 32.50, 'ATIVO'),
    (@m15, 'VALIMED-DEMO-015-A', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_SUB(CURDATE(), INTERVAL 60 DAY), 3, 28.00, 45.00, 'VENCIDO'),
    (@m15, 'VALIMED-DEMO-015-B', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 3 DAY), 2, 28.00, 45.00, 'ATIVO'),
    (@m15, 'VALIMED-DEMO-015-C', DATE_SUB(CURDATE(), INTERVAL 365 DAY), DATE_ADD(CURDATE(), INTERVAL 365 DAY), 50, 28.00, 45.50, 'ATIVO');

    -- Venda 1: total calculado a partir dos itens.
    INSERT INTO vendas (id_cliente, valor_total, data_venda)
    VALUES (@c1, 29.80, DATE_SUB(NOW(), INTERVAL 9 DAY));
    SET @venda = LAST_INSERT_ID();
    INSERT INTO itens_venda (id_venda, id_lote, quantidade, preco_unitario)
    VALUES
    (@venda, (SELECT id_lote FROM lotes WHERE id_medicamento = @m1 AND numero_lote = 'VALIMED-DEMO-001-B'), 2, 6.90),
    (@venda, (SELECT id_lote FROM lotes WHERE id_medicamento = @m3 AND numero_lote = 'VALIMED-DEMO-003-C'), 1, 16.00);

    -- Venda 2: total calculado a partir dos itens.
    INSERT INTO vendas (id_cliente, valor_total, data_venda)
    VALUES (@c2, 40.00, DATE_SUB(NOW(), INTERVAL 8 DAY));
    SET @venda = LAST_INSERT_ID();
    INSERT INTO itens_venda (id_venda, id_lote, quantidade, preco_unitario)
    VALUES
    (@venda, (SELECT id_lote FROM lotes WHERE id_medicamento = @m2 AND numero_lote = 'VALIMED-DEMO-002-B'), 1, 22.00),
    (@venda, (SELECT id_lote FROM lotes WHERE id_medicamento = @m11 AND numero_lote = 'VALIMED-DEMO-011-C'), 2, 9.00);

    -- Venda 3: total calculado a partir dos itens.
    INSERT INTO vendas (id_cliente, valor_total, data_venda)
    VALUES (NULL, 16.50, DATE_SUB(NOW(), INTERVAL 7 DAY));
    SET @venda = LAST_INSERT_ID();
    INSERT INTO itens_venda (id_venda, id_lote, quantidade, preco_unitario)
    VALUES
    (@venda, (SELECT id_lote FROM lotes WHERE id_medicamento = @m4 AND numero_lote = 'VALIMED-DEMO-004-B'), 3, 5.50);

    -- Venda 4: total calculado a partir dos itens.
    INSERT INTO vendas (id_cliente, valor_total, data_venda)
    VALUES (@c3, 44.00, DATE_SUB(NOW(), INTERVAL 6 DAY));
    SET @venda = LAST_INSERT_ID();
    INSERT INTO itens_venda (id_venda, id_lote, quantidade, preco_unitario)
    VALUES
    (@venda, (SELECT id_lote FROM lotes WHERE id_medicamento = @m6 AND numero_lote = 'VALIMED-DEMO-006-C'), 1, 19.40),
    (@venda, (SELECT id_lote FROM lotes WHERE id_medicamento = @m7 AND numero_lote = 'VALIMED-DEMO-007-B'), 2, 12.30);

    -- Venda 5: total calculado a partir dos itens.
    INSERT INTO vendas (id_cliente, valor_total, data_venda)
    VALUES (@c4, 10.40, DATE_SUB(NOW(), INTERVAL 5 DAY));
    SET @venda = LAST_INSERT_ID();
    INSERT INTO itens_venda (id_venda, id_lote, quantidade, preco_unitario)
    VALUES
    (@venda, (SELECT id_lote FROM lotes WHERE id_medicamento = @m8 AND numero_lote = 'VALIMED-DEMO-008-C'), 1, 10.40);

    -- Venda 6: total calculado a partir dos itens.
    INSERT INTO vendas (id_cliente, valor_total, data_venda)
    VALUES (@c5, 37.20, DATE_SUB(NOW(), INTERVAL 4 DAY));
    SET @venda = LAST_INSERT_ID();
    INSERT INTO itens_venda (id_venda, id_lote, quantidade, preco_unitario)
    VALUES
    (@venda, (SELECT id_lote FROM lotes WHERE id_medicamento = @m9 AND numero_lote = 'VALIMED-DEMO-009-C'), 2, 14.70),
    (@venda, (SELECT id_lote FROM lotes WHERE id_medicamento = @m10 AND numero_lote = 'VALIMED-DEMO-010-B'), 1, 7.80);

    -- Venda 7: total calculado a partir dos itens.
    INSERT INTO vendas (id_cliente, valor_total, data_venda)
    VALUES (@c6, 25.50, DATE_SUB(NOW(), INTERVAL 3 DAY));
    SET @venda = LAST_INSERT_ID();
    INSERT INTO itens_venda (id_venda, id_lote, quantidade, preco_unitario)
    VALUES
    (@venda, (SELECT id_lote FROM lotes WHERE id_medicamento = @m13 AND numero_lote = 'VALIMED-DEMO-013-C'), 1, 25.50);

    -- Venda 8: total calculado a partir dos itens.
    INSERT INTO vendas (id_cliente, valor_total, data_venda)
    VALUES (NULL, 77.00, DATE_SUB(NOW(), INTERVAL 2 DAY));
    SET @venda = LAST_INSERT_ID();
    INSERT INTO itens_venda (id_venda, id_lote, quantidade, preco_unitario)
    VALUES
    (@venda, (SELECT id_lote FROM lotes WHERE id_medicamento = @m14 AND numero_lote = 'VALIMED-DEMO-014-B'), 1, 32.00),
    (@venda, (SELECT id_lote FROM lotes WHERE id_medicamento = @m15 AND numero_lote = 'VALIMED-DEMO-015-B'), 1, 45.00);

    -- Venda 9: total calculado a partir dos itens.
    INSERT INTO vendas (id_cliente, valor_total, data_venda)
    VALUES (@c7, 46.20, DATE_SUB(NOW(), INTERVAL 1 DAY));
    SET @venda = LAST_INSERT_ID();
    INSERT INTO itens_venda (id_venda, id_lote, quantidade, preco_unitario)
    VALUES
    (@venda, (SELECT id_lote FROM lotes WHERE id_medicamento = @m1 AND numero_lote = 'VALIMED-DEMO-001-C'), 3, 7.40),
    (@venda, (SELECT id_lote FROM lotes WHERE id_medicamento = @m5 AND numero_lote = 'VALIMED-DEMO-005-B'), 2, 12.00);

    -- Venda 10: total calculado a partir dos itens.
    INSERT INTO vendas (id_cliente, valor_total, data_venda)
    VALUES (@c8, 18.00, DATE_SUB(NOW(), INTERVAL 0 DAY));
    SET @venda = LAST_INSERT_ID();
    INSERT INTO itens_venda (id_venda, id_lote, quantidade, preco_unitario)
    VALUES
    (@venda, (SELECT id_lote FROM lotes WHERE id_medicamento = @m12 AND numero_lote = 'VALIMED-DEMO-012-C'), 1, 18.00);

    COMMIT;
    SELECT 'Demonstração criada: 15 medicamentos, 10 clientes, 45 lotes e 10 vendas.' AS resultado;
END$$
CALL valimed_carregar_demo()$$
DROP PROCEDURE IF EXISTS valimed_carregar_demo$$
DELIMITER ;
