import { UserCredential } from "../models/user-model";
import { UserNotFoundError } from "./errors";
import { SERVER_URL } from "./utils";

class UserService {
    constructor() {}

    async getUserCredentials(username: string): Promise<UserCredential[]> {
        const payload = await fetch(`${SERVER_URL}/users/${username}/credentials/`, {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
        });

        const response = await payload.json();
        if (payload.status === 404) {
            console.error('User not found:', username);
            throw new UserNotFoundError(username);
        }
        if (payload.status !== 200) {
            console.error('Failed to get credentials:', payload.statusText, response);
            throw new Error('Failed to get credentials');
        }

        return response.credentials;
    }
}

export default new UserService();
