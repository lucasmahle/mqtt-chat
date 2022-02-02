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

        this.HISTORIC[userId] = [
            // {
            //     "from": "1_control",
            //     "type": "message",
            //     "payload": "Hello World!",
            //     "time": "2021-12-23T20:33:13.471Z"
            // },
            // {
            //     "from": "1_control",
            //     "type": "message",
            //     "payload": "Hello World!",
            //     "time": "2021-12-23T20:33:13.471Z"
            // },
            // {
            //     "from": "1_control",
            //     "type": "message",
            //     "payload": "Hello World!",
            //     "time": "2021-12-23T20:33:13.471Z"
            // },
            // {
            //     "from": "1_control",
            //     "type": "message",
            //     "payload": "Hello World!",
            //     "time": "2021-12-23T20:33:13.471Z"
            // },
            // {
            //     "from": "2_control",
            //     "type": "message",
            //     "payload": "Hello Dude!!",
            //     "time": "2021-12-23T20:34:12.471Z"
            // },
        ];
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