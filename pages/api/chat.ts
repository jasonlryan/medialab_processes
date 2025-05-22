import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { processData, message, chatHistory } = req.body;
    
    if (!processData || !message) {
      return res.status(400).json({ message: 'Process data and message are required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ message: 'OpenAI API key is not configured' });
    }

    // Build messages array with chat history
    const messages = [
      {
        role: 'system',
        content: 'You are an AI assistant that helps with understanding business processes. You have access to a business process model in JSON format. Your task is to answer questions about this process, explain various aspects of it, and provide insights based on the process data. Be concise but informative.'
      },
      {
        role: 'user',
        content: `Here is the business process data: ${JSON.stringify(processData)}`
      }
    ];

    // Add chat history if it exists
    if (chatHistory && Array.isArray(chatHistory)) {
      chatHistory.forEach(msg => {
        messages.push(msg);
      });
    }

    // Add the new user message
    messages.push({
      role: 'user',
      content: message
    });

    // Set response headers for streaming
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    });

    // Create the API request to OpenAI with streaming enabled
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages,
        temperature: 0.7,
        stream: true // Enable streaming
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      res.write(`data: ${JSON.stringify({ error: 'Error from OpenAI API' })}\n\n`);
      res.end();
      return;
    }

    // Process the stream from OpenAI
    const reader = response.body?.getReader();
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: 'Failed to get response reader' })}\n\n`);
      res.end();
      return;
    }

    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Decode the stream chunks
        const chunk = decoder.decode(value);
        buffer += chunk;
        
        // Process each line
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            // OpenAI sends '[DONE]' when the stream is complete
            if (data === '[DONE]') {
              res.write('data: [DONE]\n\n');
              continue;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                // Send the content chunk to the client
                res.write(`data: ${JSON.stringify({
                  content: parsed.choices[0].delta.content
                })}\n\n`);
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream processing error:', error);
      res.write(`data: ${JSON.stringify({ error: 'Error processing stream' })}\n\n`);
    } finally {
      res.end();
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
} 