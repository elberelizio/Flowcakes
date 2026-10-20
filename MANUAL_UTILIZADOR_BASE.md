# Manual de Utilizador — Flow Cakes (Chef Control)
### Texto-base para o Manual de Utilizador em Word (versão mobile)

> Este documento descreve, passo a passo, todas as funcionalidades do sistema Flow Cakes tal como aparecem na versão mobile (telemóvel). Foi escrito para ser combinado com capturas de ecrã: cada secção explica o que o utilizador vê e o que deve fazer, sem entrar em detalhes de cor ou design.

---

## SECÇÃO 1 — Página Inicial

Ao abrir o site do Flow Cakes no telemóvel pela primeira vez, o utilizador chega à página inicial (landing page), que serve de apresentação pública do sistema.

Nesta página encontram-se:

- O **logótipo Flow Cakes** no topo, identificando a marca.
- Um **texto de apresentação** que explica, em poucas palavras, o que é o Flow Cakes: um sistema de gestão de encomendas, clientes e finanças para vendedoras e vendedores de bolos e salgados.
- Um **botão "Criar Conta"** (ou "Registar"), que leva o utilizador até ao formulário de registo, para quem ainda não tem conta.
- Um **botão "Entrar"** (ou "Login"), destinado a quem já possui uma conta criada.
- Ligações no final da página (rodapé) para **"Termos de Utilização"** e **"Política de Privacidade"**, e em alguns casos um link de **"Contacto"** para falar com a equipa do Flow Cakes.
- Pode também existir uma ligação para a **"Loja"**, uma área pública onde os clientes finais conseguem acompanhar as suas encomendas.

Ao tocar em **"Criar Conta"**, o utilizador é encaminhado para a página de registo. Ao tocar em **"Entrar"**, é encaminhado para a página de login.

---

## SECÇÃO 2 — Criar Conta

### Como chegar
Na página inicial, toca-se no botão **"Criar Conta"**. O sistema abre o formulário de registo.

### Campos do formulário

1. **Nome Completo**
   - Campo de texto livre.
   - Obrigatório.
   - Deve conter o nome completo do utilizador (ex.: "Maria José Cumbe").

2. **Província**
   - Campo de seleção (lista para escolher).
   - Obrigatório.
   - O utilizador escolhe uma das 11 províncias de Moçambique: Maputo Cidade, Maputo, Gaza, Inhambane, Sofala, Manica, Tete, Zambézia, Nampula, Cabo Delgado ou Niassa.

3. **Contacto (Telefone)**
   - Campo numérico.
   - Obrigatório.
   - Deve ter 9 dígitos (ex.: 841234567) ou 12 dígitos com o prefixo do país (ex.: 258841234567).
   - O sistema remove automaticamente letras ou símbolos digitados por engano.
   - Este número será o utilizado para entrar no sistema (login), por isso deve ser um número real e ao qual o utilizador tem acesso.

4. **Email**
   - Campo de texto.
   - Opcional (não é obrigatório preencher).
   - Se for preenchido, deve ter um formato de email válido (ex.: nome@exemplo.com).

5. **Senha da Conta**
   - Campo de senha (texto escondido).
   - Obrigatório.
   - Deve ter no mínimo 4 caracteres.

6. **Caixa de confirmação "Concordo que todos os dados fornecidos são verdadeiros"**
   - Tipo caixa de confirmação (checkbox).
   - Obrigatório marcar para poder avançar.

7. **Caixa de confirmação "Li e aceito os Termos de Utilização e a Política de Privacidade"**
   - Tipo caixa de confirmação (checkbox).
   - Obrigatório marcar para poder avançar.

### Validações
- Se algum campo obrigatório não for preenchido correctamente, o sistema mostra uma mensagem de erro junto do campo em questão (ex.: "Nome completo é obrigatório.").
- Se o número de telefone já estiver registado no sistema, aparece a mensagem: **"Este contacto já está registado."**

### Aviso importante
> Ao criar uma conta, o utilizador recebe automaticamente uma licença de teste gratuita com duração de 15 dias. Durante este período tem acesso a todas as funcionalidades do Flow Cakes. Após os 15 dias, será necessário activar um plano pago para continuar a utilizar o sistema.

