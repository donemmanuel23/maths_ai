const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    
    // Using Groq as the provider for llama-3.2-11b-vision-preview
    // Ensure you add GROQ_API_KEY to your Netlify Environment Variables
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
        stream: false // Simple non-streaming implementation for reliability
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
    
    // Formatting the response to match what your frontend expects for streaming
    // Since standard Netlify functions handle buffers better than raw streams
    const content = data.choices[0].message.content;
    const formattedResponse = `data: ${JSON.stringify({ choices: [{ delta: { content: content } }] })}\ndata: [DONE]`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/event-stream' },
      body: formattedResponse
    };

  } catch (err) {
    console.error('Function Error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to process request' }) };
  }
};