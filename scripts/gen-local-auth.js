import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_STATE_PATH = path.resolve(__dirname, '../tests/.auth-state.json');

async function generateLocalAuthState() {
  const backendUrl = 'http://localhost:8080';
  console.log(`[local-auth-gen] Logging in to ${backendUrl}...`);

  try {
    const res = await axios.post(`${backendUrl}/api/v1/auth/login`, {
      email: 'test@example.com',
      nickname: 'Tester',
      loginType: 'GOOGLE'
    });

    const payload = res.data.data;
    const authState = {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      memberId: payload.memberId,
      email: payload.email,
      nickname: payload.nickname,
      portfolioId: null, // New user has no portfolio yet
      backendUrl: backendUrl,
    };

    // Ensure tests directory exists
    const dir = path.dirname(AUTH_STATE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(AUTH_STATE_PATH, JSON.stringify(authState, null, 2));
    console.log(`[local-auth-gen] Success! Written to ${AUTH_STATE_PATH}`);
    console.log(`[local-auth-gen] memberId: ${authState.memberId}`);
  } catch (err) {
    console.error(`[local-auth-gen] Failed: ${err.message}`);
    process.exit(1);
  }
}

generateLocalAuthState();