### Depois de criar a conta
1. O utilizador toca no botão **"Criar conta"** para submeter o formulário.
2. O sistema cria a conta e activa automaticamente o período de teste gratuito de 15 dias.
3. O utilizador é encaminhado para uma página de **escolha de plano**, onde pode tocar em **"Começar teste grátis"** para continuar.
4. Em seguida, é direccionado para a página de login, já com uma mensagem confirmando que a conta foi criada com sucesso e que o teste gratuito está activo.

---

## SECÇÃO 3 — Entrar (Login)

### Como chegar
Na página inicial, toca-se no botão **"Entrar"**. Também é possível chegar a esta página a partir do final do processo de registo.

### Campos a preencher
1. **Contacto (Telefone)** — o mesmo número usado no registo (9 dígitos, ou 12 com prefixo 258). Obrigatório.
2. **Senha da Conta** — a senha definida no registo. Obrigatório, mínimo 4 caracteres.

### Passos
1. Preencher o contacto e a senha.
2. Tocar no botão **"Entrar"**.

### Depois de um login bem-sucedido
- Se a conta for de **administrador**, o sistema abre o Painel Administrativo.
- Se a conta for de **utilizador normal com licença activa ou em teste válido**, o sistema abre o Dashboard principal.
- Se a conta tiver a licença pendente ou expirada, o sistema encaminha automaticamente para a página de pagamento da licença, antes de permitir o acesso ao resto do sistema.

### Se os dados estiverem errados
- Se o contacto ou a senha estiverem incorrectos, aparece a mensagem **"Contacto ou senha incorretos."**, com a opção de criar uma nova conta caso o número não exista no sistema.
- Se forem feitas demasiadas tentativas erradas, a conta pode ficar bloqueada, mostrando a mensagem: **"Conta bloqueada por excesso de tentativas. Contacte o suporte para recuperar o acesso."**
- Existe também a opção **"Esqueci a senha"**, que leva a uma página onde o utilizador introduz o seu contacto e recebe instruções para recuperar o acesso à conta.

---

## SECÇÃO 4 — Dashboard Principal

Depois do login, o utilizador entra no **Dashboard**, a página principal de trabalho do sistema.

### O que se vê

**Cartões de métricas (KPIs):**
- **Lucro Total** — soma de todo o lucro gerado pelas encomendas (valor cobrado menos custos).
- **Despesas Totais** — soma de todas as despesas registadas (ingredientes, entregas e outras despesas variáveis).
- **Dívidas Pendentes** — soma dos valores que os clientes ainda devem (encomendas não totalmente pagas).
- **Retiradas de Caixa** — soma de todo o dinheiro já retirado do lucro acumulado.

**Gráfico de evolução (Lucro / Despesa / Dívidas):**
- Mostra a evolução mensal, ao longo dos últimos 12 meses, das três linhas: lucro, despesas e dívidas.
- Serve para o utilizador perceber se o negócio está a crescer, e em que meses teve mais despesas ou mais dívidas acumuladas.

**Tabela de Encomendas Recentes:**
- Lista as encomendas mais recentes, mostrando: nome do cliente, produto, tamanho/quantidade, valor cobrado, valor pago, saldo em falta e estado da encomenda.
- O estado aparece destacado: verde quando está paga, amarelo quando o pagamento é parcial, vermelho quando está pendente.
- Ao tocar numa linha da tabela, o utilizador é levado para os detalhes completos dessa encomenda.

**Mensagens e avisos:**
- Mensagens motivacionais e dicas de utilização aparecem periodicamente (ex.: "Organize o seu dia e aproveite cada encomenda.").
- Se houver uma entrega marcada para um feriado nacional, o sistema mostra um aviso a chamar a atenção para esse facto.

---

## SECÇÃO 5 — Menu Lateral (Sidebar)

### Como abrir
No telemóvel, o menu abre-se ao tocar no ícone de **menu (hambúrguer)**, normalmente situado no canto superior da tela.

### Como fechar
Toca-se fora da área do menu, ou no mesmo ícone, ou ainda numa seta/ícone de fechar, para esconder o menu e voltar ao conteúdo da página.

### Itens do menu (Utilizador normal)

