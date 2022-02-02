const TOPIC = {
    USERS: 'users',
    GROUPS: 'groups',
}

const APP_DATA = {
    USERS: []
}

class App {
    // Static Methods
    static getUsers() {
        return APP_DATA.USERS;
    }

    static setUsers(users) {
        APP_DATA.USERS = users;
    }

    static getUserById(id) {
        return APP_DATA.USERS.find(user => user.id == id);
    }

    static updateUserById(id, props) {
        for (let i in APP_DATA.USERS) {
            if (APP_DATA.USERS[i].id != id) continue;
            const userToUpdate = APP_DATA.USERS[i];
            APP_DATA.USERS[i] = {
                ...userToUpdate,
                ...props
            }
        }
    }

    // Public Methods
    async setup() {
        await this._loadAvailableUsers();

        this._loadInstances();
        this._setupInstances();
        this._setupEvents();
    }


    // Private Methods
    _loadInstances() {
        this.authInstance = new Auth;
        this.userInstance = new User;
        this.groupInstance = new Group;
    }

    _setupInstances() {
        this.authInstance.setOnAuth(() => {
            this._onSignIn();
        });
        this.authInstance.runGuard();
    }

    async _loadAvailableUsers() {
        const users = await $.get('./assets/users.json');
        debug('App', 'Carregando usuário disponíveis', users);
        App.setUsers(users);
    }

    _onSignIn() {
        Socket.getInstance().createSocket();

        this.userInstance.onSignIn();
    }

    _setupEvents() {
        $(window).on('beforeunload', () => {
            this.userInstance.sendOfflineBroadcast();
        });
    }
}