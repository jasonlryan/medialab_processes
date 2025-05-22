# BPMN Viewer Styling Integration

This document provides instructions for implementing the external styling approach for BPMN diagrams, ensuring consistent appearance across all process maps.

## Overview

Instead of using inline styling in BPMN XML files, we've created an external CSS-based styling approach that:

1. Uses subtle, consistent colors across all diagrams
2. Properly displays arrows on sequence flows
3. Follows the style guide guidelines for professional diagrams
4. Can be applied to any BPMN diagram without modifying the source files

## Integration Steps

### 1. Include the CSS and JavaScript files

Add these files to your viewer component or HTML page:

```html
<!-- In your HTML head section or component -->
<link rel="stylesheet" href="/styles/bpmn-styles.css" />
<script src="/scripts/apply-bpmn-styles.js" defer></script>
```

### 2. Viewer Component Setup

If you're using a JavaScript framework (React, Vue, etc.), ensure the script is loaded after the BPMN viewer is initialized:

```javascript
// Example with React useEffect
useEffect(() => {
  // After your bpmnViewer is initialized and diagram loaded
  const viewer = new BpmnJS({ container: "#canvas" });

  // Load the diagram
  viewer.importXML(bpmnXML);

  // Then apply styling
  if (window.applyBpmnStyles) {
    window.applyBpmnStyles();
  } else {
    // If the script hasn't loaded yet, add it dynamically
    const script = document.createElement("script");
    script.src = "/scripts/apply-bpmn-styles.js";
    script.onload = () => window.applyBpmnStyles();
    document.head.appendChild(script);
  }
}, [bpmnXML]);
```

### 3. Style Customization (Optional)

If you need to adjust the styles for specific projects, modify the `bpmn-styles.css` file. The CSS uses specific selectors that target BPMN elements by their type and ID patterns.

## Key Features

1. **Subtle Color Usage**

   - Minimal color differentiation between process phases
   - Light backgrounds and subtle borders for clean appearance
   - No overly saturated colors

2. **Proper Arrows**

   - Script automatically adds arrow markers to sequence flows
   - Ensures directional clarity in all diagrams

3. **Consistent Typography**

   - Standardized font family (Arial/Helvetica)
   - Consistent font sizes based on element hierarchy
   - Proper label positioning

4. **Reduced Visual Noise**
   - Eliminates excessive hover effects
   - Provides subtle selection indicators
   - Removes unnecessary shadows and decorations

## Troubleshooting

If arrows are not displaying properly:

- Check browser console for errors
- Ensure the SVG markers are being created correctly
- Verify the CSS is properly loaded and applied to the BPMN viewer container

For style inconsistencies:

- Verify no inline styles are overriding the external CSS
- Check that element IDs match the expected patterns in the CSS selectors
- Ensure the CSS specificity is high enough to override default bpmn-js styles

## Best Practices

1. Keep all BPMN diagrams clean with minimal inline styling
2. For new diagrams, follow the naming conventions in the style guide
3. Use consistent element IDs that match the CSS selectors (e.g., including "PreJoin" or "PostJoin" in IDs for phase identification)
4. Test styling across different browsers and viewport sizes
