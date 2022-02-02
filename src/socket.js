const SOCKET_IP = '127.0.0.1';
const SOCKET_PORT = 9001;

const PAYLOAD_TYPE = {
    CONTROL: 'control',
    UPDATE: 'update',

    CONVERSATION: 'conversation',
    CONVERSATION_RESPONSE: 'conversation_response',
    MESSAGE: 'message',

    NEW_GROUP: 'new',
    GROUP_REQUEST: 'request',
    GROUP_RESPONSE: 'response',
    GROUP_UPDATE: 'update'
}

/**
 * @type {Socket}
 */
let socketInstance = null;

class Socket {
    constructor() {
        this.onReadyCallbacks = [];
        this.listenerCallbacks = {};
        this.connectionIsReady = false;
    }

    static getInstance() {
        if (socketInstance == null)
            socketInstance = new Socket();

        return socketInstance;
    }

    // Public Methods
    createSocket() {
        this.client = new Paho.Client(SOCKET_IP, SOCKET_PORT, this._getTopic());

        this.client.onConnectionLost = (responseObject) => this._onConnectionLost(responseObject);
        this.client.onMessageArrived = (message) => this._onMessageArrived(message);

        this.client.connect({
            onSuccess: () => this._onConnect(),
            onFailure: (error) => this._onFailure(error),
        });

        debug('Socket', 'Socket criado:', this.client);
    }

    send(payload) {
        this.client.send(payload);
    }

    onConnectionReady(callback) {
        if (this.connectionIsReady)
            callback();
        else
            this.onReadyCallbacks.push(callback);

        return this;
    }

    addListener(topic, callback) {
        debug('Socket', `Adicionado ouvinte ao tópico '${topic}'`);

        this.listenerCallbacks[topic] = this.listenerCallbacks[topic] || [];
        this.listenerCallbacks[topic].push(callback);

        this.client.subscribe(topic);

        return this;
    }

    // Private Methods
    _getTopic() {
        const id = Auth.getUserId();
        return User.generateUserTopic(id);
    }

    _onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
            debug('Socket', 'Conexão perdida. Msg ' + responseObject.errorMessage, responseObject);
        }
    }

    _onMessageArrived(message) {
        debug('Socket', 'Mensagem recebida:', JSON.parse(message.payloadString), message);

        const parsedMessage = JSON.parse(message.payloadString);

        this._callMessageArrived(message.topic, parsedMessage);
    }

    _onConnect() {
        debug('Socket', 'Socket para instância atual conectado. Topico:', this._getTopic());

        this._callOnReadyCallbacks();
        this.connectionIsReady = true;
    }

    _callMessageArrived(topic, payload) {
        const callbacks = this.listenerCallbacks[topic] || [];

        for (let cb of callbacks) {
            try {
                cb(payload);
            } catch (error) {
                console.error(error);
            }
        }
    }

    _callOnReadyCallbacks() {
        let cb = undefined;
        while (cb = this.onReadyCallbacks.pop()) {
            cb();
        }
    }

    _onFailure(error) {
        debug('User', 'Erro ao inicar socket:', error);
    }
}