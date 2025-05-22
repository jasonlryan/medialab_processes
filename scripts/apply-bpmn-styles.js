// scripts/apply-bpmn-styles.js

// This function will be called to apply BPMN styles.
// It can be used to dynamically add SVG markers (like arrowheads)
// or other manipulations that are difficult with CSS alone.

window.applyBpmnStyles = function (bpmnViewerInstance) {
  console.log("applyBpmnStyles called.");

  // Example: Ensure SVG definitions for markers are present if not handled by CSS/bpmn-js
  // This is a common requirement for custom arrowheads.
  const defs =
    document.querySelector("svg defs") ||
    document.createElementNS("http://www.w3.org/2000/svg", "defs");
  if (!document.getElementById("sequenceflow-arrow-normal")) {
    const marker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "marker"
    );
    marker.setAttribute("id", "sequenceflow-arrow-normal");
    marker.setAttribute("viewBox", "0 0 20 20");
    marker.setAttribute("refX", "11"); // Adjust for arrow position on line
    marker.setAttribute("refY", "10");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "10");
    marker.setAttribute("orient", "auto");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M 1 5 L 11 10 L 1 15 Z");
    // Style using CSS variables if possible, or set directly
    // Note: fill/stroke on marker path can sometimes be tricky with CSS variables depending on context
    path.style.fill =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--sequence-flow-stroke")
        .trim() || "#333333";
    path.style.stroke =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--sequence-flow-stroke")
        .trim() || "#333333";
    path.style.strokeWidth = "1px";

    marker.appendChild(path);
    defs.appendChild(marker);

    // Add defs to the main SVG of the bpmn-js viewer
    const svg = bpmnViewerInstance.get("canvas")._svg; // Accessing internal SVG element
    if (svg && !svg.contains(defs)) {
      svg.insertBefore(defs, svg.firstChild);
    }
  }

  // You can add more JavaScript-based styling or DOM manipulations here.
  // For example, if you need to change colors based on data attributes
  // or add complex hover effects not achievable with CSS.

  // Force re-render or update styles if necessary (bpmn-js might do this automatically)
  // if (bpmnViewerInstance) {
  //   const modeling = bpmnViewerInstance.get('modeling');
  //   const elements = bpmnViewerInstance.get('elementRegistry').getAll();
  //   modeling.setColor(elements, {
  //     stroke: 'green', // Example: this would override CSS for all elements
  //     fill: 'yellow'
  //   });
  // }

  console.log("BPMN styles and markers (if any) should be applied.");
};

// Ensure the function is available globally if loaded via <script> tag.
// If using modules, you might export it and import where needed.
