import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

interface ModalProps {
  data: {
    rawCode: string;
    messageId: string;
  };
}

export function CodeRunnerModal(props: ModalProps) {
  const [output, setOutput] = createSignal("");

  return (
    <div>
      <h2>Run Code</h2>
      <pre>{props.data.rawCode}</pre>
      <button onClick={runCode}>Run Code</button>
      {output() && <pre>{output()}</pre>}
    </div>
  );
}
