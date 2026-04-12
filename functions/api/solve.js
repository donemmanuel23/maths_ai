export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    // Access environment variables via the env object in Cloudflare
    const apiKey = env.GROQ_API_KEY || body.apiKey;

    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: 'Configuration Error: API Key is missing. Please paste it in the setup area.' 
      }), { status: 401 });
    }
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: body.model || "llama-3.2-11b-vision-preview",
        messages: body.messages,
        temperature: body.temperature || 0.2,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return new Response(JSON.stringify({ 
        error: error.error?.message || 'AI Provider Error' 
      }), { status: response.status });
    }

    const data = await response.json();
    
    return new Response(JSON.stringify({ 
      content: data.choices[0].message.content 
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
    
  } catch (err) {
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error: ' + err.message 
    }), { status: 500 });
  }
}