- **Dashboard** — abre a página principal com os resumos e gráficos.
- **Lembretes** — mostra lembretes de entregas futuras e feriados nacionais; pode aparecer um número (badge) indicando quantos lembretes existem.
- **Comunicado** — mostra avisos e comunicados enviados pela equipa do Flow Cakes.
- **Encomendas** (menu com subitens):
  - **Criar** — abre o formulário para registar uma nova encomenda.
  - **Visualizar** — abre a lista de todas as encomendas.
  - **Registar despesas** — permite associar despesas extra a uma encomenda já criada.
  - **Consultar despesas** — mostra todas as despesas variáveis já registadas.
- **Dívidas** — mostra apenas as encomendas que têm saldo em falta.
- **Relatório** — mostra gráficos e permite exportar relatórios financeiros em PDF e Excel.
- **Retiradas** — permite registar retiradas de dinheiro do lucro acumulado.
- **Clientes** — mostra a lista de clientes e o histórico de cada um.
- **Licença e Pagamentos** — mostra o estado da licença (activa, em teste, pendente) e o histórico de pagamentos.
- **Sair** — termina a sessão e volta à página de login.

### Como navegar
Basta tocar em qualquer item do menu para ser encaminhado directamente para essa página. Itens com subitens (como "Encomendas") expandem ao toque, mostrando as opções internas.

---

## SECÇÃO 6 — Criar Encomenda

### Como chegar
No menu lateral, tocar em **"Encomendas"** e depois em **"Criar"**.

### Passo a passo

1. **Escolher a categoria do produto**
   - O utilizador escolhe entre **"Doces"** ou **"Salgados"**.

2. **Preencher os dados do cliente**
   - **Nome do Cliente** (obrigatório).
   - **Contacto do Cliente** (opcional, até 9 dígitos).
   - **Endereço do Cliente** (opcional).

3. **Preencher os dados da entrega**
   - **Hora de Entrega** (opcional).
   - **Data de Entrega** (obrigatório).
   - **Tem entrega?** — escolher "Sim" ou "Não". Se for "Sim", aparecem dois campos adicionais: **Local de entrega** (obrigatório nesse caso) e **Custo da entrega** (opcional).

4. **Escolher o tipo de produto**
   - Se for **Doces**: escolher entre Bolo, Biscoitos ou Outros. Se escolher "Outros", deve escrever o nome do tipo no campo que aparece a seguir.
   - Se for **Salgados**: escolher entre Chamussas, Recois ou Outros salgados típicos. Da mesma forma, "Outros" exige um campo de texto extra.

5. **Descrever o produto**
   - **Descrição/Nome do Produto** (obrigatório). Exemplo: "Bolo de Chocolate com Calda".

6. **Indicar o tamanho ou a quantidade**
   - Para **Doces**: escolher o **Tamanho**, por nome (Pequeno, Médio, Grande) ou por número/forma (ex.: 15, 20, 47).
   - Para **Salgados**: indicar a **Quantidade em Kg** (obrigatório) e, opcionalmente, as **Unidades por Quilo** (o sistema calcula automaticamente o total de unidades).

7. **Indicar os valores**
   - **Valor Cobrado ao Cliente** (obrigatório, deve ser maior que zero).
   - **Valor Pago pelo Cliente** (opcional; se não preencher, assume-se que ainda não pagou nada).
   - **Desconto** (opcional).

8. **Registar os custos de produção**
   - O utilizador escolhe entre dois modos:
     - **Modo Simples**: preenche apenas um **Custo Total** e, se quiser, uma **Descrição da Despesa** (ex.: "Farinha + Ovos + Calda").
     - **Modo Detalhado**: adiciona vários **ingredientes**, um a um, indicando para cada um o nome, a quantidade e o valor unitário. É possível tocar em **"+ Adicionar ingrediente"** para incluir mais linhas, ou remover ingredientes já adicionados.

9. **Observações finais**
   - Campo de texto livre para qualquer nota adicional sobre a encomenda.

10. **Revisar o resumo financeiro**
    - Antes de guardar, o sistema mostra um resumo com: valor cobrado, valor pago, saldo em dívida, percentagem já paga, custo total e lucro estimado dessa encomenda.

11. **Guardar a encomenda**
    - Tocar no botão **"Criar"**.
    - Se faltar algum campo obrigatório, o sistema mostra uma mensagem de erro e leva o utilizador directamente até ao campo em falta.

