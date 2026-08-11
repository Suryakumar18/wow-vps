"use client";

import { useRef, useState } from "react";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import TipTapImage from "@tiptap/extension-image";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  ImagePlus,
  List,
  Pilcrow,
} from "lucide-react";
import { looksLikeImageUrl, parseRichBlocks } from "@/app/components-home/RichText";
import { cn } from "@/app/components-home/lib/cn";

/**
 * Word-style editor for the product's detailed description.
 *
 * What-you-see-is-what-you-get: headings, bullets, bold, alignment and
 * images are applied visually — no markup to remember. The document is
 * still STORED as the storefront's light markup (## / - / ** / [center] /
 * bare image URLs), converted both ways below, so the safe renderer on the
 * product page and everything already saved keep working unchanged.
 */

/**
 * The uploads box serves plain http, which an https admin page blocks as
 * mixed content — so the editor DISPLAYS those images through the app's own
 * image optimizer (same-origin, https), while the document keeps the raw
 * URL. The storefront renderer does the same on the product page.
 */
const displaySrc = (src: string) =>
  src.startsWith("http://") ? `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=75` : src;

const EditorImage = TipTapImage.extend({
  renderHTML({ HTMLAttributes }) {
    return ["img", { ...HTMLAttributes, src: displaySrc(String(HTMLAttributes.src ?? "")) }];
  },
}).configure({ inline: true });

/* ---------------- markup ⇄ TipTap document conversion ------------------- */

function inlineFromText(text: string): JSONContent[] {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  const nodes: JSONContent[] = [];
  parts.forEach((part, i) => {
    if (!part) return;
    nodes.push(
      i % 2 === 1
        ? { type: "text", text: part, marks: [{ type: "bold" }] }
        : { type: "text", text: part },
    );
  });
  return nodes;
}

export function markupToDoc(text: string): JSONContent {
  const content: JSONContent[] = parseRichBlocks(text).map((block) => {
    switch (block.type) {
      case "heading":
        return {
          type: "heading",
          attrs: { level: 2, textAlign: block.align },
          content: inlineFromText(block.text),
        };
      case "bullets":
        return {
          type: "bulletList",
          content: block.items.map((item) => ({
            type: "listItem",
            content: [{ type: "paragraph", content: inlineFromText(item) }],
          })),
        };
      case "image":
        return {
          type: "paragraph",
          attrs: { textAlign: block.align },
          content: [{ type: "image", attrs: { src: block.url } }],
        };
      default:
        return {
          type: "paragraph",
          attrs: { textAlign: block.align },
          content: inlineFromText(block.text),
        };
    }
  });
  return { type: "doc", content: content.length > 0 ? content : [{ type: "paragraph" }] };
}

function inlineToMarkup(nodes: JSONContent[] = []): string {
  return nodes
    .map((node) => {
      if (node.type === "text") {
        const bold = node.marks?.some((m) => m.type === "bold");
        return bold ? `**${node.text ?? ""}**` : (node.text ?? "");
      }
      if (node.type === "hardBreak") return " ";
      return "";
    })
    .join("")
    .replace(/\*\*\*\*/g, "");
}

function alignPrefix(attrs?: Record<string, unknown>): string {
  const align = attrs?.textAlign;
  return align === "center" ? "[center] " : align === "right" ? "[right] " : "";
}

