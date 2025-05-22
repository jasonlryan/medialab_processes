/**
 * Apply BPMN Styles
 *
 * This script applies the external CSS styles to BPMN diagrams
 * and ensures that arrows are properly displayed on sequence flows.
 */

function applyBpmnStyles() {
  // Load the external stylesheet
  const link = document.createElement("link");
  link.href = "/styles/bpmn-styles.css";
  link.type = "text/css";
  link.rel = "stylesheet";
  document.head.appendChild(link);

  // Ensure arrows are properly displayed on sequence flows
  function fixBpmnArrows() {
    // Check if SVG exists
    const svg = document.querySelector(".bjs-container svg");
    if (!svg) {
      // Try again in a moment if the SVG is not yet loaded
      setTimeout(fixBpmnArrows, 100);
      return;
    }

    // Check if marker definitions exist
    let defs = svg.querySelector("defs");
    if (!defs) {
      // Create defs element if it doesn't exist
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      svg.prepend(defs);
    }

    // Check if the sequence flow marker exists
    let marker = defs.querySelector("#sequenceflow-end-marker");
    if (!marker) {
      // Create sequence flow end marker (arrow)
      marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
      marker.setAttribute("id", "sequenceflow-end-marker");
      marker.setAttribute("viewBox", "0 0 20 20");
      marker.setAttribute("refX", "11");
      marker.setAttribute("refY", "10");
      marker.setAttribute("markerWidth", "10");
      marker.setAttribute("markerHeight", "10");
      marker.setAttribute("orient", "auto");

      // Create arrow path
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      path.setAttribute("d", "M 1 5 L 11 10 L 1 15 Z");

      // Use the same color as defined in CSS (--sequence-flow: #404040)
      path.setAttribute("fill", "#404040");

      marker.appendChild(path);
      defs.appendChild(marker);
    }

    // Apply marker to all sequence flows that don't already have it
    const connections = svg.querySelectorAll(
      ".djs-connection .djs-visual path"
    );
    connections.forEach((connection) => {
      if (
        !connection.getAttribute("marker-end") ||
        connection.getAttribute("marker-end") === "none"
      ) {
        connection.setAttribute("marker-end", "url(#sequenceflow-end-marker)");
      }
    });
  }

  // Run the arrow fix when the viewer has loaded
  if (document.readyState === "complete") {
    fixBpmnArrows();
  } else {
    window.addEventListener("load", fixBpmnArrows);
  }
}

// Initialize
applyBpmnStyles();
