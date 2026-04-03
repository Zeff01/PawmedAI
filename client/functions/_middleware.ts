interface StagingAuthEnv {
  STAGING_AUTH: string
  STAGING_USERNAME: string
  STAGING_PASSWORD: string
}

export async function onRequest({
  request,
  next,
  env,
}: {
  request: Request
  next: () => Promise<Response>
  env: StagingAuthEnv
}): Promise<Response> {
  if (!env.STAGING_AUTH) {
    return next()
  }

  const auth = request.headers.get('Authorization')

  if (!auth || !isValid(auth, env)) {
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': `Basic realm="PawMed Staging"`,
      },
    })
  }

  return next()
}

function isValid(header: string, env: StagingAuthEnv): boolean {
  try {
    const decoded = atob(header.replace('Basic ', ''))
    return decoded === `${env.STAGING_USERNAME}:${env.STAGING_PASSWORD}`
  } catch {
    return false
  }
}
