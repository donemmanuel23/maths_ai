exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  try {
    const body = JSON.parse(event.body);
    // Prioritize Environment Variable, fall back to key sent from UI
    const apiKey = process.env.GROQ_API_KEY || body.apiKey;

    if (!apiKey) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Configuration Error: API Key is missing. Please paste it in the setup area.' })
      };
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
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: error.error?.message || 'AI Provider Error' })
      };
    }

    const data = await response.json();
    
    // Return a clean JSON object that the frontend expects
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: data.choices[0].message.content })
    };
    
  } catch (err) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Internal Server Error: ' + err.message }) 
    };
  }
};