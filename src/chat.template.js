const KEY_MAP = {
    ENTER: 'Enter'
};

class ChatTemplate {
    constructor() {
        this.$chatHistory = $('.chat-history');
        this.$chatHistoryUl = this.$chatHistory.find('ul');
        this.$chatUserName = $('#chat-user-name');
        this.$chatMessageInput = $('#chat-message-input');
        this.$chatMessageBtn = $('#chat-message-btn');

        this._setupEvents();
    }

    // Public Methods
    renderChat(userId) {
        this.$chatUserName.text(App.getUserById(userId).name);

        const messages = this.HISTORIC[userId].map(message => {
            const fromDestination = message.from == User.generateUserTopic(userId);
            const messageDate = moment(message.time).format("DD/MM HH:mm");

            return `
<li class="clearfix">
    <div class="message-data ${fromDestination ? '' : 'text-right'}">
        <span class="message-data-time">${messageDate}</span>
    </div>
    <div class="message ${fromDestination ? 'my-message' : 'other-message'} float-${fromDestination ? 'left' : 'right'}">${message.payload}</div>
</li>`;
        });

        this.$chatHistoryUl.html(messages.join(''));
        if (!this.$chatHistory.hasClass('chat-active'))
            this.$chatHistory.addClass('chat-active');

        this._focusInputMessage();
        this._scrollBottom();
    }

    renderCreateGroupInfo(group) {
        const html = `
    <li class="group-info">
        <div>Id: ${group.id}</div>
        <div>Nome: ${group.name}</div>
        <div>Líder: ${group.leader.name}</div>
        <div>Membros: ${group.members.map(member => member.name).join(', ')}</div>
    </li>
`;
        this.$chatHistoryUl.html(html);
    }

    // Private Methods
    _setupEvents() {
        this.$chatMessageBtn.on('click', () => {
            this._sendMessage();
            this._focusInputMessage();
        });

        this.$chatMessageInput.on('keydown', (e) => {
            if (e.key != KEY_MAP.ENTER || e.shiftKey)
                return;

            e.preventDefault();
            this._sendMessage();
        });
    }

    _sendMessage() {
        const message = this.$chatMessageInput.val();

        if (message.length == 0) return;

        this.$chatMessageInput.val('');
        this._focusInputMessage();
        this.onMessageSentCallback(message);
    }

    _focusInputMessage() {
        this.$chatMessageInput.trigger('focus');
    }

    _scrollBottom() {
        this.$chatHistory.scrollTop(this.$chatHistory.prop("scrollHeight") - this.$chatHistory.prop("clientHeight"))
    }
}