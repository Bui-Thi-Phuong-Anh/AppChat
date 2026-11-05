import { websocketService } from './websocket';

export const authService = {
    register(user: string, pass: string) {
        websocketService.send('REGISTER', { user, pass });
    },

    login(user: string, pass: string) {
        websocketService.send('LOGIN', { user, pass });
    },

    reLogin(user: string, code: string) {
        websocketService.send('RE_LOGIN', { user, code });
    },

    logout() {
        websocketService.send('LOGOUT', {});
    },
};
