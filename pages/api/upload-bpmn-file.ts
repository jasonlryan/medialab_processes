import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { IncomingForm, Files, Fields } from 'formidable';

interface UploadResponse {
  message: string;
  filename?: string;
}

// Define more precise types for formidable files
interface FormidableFile {
  filepath: string;
  originalFilename?: string;
  newFilename?: string;
}

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<UploadResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const bpmnDir = path.join(process.cwd(), 'public', 'bpmn');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(bpmnDir)) {
      fs.mkdirSync(bpmnDir, { recursive: true });
    }

    // Parse the form data
    const form = new IncomingForm({
      uploadDir: bpmnDir,
      keepExtensions: true,
    });

    return new Promise<void>((resolve) => {
      form.parse(req, async (err: Error | null, fields: Fields, files: Files) => {
        if (err) {
          console.error('Error parsing form:', err);
          res.status(500).json({ message: 'Error uploading file' });
          return resolve();
        }

        try {
          // Handle different formidable versions
          const filesArray = files.file;
          const file = Array.isArray(filesArray) ? filesArray[0] : filesArray;
          
          if (!file) {
            res.status(400).json({ message: 'No file uploaded' });
            return resolve();
          }

          // Type assertion for formidable file
          const uploadedFile = file as unknown as FormidableFile;
          
          // Ensure file has .bpmn extension
          const originalFilename = uploadedFile.originalFilename || 'diagram.bpmn';
          const fileExtension = path.extname(originalFilename).toLowerCase();
          
          if (fileExtension !== '.bpmn' && fileExtension !== '.xml') {
            // Remove the temporary file
            fs.unlinkSync(uploadedFile.filepath);
            res.status(400).json({ message: 'Only .bpmn and .xml files are allowed' });
            return resolve();
          }

          // Rename file to original filename
          const newFilePath = path.join(bpmnDir, originalFilename);
          fs.renameSync(uploadedFile.filepath, newFilePath);

          res.status(200).json({ 
            message: 'File uploaded successfully',
            filename: originalFilename 
          });
          return resolve();
        } catch (error) {
          console.error('Error handling upload:', error);
          res.status(500).json({ message: 'Error saving uploaded file' });
          return resolve();
        }
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: 'Server error during upload' });
  }
} 