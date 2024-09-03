export class UserCredential {
    id: string;
    rawId: Uint8Array;
    attachment: string;
    publicKey: Uint8Array;

    constructor(id: string, rawId: Uint8Array, attachment: string, publicKey: Uint8Array) {
        this.id = id;
        this.rawId = rawId;
        this.attachment = attachment;
        this.publicKey = publicKey;
    }
}
