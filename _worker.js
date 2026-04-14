export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS Pre-flight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (url.pathname === "/api/solve" && request.method === "POST") {
      try {
        const body = await request.json();
        const apiKey = env.GROQ_API_KEY;

        if (!apiKey) {
          return new Response(JSON.stringify({ error: "Server API Key not configured." }), { status: 500 });
        }

        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.2-11b-vision-preview",
            messages: body.messages,
            temperature: 0.2,
            stream: true
          }),
        });

        return new Response(groqResponse.body, {
          headers: { "Content-Type": "text/event-stream", "Access-Control-Allow-Origin": "*" },
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};