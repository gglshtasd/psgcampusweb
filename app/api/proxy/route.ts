import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request) {
    console.log('[Universal Proxy - Step 1] Request received');
    try {
        // Parse the incoming request payload from your Next.js frontend
        const reqBody = await request.json();
        const { endpoint, method = 'GET', body, accessToken, sessionCookies } = reqBody;

        console.log(`[Universal Proxy - Step 2] Parsing payload: Endpoint=${endpoint}, Method=${method}`);

        // Validate required fields
        if (!endpoint || !accessToken) {
            console.log('[Universal Proxy - Error] Missing required fields (endpoint or accessToken)');
            return NextResponse.json(
                { error: 'Missing endpoint or accessToken' }, 
                { status: 400 }
            );
        }

        // ==========================================
        // JWT DEBUGGER LOGGING
        // ==========================================
        try {
            const payloadBase64 = accessToken.split('.')[1];
            // Fix base64 formatting before decoding in edge
            const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
            const decodedPayload = JSON.parse(atob(base64));
            console.log('[Universal Proxy - JWT Debug] Decoded Token Info:', JSON.stringify({
                preferred_username: decodedPayload.preferred_username,
                realm_access: decodedPayload.realm_access,
                resource_access: decodedPayload.resource_access
            }, null, 2));
        } catch (e) {
            console.log('[Universal Proxy - JWT Debug] Failed to parse JWT payload.');
        }

        // Construct the target URL safely
        const baseUrl = 'https://laudea.psgcas.ac.in';
        const targetUrl = endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;
        
        console.log(`[Universal Proxy - Step 3] Forwarding request to: ${targetUrl}`);

        // Construct strict headers. We mimic a real Angular browser request to avoid 403 CSRF blocks
        const headers = new Headers({
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
            'Connection': 'keep-alive',
            'Origin': 'https://laudea.psgcas.ac.in',
            'Referer': 'https://laudea.psgcas.ac.in/',
            'X-Requested-With': 'XMLHttpRequest'
        });

        // Inject the Keycloak Session Cookies if we have them
        if (sessionCookies) {
            headers.set('Cookie', sessionCookies);
            console.log('[Universal Proxy - Step 3.5] Successfully injected Session Cookies into headers');
        } else {
            console.log('[Universal Proxy - Warning] No Session Cookies provided. Request might fail if state is strictly checked.');
        }

        const fetchOptions: RequestInit = {
            method,
            headers,
            redirect: 'manual', // Prevent getting lost in unexpected auth redirects
        };

        // Attach body ONLY if the method requires it
        if (method !== 'GET' && method !== 'HEAD' && body) {
            fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
            console.log('[Universal Proxy - Step 3.6] Attached request body to fetch options');
        }

        // Execute the server-to-server request
        console.log('[Universal Proxy - Step 4] Executing fetch to target server');
        const response = await fetch(targetUrl, fetchOptions);

        console.log(`[Universal Proxy - Step 5] Target responded with Status ${response.status} ${response.statusText}`);

        // Handle the response safely (it might not be JSON)
        const responseText = await response.text();
        let responseData;
        
        try {
            responseData = JSON.parse(responseText);
            console.log('[Universal Proxy - Step 6] Successfully parsed JSON response from target');
        } catch (e) {
            console.log('[Universal Proxy - Step 6] Response is not JSON. Returning raw text.');
            responseData = responseText;
        }

        // Pass the target server's exact data back to our UI
        return NextResponse.json({
            status: response.status,
            data: responseData
        });

    } catch (error: any) {
        console.log('[Universal Proxy - Fatal Error] Exception caught:', error.message);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message }, 
            { status: 500 }
        );
    }
}
