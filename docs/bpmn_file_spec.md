# BPMN File Specifications for Viewer

This document outlines the necessary specifications for BPMN (Business Process Model and Notation) files to be correctly processed and rendered by the Next.js BPMN Viewer application, which utilizes the `bpmn-js` library.

## Key Requirements:

1.  **Valid BPMN 2.0 XML:**

    - The file must be a well-formed XML document adhering to the BPMN 2.0 OMG standard.
    - Ensure correct XML declaration (e.g., `<?xml version="1.0" encoding="UTF-8"?>`) and namespace definitions (e.g., `xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"`).

2.  **Process Definition:**

    - The XML must contain at least one `<bpmn:process>` element. This element defines the actual business process, including its flow elements (tasks, events, gateways) and sequence flows.

3.  **Diagram Interchange (DI) Information:**

    - **This is crucial for visual rendering.** The file **must** include BPMN Diagram Interchange (DI) information. This section typically starts with a `<bpmndi:BPMNDiagram>` tag.
    - Within the DI section, elements like `<bpmndi:BPMNPlane>`, `<bpmndi:BPMNShape>`, and `<bpmndi:BPMNEdge>` describe the visual layout:
      - Positions (x, y coordinates) and dimensions (width, height) of shapes (tasks, events, sub-processes, etc.).
      - Waypoints for sequence flows (lines connecting elements).
    - **Absence of DI information will lead to a "no diagram to display" error in `bpmn-js`, even if the process logic itself is valid.**
    - Most BPMN modeling tools (e.g., Camunda Modeler, Cawemo, draw.io with BPMN plugin) include DI information by default when exporting to `.bpmn` format. Ensure this option is enabled if available.

4.  **Modeling Multi-Stage / Multi-Phase Processes:**

    - To represent complex, multi-stage processes (like the new joiner onboarding example with Pre-Joining, Post-Joining, etc.), use structural BPMN elements:
      - **Pools and Lanes:** Use a `<bpmn:collaboration>` with one or more `<bpmn:participant>` (Pools) to define the main process boundaries. Within a Pool, use `<bpmn:laneSet>` and `<bpmn:lane>` to distinguish between different roles, departments, or responsibilities (e.g., HR, IT, Employee, Hiring Manager).
      - **Sub-Processes:** Employ `<bpmn:subProcess>` elements (often set as `isExpanded="true"` in the DI for visual grouping) to encapsulate distinct phases or stages of the main process. For example, "Pre-Joining" can be a sub-process containing all related tasks.
      - Tasks within each sub-process should be clearly defined.
    - **DI for Structural Elements:** It's essential that the DI section also includes visual information (shapes and edges) for these Pools, Lanes, and Sub-Processes, not just the basic tasks.

5.  **Non-Empty File:**

    - The BPMN file must not be empty. An empty file will result in parsing errors (e.g., "unparsable content detected" or "missing start tag").

6.  **File Extension:**
    - While the uploader might accept `.xml`, the standard and preferred file extension for BPMN diagrams is `.bpmn`.

## Example of a Structure with Sub-Process (Conceptual):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_Example"
                  targetNamespace="http://example.com/bpmn">

  <bpmn:collaboration id="Collab_Main">
    <bpmn:participant id="Participant_ProcessOwner" name="Main Onboarding Process" processRef="MainProcess_1" />
  </bpmn:collaboration>

  <bpmn:process id="MainProcess_1" isExecutable="true">
    <bpmn:laneSet id="LaneSet_Main">
      <bpmn:lane id="Lane_HR" name="HR Department">
        <bpmn:flowNodeRef>SubProcess_PreJoining</bpmn:flowNodeRef>
        <!-- other elements in HR lane -->
      </bpmn:lane>
      <!-- other lanes -->
    </bpmn:laneSet>

    <bpmn:subProcess id="SubProcess_PreJoining" name="Pre-Joining Phase">
      <bpmn:startEvent id="Start_PreJoin" />
      <bpmn:task id="Task_SendContract" name="Send Contract" />
      <bpmn:endEvent id="End_PreJoin" />
      <bpmn:sequenceFlow id="Flow_PreJoin1" sourceRef="Start_PreJoin" targetRef="Task_SendContract" />
      <bpmn:sequenceFlow id="Flow_PreJoin2" sourceRef="Task_SendContract" targetRef="End_PreJoin" />
    </bpmn:subProcess>
    <!-- other sub-processes or tasks -->
    <bpmn:sequenceFlow id="Flow_Connect_SubP" sourceRef="SubProcess_PreJoining" targetRef="...next_element..." />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collab_Main"> <!-- Plane usually references Collaboration or Process -->
      <bpmndi:BPMNShape id="Shape_Participant_ProcessOwner" bpmnElement="Participant_ProcessOwner" isHorizontal="true">
        <dc:Bounds x="100" y="50" width="1000" height="600" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_Lane_HR" bpmnElement="Lane_HR" isHorizontal="true">
        <dc:Bounds x="130" y="50" width="970" height="250" /> <!-- Coordinates relative to Participant -->
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_SubProcess_PreJoining" bpmnElement="SubProcess_PreJoining" isExpanded="true">
        <dc:Bounds x="160" y="80" width="350" height="150" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_Start_PreJoin" bpmnElement="Start_PreJoin">
        <dc:Bounds x="180" y="132" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_Task_SendContract" bpmnElement="Task_SendContract">
        <dc:Bounds x="250" y="110" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_End_PreJoin" bpmnElement="End_PreJoin">
        <dc:Bounds x="380" y="132" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Edge_Flow_PreJoin1" bpmnElement="Flow_PreJoin1">
        <di:waypoint x="216" y="150" />
        <di:waypoint x="250" y="150" />
      </bpmndi:BPMNEdge>
      <!-- ... more shapes and edges ... -->
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>

