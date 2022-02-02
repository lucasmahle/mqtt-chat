class UserTemplate {
    constructor() {
        this.$usersList = $('#users-list');

        this.$chatModal = $('#chat-modal');
        this.$chatName = $('#chat-name');
        this.$chatModalResponse = $('#chat-modal-response');
        this.$chatModalResponseName = $('#chat-modal-response-name');

        this._setupEvents();
    }


    // Public Methods
    getSortedUsers() {
        return App.getUsers()
            .filter(user => user.id != Auth.getUser().id)
            .sort((a, b) => {
                var aStatus = a.status || false;
                var bStatus = b.status || false;

                if (aStatus == bStatus)
                    return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0;
                else
                    return (aStatus < bStatus) ? 1 : -1;
            });
        ;
    }

    renderUsers() {
        const template = this.getSortedUsers().map(user => {
            return `
<li class="clearfix" data-action="chat" data-id="${user.id}" data-available="${user.status === true}">
    <div class="about">
        <div class="name"><i class="fa fa-circle ${user.status === true ? 'online' : 'offline'}"></i> ${user.name}</div>
    </div>
</li>`;
        });

        this.$usersList.html(template.join(''));
    }

    renderConfirmationModal(user) {
        this.$chatName.text(user.name);
        this.$chatModal.data('id', user.id);
        this.$chatModal.modal('show');
    }

    renderRespondeModal(user) {
        this.$chatModalResponseName.text(user.name);
        this.$chatModalResponse.modal('show');
    }

    // Private Methods
    _setupEvents() {
        this.$usersList.on('click', '[data-action="chat"]', (e) => {
            const $li = $(e.currentTarget);
            const id = $li.data('id');
            const available = $li.data('available');

            if (!available) return;

            this.startConversation(id);
        });

        this.$chatModal.on('click', '[data-response]', (e) => {
            const $button = $(e.currentTarget);
            const id = this.$chatModal.data('id');
            const response = $button.data('response');

            this.$chatModal.modal('hide');

            this.handleChatResponse(id, response);
        });
    }
}