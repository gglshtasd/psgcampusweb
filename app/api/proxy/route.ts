import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request) {
    console.log('[Universal Proxy] Request received');
    try {
        const reqBody = await request.json();
        // strategy options: 'control', 'headers', 'headers-cookies'
        const { endpoint, method = 'GET', body, accessToken, sessionCookies, strategy = 'headers-cookies' } = reqBody;

        if (!endpoint || !accessToken) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Failsafe: Prevent browser and Edge caching by adding a random query parameter
        const cacheBuster = `_cb=${Date.now()}`;
        const finalEndpoint = endpoint.includes('?') ? `${endpoint}&${cacheBuster}` : `${endpoint}?${cacheBuster}`;

        const baseUrl = 'https://laudea.psgcas.ac.in';
        const targetUrl = finalEndpoint.startsWith('/') ? `${baseUrl}${finalEndpoint}` : `${baseUrl}/${finalEndpoint}`;
        
        console.log(`[Proxy] Target: ${targetUrl} | Strategy: ${strategy}`);

        // Base Headers
        const headers = new Headers({
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
        });

        if (method !== 'GET' && method !== 'HEAD') {
            headers.set('Content-Type', 'application/json');
        }

        // Apply selected Strategy (Matrix Testing)
        if (strategy === 'headers' || strategy === 'headers-cookies') {
            headers.set('Origin', 'https://laudea.psgcas.ac.in');
            headers.set('Referer', 'https://laudea.psgcas.ac.in/sis/');
            headers.set('X-Requested-With', 'XMLHttpRequest');
            headers.set('Sec-Fetch-Site', 'same-origin');
            headers.set('Sec-Fetch-Mode', 'cors');
            headers.set('Sec-Fetch-Dest', 'empty');
        }

        if (strategy === 'headers-cookies' && sessionCookies) {
            headers.set('Cookie', sessionCookies);
        }

        // Failsafe: Explicit Timeout Handling (8 seconds) to prevent infinite Vercel hangs
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const fetchOptions: RequestInit = {
            method,
            headers,
            redirect: 'manual',
            signal: controller.signal
        };

        if (method !== 'GET' && method !== 'HEAD' && body) {
            fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        console.log(`[Proxy] Firing Request...`);
        const response = await fetch(targetUrl, fetchOptions);
        clearTimeout(timeoutId); // Clear timeout on success

        console.log(`[Proxy] Target Status: ${response.status}`);

        const responseText = await response.text();
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            responseData = responseText; // Handle non-JSON gracefully
        }

        return NextResponse.json({
            status: response.status,
            data: responseData
        });

    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.log('[Proxy Error] Request timed out after 8 seconds.');
            return NextResponse.json({ error: 'Target Server Timeout (8s)' }, { status: 504 });
        }
        console.log('[Proxy Error] Exception:', error.message);
        return NextResponse.json({ error: 'Internal Proxy Error', details: error.message }, { status: 500 });
    }
}
