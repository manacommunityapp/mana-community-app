import { useEffect, useRef } from "react";
import grapesjs, { type Editor } from "grapesjs";
import newsletterPreset from "grapesjs-preset-newsletter";
import basicBlocks from "grapesjs-blocks-basic";
import "grapesjs/dist/css/grapes.min.css";
import { emailBlocks, starterTemplateCss, starterTemplateHtml } from "./emailBuilderData";
import type { PreviewDevice } from "./PreviewModal";

interface BuilderSnapshot {
  html: string;
  css: string;
  jsonLayout: unknown;
}

const deviceWidth: Record<PreviewDevice, string> = {
  desktop: "",
  tablet: "520px",
  mobile: "360px",
};

function applyDevice(editor: Editor, device: PreviewDevice) {
  const deviceName = device === "desktop" ? "Desktop" : device === "tablet" ? "Tablet" : "Mobile";
  editor.DeviceManager.select(deviceName);

  const frame = editor.Canvas.getFrameEl();
  if (frame) {
    frame.style.maxWidth = deviceWidth[device] || "";
  }
}

export function BuilderCanvas({
  html,
  css,
  device,
  onReady,
  onChange,
}: {
  html?: string;
  css?: string;
  device: PreviewDevice;
  onReady: (editor: Editor) => void;
  onChange: (snapshot: BuilderSnapshot) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    const editor = grapesjs.init({
      container: containerRef.current,
      height: "100%",
      width: "100%",
      storageManager: false,
      fromElement: false,
      plugins: [newsletterPreset, basicBlocks],
      pluginsOpts: {
        [newsletterPreset as unknown as string]: {},
        [basicBlocks as unknown as string]: { flexGrid: true },
      },
      canvas: {
        styles: [],
      },
      deviceManager: {
        devices: [
          { name: "Desktop", width: "" },
          { name: "Tablet", width: "520px" },
          { name: "Mobile", width: "360px" },
        ],
      },
    });

    editor.BlockManager.getAll().reset();
    emailBlocks.forEach((block) => {
      editor.BlockManager.add(block.id, {
        label: block.label,
        category: block.category,
        content: block.content,
      });
    });

    editor.Commands.add("insert-dynamic-field", {
      run(ed, _sender, options = {}) {
        const token = String((options as { token?: string }).token ?? "");
        if (!token) return;
        const selected = ed.getSelected();
        if (selected) {
          selected.append(`<span>${token}</span>`);
        } else {
          ed.addComponents(`<span>${token}</span>`);
        }
      },
    });

    editor.setComponents(html || starterTemplateHtml);
    editor.setStyle(css || starterTemplateCss);
    editor.on("update", () => {
      onChangeRef.current({
        html: editor.getHtml(),
        css: editor.getCss() || "",
        jsonLayout: editor.getProjectData(),
      });
    });

    editorRef.current = editor;
    onReady(editor);
    applyDevice(editor, device);
    editor.on("canvas:frame:load", () => applyDevice(editor, device));
    onChangeRef.current({
      html: editor.getHtml(),
      css: editor.getCss() || "",
      jsonLayout: editor.getProjectData(),
    });

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
    // GrapesJS owns its internal state after initialization; changing templates remounts this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    applyDevice(editor, device);
  }, [device]);

  return (
    <div className="min-h-[720px] flex-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div ref={containerRef} className="h-full min-h-[720px]" />
    </div>
  );
}
