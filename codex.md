Codex Instructions for GoJS Node Template Designer

This file provides project‑specific guidance for the OpenAI Codex CLI. The
instructions here mirror those found in AGENTS.md so that Codex will
read them automatically when operating inside this repository
philschmid.de
. If
you are using the Codex CLI, place these lines at the root of the repo
and ensure that global instructions in ~/.codex/instructions.md do not
conflict.

Summary

Build a visual node‑template designer for the GoJS library using
React + TypeScript. Provide a palette of GraphObjects, a canvas
supporting nested drag‑and‑drop, a property inspector that allows
editing any GoJS property, a binding editor for data paths and
converters, deletion and undo/redo support, and a code generator that
produces a TypeScript function using go.GraphObject.make. The
designer should run client‑side from designer/index.html without a
backend. A DSL and code generator exist under src/ and compile to
dist/.

Commands

cd project && npm install – install dependencies.

npm run build – compile TypeScript sources (optional for the
designer).

npm start – run the demo code generator (optional).

Open project/designer/index.html in a browser to use the
visual designer. You can also launch a local HTTP server (e.g.
npx http-server project/designer).

Coding Guidelines

Use TypeScript with strict type checking.

Write functional React components with hooks; avoid classes.

Style with Tailwind CSS; keep UI simple and accessible.

Adopt single quotes and omit semicolons; run Prettier/ESLint.

Structure state immutably to enable undo/redo functionality.

Name variables and components descriptively. Avoid abbreviations.

Implementation Tasks

Implement a palette component listing Node, Panel, Shape, TextBlock
and Picture tools. Allow configuration of categories (Auto,
Horizontal, Vertical, Spot, Table) and shape figures (Rectangle,
Ellipse, RoundedRectangle, etc.).

Build a canvas component that accepts drag‑and‑drop from the
palette and from existing elements. Enforce a single root Node
and arbitrary nesting of panels and content. Update internal DSL
state on each change.

Provide a property inspector that shows every configurable
property of the selected element. Include specific controls for
common types (colour pickers, dropdowns) and a generic table for
arbitrary properties.

Implement a binding editor. Each binding should include the
property name, data path, two‑way toggle and optional converter
name. Support adding and deleting bindings.

Add deletion and undo/redo support. Deleting an element removes
its descendants. Maintain a history stack for undo/redo.

Generate TypeScript code using the DSL. Traverse the DSL state to
emit $(...) calls with properties and bindings. Emit helper
converter functions if used.

Ensure the designer can load an existing template from
preloadedTemplate.json and render it. Provide a mechanism to
import/export DSL JSON if needed.

Write tests or manual instructions verifying drag‑and‑drop,
property editing, binding editing, deletion, undo/redo and code
generation.

Testing Instructions

Follow the tests described in AGENTS.md under Testing
Instructions. You can run npm test if automated tests are
provided, or perform manual checks in the browser. The Codex CLI
will attempt to run test commands automatically
agents.md
.

Notes

These instructions are consumed by the Codex CLI along with any
personal guidance in ~/.codex/instructions.md
philschmid.de
. If you
update this file, re‑run your Codex task to refresh the context.
