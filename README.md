# 1.0 Startar broker

Suba o broker Mosquitto com a configuração do projeto utilizando o comando abaixo:
```bash
$ mosquitto -c ./assets/mosquitto.conf
```

# 2.0 Aplicação

## 2.1 Instalação de dependências

Caso não exista a pasta `node_modules` na raíz do projeto, é necessário instalar as bibliotecas de dependência usando o compando `npm install` (`node.js` é pré requisito para efetuar esse passo).

## 2.2 Startar aplicação

É necessário subir um servidor local para acessar o arquivo `index.html`.
Sugerimos que seja utilizado o editor de código [`Visual Studio Code`](https://code.visualstudio.com/), bem como a instalação da extensão [`Live Server`](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).
Com a extensão instalada, basta clicar no botão `Go Live` (geralmente no canto inferior direito), automaticamente será aberto uma página no navegador (geralmente em http://127.0.0.1:5500).

# 3.0 Documentação

A documentação do projeto está no arquivo `documentation.pdf` disponível na raíz do projeto.