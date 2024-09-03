# Passkey POC

## Install all dependencies
`npm install`

## Run the POC
`npm run dev`

Open http://localhost:5173

## Testing on a mobile device
Install and setup NGROK: https://ngrok.com/docs/getting-started/
Run `ngrok http http://localhost:5173`
Visit the "Forwarding" URL on your mobile device

# Small Description

This is a basic login example to show the flow for webauthn flow.

## First Time Login

This is a basic a login/create account flow.

Enter any "username"
You will now be prompted to create a passkey

## Subsequent Logins

You will be prompted to authenticate your passkey
If you don't have a passkey on this device for that username, you will be unable to log in
If you do have a passkey, you can log in

## Where is my data stored?

Public key and some other information about the credential is stored on the back-end server.