### Depois de guardar
- Aparece a mensagem **"Encomenda criada com sucesso."**
- O utilizador é encaminhado para a lista de encomendas, onde a nova encomenda já aparece registada.

---

## SECÇÃO 7 — Lista de Encomendas / Gestão

### Como aceder
No menu lateral, tocar em **"Encomendas"** e depois em **"Visualizar"**.

### O que é apresentado
A página tem dois separadores (abas):

- **Encomendas Activas** — todas as encomendas em curso (não canceladas), ordenadas pela data de entrega mais próxima.
- **Encomendas Encerradas** — encomendas já canceladas ou concluídas.

Cada encomenda aparece numa linha (ou cartão, no telemóvel) com: nome do cliente, produto, tamanho/quantidade, valor cobrado, valor pago, saldo em falta, estado da encomenda e estado do pagamento.

### Como pesquisar ou filtrar
É possível filtrar a lista por:
- **Nome do cliente** (escrevendo parte do nome).
- **Categoria** (Doces ou Salgados).
- **Estado da encomenda** (Encomenda feita, Em processo, Finalizada, ou Cancelada na aba de encerradas).
- **Estado do pagamento** (Pendente, Parcial, Pago).

### Como ver o detalhe de uma encomenda
Tocar sobre o nome do cliente ou sobre a linha da encomenda para abrir a página de detalhes completos, que mostra: informações gerais, estado, dados financeiros, custos, lucro, observações e, se existirem, os ingredientes registados.

### Como editar uma encomenda
A partir da página de detalhes, é possível tocar em **"Editar"** para alterar os dados da encomenda.

### Como mudar o estado de uma encomenda

- **Marcar como Entregue**: se a encomenda ainda tiver saldo em dívida, o sistema pergunta se o utilizador quer:
  - confirmar a entrega e registar o pagamento total; ou
  - confirmar a entrega mantendo o saldo como dívida.
  - Se já não houver saldo em dívida, a encomenda é marcada como entregue directamente.

- **Cancelar uma Encomenda**: ao tocar em "Cancelar", abre-se uma janela onde o utilizador indica o motivo do cancelamento (Cliente desistiu, Não consegui produzir, Recusa na entrega, Erro de registo, ou Outro), o estágio em que a produção se encontrava (Ainda não produzi, Já produzi, Já tinha sido entregue) e, se aplicável, o tipo de reembolso ao cliente (Sem devolução, Devolução total, Devolução parcial) com o respectivo valor.

### Eliminar encomenda
O sistema não elimina encomendas de forma definitiva; em vez disso, uma encomenda pode ser cancelada (ver acima), o que a move para a aba de "Encomendas Encerradas".

---

## SECÇÕES ADICIONAIS

### 8. Clientes

**Como chegar:** menu lateral → **"Clientes"**.

**O que se vê:** uma lista de todos os clientes, agrupados automaticamente a partir das encomendas registadas, com: nome do cliente, tipo de produto que costuma encomendar (Doces, Salgados ou Ambos), número total de encomendas, valor total movimentado e um "perfil" do cliente (Em dia, Regular, Atenção ou Risco, calculado de acordo com a taxa de pagamento).

**Como usar:**
1. Filtrar a lista por nome do cliente ou tipo de produto.
2. Tocar sobre um cliente para abrir os detalhes: todas as suas encomendas, total cobrado, total pago e total em dívida.
3. Se o cliente tiver dívida, é possível registar um novo pagamento directamente a partir desse ecrã.

---

### 9. Dívidas

**Como chegar:** menu lateral → **"Dívidas"**.

**O que se vê:** uma lista apenas com as encomendas que ainda têm saldo em falta, mostrando cliente, produto, tamanho, valor cobrado, valor pago, valor em dívida e data de entrega.

**Como usar:**
1. Filtrar por cliente, categoria, estado da encomenda ou estado do pagamento.
2. Tocar em **"Marcar como pago"** junto de uma encomenda para registar o valor recebido — pode ser o pagamento total ou apenas parcial.

No topo da página aparecem contadores com o número de encomendas em dívida e o valor total ainda a receber.

---

### 10. Lembretes

