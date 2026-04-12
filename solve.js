exports.handler = async (event, context) => {
  // Netlify functions only support POST for this implementation
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  if (!process.env.GROQ_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GROQ_API_KEY is not configured in Netlify environment variables.' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    
    // Using native fetch (available in Node 18+)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
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
    const content = data.choices[0].message.content;
    
    // Format as SSE (Server-Sent Events) to satisfy the frontend's stream reader
    const formattedResponse = `data: ${JSON.stringify({ choices: [{ delta: { content: content } }] })}\ndata: [DONE]`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/event-stream' },
      body: formattedResponse
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};