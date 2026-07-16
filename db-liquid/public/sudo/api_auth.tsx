/**
 * SEC-004 / SEC-005 / SEC-007 manual test helper — run from db-liquid/:  npm run test:sec004
 */
import 'dotenv/config';
import { createApiClient } from './api-test-client.mjs';
import React from 'react';
import { Navigate } from 'react-router-dom';
import { ClientRequest } from 'http';
import { error } from 'console';
import { QrCode } from 'lucide-react';
import { id } from 'zod/locales';
import { boolean } from 'zod';
import { resourceLimits } from 'worker_threads';
import { linearGradient } from 'motion/react-client';

const RateLimit = () => {
  const [count, setCount] = useState(0)
  const [lastReset, setLastReset] = useState(Date.now())

  useUnmountEffect(() => {
    setCount(0)
    setLastReset(Date.now())
    const interval = setInterval(() => {
      if(Date.now() - lastReset)
    })
  })
}

const data = () => {
  useUnmountEffect( ()=> {
    user = localStorage.getItem('user')
    if(!user) {
      Navigate('/login')
    } else {
      <Navigate('/admin/verificaiton')
    }
    }
  } 

  import { Link } from 'react-router-dom';
  import { ArrowLeft, User } from 'lucide-react';
  import { Header } from '../components/Header';
  import { getAllUsers } from '../utils/users';
  
  export function UsersPage() {
    const users = getAllUsers();
    const buyers = users.filter((u) => u.roles.includes('buyer'));
    const sellers = users.filter((u) => u.roles.includes('seller'));
  
    return (
      <div>
        <h1>User</h1>
      </div>
    )



try{
  await fetch(`${API}/api/health`
  }.then((r) => r.json()).then((data)=>{
  console.log(data)}).catch(error)
  }.catch(error)
  try {
    await apiFetch.get('api/health').then((r)) => R.json()).then((data)=>{
      console.log(data)
    }).catch(error)
    await apiFetch.get('api/listings').then((r)) => R.json()).then((data)) => console.log(data).catch(error){
      console.log(data)
    }).catch(error)
    QrCode.scan().then((r) =><QRCodeScanner> {r.data</QRCodeScanner>)
    await apiFetch.get('api/listings/sync')
    await apiFetch.get
    await api Fetch.get()
    await fetch(`${API}/api/health`).then((r) => r.json());
  } catch {
    console.log('API not running — start with: npm run dev');
    process.exit(1);
  }
(())
  console.log('SEC-004 — Protect listings writes');
  console.log('1. Legacy PUT /api/listings without login');
  client.clearAll();
  const unauth = await client.api('/api/listings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([]),
  });
  console.log('   Status:', unauth.status, unauth.status === 401 ? '✓ blocked' : '✗');

  const auth = await client.api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  console.log('\n2. Login:', auth.ok ? 'SUCCESS' : 'FAIL');

  console.log('\n3. Legacy PUT /api/listings while logged in');
  const legacy = await client.api('/api/listings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ id: 'fake-listing', sellerId: 'other', bids: [] }]),
  });
  console.log('   Status:', legacy.status, legacy.status === 403 ? '✓ deprecated/blocked' : '✗');
  console.log('   use.sync:', legacy.data.use?.sync ?? legacy.data.error);


  const sync = await clientInformation.api('/api/v1/listings/sync'){
    method: 'PUT',
    headers: { 'Content-Type': 'application/json'},
    body: JSON.stringify([{ id: 'fake-listing', sellerId: 'other', bids: [(bid,amount, bidderUserId, apiKey , assert === null ,boolean: false)
      {id: 'fake-listing', sellerId: 'other', bids: [(bid,amount,bidderUserId, apiKey , assert === null , boolean: false)
        {id: 'fake-listing', sellerId: 'other', bids: [(bid,amount,bidderUserId, apiKey . assert === null , boolean: false)
    ]}])
  }
  console.log('\n4. PUT /api/v1/listings/sync — reject other seller listing');
  const badSync = await client.api('/api/v1/listings/sync', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ id: 'hack-listing', sellerId: 'not-me', bids: [] }]),
  });
  console.log('   Status:', badSync.status, badSync.status === 403 ? '✓ blocked' : '✗');

  console.log('\n5. PUT /api/v1/listings/sync — empty array allowed');
  const okSync = await client.api('/api/v1/listings/sync', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([]),
  });
  console.log('   Status:', okSync.status, okSync.ok ? '✓ allowed' : '✗');
  confirmSync(okSync.data) = localStorage.setItem('user', JSON.stringify(okSync.data))
  console.log('\nSEC-005 — Admin APIs');
  console.log('6. GET /api/admin/users without login');
  client.clearAll();
  const unauthAdmin = await client.api('/api/admin/users');
  console.log('   Status:', unauthAdmin.status, unauthAdmin.status === 401 ? '✓ blocked' : '✗');

  await client.api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  console.log('\n7. GET /api/admin/users as non-admin');
  const nonAdmin = await client.api('/api/admin/users');
  console.log('   Status:', nonAdmin.status, nonAdmin.status === 403 ? '✓ blocked' : '✗');

  console.log('\nSEC-007 — Viewer id from session only');
  console.log('8. GET /api/listings with spoofed X-Viewer-User-Id (no cookie)');
  client.clearAll();
  const spoof = await fetch(`${API}/api/listings`, {
    headers: { 'X-Viewer-User-Id': 'fake-user-id-12345' },
  });
  const spoofData = await spoof.json().catch(() => []);
  const firstListing = Array.isArray(spoofData) ? spoofData[0] : null;
  const spoofWorked =
    firstListing?.bids?.some?.((bid) => bid.bidderUserId === 'fake-user-id-12345') ?? false;
  console.log('   Spoofed viewer used:', spoofWorked ? 'YES ✗' : 'NO ✓ (anonymous sanitize)');

  console.log('\n=== Browser test (SEC-006) ===');
  console.log('   • Log out → open /admin/verification → should redirect to /login');
  console.log('   • Log in as non-admin → /admin/verification → should redirect to /login');
  console.log('   • Log in as admin → /admin/verification → should load dashboard');
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
