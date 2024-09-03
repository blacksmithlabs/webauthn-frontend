
export class UserNotFoundError extends Error {
    constructor(username: string) {
        super(`User not found: ${username}`);
        this.name = 'UserNotFoundError';
    }
}
