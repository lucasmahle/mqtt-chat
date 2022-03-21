const KEY_MAP = {
    ENTER: 'Enter'
};

class ChatTemplate {
    constructor() {
        this.$chatHistory = $('.chat-history');
        this.$chatHistoryUl = this.$chatHistory.find('ul');
        this.$chatName = $('#chat-user-name');
        this.$chatGroupLeader = $('#chat-group-leader');
        this.$chatGroupInfoBtn = $('#group-info');
        this.$chatGroupInfoModal = $('#group-info-modal');
        this.$chatMessageInput = $('#chat-message-input');
        this.$chatMessageBtn = $('#chat-message-btn');

        this.$usersTabs = $('#tab-users');

        this._setupEvents();
        this._hideGroupElements();
    }

    // Public Methods
    renderUserChat(userId) {
        this.$chatName.text(App.getUserById(userId).name);
        this._hideGroupElements();

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

    renderGroupChat(groupId) {
        this.$chatName.text(App.getGroupById(groupId).name);
        const getUserName = (id) => App.getUserById(User.extractId(id)).name;

        const messages = this.HISTORIC[groupId].map(message => {
            const fromDestination = message.from == User.generateUserTopic();
            const messageDate = moment(message.time).format("DD/MM HH:mm");
            const fromName = getUserName(message.from);

            return `
<li class="clearfix">
    <div class="message-data ${fromDestination ? '' : 'text-right'}">
        <span class="message-data-time">${messageDate}</span>
        <span class="message-user">${fromName}</span>
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

    renderGroupInfo(group) {
        this._showGroupElements();

        this.$chatGroupLeader.text(group.leader.name);
        const html = `
            <div class="group-info">
                <div>Id: ${group.id}</div>
                <div>Nome: ${group.name}</div>
                <div>Líder: ${group.leader.name}</div>
                <div>Membros: ${group.members.map(member => member.name).join(', ')}</div>
            </div>
        `;
        this.$chatGroupInfoModal.find('.modal-body').html(html);
    }

    getActiveChatType() {
        return this.$usersTabs.find('a.active').data('type')
    }

    // Private Methods
    _setupEvents() {
        this.$chatMessageBtn.on('click', () => {
            if (!this.isActiveType())
                return;

            this._sendMessage();
            this._focusInputMessage();
        });

        this.$chatGroupInfoBtn.on('click', () => {
            this.$chatGroupInfoModal.modal();
        });

        this.$chatMessageInput.on('keydown', (e) => {
            if (e.key != KEY_MAP.ENTER || e.shiftKey || !this.isActiveType())
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
        this.handleMessageSent(message);
    }

    _focusInputMessage() {
        this.$chatMessageInput.trigger('focus');
    }

    _scrollBottom() {
        this.$chatHistory.scrollTop(this.$chatHistory.prop("scrollHeight") - this.$chatHistory.prop("clientHeight"))
    }

    _hideGroupElements() {
        this.$chatGroupLeader.hide();
        this.$chatGroupInfoBtn.hide();
    }

    _showGroupElements() {
        this.$chatGroupLeader.show();
        this.$chatGroupInfoBtn.show();
    }
}