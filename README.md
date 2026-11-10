# Collection Route Compass

First Mile Control — Dashboard de Planejamento de Rotas



Crie uma aplicação web completa, moderna e funcional para planejamento e controle de rotas de coleta do setor First Mile de uma operação logística.



O objetivo é substituir a planilha tradicional utilizada para organizar lojas, endereços, IDs e distribuição de coletas, tornando o planejamento mais visual, rápido e inteligente.



IMPORTANTE: Não quero apenas um protótipo visual. Quero um sistema funcional, com banco de dados, cadastro e edição de informações, filtros, importação de planilhas e persistência dos dados.



1. Identidade visual



Desenvolva uma interface profissional inspirada em sistemas de gestão logística e torres de controle operacionais.



- Nome do sistema: First Mile Control.

- Idioma: português brasileiro.

- Formato de data: DD/MM/AAAA.

- Horário: formato de 24 horas.

- Aparência moderna, limpa e profissional.

- Priorizar tons de azul-marinho, cinza, branco e detalhes em amarelo, laranja e vermelho para alertas.

- Layout responsivo para computador, tablet e celular, priorizando o uso em computadores.

- Menu lateral com ícones e navegação simples.

- Tabelas com boa densidade de informação, cabeçalhos fixos e edição rápida.



2. Dashboard principal



Criar uma página inicial com indicadores atualizados automaticamente conforme o planejamento selecionado.



Exibir cards com:



- Total de lojas planejadas.

- Total de lojas com alto volume.

- Quantidade de rotas planejadas.

- Quantidade de rotas que precisam de apoio.

- Quantidade de rotas avulsas necessárias.

- Lojas sem rota atribuída.

- Lojas pendentes de planejamento.



Adicionar seletor de data e turno, campo de pesquisa e filtros rápidos.



Criar uma seção chamada “Atenção operacional”, mostrando automaticamente as lojas e rotas que precisam de alguma ação, como alto volume sem apoio definido, loja sem rota atribuída ou rota com excesso de volume.



Não inventar dados reais. Se o sistema estiver vazio, mostrar indicadores zerados e orientar o usuário a cadastrar ou importar as lojas.



3. Página principal: Planejamento de rotas



Esta será a funcionalidade mais importante do sistema.



Criar uma tabela editável semelhante a uma planilha, permitindo adicionar, editar e excluir registros diretamente na interface.



Cada linha representa uma loja em um planejamento de coleta.



A tabela deverá conter as seguintes colunas:



1. Data da coleta.

2. Turno.

3. ID da loja.

4. Nome da loja.

5. Rua e endereço completo.

6. Região ou bairro.

7. Rota atribuída.

8. Volume previsto de pacotes.

9. Classificação de volume: baixo, médio ou alto.

10. Necessita rota avulsa? Sim/Não.

11. Necessita apoio? Sim/Não.

12. Tipo de apoio: veículo extra, outra rota, equipe adicional ou outro.

13. Prioridade operacional: baixa, normal, alta ou crítica.

14. Status: não planejada, planejada, confirmada, em andamento, concluída ou com problema.

15. Observações.



Adicionar funcionalidades:



- Botão para adicionar nova loja.

- Edição rápida das células.

- Exclusão com confirmação.

- Duplicação de registros para facilitar o planejamento de outro dia.

- Pesquisa por nome, ID, rua ou rota.

- Filtros por data, turno, região, volume, rota, status, apoio e rota avulsa.

- Ordenação por qualquer coluna.

- Seleção de várias lojas para atribuir uma mesma rota em lote.

- Seleção de várias lojas para alterar prioridade ou status em lote.

- Fixar as colunas de ID e nome da loja durante a rolagem horizontal.

- Paginação ou rolagem eficiente para grandes quantidades de registros.

- Salvamento automático com indicação visual de salvamento e tratamento de erros.

- Opção de desfazer a última edição, quando possível.



Criar uma visualização compacta, parecida com Excel, para facilitar o trabalho operacional.



4. Cadastro permanente de lojas



Criar uma página separada chamada “Cadastro de lojas”.



Cada loja terá um registro permanente contendo:



- ID único da loja.

- Nome da loja.

- Endereço completo.

- Rua.

- Número e complemento, quando aplicáveis.

- Bairro ou região.

- Cidade.

- Referência de localização.

- Observações fixas.



O cadastro permanente deverá ser independente do planejamento diário.



Ao adicionar uma loja já cadastrada em um novo planejamento, preencher automaticamente seu nome e endereço pelo ID, evitando retrabalho.



Impedir IDs duplicados no cadastro permanente e permitir atualizar o endereço sem apagar o histórico dos planejamentos anteriores.



5. Gestão de rotas



Criar uma página chamada “Rotas”.



Cada rota deverá ter:



- Código ou nome da rota.

- Data e turno.

- Responsável, opcional.

- Veículo ou tipo de veículo, opcional.

- Capacidade estimada de pacotes, opcional.

- Lista de lojas atribuídas.

- Volume total previsto.

- Quantidade total de lojas.

- Indicador de necessidade de apoio.

- Indicador de necessidade de rota avulsa.

- Status da rota.

- Observações.



Calcular automaticamente a soma do volume previsto das lojas atribuídas a cada rota.



Se uma rota possuir capacidade cadastrada, comparar o volume previsto com essa capacidade e sinalizar quando atingir ou ultrapassar o limite.



Permitir criar rotas, renomear, editar, arquivar e transferir lojas entre rotas.



