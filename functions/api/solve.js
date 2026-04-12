export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const apiKey = env.GROQ_API_KEY || body.apiKey;

    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: 'Configuration Error: API Key is missing. Please paste it in the setup area.' 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
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

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ 
        error: data.error?.message || 'AI Provider Error' 
      }), { 
        status: response.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    return new Response(JSON.stringify({ 
      content: data.choices[0].message.content 
    }), { 
      status: 200, 
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      } 
    });
    
  } catch (err) {
    return new Response(JSON.stringify({ 
      error: 'Worker Error: ' + err.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}