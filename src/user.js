
class User extends UserTemplate {
    constructor() {
        super();
        this.countRecivedUpdateStatus = 0;

        this.chatInstance = new Chat(CHAT_CALLBACK_TYPE.USER);
        this.chatInstance.onMessageSent((message) => {
            this._handleSentMessage(message);
        });
    }

    // Static Methods
    static generateUserTopic(id) {
        if (typeof id == 'undefined')
            id = Auth.getUser().id;

        return `${id}_control`;
    }

    static extractId(topic) {
        return Number(topic.replace('_control', ''));
    }

    // Public Methods

    onSignIn() {
        this.renderUsers();

        Socket
            .getInstance()
            .onConnectionReady(() => {
                this._handleSocketReady();
            });
    }

    sendOfflineBroadcast() {
        if (!Auth.isLogged()) return;

        const obj = {
            id: User.generateUserTopic(),
            status: false,
            type: PAYLOAD_TYPE.CONTROL
        };

        this._sendObject(obj, TOPIC.USERS);
    }

    // Protected Methods
    startConversation(id) {
        if (this.chatInstance.hasToRequestChat(id)) {
            debug('User', 'Solicitar início de conversa com id: ' + id, App.getUserById(id));
            this._sendChatSolicitation(id);
            return;
        }

        debug('User', `Conversa com id ${id} já solicitando. Renderizando chat com `, App.getUserById(id).name);
        this.chatInstance.loadUserChat(id);
    }

    handleChatResponse(id, response) {
        const user = App.getUserById(id);
        debug('User', `Respondendo ${response ? 'positivamente' : 'negativamente'} o id ${id}`, user);

        const chatTopic = this._generateChatTopic(id);
        this._sendChatResponse(id, response, chatTopic);

        if (response) {
            this._startChat(user, chatTopic);
        }
    }

    // Private Methods
    _generateChatTopic(targetId) {
        const dateTime = new Date;
        const timestamp = `${String(dateTime.getHours()).padStart(2, '0')}${String(dateTime.getMinutes()).padStart(2, '0')}`;
        return `${targetId}_${Auth.getUser().id}_${timestamp}`;
    }

    _handleSocketReady() {
        Socket
            .getInstance()
            .addListener(User.generateUserTopic(), (payload) => this._onMessageArrived(payload))
            .addListener(TOPIC.USERS, (payload) => this._onMessageArrived(payload));

        this._sendOnlineBroadcast();
    }

    _handleSentMessage(message) {
        const { id: destinationId, topic } = this.chatInstance.getActiveChatInfo();
        const destination = App.getUserById(destinationId);
        debug('User', `Mensagem "${message}" será enviado ao usuário: `, destination);

        const payload = this._sendChatMessage(message, topic);
        this.chatInstance.addMessage(destinationId, payload);
    }

    _sendChatMessage(message, topic) {
        const obj = {
            from: User.generateUserTopic(),
            type: PAYLOAD_TYPE.MESSAGE,
            payload: message,
            time: App.getTimestamp()
        };

        this._sendObject(obj, topic);

        return obj;
    }

    _sendOnlineBroadcast() {
        const obj = {
            id: User.generateUserTopic(),
            status: true,
            type: PAYLOAD_TYPE.CONTROL
        };

        this._sendObject(obj, TOPIC.USERS);
    }

    _sendChatSolicitation(id) {
        const obj = {
            from: User.generateUserTopic(),
            type: PAYLOAD_TYPE.CONVERSATION
        };

        this._sendObject(obj, User.generateUserTopic(id));
    }

    _sendChatResponse(id, response, chatTopic) {
        const obj = {
            from: User.generateUserTopic(),
            type: PAYLOAD_TYPE.CONVERSATION_RESPONSE,
            status: response,
            topic: chatTopic
        };

        this._sendObject(obj, User.generateUserTopic(id));
    }

    _sendUpdateStatus() {
        const obj = {
            id: User.generateUserTopic(),
            type: PAYLOAD_TYPE.UPDATE
        };

        this._sendObject(obj, TOPIC.USERS);
    }

    _sendObject(obj, topic) {
        const message = new Paho.Message(JSON.stringify(obj));
        message.destinationName = topic;

        Socket
            .getInstance()
            .send(message);
    }

    _startChat(user, topic) {
        this.chatInstance.addChat(user.id, topic);
        this.startConversation(user.id);

        debug('User', 'Adicionando inscrição no tópico da conversa', topic);

        Socket
            .getInstance()
            .addListener(topic, (payload) => this._onMessageArrived(payload));
    }

    // Message proccess 
    _onMessageArrived(payload) {
        switch (payload.type) {
            case PAYLOAD_TYPE.CONTROL: return this._proccessUserStatus(payload);
            case PAYLOAD_TYPE.UPDATE: return this._proccessUpdateStatus(payload);
            case PAYLOAD_TYPE.CONVERSATION: return this._proccessChatSolicitation(payload);
            case PAYLOAD_TYPE.CONVERSATION_RESPONSE: return this._proccessChatResponse(payload);
            case PAYLOAD_TYPE.MESSAGE: return this._proccessChatMessage(payload);
        }
    }

    _proccessUserStatus(payload) {
        if (payload.id == User.generateUserTopic())
            return;

        debug('User', 'Processando que mudou status', payload);

        if (payload.status) {
            this._sendUpdateStatus();
            debug('User', 'Enviando o próprio status para usuário recém logado');
        }

        const id = User.extractId(payload.id);
        App.updateUserById(id, {
            status: payload.status
        });

        this.renderUsers();
    }

    _proccessUpdateStatus(payload) {
        if (payload.id == User.generateUserTopic())
            return;

        if (this.countRecivedUpdateStatus === App.getUsers().length)
            return;

        debug('User', 'Processando usuário já online', payload);

        const id = User.extractId(payload.id);
        const users = App.getUsers();

        App.setUsers(users.map(user => {
            if (user.id != id) return user;

            return {
                ...user,
                status: true
            }
        }));

        this.renderUsers();
        this.countRecivedUpdateStatus++;
    }

    _proccessChatSolicitation(payload) {
        debug('User', 'Requistado início de conversa', payload);

        const id = User.extractId(payload.from);
        const user = App.getUserById(id);

        super.renderConfirmationModal(user);
    }

    _proccessChatResponse(payload) {
        debug('User', `Usuário respondeu ${payload.status ? 'positivamente' : 'negativamente'} a solicitação para iniciar a conversa`, payload);

        const id = User.extractId(payload.from);
        const user = App.getUserById(id);

        if (!payload.status) {
            super.renderRespondeModal(user);
            return;
        }

        this._startChat(user, payload.topic);
    }

    _proccessChatMessage(payload) {
        if (payload.from == User.generateUserTopic())
            return;

        debug('User', `Recebido uma mensagem de ${payload.from}`, payload);
        const fromId = User.extractId(payload.from);
        this.chatInstance.addMessage(fromId, payload);
    }
}