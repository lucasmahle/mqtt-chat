class Group extends GroupTemplate {
    constructor() {
        super();

        this.chatInstance = new Chat(CHAT_CALLBACK_TYPE.GROUP);
        this.chatInstance.onMessageSent((message) => {
            this._handleSentMessage(message);
        });

        this.renderGroups();
        this.setup();
    }

    // Public Methods
    setup() {
        Socket
            .getInstance()
            .onConnectionReady(() => {
                this._handleSocketReady();
            });
    }

    generateGroupTopic(group) {
        const leaderId = User.extractId(group.leader);
        const groupId = group.id;

        return `${leaderId}_${groupId}`;
    }

    extractInfoFromTopic(topic) {
        const [leaderId, groupId] = topic.split('_');

        return {
            leader: leaderId,
            group: groupId
        };
    }

    handleGroupCreating(name) {
        this._sendGroupCreation(name);
    }

    handleGroupChat(id) {
        if (!this._userHasAccessToGroup(id))
            return this._handleRequestGroupAccess(id);

        this.startConversation(id);
    }

    startConversation(id) {
        const group = App.getGroupById(id);
        const groupInfo = {
            ...group,
            leader: App.getUserById(User.extractId(group.leader)),
            members: group.members.map(memberTopic => App.getUserById(User.extractId(memberTopic)))
        };

        this.chatInstance.loadGroupChat(id);
        this.chatInstance.renderGroupInfo(groupInfo);
    }

    handleSentGroupRequest(id) {
        this._sendGroupRequest(id);
    }

    handleSentGroupResponse(groupId, userId, status) {
        const group = App.getGroupById(groupId);
        const user = App.getUserById(userId);

        this._sendGroupResponse(group, user, status);

        if (status) {
            group.members.push(User.generateUserTopic(userId));
            this._sendGroupUpdate(group);
        }
    }

    // Private Methods
    _generateGroupId() {
        return moment().format('YYYYMMDDHHmmss');
    }

    _getUserTopic() {
        return User.generateUserTopic();
    }

    _handleRequestGroupAccess(id) {
        const group = App.getGroupById(id);

        this.openGroupConfirmationModal(group);
    }

    _handleSocketReady() {
        Socket
            .getInstance()
            .addListener(TOPIC.USERS, (payload) => this._onMessageArrived(payload))
            .addListener(TOPIC.GROUPS, (payload) => this._onMessageArrived(payload))
            .addListener(User.generateUserTopic(), (payload) => this._onMessageArrived(payload));
    }

    _handleSentMessage(message) {
        const { id: destinationId, topic } = this.chatInstance.getActiveChatInfo();
        const { group: groupId } = this.extractInfoFromTopic(topic);
        const destination = App.getGroupById(groupId);
        debug('Group', `Mensagem "${message}" será enviado ao grupo: `, destination);

        const payload = this._sendChatMessage(message, topic, groupId);
        this.chatInstance.addMessage(destinationId, payload);
    }

    _sendChatMessage(message, topic, groupId) {
        const obj = {
            from: User.generateUserTopic(),
            group: groupId,
            type: PAYLOAD_TYPE.GROUP_MESSAGE,
            payload: message,
            time: App.getTimestamp()
        };

        this._sendObject(obj, topic);

        return obj;
    }

    _userHasAccessToGroup(groupId) {
        const group = App.getGroupById(groupId);
        const userTopic = this._getUserTopic();

        return (group.leader == userTopic) || group.members.some(memberTopic => memberTopic == userTopic);
    }

    _handleLoginUser(payload) {
        debug('Group', 'Enviando grupos ao usuário recém logado', payload);

        const leaderTopic = User.generateUserTopic();
        const groupsByLeader = App.getGroupsByLeader(leaderTopic);

        for (let group of groupsByLeader) {
            this._sendGroupUpdate(group);
        }
    }

    _handleLogoutUser(payload) {
        debug('Group', 'Apagando grupos do usuário que deslogou', payload);

        const userTopic = payload.id;
        this._deleteGroupsByLeader(userTopic);
        this._removeOfflineMemberFromGroups(userTopic);

        this.renderGroups();
    }

    _removeOfflineMemberFromGroups(memberTopic) {
        const leaderTopic = User.generateUserTopic();
        const groupsByLeader = App.getGroupsByLeader(leaderTopic);

        for (let group of groupsByLeader) {
            const index = group.members.indexOf(memberTopic);
            if (index < 0) continue;

            group.members.splice(index, 1);
            this._sendGroupUpdate(group);
        }
    }

    _deleteGroupsByLeader(leaderTopic) {
        const groups = App.getGroups().filter(group => group.leader != leaderTopic);
        App.setGroups(groups)
    }

    _sendObject(obj, topic) {
        const message = new Paho.Message(JSON.stringify(obj));
        message.destinationName = topic;

        Socket
            .getInstance()
            .send(message);
    }

    _sendGroupRequest(id) {
        const group = App.getGroupById(id);
        debug('Group', `Enviando requisição de acesso ao líder do grupo '${group.name}'`);

        const obj = {
            type: PAYLOAD_TYPE.GROUP_REQUEST,
            id: id,
            from: this._getUserTopic(),
        };

        this._sendObject(obj, group.leader);
    }

    _sendGroupUpdate(group) {
        const obj = {
            type: PAYLOAD_TYPE.GROUP_UPDATE,
            id: group.id,
            name: group.name,
            leader: group.leader,
            members: group.members,
        };

        this._sendObject(obj, TOPIC.GROUPS);
    }

    _sendGroupResponse(group, user, status) {
        debug('Group', `Enviando requisição de acesso ao líder do grupo '${group.name}'`);

        const obj = {
            type: PAYLOAD_TYPE.GROUP_RESPONSE,
            id: group.id,
            leader: this._getUserTopic(),
            status: status,
        };

        this._sendObject(obj, User.generateUserTopic(user.id));
    }

    _sendGroupCreation(name) {
        const obj = {
            id: this._generateGroupId(),
            type: PAYLOAD_TYPE.NEW_GROUP,
            name: name,
            leader: this._getUserTopic(),
            members: []
        };

        this._sendObject(obj, TOPIC.GROUPS);
    }

    _startChat(group, topic) {
        this.chatInstance.addChat(group.id, topic);
        this.startConversation(group.id);

        debug('Group', 'Adicionando inscrição no tópico do grupo', topic);

        Socket
            .getInstance()
            .addListener(topic, (payload) => this._onMessageArrived(payload));
    }

    // Message proccess 
    _onMessageArrived(payload) {
        switch (payload.type) {
            case PAYLOAD_TYPE.NEW_GROUP: return this._proccessGroupCreaction(payload);
            case PAYLOAD_TYPE.GROUP_REQUEST: return this._proccessGroupRequest(payload);
            case PAYLOAD_TYPE.GROUP_RESPONSE: return this._proccessGroupResponse(payload);
            case PAYLOAD_TYPE.GROUP_UPDATE: return this._proccessGroupUpdate(payload);
            case PAYLOAD_TYPE.GROUP_MESSAGE: return this._proccessGroupMessage(payload);
            case PAYLOAD_TYPE.CONTROL: return this._proccessUserStatus(payload);
        }
    }

    _proccessGroupCreaction(payload) {
        debug('Group', 'Processando novo grupo criado', payload);

        const groups = App.getGroups();
        groups.push(payload);
        App.setGroups(groups);

        this.renderGroups();

        if (payload.leader == User.generateUserTopic()) {
            const groupTopic = this.generateGroupTopic(payload);
            this._startChat(payload, groupTopic);
        }
    }

    _proccessGroupRequest(payload) {
        debug('Group', 'Requisição para entrar no grupo', payload);

        const group = App.getGroupById(payload.id);
        const user = App.getUserById(User.extractId(payload.from));
        this.openGroupRequestModal(group, user)
    }

    _proccessGroupResponse(payload) {
        debug('Group', 'Resposta sobre entrada no grupo', payload);

        const group = App.getGroupById(payload.id);
        const user = App.getUserById(User.extractId(payload.leader));
        this.openGroupResponseModal(group, user, payload.status);

        if (payload.status) {
            const groupTopic = this.generateGroupTopic(payload)
            this._startChat(group, groupTopic);
        }
    }

    _proccessGroupUpdate(payload) {
        if (!payload.leader) return;

        debug('Group', 'Informação de grupo foi atualizado', payload);

        const groupExists = !!App.getGroupById(payload.id);

        if (groupExists)
            App.updateGroupById(payload.id, payload);
        else {
            const groups = App.getGroups();
            groups.push(payload);
            App.setGroups(groups);
        }

        this.renderGroups();
    }

    _proccessGroupMessage(payload) {
        if (payload.from == User.generateUserTopic())
            return;

        const group = App.getGroupById(payload.group);

        debug('Group', `Mensagem no grupo "${group.name}" recebida`, payload);
        this.chatInstance.addMessage(group.id, payload);
    }

    _proccessUserStatus(payload) {
        if (payload.id == User.generateUserTopic())
            return;

        if (payload.status)
            this._handleLoginUser(payload);
        else
            this._handleLogoutUser(payload);
    }
}