import { decode as cborDecode } from 'cbor-x';
import { UserCredential } from "../models/user-model";
import { assertionToJSON, base64decode, credentialToJSON, SERVER_URL } from './utils';
import { UserNotFoundError } from './errors';

interface CreateCredentialOptions {
    publicKey: PublicKeyCredentialCreationOptions;
}

interface CreateCredentialOptionsResponse {
    requestId: string;
    options: CreateCredentialOptions;
}

interface StartAssertionOptions {
    publicKey: PublicKeyCredentialRequestOptions;
}

interface StartAssertionOptionsResponse {
    requestId: string;
    options: StartAssertionOptions;
}

class AuthService {
    constructor(){}

    async _getCredentialCreationOptions(username: string): Promise<CreateCredentialOptionsResponse> {
        const payload = await fetch(`${SERVER_URL}/credentials/`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({
                user: {
                    userId: username,
                    userName: username,
                }
            }),
        });

        const response = await payload.json() as CreateCredentialOptionsResponse;

        if (payload.status !== 200) {
            console.error('Failed to get credential creation options:', payload.statusText, response);
            throw new Error('Failed to get credential creation options');
        }

        response.options.publicKey.challenge = base64decode((response.options.publicKey.challenge as unknown) as string);
        response.options.publicKey.user.id = base64decode((response.options.publicKey.user.id as unknown) as string);

        return response;
    }

    async _saveCredential(username: string, requestId: string, credential: PublicKeyCredential) {
        if (!requestId) {
            console.error('No request ID provided. Cannot save credential.');
            return;
        }

        const payload = await fetch(`${SERVER_URL}/credentials/${requestId}`, {
            method: 'PUT',
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({
                user: {
                    userId: username,
                },
                credential: credentialToJSON(credential),
            }),
        });

        const response = await payload.json();
        if (payload.status !== 200) {
            console.error('Failed to save credential:', payload.statusText, response);
        }
    }


    async _getAssertionOptions(username: string): Promise<StartAssertionOptionsResponse> {
        const payload = await fetch(`${SERVER_URL}/authentication/`, {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({
                user: {
                    userId: username,
                }
            }),
        });

        const response = await payload.json() as StartAssertionOptionsResponse;

        if (payload.status === 404) {
            throw new UserNotFoundError(username);
        }

        if (payload.status !== 200) {
            console.error('Failed to get credential request options:', payload.statusText, response);
            throw new Error('Failed to get credential request options');
        }

        response.options.publicKey.challenge = base64decode((response.options.publicKey.challenge as unknown) as string);
        if (response.options.publicKey.allowCredentials) {
            for (const allowCredentials of response.options.publicKey.allowCredentials) {
                allowCredentials.id = base64decode((allowCredentials.id as unknown) as string);
            }
        }

        return response;
    }

    async _validateAssertion(username: string, requestId: string, assertion: PublicKeyCredential): Promise<boolean> {
        if (!requestId) {
            console.error('No request ID provided. Cannot validate assertion.');
            return false;
        }

        const payload = await fetch(`${SERVER_URL}/authentication/${requestId}`, {
            method: 'PUT',
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({
                user: {
                    userId: username,
                },
                assertion: assertionToJSON(assertion),
            }),
        });

        const response = await payload.json();
        if (payload.status !== 200) {
            console.error('Failed to validate assertion:', payload.statusText, response);
            return false;
        }
        return true;
    }

    async createCredential(username: string): Promise<UserCredential> {
        const { requestId, options } = await this._getCredentialCreationOptions(username);
        console.log('Creating credential with options:', options);

        const credential = await navigator.credentials.create(options) as PublicKeyCredential;
        console.log('Credential created:', credential);

        if (!credential) {
            throw new Error("Failed to create credential");
        }

        await this._saveCredential(username, requestId, credential);

        return this.decodeCreateCredentialResponse(credential);
    }

    private decodeCreateCredentialResponse(credential: PublicKeyCredential): UserCredential {
        const response = (credential.response as AuthenticatorAttestationResponse);
        const publicKey = response.getPublicKey();
        if (!publicKey) {
            const decodedAttestationObj = cborDecode(response.attestationObject);
            console.log("Failed to get public key from response", decodedAttestationObj);
            throw Error("Failed to get public key from response")
        }

        return new UserCredential(
            credential.id,
            new Uint8Array(credential.rawId),
            credential.authenticatorAttachment!,
            new Uint8Array(publicKey),
        );
    }

    async createAssertion(username: string): Promise<boolean> {
        const createAssertionOptions = await this._getAssertionOptions(username);

        console.log('Creating attestation with options:', createAssertionOptions);

        const assertion = await navigator.credentials.get(createAssertionOptions.options) as PublicKeyCredential;
        console.log('Assertion created:', assertion);

        if (!assertion) {
            throw new Error("Failed to create assertion");
        }

        return await this._validateAssertion(username, createAssertionOptions.requestId, assertion);
    }
}

export default new AuthService();
