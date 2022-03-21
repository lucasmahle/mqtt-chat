const CHAT_CALLBACK_TYPE = {
    USER: 'user',
    GROUP: 'group'
}

class Chat extends ChatTemplate {
    constructor(chatType) {
        super();
        this.CHATS = [];
        this.HISTORIC = {};
        this.ACTIVE_CHAT = 0;
        this.CHAT_TYPE = chatType;
    }

    // Public Methods
    hasToRequestChat(id) {
        return !this.CHATS.some(chat => chat.id == id);
    }

    addChat(chatId, topic) {
        this.CHATS.push({
            id: chatId,
            topic
        });

        this.HISTORIC[chatId] = [];
    }

    addMessage(id, messageObj) {
        this.HISTORIC[id].push(messageObj);

        if (this.ACTIVE_CHAT == id) {
            if (this.CHAT_TYPE == CHAT_CALLBACK_TYPE.USER)
                this.renderUserChat(id);
            else
                this.renderGroupChat(id)
        }
    }

    loadUserChat(id) {
        this.ACTIVE_CHAT = id;
        App.setChatType(CHAT_CALLBACK_TYPE.USER);
        this.renderUserChat(id);
    }

    loadGroupChat(id) {
        this.ACTIVE_CHAT = id;
        App.setChatType(CHAT_CALLBACK_TYPE.GROUP);
        this.renderGroupChat(id);
    }

    getActiveChatInfo() {
        const id = this.ACTIVE_CHAT;
        return this.CHATS.find(chat => chat.id == id);
    }

    onMessageSent(callback) {
        this.onMessageSentCallback = callback;
    }

    isActiveType() {
        return this.CHAT_TYPE == App.getChatType();
    }

    handleMessageSent(message) {
        if (this.isActiveType())
            this.onMessageSentCallback(message);
    }

    // Private Methods
}