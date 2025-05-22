# Next.js BPMN Viewer

A modern BPMN (Business Process Model and Notation) diagram viewer built with Next.js and bpmn-js.

## Features

- View and interact with BPMN 2.0 diagrams
- Upload new BPMN files
- Browse and manage all uploaded diagrams
- Responsive design that works on desktop and mobile
- Built with Next.js for optimized performance

## Getting Started

### Prerequisites

- Node.js 14.x or later
- npm or yarn

### Installation

1. Clone this repository

   ```bash
   git clone <repository-url>
   cd bpmn-viewer-next
   ```

2. Install dependencies

   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Upload BPMN files using the "Upload" button
2. All uploaded files will be stored in the `public/bpmn` directory
3. Select a file from the list to view it in the BPMN viewer
4. The viewer supports panning and zooming for easy navigation

## Directory Structure

```
bpmn-viewer-next/
├── components/       # React components
│   ├── BpmnViewer.tsx
│   └── FileSelector.tsx
├── pages/           # Next.js pages
│   ├── api/         # API routes
│   │   ├── list-bpmn-files.ts
│   │   └── upload-bpmn-file.ts
│   ├── _app.tsx
│   └── index.tsx
├── public/          # Static assets
│   └── bpmn/        # BPMN files directory
└── styles/          # CSS modules
    ├── BpmnViewer.module.css
    ├── FileSelector.module.css
    ├── Home.module.css
    └── globals.css
```

## Customization

You can customize the appearance of the BPMN viewer by modifying the CSS modules in the `styles` directory.

## Dependencies

- [Next.js](https://nextjs.org/) - React framework
- [bpmn-js](https://github.com/bpmn-io/bpmn-js) - BPMN 2.0 renderer and web modeler
- [formidable](https://github.com/node-formidable/formidable) - Node.js module for parsing form data

## Building for Production

```bash
npm run build
# or
yarn build
```

Start the production server:

```bash
npm run start
# or
yarn start
```

## License

This project is open source and available under the MIT License.
