class Group extends GroupTemplate {
    constructor() {
        super();

        this.chatInstance = new Chat;
        this.GROUPS = [];

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

    getGroupById(id) {
        const group = this.GROUPS.find(group => group.id == id);

        return group;
    }

    updateGroupById(id, props) {
        for (let i in this.GROUPS) {
            if (this.GROUPS[i].id != id) continue;
            const groupToUpdate = this.GROUPS[i];
            this.GROUPS[i] = {
                ...groupToUpdate,
                ...props
            }
        }
    }

    handleGroupCreating(name) {
        this._sendGroupCreation(name)
    }

    handleGroupInfo(id) {
        if (!this._userHasAccessToGroup(id))
            return this._handleRequestGroupAccess(id);

        const group = this.getGroupById(id);
        const groupInfo = {
            ...group,
            leader: App.getUserById(User.extractId(group.leader)),
            members: group.members.map(memberTopic => App.getUserById(User.extractId(memberTopic)))
        };

        this.chatInstance.renderCreateGroupInfo(groupInfo);
    }

    handleSentGroupRequest(id) {
        this._sendGroupRequest(id);
    }

    handleSentGroupResponse(groupId, userId, status) {
        const group = this.getGroupById(groupId);
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
        const group = this.getGroupById(id);

        this.openGroupConfirmationModal(group);
    }

    _handleSocketReady() {
        Socket
            .getInstance()
            .addListener(TOPIC.USERS, (payload) => this._onMessageArrived(payload))
            .addListener(TOPIC.GROUPS, (payload) => this._onMessageArrived(payload))
            .addListener(User.generateUserTopic(), (payload) => this._onMessageArrived(payload));
    }

    _userHasAccessToGroup(groupId) {
        const group = this.getGroupById(groupId);
        const userTopic = this._getUserTopic();

        return (group.leader == userTopic) || group.members.some(memberTopic => memberTopic == userTopic);
    }

    _handleLoginUser(payload) {
        debug('Group', 'Enviando grupos ao usuário recém logado', payload);

        const leaderTopic = User.generateUserTopic();
        const groupsByLeader = this.GROUPS.filter(group => group.leader == leaderTopic);

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
        const groupsByLeader = this.GROUPS.filter(group => group.leader == leaderTopic);

        for (let group of groupsByLeader) {
            const index = group.members.indexOf(memberTopic);
            if (index < 0) continue;

            group.members.splice(index, 1);
            this._sendGroupUpdate(group);
        }
    }

    _deleteGroupsByLeader(leaderTopic) {
        this.GROUPS = this.GROUPS.filter(group => group.leader != leaderTopic);
    }

    _sendObject(obj, topic) {
        const message = new Paho.Message(JSON.stringify(obj));
        message.destinationName = topic;

        Socket
            .getInstance()
            .send(message);
    }

    _sendGroupRequest(id) {
        const group = this.getGroupById(id);
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

    // Message proccess 
    _onMessageArrived(payload) {
        switch (payload.type) {
            case PAYLOAD_TYPE.NEW_GROUP: return this._proccessGroupCreaction(payload);
            case PAYLOAD_TYPE.GROUP_REQUEST: return this._proccessGroupRequest(payload);
            case PAYLOAD_TYPE.GROUP_RESPONSE: return this._proccessGroupResponse(payload);
            case PAYLOAD_TYPE.GROUP_UPDATE: return this._proccessGroupUpdate(payload);
            case PAYLOAD_TYPE.CONTROL: return this._proccessUserStatus(payload);
        }
    }

    _proccessGroupCreaction(payload) {
        debug('Group', 'Processando novo grupo criado', payload);

        this.GROUPS.push(payload);

        this.renderGroups();
    }

    _proccessGroupRequest(payload) {
        debug('Group', 'Requisição para entrar no grupo', payload);

        const group = this.getGroupById(payload.id);
        const user = App.getUserById(User.extractId(payload.from));
        this.openGroupRequestModal(group, user)
    }

    _proccessGroupResponse(payload) {
        debug('Group', 'Resposta sobre entrada no grupo', payload);

        const group = this.getGroupById(payload.id);
        const user = App.getUserById(User.extractId(payload.leader));
        this.openGroupResponseModal(group, user, payload.status);
    }

    _proccessGroupUpdate(payload) {
        if (!payload.leader) return;

        debug('Group', 'Informação de grupo foi atualizado', payload);

        const groupExists = !!this.getGroupById(payload.id);

        if (groupExists)
            this.updateGroupById(payload.id, payload);
        else
            this.GROUPS.push(payload);

        this.renderGroups();
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