**Como chegar:** menu lateral → **"Lembretes"**.

**O que se vê:** uma lista de lembretes de entregas futuras, organizados por proximidade da data, e também os feriados nacionais de Moçambique nos próximos 12 meses.

**Como criar um novo lembrete:**
1. Tocar em **"Novo"**.
2. Preencher: **Nome do Cliente** (obrigatório), **Endereço/Local** (opcional), **Data de Entrega** (obrigatório), **Descrição/Notas** (opcional) e **Notificar com quantos dias de antecedência** (entre 0 e 90 dias; por padrão 5 dias).
3. Guardar o lembrete.

**Como editar:** tocar sobre um lembrete existente para carregar os seus dados no formulário e alterá-los.

**Como eliminar:** tocar em eliminar e confirmar a remoção.

Cada lembrete mostra visualmente quão próxima está a data: "Hoje", "Faltam X dias" ou "Data passada".

---

### 11. Comunicados / Notificações

**Como chegar:** menu lateral → **"Comunicado"**.

**O que se vê:** avisos enviados pela equipa do Flow Cakes (por exemplo, manutenções programadas ou novidades do sistema), organizados em dois separadores: **"Não Lidos"** e **"Lidos"**.

**Como usar:** tocar num comunicado para o ler na totalidade, e tocar em **"Marcar como lida"** para movê-lo para o separador de lidos.

---

### 12. Registar e Consultar Despesas Variáveis

**Como chegar:** menu lateral → "Encomendas" → **"Registar despesas"** ou **"Consultar despesas"**.

**Registar despesas:**
1. Escolher a encomenda à qual a despesa se refere (pode pesquisar por nome do cliente ou produto).
2. Adicionar uma ou mais despesas, indicando o nome (ex.: "Entrega", "Embalagem premium") e o respectivo valor.
3. Tocar em **"Guardar"** para associar essas despesas à encomenda escolhida.

**Consultar despesas:**
- Mostra uma tabela com todas as despesas já registadas, com a encomenda, cliente, produto, nome da despesa, valor e data.
- É possível pesquisar por cliente, produto ou tipo de despesa.

---

### 13. Relatórios

**Como chegar:** menu lateral → **"Relatório"**.

**O que se vê:**
- Um **gráfico circular** que mostra a composição financeira do negócio: lucro, despesas, dívidas a cobrar e retiradas, cada parte com o respectivo valor em Meticais.
- Indicadores resumidos para o período seleccionado: lucro total, despesas totais, dívidas pendentes e retiradas de caixa.

**Como filtrar por período:**
1. Escolher uma **data inicial** e uma **data final**.
2. Tocar em **"Aplicar"** para actualizar os dados ao período escolhido, ou em **"Limpar"** para voltar a ver o total acumulado desde sempre.

**Como exportar:**
- Tocar em **"Exportar PDF"** para gerar um relatório em PDF com o gráfico, o resumo financeiro e a lista de encomendas do período.
- Tocar em **"Exportar Excel"** para gerar uma folha de cálculo com todas as encomendas e respectivos valores do período seleccionado.

---

### 14. Retiradas

**Como chegar:** menu lateral → **"Retiradas"**.

**Como registar uma retirada:**
1. Indicar o **Valor a Retirar** (obrigatório, não pode exceder o lucro disponível).
2. Escolher a **Data da Retirada** (por padrão, o dia de hoje).
3. Escrever, opcionalmente, uma **Descrição/Motivo** (ex.: "Pagamento de fornecedor").
4. Tocar em **"Guardar"**.

Se o valor a retirar deixar o saldo disponível muito baixo, o sistema mostra um aviso antes de confirmar a operação.

**Histórico:** a página mostra uma tabela com todas as retiradas já feitas (data, valor, descrição), com a opção de eliminar um registo, mediante confirmação.

---

### 15. Licença e Pagamentos (M-Pesa / e-Mola)

**Como chegar:** menu lateral → **"Licença e Pagamentos"**.

**O que se vê:**
- O **estado actual da licença**: Activa, Teste, Pendente de Pagamento ou Expirada, com a data de validade e os dias restantes.
- Um **histórico de pagamentos**, mostrando data do pagamento, valor pago, estado (Confirmado, Pendente ou Rejeitado), duração adquirida e identificador da transacção.

