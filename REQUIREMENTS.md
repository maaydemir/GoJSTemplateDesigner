Requirements – GoJS Node Template Designer

This document summarises the functional and non‑functional requirements
for the GoJS Node Template Designer project. It is intended to be
read by AI coding agents and human developers alike. For broader
context and build instructions, see AGENTS.md and project/README.md.

Product Goals

The tool will allow developers and diagram designers to build complex
GoJS node templates visually. Instead of hand‑writing nested
go.GraphObject.make calls, users can assemble templates using a
drag‑and‑drop interface, configure every property through a property
inspector, add data bindings, and export working TypeScript/JS code.

The primary goals are:

WYSIWYG Editor – Provide a canvas where users can construct
arbitrary hierarchies of GraphObjects (Nodes, Panels, Shapes,
TextBlocks, Pictures, etc.) by dragging from a palette and
dropping into containers. Visually represent the structure and
update it in real time.

Comprehensive Property Editing – For every GraphObject,
expose all configurable GoJS properties (e.g., fill, stroke,
strokeWidth, category, figure, margin, spot, alignment,
font, size). Provide intuitive controls for common types and
allow adding custom properties via a key–value table.

Data Binding Support – Allow any property to be bound to a
data source via GoJS bindings. Each binding must specify a
property, a data path, whether it is two‑way, and an optional
converter function name.

Hierarchy Manipulation – Users must be able to reorder
elements and change parent–child relationships by dragging
existing items. Deleting an element removes its descendants.
Undo/redo actions should be supported.

Code Generation – Generate TypeScript/JavaScript code that
recreates the designed template. The output should be a
function returning a go.Node created via go.GraphObject.make.
Bindings must be emitted as new go.Binding(...), and converter
stubs should be added when referenced.

Import/Export – (Optional) Provide the ability to load
existing templates from a JSON/DSL representation and save the
current design to JSON for reuse.

Target Users

This tool is aimed at JavaScript/TypeScript developers who use GoJS to
build diagrams and require custom node templates. It also targets
non‑programmers such as UX designers who need to design nodes but do
not want to write GoJS code manually. The tool must therefore be
usable by both technical and non‑technical users.

Key Features

Palette with selectable GraphObjects (Node, Panel, Shape,
TextBlock, Picture) and configuration options such as category and
figure type.

Canvas supporting nested drag‑and‑drop, with visual cues for
insertion points and selected element highlighting.

Property Inspector showing all settable properties for the
selected element, including enumerations (e.g., Spot values),
numbers, strings, colours, sizes and custom objects. A generic
table for additional properties.

Bindings Editor listing all bindings for the selected element
with fields for property, data path, two‑way flag and converter
name. Ability to add and delete bindings.

Deletion & Undo/Redo controls integrated into the property
inspector or via keyboard shortcuts.

Code Generator producing a clean, readable TypeScript function
with $ calls and binding objects. Helper converter functions
should be included as empty stubs.

Preloaded Templates – the designer should be able to load a
template from preloadedTemplate.json and visualise it.

Constraints

Browser‑only: The application must run in modern browsers
(Chrome, Firefox, Edge) with no server side. Use GoJS for
rendering diagrams.

Technology stack: Front‑end built with React + TypeScript.
Use plain JavaScript where necessary; avoid heavy frameworks.

Performance: The UI should remain responsive even with deep
hierarchies of GraphObjects. Use memoization and efficient state
updates.

Accessibility: Provide keyboard accessibility and semantic HTML.
Use ARIA attributes where appropriate. Colour pickers and
dropdowns should be screen‑reader friendly.

Extensibility: The property and binding editors should be data
driven so new GoJS properties or GraphObject types can be added by
updating a metadata map.

Security: Do not execute user‑supplied code in the browser
(except within GoJS’s API). Sanitize any text rendered in the
inspector.

Open Questions / Future Enhancements

Geometry & Path Editors – Provide a vector editor for custom
shape geometries beyond the default figures.

Theming – Allow users to save and apply design themes (sets of
colours, fonts, shapes).

Collaboration – Implement real‑time collaboration or export
designs to share with team members.

If any of these items are unclear, the implementing agent should make
reasonable assumptions and document them in its commit messages or
pull request descriptions.
