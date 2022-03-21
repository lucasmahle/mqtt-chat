const GROUP_ACTIONS = {
    CREATE: 'create_group',
    GROUP_OPEN: 'group'
}

class GroupTemplate {
    constructor() {
        this.$groupsList = $('#groups-list');

        this.$groupCreateModal = $('#group-create-modal');
        this.$groupCreateForm = $('#group-create-form');
        this.$groupCreateInput = $('#group-create-name');

        this.$groupName = $('#group-name');
        this.$groupId = $('#group-id');
        this.$groupConfirmationModal = $('#group-confirmation-modal');

        this.$groupRequestModal = $('#group-request-modal');
        this.$groupRequestModalId = $('#group-request-id');
        this.$groupRequestModalUser = $('#group-request-user');
        this.$groupRequestModalUserName = $('#group-request-user-name');
        this.$groupRequestModalGroupName = $('#group-request-group-name');

        this.$groupResponseModal = $('#group-response-modal');
        this.$groupResponseModelUserName = $('#group-response-user-name');
        this.$groupResponseModelGroupName = $('#group-response-name');
        this.$groupResponseModelDescription = $('#group-response-description');

        this._setupEvents();
    }


    // Public Methods
    getSortedGroups() {
        return App.getGroups()
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    renderGroups() {
        const template = this.getSortedGroups().map(group => {
            return `
<li class="clearfix" data-action="group" data-id="${group.id}">
    <div class="about">
        <div class="name"><i class="fa fa-users"></i> ${group.name}</div>
    </div>
</li>`;
        });

        template.push(this._renderCreateGroupOption());

        this.$groupsList.html(template.join(''));
    }

    openGroupConfirmationModal(group) {
        this.$groupId.val(group.id);
        this.$groupName.text(group.name);
        this.$groupConfirmationModal.modal('show');
    }

    openGroupRequestModal(group, user) {
        this.$groupRequestModalId.val(group.id);
        this.$groupRequestModalUser.val(user.id);
        this.$groupRequestModalUserName.text(user.name);
        this.$groupRequestModalGroupName.text(group.name);

        this.$groupRequestModal.modal('show');
    }

    openGroupResponseModal(group, user, status) {
        this.$groupResponseModelGroupName.text(group.name);
        this.$groupResponseModelUserName.text(user.name);
        this.$groupResponseModelDescription.text(status ? 'aceitou' : 'recusou');

        this.$groupResponseModal.modal('show');
    }

    // Private Methods
    _setupEvents() {
        this.$groupsList.on('click', '[data-action]', (e) => {
            const $li = $(e.currentTarget);
            const id = $li.data('id');
            const action = $li.data('action');

            if (action == GROUP_ACTIONS.CREATE)
                this.$groupCreateModal.modal('show');
            else if (action == GROUP_ACTIONS.GROUP_OPEN)
                this.handleGroupChat(id);
        });

        this.$groupCreateForm.on('submit', (e) => {
            e.preventDefault();

            const name = this.$groupCreateInput.val();
            this.$groupCreateInput.val('');

            if (name.length == 0)
                return;

            this.$groupCreateModal.modal('hide');
            this.handleGroupCreating(name);
        });

        this.$groupConfirmationModal.on('click', '[data-response]', (e) => {
            const $button = $(e.currentTarget);
            const response = $button.data('response');
            const groupId = this.$groupId.val();

            if (!response)
                return;

            this.handleSentGroupRequest(groupId);
        });

        this.$groupRequestModal.on('click', '[data-response]', (e) => {
            const $button = $(e.currentTarget);
            const response = $button.data('response');
            const groupId = this.$groupRequestModalId.val();
            const userId = this.$groupRequestModalUser.val();

            this.handleSentGroupResponse(groupId, userId, response);
        });
    }

    _renderCreateGroupOption() {
        return `
<li class="clearfix" data-action="create_group">
    <div class="about">
        <div class="name"><i class="fa fa-plus"></i> Novo grupo</div>
    </div>
</li>`;
    }
}