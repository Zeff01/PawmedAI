interface Env {
  STAGING_AUTH: string
  STAGING_USERNAME: string
  STAGING_PASSWORD: string
}

const LOGIN_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>PawMed Staging</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      font-family: sans-serif;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      width: 100%;
      max-width: 380px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 1.5rem;
    }
    .logo span { font-weight: 600; font-size: 1.1rem; }
    .badge {
      background: #fef3c7;
      color: #92400e;
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 99px;
      font-weight: 500;
    }
    h2 { font-size: 1.2rem; margin-bottom: 0.4rem; }
    p { color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem; }
    label { font-size: 0.85rem; font-weight: 500; display: block; margin-bottom: 4px; }
    input {
      width: 100%;
      padding: 0.6rem 0.8rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.95rem;
      margin-bottom: 1rem;
      outline: none;
    }
    input:focus { border-color: #3b82f6; }
    button {
      width: 100%;
      padding: 0.7rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
    }
    button:hover { background: #2563eb; }
    .error {
      color: #ef4444;
      font-size: 0.85rem;
      margin-bottom: 1rem;
      display: none;
    }
    .error.show { display: block; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <span>PawMed AI</span>
    </div>
    <h2>Restricted Access</h2>
    <p>This is a staging environment for internal use only.</p>
    <div class="error" id="error">Incorrect username or password.</div>
    <form method="POST" action="/__staging_auth">
      <label>Username</label>
      <input type="text" name="username" autofocus />
      <label>Password</label>
      <input type="password" name="password" />
      <button type="submit">Sign in</button>
    </form>
  </div>
</body>
</html>`

const LOGIN_PAGE_ERROR = LOGIN_PAGE.replace('display: none;', 'display: block;')

export async function onRequest({
  request,
  next,
  env,
}: {
  request: Request
  next: () => Promise<Response>
  env: Env
}): Promise<Response> {
  if (!env.STAGING_AUTH) {
    return next()
  }

  const url = new URL(request.url)
  const cookie = request.headers.get('Cookie') || ''
  const isAuthenticated = cookie.includes('staging_auth=true')
  const isAuthCallback = url.pathname.startsWith('/auth/callback')

  if (request.method === 'POST' && url.pathname === '/__staging_auth') {
    const formData = await request.formData()
    const username = formData.get('username')
    const password = formData.get('password')

    if (
      username === env.STAGING_USERNAME &&
      password === env.STAGING_PASSWORD
    ) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/',
          'Set-Cookie':
            'staging_auth=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800',
        },
      })
    }

    return new Response(LOGIN_PAGE_ERROR, {
      status: 401,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  // Allow OAuth callback
  if (!isAuthenticated && isAuthCallback) {
    return next()
  }

  // Block all routes IF not authenticated
  if (!isAuthenticated) {
    return new Response(LOGIN_PAGE, {
      status: 401,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  return next()
}
