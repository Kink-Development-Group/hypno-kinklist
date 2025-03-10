import "../styles/main.scss";
import { KinkEditor } from "./KinkEditor";

document.addEventListener("DOMContentLoaded", () => {
  const appContainer = document.getElementById("app");
  if (appContainer) {
    const editor = new KinkEditor(appContainer);
    editor.init();
  }
});
