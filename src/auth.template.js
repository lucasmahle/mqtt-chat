class AuthTemplate {
    constructor() {
        this.$loginModal = $('#login-modal');
        this.$loginForm = $('#login-form');
        this.$loginFormMsg = $('#login-msg');
        this.$loginIdInput = $('#login-id');
        this.$body = $('body');

        this._setupEvents();
    }

    // Public Methods
    closeLoginModal() {
        this.$loginModal.modal('hide');
        this.$loginFormMsg.text('').addClass('hide');
    }

    openLoginModal() {
        this.$body.addClass('modal-login-open');
        this.$loginModal.modal({
            backdrop: 'static',
            keyboard: false
        });
    }

    renderUserNotFoundMessage() {
        this.$loginFormMsg.text('Usuário não encontrado.').removeClass('hide');
    }

    // Private Methods
    _setupEvents() {
        this.$loginModal.on('shown.bs.modal', () => {
            this.$loginIdInput.trigger('focus');
        });

        this.$loginModal.on('hidden.bs.modal', () => {
            this.$body.removeClass('modal-login-open');
        });

        this.$loginForm.on('submit', (e) => {
            e.preventDefault();
            const id = Number(this.$loginIdInput.val());
            if (!id) return;

            Auth.setUserId(id);
            if (this.handleAuth())
                this.closeLoginModal();
        });
    }
}