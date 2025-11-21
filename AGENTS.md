GoJS Node Template Designer – Instructions for AI Agents
Project Overview

This repository contains a visual node‑template designer for the
GoJS diagramming library. The tool lets you create complex node
templates by dragging and dropping GraphObject primitives (Nodes,
Panels, Shapes, TextBlocks, Pictures, etc.), configuring their
properties, binding them to data paths, and then exporting working
GoJS code. It is implemented entirely in the browser using
React + TypeScript. There is no backend – the app runs from
designer/index.html and renders live previews with GoJS.

The goal is to give users a WYSIWYG editor for GoJS templates: you
drag items from a palette onto a canvas, build nested hierarchies,
edit any property, add bindings, delete or reorder items, and finally
generate a function that builds the same template using
go.GraphObject.make. The repository also includes a TypeScript DSL
and code generator for converting a JSON description into GoJS code.

Setup and Build Commands

Agents should run all commands from the repository root unless
otherwise specified. The app is a Vite + React single‑page
application under the project/ directory.

Install dependencies by running:

cd project
npm install


Run the visual designer locally:

npm run dev -- --host


This starts the Vite dev server (default port 5173) so you can
try the live designer in the browser.

Create a production build (used for Vercel/static hosting):

npm run build


Preview the production build locally (mirrors Vercel output):

npm run preview -- --host --port 4173


This serves the contents of dist/ at http://localhost:4173.

Code Style and Conventions

When generating or editing code, follow these guidelines:

TypeScript strict mode: enable strict in tsconfig.json and
avoid using any. Prefer explicit interfaces and types for
GraphObjects, bindings and component state.

Functional React components: use hooks (useState, useEffect,
useReducer) instead of class components. Break down UI into
reusable components (Palette, Canvas, PropertyEditor, BindingEditor,
CodeGenerator, etc.).

Tailwind CSS: use Tailwind
 utility
classes for styling when appropriate. Avoid custom CSS unless
necessary for layout. Keep the UI simple and accessible.

Single quotes & no semicolons: follow the standard Prettier
configuration of single quotes and omit semicolons in TypeScript and
JavaScript files
agents.md
. Use prettier/ESLint to
maintain formatting consistency.

Idempotent functions: write pure functions where possible
(e.g., for the DSL parser and code generator). Mutate state via
immutable patterns (use Immer or spread syntax) to enable undo/redo.

Descriptive naming: choose meaningful variable and component
names. Avoid abbreviations and magic numbers. Use PascalCase for
React components and camelCase for variables and functions.

Implementation Guidelines

The designer should support the full power of GoJS’s GraphObject
hierarchy. Here are the core requirements:

Palette: Provide a toolbox of GraphObject types. At minimum
include:

Node – start with category “Auto” by default, but allow the
category to be changed (Auto, Horizontal, Vertical, Spot, Table).

Panel – sub‑containers for layout. The panel’s layout type
should be configurable.

Shape – support common figures (Rectangle, Ellipse,
RoundedRectangle, etc.) and allow the user to set fill, stroke,
stroke width, size, position, margin and other GoJS shape
properties.

TextBlock – for text content; allow editing of text, font,
colour, margin, alignment, wrapping, and any other GoJS text
properties.

Picture – allow specifying a URL or data URI, size, and other
picture properties.

Canvas / Designer: Implement a drag‑and‑drop area where
GraphObjects can be nested. Only one Node may be placed at
the root. Panels, Shapes, TextBlocks and Pictures can be dropped
inside panels or nodes. Users must be able to drag existing
elements to reorder them or move them under different parents.

Property Editor: When an element is selected, display a panel
containing all of its configurable properties. Provide specific
input controls for common types (colour pickers for colours, drop
downs for categories and figure names, numeric inputs for sizes,
text inputs for strings). Additionally, include a generic table
labelled Properties that allows adding arbitrary key–value pairs
for properties not covered by the UI. When a property is changed
the canvas should update immediately.

Binding Editor: Below the property editor, include a section
Bindings. Each binding row must specify:

prop: the name of the property to bind (e.g., text, fill,
location).

path: the data path in your model (e.g., name, loc).

twoWay: a boolean to indicate if the binding should be two‑way.

converter: optional name of a conversion function. Emit stub
functions in the generated code for converters.
Allow users to add and remove bindings for any property.

Deletion: Provide a Delete button in the property panel to
remove the selected element and all of its descendants. Deleting
the root node should clear the canvas.

Undo/Redo: Maintain an edit history so users can undo and redo
changes. Use immutable state updates to facilitate this.

Code Generation: Provide a Generate Code button. When
clicked, traverse the internal DSL and produce a TypeScript
function that constructs the template using go.GraphObject.make.
Each GraphObject should become a $ call with its properties and
bindings. Emit helper converter functions if they are used in
bindings. The generated code should be ready to copy into a GoJS
diagram and assigned to diagram.nodeTemplate.

Extensibility: Architect the app so new GraphObject types or
properties can be added by updating a metadata map, not by
modifying core logic. Reflection on GoJS types is limited, so
maintain a JSON schema of common properties.

Accessibility & UX: Ensure drag targets are large enough and
keyboard navigation is possible where practical. Provide tooltips
and descriptive labels. The designer should be usable without
network access.

Testing Instructions

To validate your implementation, the following checks should pass. If
you add automated tests, run them with npm test; otherwise, execute
manual steps and confirm expected behaviour.

Build succeeds: Running npm run build in the project
directory completes without TypeScript errors. The compiled
dist/ files exist and can be executed with node.

Designer loads: Opening project/designer/index.html shows
the palette, blank canvas and property panel. There should be no
JavaScript errors in the browser console.

Drag and drop: Dragging an item from the palette onto the
canvas creates the corresponding GraphObject. Dragging existing
elements onto other panels re‑parents them correctly. The state
updates and the property editor reflects the selected element.

Property editing: Changing values in the property editor
updates the selected element in real time. Adding a new custom
property in the Properties table should reflect in the
internal DSL and subsequent code generation.

Binding editing: Adding bindings to any property and toggling
the two‑way flag should store the configuration. The bindings
should appear in the generated code as new go.Binding(...). If
a converter name is specified, it should appear both in the
binding and as a stub function.

Deletion & undo: Pressing Delete removes the selected
element and descendants. Undo/redo should restore or reapply the
deletion correctly.

Code generation: Pressing Generate Code produces a valid
TypeScript function. Copying this function into a GoJS project
and setting it as diagram.nodeTemplate should render an
equivalent node. Converters are emitted as stub functions.

Additional Guidance

Use reasonable assumptions: If the requirements leave room
for interpretation (e.g., how a certain GoJS property should be
edited), make a sensible choice and document it in your code. When
in doubt, prefer flexibility for the user.

Don’t expose secrets or API keys: The project does not require
any external services. Never hard‑code API keys or secret data.

Security considerations: The designer runs client‑side. When
rendering user‑supplied images or code, ensure you do not expose
the environment to XSS attacks. Escape text where necessary.

Keep README.md for humans: This file (AGENTS.md) is
specifically for AI coding agents. Do not duplicate user‑oriented
documentation here
agents.md
. Keep the README concise.

By following the instructions above, an AI coding agent like Codex
should be able to build, run, and extend this project in a
deterministic way. Feel free to add further sections (e.g., security
guidelines, deployment steps) if they become relevant.
