## Início

Quando uma aba é aberta, é requisitado ao usuário informar qual o id de utilização, assim que confirmado o id, é criada a instância. Lembrando que os usuários disponíveis estão pré definidos diretamente no código.

## Instância

Quando uma nova instância é criada, é definido o tópico que controla o identificador da instância, que será `{{id}}_control`.
Por ex:
`id: 9`
`tópico: 9_control`

## Online

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

## Offline

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

## Processando usuário online

Quando receber a informação de usuário online, todos as instâncias online, enviam para o tópico `users` um sinal, para que o usuário que acabou de se conectar, consiga saber quem está online. Sendo assim, todos enviam a seguinte informação:
```json
{
    "id": "9_control",
    "type": "update"
}
```
Essa informação é relevante somente ao usuário que acabou de se conectar, para os demai, a informação é ignorada.
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

## Início conversa

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

## Envio de mensagem

Uma vez a conversa ativa, quando um usuário envia uma mensagem, a instância envia para o alvo a seguinte informação:
```json
{
    "from": "foo_control",
    "type": "message",
    "payload": "Hello World!",
    "time": "2021-12-23T20:33:13.471Z"
}
```

## Recebendo mensagem

Quando a instância recebe mensagem, a instância salva a mensagem e data em uma lista de mensagens referente à conversa. Caso a conversa esteja aberta, ela será exibida na lista, caso contrário, fica salvo em memória para ser renderizada quando o usuário abrir a conversa.

## Criando novo grupo

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

## Requisitando entrada no grupo

Quando um usuário desejar ingressar em um grupo, um pedido será enviado ao líder, com a seguinte informação:
```json
{
    "type": "request",
    "id": "20211226150122",
    "from": "bar_control",
}
```
Sendo `id`, o identificador do grupo.

## Respondendo requisição para entrar no grupo

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

## Atualizando informações do grupos

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

## Apagando o grupo

Quando o líder resolve apagar o grupo, ele envia para o tópico `groups` um objeto com a informação que o grupo foi apagado:
```json
{
    "type": "delete",
    "id": "20211226150122",
    "leader": "foo_control",
}
```

## Startar aplicação

```bash
$ mosquitto -c ./assets/mosquitto.conf
```