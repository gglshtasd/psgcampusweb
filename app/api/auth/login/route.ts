import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // Parse the incoming credentials from the request body
        const body = await request.json();
        const username = body.username;
        const password = body.password;

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
        }

        console.log(`[Auth API - Step 1] Received login request for user: ${username}`);

        // Step 1: Hit the initial Keycloak login page to generate a fresh session state
        const loginUrl = "https://accounts.psgcas.ac.in/realms/ies/protocol/openid-connect/auth?client_id=laudea&redirect_uri=https%3A%2F%2Flaudea.psgcas.ac.in%2F&response_mode=fragment&response_type=code&scope=openid";
        
        console.log('[Auth API - Step 2] Fetching initial Keycloak login page...');
        const initialRes = await fetch(loginUrl, { 
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
            }
        });
        
        // Grab the initial setup cookies safely
        const initialCookies = initialRes.headers.get('set-cookie') || '';
        const html = await initialRes.text();

        // Step 2: Scrape the dynamic POST action URL from the HTML form
        console.log('[Auth API - Step 3] Scraping HTML for dynamic form action URL...');
        const actionMatch = html.match(/action="(https:\/\/accounts\.psgcas\.ac\.in\/realms\/ies\/login-actions\/authenticate[^"]+)"/);
        
        if (!actionMatch) {
            console.error('[Auth API - Error] Failed to find form action URL in Keycloak HTML.');
            return NextResponse.json({ error: 'Failed to parse login page from college server' }, { status: 500 });
        }
        
        // The URL in HTML uses "&amp;", we must convert it back to "&" for the fetch request
        const postUrl = actionMatch[1].replace(/&amp;/g, '&');
        console.log('[Auth API - Step 4] Successfully extracted POST URL.');

        // Step 3: Construct the form data payload exactly as the browser sends it
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('login', 'Log in');

        console.log('[Auth API - Step 5] Sending POST request with credentials...');
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
            // CRITICAL: We must stop Next.js from automatically following the redirect. 
            // We want to catch the 302 to extract the cookies and the code.
            redirect: 'manual' 
        });

        console.log(`[Auth API - Step 6] Keycloak responded with status: ${authRes.status}`);

        // Step 4: Evaluate the result
        // 302 or 303 are standard redirect codes for successful OIDC logins
        if (authRes.status === 302 || authRes.status === 303) {
            const location = authRes.headers.get('location') || '';
            // These are the golden tickets: KEYCLOAK_SESSION cookies
            const authCookies = authRes.headers.get('set-cookie') || ''; 
            
            console.log('[Auth API - Step 7] Login SUCCESS. Intercepted Redirect.');
            console.log(`[Auth API - Output] Intercepted Cookies length: ${authCookies.length}`);
            
            return NextResponse.json({ 
                success: true, 
                message: "Authentication successful",
                redirectUrl: location,
                rawCookies: authCookies
            }, { status: 200 });

        } else if (authRes.status === 200) {
            // If it returns 200 instead of 302/303, the login failed and re-rendered the form showing an error
            console.error('[Auth API - Error] Login failed. Keycloak returned 200 (Form re-render). Check credentials.');
            return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
        } else {
            console.error(`[Auth API - Error] Unexpected status code: ${authRes.status}`);
            return NextResponse.json({ error: `Unexpected authentication error: ${authRes.status}` }, { status: 500 });
        }

    } catch (error) {
        console.error('[Auth API - Fatal Error]', error);
        return NextResponse.json({ error: 'Internal Server Error during authentication' }, { status: 500 });
    }
}