Uma loja não poderá aparecer duplicada no mesmo planejamento de coleta, salvo quando houver uma justificativa operacional explícita.



6. Inteligência operacional e alertas



Criar uma seção de análise automática que ajude o planejador a identificar possíveis problemas.



Regras:



- Loja com alto volume e sem rota atribuída: alerta crítico.

- Loja com alto volume e sem definição de apoio: alerta de atenção.

- Rota acima da capacidade cadastrada: alerta de sobrecarga.

- Loja sem endereço: alerta de cadastro incompleto.

- Loja duplicada no mesmo planejamento: alerta de inconsistência.

- Rota avulsa marcada como necessária, mas ainda não criada: alerta pendente.

- Loja sem planejamento: exibir na lista de pendências.



Permitir que o planejador defina os limites de volume baixo, médio e alto nas configurações.



Não assumir limites fixos de pacotes sem que o usuário os configure.



Os alertas devem ser calculados automaticamente com base nos dados cadastrados e desaparecer quando o problema for resolvido.



O sistema deve sugerir ações, mas nunca alterar ou distribuir rotas automaticamente sem confirmação do usuário.



7. Importação e exportação de planilhas



Criar uma funcionalidade chamada “Importar planilha”.



Permitir importar arquivos CSV e Excel (.xlsx).



A importação deverá:



- Permitir selecionar o arquivo.

- Exibir uma prévia das linhas.

- Permitir mapear as colunas da planilha para os campos do sistema.

- Reconhecer cabeçalhos comuns como ID, Loja, Nome, Rua, Endereço e Rota.

- Identificar registros incompletos e possíveis duplicidades.

- Permitir corrigir problemas antes de confirmar.

- Mostrar quantas linhas serão adicionadas, atualizadas ou ignoradas.

- Permitir escolher entre cadastrar novas lojas e atualizar lojas existentes, sem apagar dados acidentalmente.

- Apresentar um resumo do resultado da importação.



Criar também exportação para Excel e CSV, respeitando os filtros selecionados, para que o planejamento possa ser compartilhado com a equipe.



Disponibilizar um modelo de planilha para download, com os cabeçalhos esperados.



8. Histórico de planejamentos



Criar uma página chamada “Histórico”.



Permitir consultar planejamentos anteriores por data, turno, rota e loja.



Guardar os dados de cada planejamento sem sobrescrever os registros históricos quando o cadastro permanente de uma loja for atualizado.



Permitir duplicar um planejamento anterior para servir como ponto de partida para um novo dia.



Mostrar data de criação e última atualização.



Registrar, quando possível, quem realizou as alterações importantes.



9. Layout de visualização por rota



Além da tabela, criar uma visualização alternativa em cartões ou quadro operacional.



Cada cartão representa uma rota e apresenta:



- Nome da rota.

- Quantidade de lojas.

- Volume total previsto.

- Barra visual de ocupação, quando houver capacidade definida.

- Lista resumida das lojas.

- Sinalização de alto volume.

- Sinalização de apoio necessário.

- Sinalização de rota avulsa.

- Status operacional.



Permitir arrastar lojas entre rotas, caso essa funcionalidade seja implementada de forma confiável, atualizando os dados no banco após a confirmação da alteração.



Se o recurso de arrastar e soltar não for viável, oferecer um seletor de rota para transferência rápida.



10. Banco de dados e tecnologia



Utilizar Supabase para banco de dados PostgreSQL, autenticação e persistência das informações.



Criar tabelas organizadas para:



- Usuários.

- Cadastro permanente de lojas.

- Planejamentos diários.

- Registros das lojas em cada planejamento.

- Rotas.

- Configurações operacionais.

- Histórico de alterações, quando aplicável.



Definir relacionamentos e chaves estrangeiras corretamente.



Implementar Row Level Security (RLS) e políticas adequadas para proteger os dados.



Como o sistema poderá conter informações operacionais internas, não deixar as tabelas publicamente acessíveis. Não colocar chaves secretas no frontend.



Preparar uma estrutura que permita adicionar diferentes níveis de acesso no futuro, como administrador e planejador, sem exigir uma reconstrução completa.



11. Experiência de uso



Priorizar velocidade e simplicidade.



O usuário deve conseguir:



1. Selecionar a data e o turno.

2. Importar a planilha atual ou abrir as lojas já cadastradas.

3. Organizar as lojas nas rotas.

4. Marcar alto volume, apoio e rota avulsa.

5. Visualizar os alertas.

6. Confirmar o planejamento.

7. Exportar a versão final.



Adicionar confirmação antes de excluir dados, mensagens claras de erro, estados de carregamento e telas vazias úteis.



Não utilizar botões decorativos sem funcionalidade. Todos os botões e filtros devem funcionar.



12. Ordem de desenvolvimento



Desenvolva primeiro a estrutura visual e a navegação. Depois implemente o banco de dados e as operações reais de cadastro, edição, exclusão e consulta.



Em seguida, implemente importação e exportação, cálculos automáticos, alertas e histórico.



Priorize um MVP funcional e confiável antes de adicionar recursos complexos.



Ao finalizar, teste os fluxos de cadastro, edição, importação, atribuição de rotas, atualização de volumes, alertas, exportação e persistência após recarregar a página.



O resultado deve ser um sistema profissional de planejamento First Mile, pronto para evoluir conforme as necessidades reais da operação.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://collection-route-compass.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/518882d2-2cec-4f0b-bcb6-64bb2a5296b7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
