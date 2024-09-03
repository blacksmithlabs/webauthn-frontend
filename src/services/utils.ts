export const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:8081';

export function strtoarray(str: string): Uint8Array {
    return Uint8Array.from(str, c => c.charCodeAt(0));
}

export function base64encode(input: ArrayBuffer): string {
    const bytes = new Uint8Array (input);
    const encoded = btoa(String.fromCharCode(...bytes));
    // Replace URL characters
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=$/g, '');
}

export function base64decode(input: string): ArrayBuffer {
    // Replace URL characters
    let encoded = input.replace(/-/g, '+').replace(/_/g, '/');
    // Pad with '='
    const pad = encoded.length % 4;
    if (pad) {
        encoded += '='.repeat(4 - pad);
    }
    return strtoarray(atob(encoded)).buffer;
}

export function credentialToJSON(credential: PublicKeyCredential): any { // eslint-disable-line @typescript-eslint/no-explicit-any
    const response = credential.response as AuthenticatorAttestationResponse;

    return {
        type: credential.type,
        id: credential.id,
        rawId: base64encode(credential.rawId),
        authenticatorAttachment: credential.authenticatorAttachment,
        extensionResults: credential.getClientExtensionResults(),
        response: {
            attestationObject: base64encode(response.attestationObject),
            clientDataJSON: base64encode(response.clientDataJSON),
        },
    };
}

export function assertionToJSON(credential: PublicKeyCredential): any { // eslint-disable-line @typescript-eslint/no-explicit-any
    const response = credential.response as AuthenticatorAssertionResponse;

    return {
        type: credential.type,
        id: credential.id,
        rawId: base64encode(credential.rawId),
        authenticatorAttachment: credential.authenticatorAttachment,
        response: {
            authenticatorData: base64encode(response.authenticatorData),
            clientDataJSON: base64encode(response.clientDataJSON),
            signature: base64encode(response.signature),
            userHandle: response.userHandle ? base64encode(response.userHandle) : null,
        },
    };
}
