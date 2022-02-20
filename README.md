# 1.0: Startar aplicação

Suba o broker Mosquitto com a configuração do nosso projeto utilizando o comando abaixo
```bash
$ mosquitto -c ./assets/mosquitto.conf
```

Em seguida basta subir a aplicação javascript e roda-la em seu navegador. Nosso grupo fez isso a partir da extensão Live Server do Visual Studio Code. Com essa extensão instalada, basta clicar no botão "Go Live" que aparece na IDE, e o projeto sobe e é aberto no navegador.



# 2.0: Funcionalidades

### 2.1: Login

Primeiramente informe o id do seu usuário, ele pode ser 1, 2 ou 3 (valores que definimos no arquivo users.json). Após isso você abrirá. Quando você se identifica como usuário, o valor fica salvo no navegador, então vc sempre estará logado com esse usuário a menos que limpe o LocalStorage do navegador. Você pode entrar com mais de um usuário utilizando a janela anônima do navegador ou utilizando outro navegador.

### 2.2: Chat de usuários

Após o login, o nome dos usuários presentes no arquivo users.json aparecem na tela, ao lado de um círculo vermelho ou verde que identifica se eles estão online ou offline. O usuário pode clicar no nome dos usuários que estão online e enviar uma solicitação de conversa, caso seja aceita, o chat fica disponível para ambos trocarem mensagens.

### 2.3: Chat de grupos

TODO

# 3.0: Funcionamento interno da aplicação

### 3.1: Login
A primeira tela exibida ao usuário é a tela de "Login", na qual o usuário deve informar seu Id. Os Ids de usuários válidos estão armazenados no arquivo users.json. Ao receber um Id válido a aplicação exibe a tela de chat e usuários disponíveis no arquivo users.json.

### 3.2: Usuários online/offline
Após o Login, a aplicação se conecta com o broker com o protocolo websocket. Quando a conexão é feita, a aplicação passa a assinar o tópico USERS, referente ao status de online ou offline dos usuários e publica que está ONLINE, enviando um pacote com seu ID, tipo CONTROL com status TRUE conforme mostrado no <b>[Capítulo 4.2]</b>. As outras aplicações que assinaram o tópico, ao receber uma publicação nesse formato, atualizam na tela o usuário como online e fazem uma publicação com seu ID e tipo UPDATE<b>[Capítulo 4.4]</b>, os assinantes colocam todos que publicaram como online. Dessa forma o novo usuário sabe quais estão online desde antes de ele assinar o tópico. Também é publicado um pacote com ID, tipo CONTROL com status FALSE caso o usuário feche a aplicação no navegador<b>[Capítulo 4.3]</b>, um callback foi criado para monitorar caso a janela ou guia seja fechada e faz o envio antes da ação acontecer. Com isso os outros assinantes marcam o usuário como offline. 

### 3.3: Iniciação de conversa
Após a conexão com o broker ser realizada, também é criado o tópico com o nome "{idUsuario}_Control"<b>[Capítulo 4.1]</b> e o usuário se inscreve nesse tópico. Caso outro usuário deseje iniciar uma conversa, a aplicação dele enviará uma publicação do tipo CONVERSATION<b>[Capítulo 4.5]</b>. A aplicação do usuário que recebeu a solicitação abrirá uma informará que há um solicitação de conversa na qual ele pode aceitar ou recusar, sua resposta resulta em uma publicação do tipo Conversation_Response <b>[Capítulo 4.5]</b>. Caso seja aceita e criado um novo tópico e ambos os usuários entram nele, o nome do tópico será uma união do id de ambos e o timestamp. Quando um dos usuários desloga, o outro usuário sabe por conta do tópico USERS<b>[Capítulo 4.3]</b> e sai do tópico da conversa. Caso o usuário clique para iniciar a conversa com outro usuário, porém o tópico já existe, as mensagens são exibidas e o tópico não precisa ser recriado.

### 3.4: Troca de mensagems
Após o tópico do chat entre dois usuários ser criado, quando qualquer um deles submete a mensagem a aplicação publica no tópico, no formato <b>[Capítulo 4.6]</b> e salva em um array de histórico, armazenando o histórico para caso o usuário abra outro chat e depois reabra o chat que foi ocultado. Essa feature também é útil para caso o usuário receba a mensagem mas o chat não esteja aberto, por exemplo, quando ele está conversando com outra pessoa, nesse caso a conversa aparecerá quando o usuário voltar a abrir o chat cuja mensagem foi recebida.

### 3.5: Grupos 
TODO

# 4.0: Tópicos e Publicações

Este capítulo explica e exemplifica os tipos de publicações e tópicos utilizados para completar o entendimento do capítulo anterior

## 4.1: Instância

Quando uma nova instância é criada, é definido o tópico que controla o identificador da instância, que será `{{id}}_control`.
Por ex:
`id: 9`
`tópico: 9_control`

## 4.2: Tópico Online

Assim que a instância é criada, é enviado para o tópico `users` o seu id. Então, todos as instâncias já criadas recebem a informação que o usuário está online.
O padrão de envio dessa informação é um json com o seguinte formato:
```json
{
    "id": "9_control",
    "status": true,
    "type": "control"
}
```
Sendo status `true` para ONLINE e `false` para OFFLINE.

