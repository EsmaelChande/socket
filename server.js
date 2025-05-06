const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORTA = process.env.PORT || 3000;
const CAMINHO_HTML = path.join(__dirname, 'public', 'index.html');
const clientes = [];

function responderPaginaInicial(req, res) {
  fs.readFile(CAMINHO_HTML, function (erro, dados) {
    if (erro) {
      res.writeHead(500);
      res.end('Erro ao carregar a página HTML.');
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(dados);
    }
  });
}

function lidarComMensagem(remetente, mensagem) {
  for (let i = 0; i < clientes.length; i++) {
    const cliente = clientes[i];
    if (cliente !== remetente && cliente.readyState === WebSocket.OPEN) {
      cliente.send('Outro utilizador: ' + mensagem);
    }
  }
}

function aoDesconectar(ws) {
  const index = clientes.indexOf(ws);
  if (index !== -1) {
    clientes.splice(index, 1);
    console.log('Um cliente saiu do chat.');
  }
}

function aoConectar(ws) {
  if (clientes.length >= 2) {
    ws.send('O chat já tem dois utilizadores conectados.');
    ws.close();
    return;
  }

  clientes.push(ws);
  ws.send('Ligado ao servidor de chat.');

  ws.on('message', function (mensagem) {
    console.log('Mensagem recebida:', mensagem.toString());
    lidarComMensagem(ws, mensagem.toString());
  });

  ws.on('close', function () {
    aoDesconectar(ws);
  });
}

function iniciarServidor() {
  const servidorHTTP = http.createServer(responderPaginaInicial);
  const servidorWS = new WebSocket.Server({ server: servidorHTTP });

  servidorWS.on('connection', aoConectar);

  servidorHTTP.listen(PORTA, function () {
    console.log('Servidor WebSocket a correr na porta ' + PORTA);
  });
}

iniciarServidor();
