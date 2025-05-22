import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

interface ResponseData {
  files?: string[];
  message?: string;
  error?: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    const bpmnDirectory = path.join(process.cwd(), 'public', 'bpmn');
    
    // Check if directory exists
    if (!fs.existsSync(bpmnDirectory)) {
      console.warn(`Directory not found: ${bpmnDirectory}`);
      return res.status(200).json({ files: [] }); // Return empty list if dir doesn't exist, not necessarily a 500 error
    }

    const filenames = fs.readdirSync(bpmnDirectory);
    const bpmnFiles = filenames.filter(file => file.endsWith('.bpmn'));
    
    return res.status(200).json({ files: bpmnFiles });

  } catch (error: unknown) {
    console.error('Error listing BPMN files:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ message: 'Error listing BPMN files', error: errorMessage });
  }
} 