A instância quando receba essa informação, altera a lista de usuários onlines com a info do usuário que logou.

## 4.3: Tópico Offline

Quando o usuário clica no botão de SAIR, é enviado para o tópico `users` a informação de logout.
O padrão de envio dessa informação é um json com o seguinte formato:
```json
{
    "id": "9_control",
    "status": false,
    "type": "control"
}
```
Sendo status `true` para ONLINE e `false` para OFFLINE.

A instância quando receba essa informação, altera a lista de usuários onlines com a info do usuário que deslogou.

## 4.4: Processando usuário online

Quando receber a informação de usuário online, todos as instâncias online, enviam para o tópico `users` um sinal, para que o usuário que acabou de se conectar, consiga saber quem está online. Sendo assim, todos enviam a seguinte informação:
```json
{
    "id": "9_control",
    "type": "update"
}
```
Essa informação é relevante somente ao usuário que acabou de se conectar, para os demais, a informação é ignorada.
O mesmo acontece com grupos, todas instâncias cujo são líderes de algum grupo, enviam para o tópico `groups`, da mesma maneira que acontece na seção "Atualizando informações do grupos" deste documento.
```json
{
    "type": "update",
    "id": "20211226150122",
    "name": "Grupo do Zequinha",
    "leader": "foo_control",
    "members": ["bar_control"]
}
```

## 4.5: Início conversa

Quando um usuário clica em outro usuário para iniciar uma conversa, é enviado para a instância alvo uma requisição para iniciar uma conversa. Após o usuário alvo aceitar ou recusar a conversa, é enviado a informação ao usuário solicitante, e caso seja uma resposta positiva, é definido um tópico para a conversa entre ambos, no formato `{{solicitante}}_{{alvo}}_{{timestamp}}`
Ex:
O usuário cujo possui tópico de controle `foo_control` deseja iniciar com um usuário cujo o tópico de controle é `bar_control`.
A instância do solicitante envia uma mensagem para a instância do alvo com o seguinte contúdo:
```json
{
    "from": "foo_control",
    "type": "conversation"
}
```

A instância do alvo processa e exibe o modal para o usuário confirmar ou recusar, quando o usuário aceita/recusa, a instância do alvo manda uma mensagem para a instância solicitante com o seguinte conteúdo:
```json
{
    "from": "bar_control",
    "type": "conversation_response",
    "status": true
}
```
Sendo status `true` para ACEITAR e `false` para RECUSAR.

Caso seja aceita a conversa, é criado o tópico entre ambos, considerando como timestamp a hora e minuto do momento. Nesse caso seria `foo_bar_1534`, sendo `foo` o id do solicitante, `bar` o id do alvo e `1534` o timestamp do momento.

Quando um dos dois usuário deslogar, é enviado para o tópico `users` essa informação, logo, todos que possui alguma conversa ativa, removem a informação. Tornando necessário uma nova requisição e aceite quando o usuário logar novamente

## 4.6: Envio de mensagem

Uma vez a conversa ativa, quando um usuário envia uma mensagem, a instância envia para o alvo a seguinte informação:
```json
{
    "from": "foo_control",
    "type": "message",
    "payload": "Hello World!",
    "time": "2021-12-23T20:33:13.471Z"
}
```

## 4.7 Criando novo grupo

Quando um usuário decide criar um grupo, a aplicação irá requisitar o nome do grupo. Após isso, o grupo será criado e será replicado a todos as instâncias pelo tópico `groups`. Também é gerado um `id` para identificar o grupo, esse `id` será formado pelo timestamp no formato `{{ano}}{{mês}}{{dia}}{{hora}}{{minuto}}{{segundo}}`.
```json
{
    "type": "new",
    "id": "20211226150122",
    "name": "Grupo do Zequinha",
    "leader": "foo_control",
    "members": []
}
```
Todos que receberem essa informação, atualizarão a lista de grupos, considerando o `id` para evitar duplicidade na atualização de informações.

## 4.8 Requisitando entrada no grupo

Quando um usuário desejar ingressar em um grupo, um pedido será enviado ao líder, com a seguinte informação:
```json
{
    "type": "request",
    "id": "20211226150122",
    "from": "bar_control",
}
```
Sendo `id`, o identificador do grupo.

## 4.9 Respondendo requisição para entrar no grupo

Assim que o líder receber a informação de requisição para entrada no grupo, ele pode aceitar ou recusar a entrada, após essa ação, será enviada para o usuário solicitante a seguinte informação:
```json
{
    "type": "response",
    "id": "20211226150122",
    "leader": "foo_control",
    "status": true,
}
```
Sendo status `true` para ACEITE e `false` para RECUSADO.

## 4.10 Atualizando informações do grupos

Se um novo usuário entra em um grupo, o líder envia para o tópico `groups` as nova informações do grupo:
```json
{
    "type": "update",
    "id": "20211226150122",
    "name": "Grupo do Zequinha",
    "leader": "foo_control",
    "members": ["bar_control"]
}
```
Todos que receberem a informação, vão conseguir atualizar a lista de grupos.

## 4.11 Apagando o grupo

Quando o líder resolve apagar o grupo, ele envia para o tópico `groups` um objeto com a informação que o grupo foi apagado:
```json
{
    "type": "delete",
    "id": "20211226150122",
    "leader": "foo_control",
}
```

