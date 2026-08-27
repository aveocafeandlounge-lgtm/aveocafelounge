import https from 'node:https';
import { URLSearchParams } from 'node:url';

const firebaseConfig = {
  apiKey: 'AIzaSyAbWWDV00qaN5lyBygs5xPrjkm_8dzYEss',
  authDomain: 'aveocafe-lounge.firebaseapp.com',
  projectId: 'aveocafe-lounge',
  storageBucket: 'aveocafe-lounge.firebasestorage.app',
  messagingSenderId: '83831360825',
  appId: '1:83831360825:web:ff45923cd1adc1612fece8',
};

const users = [
  { email: 'aveocafeandlounge@gmail.com', password: 'Aveo@123' },
  { email: 'cashier@aveocafe-lounge.com', password: 'Aveo@123' },
];

function fetchJson(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          if (data) json = JSON.parse(data);
        } catch (error) {
          reject(error);
          return;
        }
        if (res.statusCode && res.statusCode >= 400) {
          reject(json || new Error(`HTTP ${res.statusCode}`));
          return;
        }
        resolve(json);
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function createUser(email, password) {
  const payload = JSON.stringify({
    email,
    password,
    returnSecureToken: true,
  });

  try {
    const response = await fetchJson(
      {
        method: 'POST',
        hostname: 'identitytoolkit.googleapis.com',
        path: `/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      payload,
    );

    console.log(`Created user ${email}. uid=${response.localId}`);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : error && typeof error === 'object' && 'error' in error && error.error
        ? String(error.error.message || JSON.stringify(error.error))
        : String(error);

    if (message.includes('EMAIL_EXISTS')) {
      console.log(`User ${email} already exists.`);
      return;
    }
    console.error(`Failed to create ${email}:`, error);
    return;
  }
}

async function main() {
  console.log('Creating Firebase Auth users...');
  for (const user of users) {
    await createUser(user.email, user.password);
  }
  console.log('Firebase Auth user creation complete.');
}

main().catch((error) => {
  console.error('Error creating Firebase Auth users:', error);
  process.exit(1);
});
