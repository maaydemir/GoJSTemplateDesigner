Acceptance Tests – GoJS Node Template Designer

This file contains a list of manual and automated checks to verify
that the Node Template Designer meets the requirements in
REQUIREMENTS.md and the instructions in AGENTS.md. Each test is
labeled with an owner to indicate who is primarily responsible.
The tester should work through every check and ensure that the
application behaves as expected. If automated tests are added,
execute them with npm test.

Test Cases

[Designer] Palette availability

The palette shows entries for Node, Panel, Shape, TextBlock and
Picture.

The Node entry defaults to category “Auto” but can be changed via
a dropdown when selected.

The Shape entry offers at least Rectangle, Ellipse and
RoundedRectangle figures.

[Frontend] Drag‑and‑drop creation

Dragging Node onto the blank canvas creates a root node.

Dragging Panel, Shape, TextBlock or Picture onto
the root node or a panel nests the element inside that parent.

Attempting to drag a second node onto the canvas is ignored or
prevented (only one root is allowed).

Dragging an existing element onto another panel re‑parents the
element and updates the hierarchy visually.

[Frontend] Property editing

Selecting an element populates the property inspector with
relevant fields: e.g., category for nodes, layout for panels,
figure and colours for shapes, font and text for text blocks.

Editing a property value updates the element on the canvas in
real time. For example, changing a shape’s fill colour reflects
immediately.

Adding a custom property via the generic properties table stores
it in the internal state and displays it in code generation.

[Frontend] Binding editing

The bindings editor lists all existing bindings for the selected
element, showing property, path, two‑way and converter fields.

Adding a new binding populates a new row with empty values. The
user can enter a property and path, toggle two‑way and provide a
converter name.

Deleting a binding removes it from the list. Binding changes
persist when switching selection and reloading the code.

[Frontend] Deletion and undo/redo

Pressing the Delete button in the inspector removes the
selected element and its children. The canvas updates
accordingly.

Pressing Undo (e.g., Ctrl+Z or an undo button) restores the
element. Pressing Redo reapplies the deletion.

[Frontend] Code generation

Clicking Generate Code produces a TypeScript function in the
output panel below the canvas. The function contains nested $
calls matching the hierarchy built on the canvas.

The generated code includes all property assignments and bindings
set in the inspector. Converter names appear as stub functions.

Copying the generated function into a GoJS project (assigning it
to diagram.nodeTemplate) renders a node that matches the
original design.

[Tester] Loading preloaded template

When the designer loads, it automatically renders the contents of
preloadedTemplate.json (if present). Verify that the loaded
diagram matches the JSON definition.

Editing the loaded template (e.g., changing colours or text) and
generating code should reflect the modifications.

[Tester] Build and lint

Running npm run build completes without errors.

If a linter is configured (e.g., ESLint), running npm run lint
produces no warnings. Code adheres to the style guidelines
specified in AGENTS.md.

[Tester] Cross‑browser support

Open designer/index.html in at least Chrome, Firefox and Edge.
Verify that all functionality (drag‑and‑drop, property editing,
binding editing, deletion, code generation) works consistently.

Document any failures or unexpected behaviour with reproduction
steps. If automated tests are added, ensure they cover these
scenarios and run them as part of the CI pipeline.
