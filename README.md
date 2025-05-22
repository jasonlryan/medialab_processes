# MediaLab Process Viewer

A modern viewer for Business Process Model and Notation (BPMN) diagrams with AI-powered assistance.

## Features

- Secure access with password protection
- View any BPMN 2.0 compliant XML file
- Upload and manage BPMN files
- Dual view modes: diagram view and textual process view
- AI-powered chat for process understanding and analysis
- Pan and zoom navigation
- Modern responsive UI built with Material UI
- Next.js-based application

## Getting Started

### Running Locally

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open http://localhost:3000 in your browser
5. Enter the password: `medialab2024`

### Deployment

To deploy the application:

```
npm run build
npm run start
```

For production deployment, consider using Vercel or Netlify for simplified deployment of Next.js applications.

## Usage

1. After logging in, upload BPMN files through the interface
2. View diagrams in either graphical BPMN format or as a textual process
3. Use the AI chat panel to ask questions about the displayed process
4. Navigate between uploaded files using the file selector

## Technical Details

This application uses:

- Next.js for the React framework
- Material UI for the component library
- bpmn-js for BPMN rendering
- AI integration for process analysis

## Troubleshooting

- Ensure your BPMN files are valid BPMN 2.0 XML format
- For file upload issues, check file size and permissions
- If AI chat is not responding, ensure your network connection is stable

## Security

The application is protected with a password. Default password is `medialab2024`.
