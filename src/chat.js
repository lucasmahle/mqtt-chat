class Chat extends ChatTemplate {
    constructor() {
        super();
        this.CHATS = [];
        this.HISTORIC = {};
        this.ACTIVE_CHAT = 0;
    }

    // Public Methods
    hasToRequestChat(id) {
        return !this.CHATS.some(chat => chat.id == id);
    }

    addChat(userId, topic) {
        this.CHATS.push({
            id: userId,
            topic
        });

        this.HISTORIC[userId] = [];
    }

    addMessage(userId, messageObj) {
        this.HISTORIC[userId].push(messageObj);

        if (this.ACTIVE_CHAT == userId)
            this.renderChat(userId);
    }

    loadChat(id) {
        this.ACTIVE_CHAT = id;
        this.renderChat(id);
    }

    getActiveChatInfo() {
        const userId = this.ACTIVE_CHAT;

        return this.CHATS.find(chat => chat.id == userId);
    }

    onMessageSent(callback) {
        this.onMessageSentCallback = callback;
    }

    // Private Methods
}