**Como pagar / renovar a licença:**
1. Tocar em **"Renovar"** ou **"Pagar Licença"**.
2. Escolher o número de meses a pagar (1, 3, 6 ou 12 meses). O valor é calculado automaticamente (500 MZN por mês).
3. Escolher o método de pagamento: **M-Pesa** ou **e-Mola**.
4. Introduzir o número de telefone da carteira móvel a partir da qual vai transferir.
5. Fazer a transferência manual para o número indicado pelo sistema (M-Pesa: 846746170; e-Mola: 871964887).
6. Aguardar a confirmação automática — o sistema verifica periodicamente (de poucos em poucos segundos) se o pagamento foi recebido.

**Resultados possíveis:**
- **Pagamento confirmado**: a licença é renovada automaticamente e o utilizador é encaminhado para o Dashboard com uma mensagem de sucesso.
- **Pagamento pendente**: o sistema continua a aguardar confirmação; o utilizador pode acompanhar o estado nesta mesma página.
- **Pagamento rejeitado**: é mostrado o motivo da rejeição, podendo o utilizador tentar novamente ou contactar o suporte via WhatsApp.

**Recibos e extratos:**
- Para cada pagamento confirmado, é possível tocar em **"Descarregar Recibo (PDF)"**.
- É possível também descarregar um **"Extrato (PDF)"** com o histórico completo de pagamentos.

---

## SECÇÃO FINAL — Configurações e Perfil

**Como chegar:** menu lateral → **"Perfil"** (em algumas versões aparece como ícone de utilizador no topo da página).

A página de perfil está organizada em três separadores:

### 1. Dados Pessoais
- **Nome Completo**
- **Tipo de Documento** (BI ou NUIT)
- **Número do Documento**
- **Província**
- **Email**

Após editar, tocar em **"Guardar Dados"**.

### 2. Contacto
- **Novo Contacto** (deve ser diferente do número actual, com 9 dígitos ou 258 + 9 dígitos).
- **Senha Actual** (para confirmar a identidade do utilizador antes de alterar o contacto).

Após preencher, tocar em **"Alterar Contacto"**. Este novo número passa a ser o usado para entrar no sistema.

### 3. Senha
- **Senha Actual**
- **Nova Senha** (mínimo 4 caracteres)
- **Confirmar Senha** (deve ser igual à nova senha)

Após preencher, tocar em **"Alterar Senha"**.

### Outras informações e opções
- A página mostra também a **data de criação da conta**.
- No menu lateral, está sempre disponível a opção **"Sair"**, que termina a sessão actual e devolve o utilizador à página de login.

---

## LISTA COMPLETA DE FUNCIONALIDADES DO FLOW CAKES

1. Página inicial (apresentação pública do sistema)
2. Criação de conta com licença de teste gratuita de 15 dias
3. Login com número de telefone e senha
4. Recuperação de senha
5. Dashboard com métricas de lucro, despesas, dívidas e retiradas
6. Gráfico de evolução mensal (lucro, despesas, dívidas)
7. Tabela de encomendas recentes
8. Menu lateral de navegação completo
9. Criação de encomendas (Doces e Salgados) com cálculo automático de lucro
10. Registo de ingredientes e custos detalhados ou em modo simples
11. Lista de encomendas activas e encerradas, com filtros de pesquisa
12. Detalhes completos de cada encomenda
13. Marcação de encomendas como entregues
14. Cancelamento de encomendas com motivo, estágio de produção e tipo de reembolso
15. Gestão de clientes com perfil de risco de pagamento
16. Gestão de dívidas e registo de pagamentos
17. Lembretes de entregas e aviso de feriados nacionais
18. Comunicados/avisos do sistema
19. Registo e consulta de despesas variáveis associadas a encomendas
20. Relatórios financeiros com gráfico de composição e exportação em PDF/Excel
21. Registo de retiradas de lucro com histórico
22. Gestão de licença e histórico de pagamentos (M-Pesa e e-Mola)
23. Descarregamento de recibos e extratos de pagamento em PDF
24. Edição de perfil (dados pessoais, contacto e senha)
25. Suporte via WhatsApp para questões de pagamento

---

*Fim do texto-base para o Manual de Utilizador Flow Cakes.*
