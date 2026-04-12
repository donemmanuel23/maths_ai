export default async (request, context) => {
    // Only allow POST requests
    if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const body = await request.json();
        const apiKey = process.env.GROQ_API_KEY; // This will be set in Netlify Dashboard

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });

        // Forward the stream back to the frontend
        return new Response(response.body, {
            headers: { 'Content-Type': 'text/event-stream' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};