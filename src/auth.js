const AUTH_DATA = {
    LOGGED_USER: null,
    LOCAL_STORAGE_USER_ID_KEY: 'loggedUserId'
}

class Auth extends AuthTemplate {
    constructor() {
        super();
        this._loadStoragedUser();
    }

    // Static Methods
    static getUser() {
        return AUTH_DATA.LOGGED_USER;
    }

    static setUser(user) {
        AUTH_DATA.LOGGED_USER = user;
    }

    static isLogged() {
        return AUTH_DATA.LOGGED_USER !== null;
    }

    static setUserId(id) {
        localStorage.setItem(AUTH_DATA.LOCAL_STORAGE_USER_ID_KEY, id);
    }

    static getUserId() {
        return Number(localStorage.getItem(AUTH_DATA.LOCAL_STORAGE_USER_ID_KEY));
    }

    static clearUserId() {
        localStorage.removeItem(AUTH_DATA.LOCAL_STORAGE_USER_ID_KEY);
    }

    // Public Methods
    setOnAuth(callback) {
        this.onAuthCallback = callback;
    }

    runGuard() {
        if (Auth.isLogged()) {
            debug('Auth', 'Usuário logado');
            return this.handleAuth();
        }

        debug('Auth', 'Usuário não logado. Exibir modal de login');
        this.openLoginModal();
    }

    handleAuth() {
        const user = this._getLoggedUser();

        if (!user) {
            this._userNotFound();
            return false;
        }

        Auth.setUser(user);
        debug('Auth', 'Usuário autenticado: ', user);

        if (typeof this.onAuthCallback == 'function')
            this.onAuthCallback();

        return true;
    }


    // Private Methods
    _getLoggedUser() {
        const userId = Auth.getUserId();
        const user = App.getUserById(userId);

        return user;
    }

    _loadStoragedUser() {
        const user = this._getLoggedUser();
        
        if (!user) return;

        Auth.setUser(user);
    }

    _userNotFound() {
        Auth.clearUserId();
        Auth.setUser(null);
        this.renderUserNotFoundMessage();
    }
}