export function docToMarkup(doc: JSONContent): string {
  const lines: string[] = [];
  for (const node of doc.content ?? []) {
    if (node.type === "heading") {
      const text = inlineToMarkup(node.content).trim();
      if (text) lines.push(`${alignPrefix(node.attrs)}## ${text}`, "");
    } else if (node.type === "bulletList") {
      for (const li of node.content ?? []) {
        const text = inlineToMarkup(li.content?.[0]?.content).trim();
        if (text) lines.push(`- ${text}`);
      }
      lines.push("");
    } else if (node.type === "paragraph") {
      const image = node.content?.find((c) => c.type === "image");
      if (image?.attrs?.src) {
        const src = String(image.attrs.src);
        // Hosts the renderer's heuristic wouldn't recognise as images get the
        // explicit [img] marker so they can't fall back to plain text.
        lines.push(`${alignPrefix(node.attrs)}${looksLikeImageUrl(src) ? src : `[img] ${src}`}`, "");
      } else {
        const text = inlineToMarkup(node.content).trim();
        if (text) lines.push(`${alignPrefix(node.attrs)}${text}`, "");
      }
    } else if (node.type === "image" && node.attrs?.src) {
      lines.push(String(node.attrs.src), "");
    }
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/* ---------------- the editor ------------------------------------------- */

export default function RichEditor({
  value,
  onChange,
  uploadImage,
}: {
  /** Current light-markup value (from the form state). */
  value: string;
  onChange: (markup: string) => void;
  /** Uploads a file and resolves to its public URL, or null on failure. */
  uploadImage: (file: File) => Promise<string | null>;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
        // Only what the storefront's format can show — everything else off
        // so nothing typed here gets silently lost on save.
        italic: false,
        strike: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        orderedList: false,
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      EditorImage,
    ],
    content: markupToDoc(value),
    onUpdate: ({ editor: e }) => onChange(docToMarkup(e.getJSON())),
    editorProps: {
      attributes: {
        class:
          "rich-editor-content min-h-[16rem] max-h-[32rem] overflow-y-auto rounded-b-lg bg-white px-4 py-3 text-micro leading-relaxed text-slate-700 outline-none",
      },
    },
  });

  const pickImage = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (url && editor) {
        editor.chain().focus().setImage({ src: url }).setTextAlign("center").run();
      }
    } finally {
      setUploading(false);
    }
  };

  const tools = editor
    ? ([
        {
          label: "Heading",
          icon: Heading2,
          active: editor.isActive("heading", { level: 2 }),
          run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        },
        {
          label: "Paragraph",
          icon: Pilcrow,
          active: editor.isActive("paragraph") && !editor.isActive("bulletList"),
          run: () => editor.chain().focus().setParagraph().run(),
        },
        {
          label: "Bullet",
          icon: List,
          active: editor.isActive("bulletList"),
          run: () => editor.chain().focus().toggleBulletList().run(),
        },
        {
          label: "Bold",
          icon: Bold,
          active: editor.isActive("bold"),
          run: () => editor.chain().focus().toggleBold().run(),
        },
        {
          label: "Left",
          icon: AlignLeft,
          active: editor.isActive({ textAlign: "left" }),
          run: () => editor.chain().focus().setTextAlign("left").run(),
        },
        {
          label: "Center",
          icon: AlignCenter,
          active: editor.isActive({ textAlign: "center" }),
          run: () => editor.chain().focus().setTextAlign("center").run(),
        },
        {
          label: "Right",
          icon: AlignRight,
          active: editor.isActive({ textAlign: "right" }),
          run: () => editor.chain().focus().setTextAlign("right").run(),
        },
      ] as const)
    : [];

  return (
    <div className="rounded-lg border border-line focus-within:border-gold-500">
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-mist/60 px-2 py-1.5">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            onClick={tool.run}
            title={tool.label}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-nano font-semibold transition-colors",
              tool.active
                ? "bg-gold-500 text-navy-900"
                : "text-slate-600 hover:bg-white hover:text-ink",
            )}
          >
            <tool.icon size={13} aria-hidden="true" />
            <span className="hidden sm:inline">{tool.label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || !editor}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-nano font-semibold text-slate-600 transition-colors hover:bg-white hover:text-ink disabled:opacity-50"
        >
          <ImagePlus size={13} aria-hidden="true" />
          <span className="hidden sm:inline">{uploading ? "Uploading…" : "Insert Image"}</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void pickImage(file);
            e.target.value = "";
          }}
        />
      </div>

      <EditorContent editor={editor} />

      {/* Editor typography — mirrors what the storefront's renderer shows. */}
      <style jsx global>{`
        .rich-editor-content h2 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #102135;
          margin: 0.75rem 0 0.35rem;
        }
        .rich-editor-content p {
          margin: 0.35rem 0;
        }
        .rich-editor-content ul {
          list-style: disc;
          padding-left: 1.25rem;
          margin: 0.35rem 0;
        }
        .rich-editor-content li::marker {
          color: #c9a55a;
        }
        .rich-editor-content strong {
          color: #102135;
          font-weight: 600;
        }
        .rich-editor-content img {
          max-width: 100%;
          max-height: 20rem;
          border-radius: 0.5rem;
          border: 1px solid #e5e9f0;
          display: inline-block;
        }
        .rich-editor-content img.ProseMirror-selectednode {
          outline: 2px solid #c9a55a;
        }
      `}</style>
    </div>
  );
}
