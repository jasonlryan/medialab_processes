# BPMN Viewer

A simple viewer for Business Process Model and Notation (BPMN) diagrams.

## How to Use

1. Place your BPMN files in the `bpmn/` directory in the root of this project.
2. Open the `bpmn-viewer.html` file in your web browser.
3. Click "Scan BPMN Directory" to detect BPMN files in the directory.
4. Click on any of the discovered BPMN files to view them.
5. Alternatively, click "Load Custom BPMN File" to select and open a BPMN file from anywhere on your computer.

## Features

- View any BPMN 2.0 compliant XML file
- Automatically discover BPMN files in the `/bpmn` directory
- Load files from your local system
- Pan and zoom navigation
- Caches loaded diagrams for quick switching
- Responsive layout that works on any screen size
- No server required - works directly in the browser

## Setup

1. Create a `bpmn` directory in the same location as the HTML file
2. Place your BPMN files (with `.bpmn` extension) in that directory
3. Open the HTML file in a browser

## Technical Details

This viewer uses the [bpmn-js](https://github.com/bpmn-io/bpmn-js) library, which is a BPMN 2.0 renderer and web modeler.

## Dependencies

- bpmn-js (loaded via CDN)

## Troubleshooting

If the viewer cannot automatically discover files in the /bpmn directory, you may need to:

1. Ensure the files have a `.bpmn` extension
2. Run the page from a local server (not just opening the file directly) for some browsers
3. Use the "Load Custom BPMN File" button to load files manually

## Extending the Viewer

If you need to edit BPMN diagrams (not just view them), consider upgrading to the full bpmn-js modeler by changing the dependency to:

```html
<script src="https://unpkg.com/bpmn-js@11.5.0/dist/bpmn-modeler.development.js"></script>
```

And adding the necessary modeler initialization code.