</bpmn:definitions>
```

## Troubleshooting Common Errors:

- **"unparsable content detected" / "missing start tag":**
  - Usually indicates the file is empty, not valid XML, or the fetched content was not the XML itself (e.g., an HTML error page due to a 404).
- **"no diagram to display":**
  - The XML is likely valid BPMN but is missing the Diagram Interchange (DI) section needed for visual rendering. Ensure your modeling tool exports this information, including for structural elements like Pools, Lanes, and Sub-Processes.

By adhering to these specifications, you can ensure your BPMN files are compatible with the viewer application.

# BPMN Diagram Style Guide

This style guide provides best practices for creating clear, professional, and visually consistent BPMN diagrams. Following these guidelines will ensure your diagrams effectively communicate process flows while maintaining visual appeal.

## Layout and Spacing

1. **Adequate Spacing**

   - Maintain minimum 20px spacing between all elements
   - Ensure labels have sufficient padding (10px minimum) to prevent overlap
   - Avoid overcrowding by distributing elements evenly across the canvas

2. **Swimlane Usage**

   - Only include swimlanes (pools/lanes) that serve a distinct purpose
   - Consolidate roles with similar responsibilities into a single lane
   - Maintain consistent lane widths (avoid extremely narrow or wide lanes)
   - Ensure lane labels are clearly visible and positioned consistently

3. **Flow Direction**
   - Establish a clear primary flow direction (typically left-to-right)
   - Minimize crossing sequence flows to reduce visual complexity
   - Align elements in a logical grid structure where possible

## Element Design

1. **Consistent Styling**

   - Apply uniform styling to similar element types
   - Avoid random use of bold, shadows, or other effects on select elements
   - If using colors, ensure they follow a coherent system with consistent meaning

2. **Typography**

   - Use a single, readable sans-serif font throughout (e.g., Arial, Helvetica)
   - Maintain consistent font sizes based on element hierarchy:
     - Pool/Lane labels: 14pt
     - Activity/Task labels: 12pt
     - Event labels: 10-12pt
   - Avoid all-caps text except for very short labels or acronyms
   - Ensure sufficient contrast between text and background

3. **Connection Lines**
   - Use clear directional arrows on all sequence flows
   - Maintain consistent line weights (1-2px recommended)
   - Avoid diagonal lines through elements
   - Use rounded corners (radius 5-10px) for direction changes
   - Minimize the number of bend points in connectors

## Color and Visual Hierarchy

1. **Color Usage**

   - Implement a restrained color palette (3-5 colors maximum)
   - Use color purposefully to indicate:
     - Element categories (e.g., automated vs. manual tasks)
     - Process stages/phases
     - Exception paths
   - Ensure sufficient contrast for accessibility
   - Consider colorblind-friendly palettes

2. **Visual Hierarchy**
   - Emphasize critical path elements through subtle visual differentiation
   - De-emphasize less important or exceptional paths
   - Use consistent visual weights to indicate element importance

## Diagram Size and Complexity

1. **Size Management**

   - Keep diagrams to a reasonable size (viewable on standard screens)
   - For complex processes, consider breaking into connected sub-processes
   - Maintain aspect ratio appropriate for intended viewing medium

2. **Complexity Reduction**
   - Limit diagram to 15-25 elements where possible
   - Use collapsed sub-processes for complex sections
   - Consider creating overview diagrams with drill-down capabilities

## Anti-Patterns to Avoid

1. **Visual Clutter**

   - Random use of bold text, shadows, or effects
   - Inconsistent spacing between elements
   - Overlapping labels or elements
   - Unnecessary decorative elements

2. **Structural Issues**

   - Empty or redundant swimlanes
   - Lines passing through the middle of shapes
   - Missing directional arrows on sequence flows
   - Excessively long straight lines (use bend points)

3. **Readability Problems**
   - Font sizes too small to read
   - Poor contrast between text and background
   - Abbreviated labels that are unclear
   - Inconsistent terminology across the diagram

By following these guidelines, your BPMN diagrams will not only be technically correct but also visually professional, clear, and easy to understand for all stakeholders.
