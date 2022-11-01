import domtoimage from "dom-to-image";
import { createRoot } from "react-dom/client";
import App from "./app";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
// import * as monaco from "monaco-editor";

// monaco.editor.create(document.getElementById('container'), {
//   value: '{}',
//   language: 'json',
// });

console.log("ewee");
