import React, { useState, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useNavigate, Outlet } from "react-router-dom";
import webauthnLogo from '/webauthn_shield.svg'
import './App.css'
import authService from './services/auth-service';
import userService from './services/user-service';
import { UserNotFoundError } from './services/errors';

type RelativeNavigateFunction = (path: string) => void;
const useRelativeNavigate = (): RelativeNavigateFunction => {
  const navigate = useNavigate();
  return (path: string) => {
    navigate(import.meta.env.BASE_URL + path)
  };
}

interface LoginDetails {
  username?: string
  loggedIn?: boolean
  type?: 'otp' | 'webauthn'

  setUsername: (username: string) => void
  setLoggedIn: (loggedIn: boolean, type: 'otp' | 'webauthn') => void
  setLoggedOut: () => void
}

const AuthContext = React.createContext<LoginDetails>({
  setUsername: () => {},
  setLoggedIn: () => {},
  setLoggedOut: () => {},
})

const CreatePasskeyBox = () => {
  const [visible, setVisible] = useState(true)
  const { username } = React.useContext(AuthContext)

  const createPasskey = async () => {
    try {
      await authService.createCredential(username!);
      setVisible(false)
    } catch (exception) {
      console.error('Error creating credential:', exception)
    }
  }

  const display = visible ? 'flex' : 'none'

  return (
    <div style={{display, position: 'absolute', top: "-50%", left: "50%", right: "-50%", borderRadius: '8px', backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center'}}>
      <div style={{color: 'black', backgroundColor: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)'}}>
        <h3>Create Passkey</h3>
        <p>It looks like you don't have a passkey set up yet. Would you like to create one?</p>
        <button onClick={createPasskey}>Yes</button>
        <button onClick={() => setVisible(false)}>No</button>
      </div>
    </div>
  );
}

const ProfilePage = () => {
  const navigate = useRelativeNavigate()
  const { username, loggedIn, type, setLoggedOut } = React.useContext(AuthContext)
  // const [showCreatePasskey, setShowCreatePasskey] = useState(false)
  const showCreatePasskey = false
  const [credentials, setCredentials] = useState<any[]>([]) // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    if (!loggedIn) {
      console.log('Not logged in')
      navigate('/login')
    }
  }, [loggedIn, navigate])

  const loadCredentials = () => {
    if (username) {
      userService.getUserCredentials(username).then(credentials => {
        console.log('credentials', credentials)
        setCredentials(credentials);
      }).catch(e => {
        if (!(e instanceof UserNotFoundError)) {
          console.error('Failed to get user info:', username);
        }
        navigate('/login');
      });
    }
  }
  useEffect(loadCredentials, [username, setCredentials, navigate]);

  const createPasskey = async () => {
    try {
      const credential = await authService.createCredential(username!);
      if (credential) {
        loadCredentials();
      }
    } catch (exception) {
      console.error('Error creating credential:', exception)
    }
  }

  const handleLogout = () => {
    console.log('Logging out');
    setLoggedOut();
  }

  return (
    <div style={{position: 'relative'}}>
      <h2>Profile</h2>
      <p>Welcome to your profile page!</p>
      <p>Username: {username}</p>
      <p>Authentication Type: {type}</p>
      <button onClick={handleLogout}>Logout</button>
      {showCreatePasskey && <CreatePasskeyBox />}
      {!showCreatePasskey && (
        <div><button onClick={createPasskey}>Create Passkey</button></div>
      )}
      {credentials.length > 0 && (
        <div>
          <h3>Credentials</h3>
          <ul>
            {credentials.map((credential, index) => (
              <li key={index}>
                <div>Id: {credential.id}</div>
                <div>Public Key: {credential.publicKey}</div>
                <div>Sign Count: {credential.authenticator.signCount}</div>
              </li>
            ))}
          </ul>
        </div>
    )}
    </div>
  )

}

const OtpPrompt = () => {
  const navigate = useRelativeNavigate()
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { username, setLoggedIn } = React.useContext(AuthContext)

  useEffect(() => {
      if (!username) {
        console.log('Username not set. Redirecting to login');
        navigate('/login')
      }
  }, [username, navigate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log(`Logging in with OTP: ${otp}`);

    if (otp === '123456') {
      console.log('Logged in successfully');
      setLoggedIn(true, 'otp');
      navigate('/profile');
    } else {
      console.log('Invalid OTP');
      setError('Invalid OTP');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <p>
        <label>
          OTP: (use 123456) &nbsp;
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
        </label>
      </p>
      <p>
        <button type="submit">Login</button>
      </p>
    </form>
  )
}

const LoginForm = () => {
  const navigate = useRelativeNavigate()
  const { username, setUsername, setLoggedIn } = React.useContext(AuthContext)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (username) {
      console.log(`Logging in with username: ${username}`);

      const doLogin = () => {
        console.log('Logged in successfully');
        setLoggedIn(true, 'webauthn');
        navigate('/profile');
      };

      try {
        // Attempt to authenticate with WebAuthn
        const validAuth = await authService.createAssertion(username);
        if (validAuth) {
          doLogin();
          return;
        } else {
          console.log('Failed to authenticate with WebAuthn')
        }
      } catch (e) {
        if (e instanceof UserNotFoundError) {
          // Create the passkey
          try {
            const credential = await authService.createCredential(username);
            if (credential) {
              doLogin();
              return;
            }
          } catch (e) {
            console.error('Failed to create credential:', e);
            alert('Failed to create credential');
          }
        } else {
          console.error('Failed to authenticate with WebAuthn', e);
          alert('Authentication failed');
        }
      }
      // navigate('/otp');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p>
        <label>
          Username: &nbsp;
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
      </p>
      <p>
        <button type="submit">Login</button>
      </p>
    </form>
  )
}

const Container = () => {
  const [username, setUsername] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [type, setType] = useState<'otp' | 'webauthn'>('otp')

  return (
    <AuthContext.Provider value={{
      username: username,
      loggedIn,
      type,
      setUsername,
      setLoggedIn: (loggedIn, type) => {
        setLoggedIn(loggedIn)
        setType(type)
      },
      setLoggedOut: () => {
        setUsername('')
        setLoggedIn(false)
      }
    }}>
      <div>
        <a href="https://webauthn.io" target="_blank">
          <img src={webauthnLogo} className="logo" alt="Vite logo" />
        </a>
      </div>
      <div className="card">
        <Outlet />
      </div>
    </AuthContext.Provider>
  );
}

const App = () => {
  return (
    <BrowserRouter>
        <Routes>
          <Route path={import.meta.env.BASE_URL} element={<Container />}>
            <Route path="" element={<LoginForm />} />
            <Route path="login" element={<LoginForm />} />
            <Route path="otp" element={<OtpPrompt />} />
            <Route path="webauthn" element={<div>WebAuthn</div>} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
    </BrowserRouter>
  )
}

export default App
