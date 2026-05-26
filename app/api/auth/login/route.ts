import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const username = body.username;
        const password = body.password;

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
        }

        console.log(`[Auth API - Step 1] Initiating login for user: ${username}`);

        // Step 1: Initial Keycloak request
        const redirectUri = "https://laudea.psgcas.ac.in/";
        const loginUrl = `https://accounts.psgcas.ac.in/realms/ies/protocol/openid-connect/auth?client_id=laudea&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=fragment&response_type=code&scope=openid`;
        
        console.log('[Auth API - Step 2] Fetching initial Keycloak login page...');
        const initialRes = await fetch(loginUrl, { 
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });
        
        const initialCookies = initialRes.headers.get('set-cookie') || '';
        const html = await initialRes.text();

        // Step 2: Scrape dynamic form action
        const actionMatch = html.match(/action="(https:\/\/accounts\.psgcas\.ac\.in\/realms\/ies\/login-actions\/authenticate[^"]+)"/);
        if (!actionMatch) {
            console.error('[Auth API - Error] Failed to find form action URL.');
            return NextResponse.json({ error: 'Failed to parse login page' }, { status: 500 });
        }
        
        const postUrl = actionMatch[1].replace(/&amp;/g, '&');
        
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('login', 'Log in');

        // Step 3: Submit credentials
        console.log('[Auth API - Step 3] Sending POST request with credentials...');
        const authRes = await fetch(postUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': initialCookies,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Origin': 'https://accounts.psgcas.ac.in',
                'Referer': loginUrl
            },
            body: formData.toString(),
            redirect: 'manual' 
        });

        if (authRes.status !== 302 && authRes.status !== 303) {
            console.error(`[Auth API - Error] Login failed. Status: ${authRes.status}`);
            return NextResponse.json({ error: 'Invalid credentials or login failed' }, { status: 401 });
        }

        const location = authRes.headers.get('location') || '';
        const authCookies = authRes.headers.get('set-cookie') || '';
        console.log('[Auth API - Step 4] Intercepted OIDC Redirect.');

        // Step 4: Extract the 'code' from the location fragment (#code=...)
        const codeMatch = location.match(/[#&?]code=([^&]+)/);
        if (!codeMatch) {
            console.error('[Auth API - Error] No OIDC code found in redirect location.');
            return NextResponse.json({ error: 'OIDC flow failed: Missing code' }, { status: 500 });
        }
        const oidcCode = codeMatch[1];
        console.log('[Auth API - Step 5] Extracted OIDC Authorization Code.');

        // Step 5: Token Exchange (The Handshake)
        console.log('[Auth API - Step 6] Exchanging Code for Access Token...');
        const tokenUrl = "https://accounts.psgcas.ac.in/realms/ies/protocol/openid-connect/token";
        
        const tokenFormData = new URLSearchParams();
        tokenFormData.append('grant_type', 'authorization_code');
        tokenFormData.append('client_id', 'laudea');
        tokenFormData.append('redirect_uri', redirectUri);
        tokenFormData.append('code', oidcCode);

        const tokenRes = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                // Sometimes Keycloak requires the session cookies for token exchange
                'Cookie': authCookies || initialCookies,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            body: tokenFormData.toString()
        });

        if (!tokenRes.ok) {
            const errorText = await tokenRes.text();
            console.error(`[Auth API - Error] Token exchange failed. Status: ${tokenRes.status}`, errorText);
            return NextResponse.json({ error: 'Failed to exchange token' }, { status: 502 });
        }

        const tokenData = await tokenRes.json();
        console.log('[Auth API - Step 7] Token Exchange SUCCESS!');

        // Return the master tokens to the client
        return NextResponse.json({ 
            success: true, 
            message: "Authentication and Token Exchange successful",
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresIn: tokenData.expires_in,
            sessionCookies: authCookies // Passing these just in case we need them later
        }, { status: 200 });

    } catch (error) {
        console.error('[Auth API - Fatal Error]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
