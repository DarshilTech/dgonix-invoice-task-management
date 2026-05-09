'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { useEffect } from 'react';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

type BtnProps = {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
};

function Btn({ onClick, active, title, children, disabled }: BtnProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`flex h-7 w-auto min-w-[28px] items-center justify-center rounded px-1.5 text-xs transition-colors ${
        active
          ? 'bg-gray-200 text-gray-900'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      } disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-gray-200 shrink-0" />;
}

function SelectBtn({ value, options, onChange, title }: { value: string; options: { label: string; value: string }[]; onChange: (v: string) => void; title: string }) {
  return (
    <select
      title={title}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onMouseDown={(e) => e.stopPropagation()}
      className="h-7 rounded border border-gray-200 bg-white px-1.5 text-xs text-gray-700 focus:outline-none focus:border-primary-400"
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

const FONT_SIZES = ['10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48'];
const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Times New Roman', value: 'Times New Roman' },
];

export function RichEditor({ value, onChange, placeholder }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Subscript,
      Superscript,
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[160px] px-4 py-3 text-sm text-gray-700 focus:outline-none',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt('Image URL');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const addLink = () => {
    const url = window.prompt('URL', editor.getAttributes('link').href ?? '');
    if (url === null) return;
    if (url === '') { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  };

  const insertTable = () =>
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();

  return (
    <div className="overflow-hidden rounded-b-xl border-t border-gray-100">
      {/* Toolbar row 1 */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        {/* Undo / Redo */}
        <Btn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 010 10H9M3 10l4-4M3 10l4 4" /></svg>
        </Btn>
        <Btn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 000 10h4M21 10l-4-4M21 10l-4 4" /></svg>
        </Btn>

        <Divider />

        {/* Block type */}
        <SelectBtn
          title="Block type"
          value={
            editor.isActive('heading', { level: 1 }) ? 'h1'
            : editor.isActive('heading', { level: 2 }) ? 'h2'
            : editor.isActive('heading', { level: 3 }) ? 'h3'
            : 'paragraph'
          }
          options={[
            { label: 'Paragraph', value: 'paragraph' },
            { label: 'Heading 1', value: 'h1' },
            { label: 'Heading 2', value: 'h2' },
            { label: 'Heading 3', value: 'h3' },
          ]}
          onChange={(v) => {
            if (v === 'paragraph') editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: Number(v.slice(1)) as 1 | 2 | 3 }).run();
          }}
        />

        <Divider />

        {/* Font family */}
        <SelectBtn
          title="Font family"
          value={editor.getAttributes('textStyle').fontFamily ?? ''}
          options={FONT_FAMILIES}
          onChange={(v) => {
            if (v) editor.chain().focus().setFontFamily(v).run();
            else editor.chain().focus().unsetFontFamily().run();
          }}
        />

        {/* Font size */}
        <SelectBtn
          title="Font size"
          value="14"
          options={FONT_SIZES.map((s) => ({ label: `${s}px`, value: s }))}
          onChange={() => {}}
        />

        <Divider />

        {/* Inline formatting */}
        <Btn title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </Btn>
        <Btn title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </Btn>
        <Btn title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <span className="underline">U</span>
        </Btn>
        <Btn title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <span className="line-through">S</span>
        </Btn>
        <Btn title="Subscript" active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()}>
          X<sub className="text-[8px]">2</sub>
        </Btn>
        <Btn title="Superscript" active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()}>
          X<sup className="text-[8px]">2</sup>
        </Btn>

        <Divider />

        {/* Text color */}
        <label title="Text color" className="flex h-7 cursor-pointer items-center gap-0.5 rounded px-1.5 text-xs text-gray-600 hover:bg-gray-100">
          <span className="font-bold underline decoration-2" style={{ textDecorationColor: '#ef4444' }}>A</span>
          <input type="color" className="h-0 w-0 opacity-0" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} />
          <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>
        </label>

        {/* Highlight */}
        <label title="Highlight" className="flex h-7 cursor-pointer items-center gap-0.5 rounded px-1.5 text-xs text-gray-600 hover:bg-gray-100">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536-9.192 9.192a1 1 0 01-.424.242l-4.243 1.06 1.06-4.242a1 1 0 01.243-.424l9.02-9.364z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 7l1 1" /></svg>
          <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>
          <input type="color" className="h-0 w-0 opacity-0" defaultValue="#fef08a" onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()} />
        </label>

        <Divider />

        {/* Lists */}
        <Btn title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /><circle cx="2" cy="6" r="1" fill="currentColor" /><circle cx="2" cy="12" r="1" fill="currentColor" /><circle cx="2" cy="18" r="1" fill="currentColor" /></svg>
        </Btn>
        <Btn title="Ordered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" /><text x="2" y="8" fontSize="7" fill="currentColor" fontFamily="sans-serif">1.</text><text x="2" y="14" fontSize="7" fill="currentColor" fontFamily="sans-serif">2.</text><text x="2" y="20" fontSize="7" fill="currentColor" fontFamily="sans-serif">3.</text></svg>
        </Btn>

        <Divider />

        {/* Alignment */}
        <Btn title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" /></svg>
        </Btn>
        <Btn title="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></svg>
        </Btn>
        <Btn title="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="3" y1="6" x2="21" y2="6" /><line x1="9" y1="12" x2="21" y2="12" /><line x1="6" y1="18" x2="21" y2="18" /></svg>
        </Btn>
        <Btn title="Justify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </Btn>

        <Divider />

        {/* Blockquote */}
        <Btn title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 10c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35l.539-.222.474-.197-.485-1.938-.597.144c-.191.048-.424.104-.689.171-.271.05-.56.187-.882.312-.318.142-.686.238-1.028.466-.344.218-.741.4-1.091.692-.339.301-.748.562-1.05.945-.307.374-.668.689-.93 1.064-.273.372-.556.723-.738 1.098-.191.385-.348.748-.459 1.087-.132.351-.157.65-.2.893-.04.4-.05.59-.04.652l.01.08c.02.238.08.558.189.907.103.348.284.717.505 1.063.222.354.506.666.844.925.332.254.74.45 1.15.547.415.104.849.07 1.24-.025.215-.051.428-.12.636-.232.21-.111.437-.237.617-.428.195-.197.34-.435.427-.683.087-.248.117-.516.073-.777-.053-.312-.209-.6-.434-.822-.222-.22-.515-.372-.82-.432-.289-.058-.57-.02-.829.068-.19.065-.354.191-.509.326-.148.133-.304.305-.355.526l-.03.17c.065-.04.138-.072.218-.09.072-.013.141-.011.208.013.066.024.13.06.186.11.056.055.1.12.13.196.03.078.04.161.027.243-.01.063-.036.126-.078.174-.038.05-.09.086-.147.113a.495.495 0 01-.183.044c-.073.006-.145-.005-.212-.04a.514.514 0 01-.163-.117.5.5 0 01-.108-.188.54.54 0 01-.03-.23.676.676 0 01.086-.234.652.652 0 01.16-.177.659.659 0 01.22-.104.752.752 0 01.252-.022c.09.01.18.04.264.083.086.046.162.108.224.184a.758.758 0 01.143.272.788.788 0 01.027.301.852.852 0 01-.097.295.937.937 0 01-.199.252.99.99 0 01-.279.176 1.085 1.085 0 01-.33.081c-.119.01-.24 0-.356-.034a1.108 1.108 0 01-.33-.155 1.122 1.122 0 01-.265-.261 1.19 1.19 0 01-.174-.359 1.257 1.257 0 01-.047-.419c.01-.147.048-.293.116-.428zM14 10c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35l.539-.222.474-.197-.485-1.938-.597.144c-.191.048-.424.104-.689.171-.271.05-.56.187-.882.312-.318.142-.686.238-1.028.466-.344.218-.741.4-1.091.692-.339.301-.748.562-1.05.945-.307.374-.668.689-.93 1.064-.273.372-.556.723-.738 1.098-.191.385-.348.748-.459 1.087-.132.351-.157.65-.2.893-.04.4-.05.59-.04.652l.01.08c.02.238.08.558.189.907.103.348.284.717.505 1.063.222.354.506.666.844.925.332.254.74.45 1.15.547.415.104.849.07 1.24-.025.215-.051.428-.12.636-.232.21-.111.437-.237.617-.428.195-.197.34-.435.427-.683.087-.248.117-.516.073-.777-.053-.312-.209-.6-.434-.822-.222-.22-.515-.372-.82-.432-.289-.058-.57-.02-.829.068-.19.065-.354.191-.509.326-.148.133-.304.305-.355.526l-.03.17c.065-.04.138-.072.218-.09.072-.013.141-.011.208.013.066.024.13.06.186.11.056.055.1.12.13.196.03.078.04.161.027.243-.01.063-.036.126-.078.174-.038.05-.09.086-.147.113a.495.495 0 01-.183.044c-.073.006-.145-.005-.212-.04a.514.514 0 01-.163-.117.5.5 0 01-.108-.188.54.54 0 01-.03-.23.676.676 0 01.086-.234.652.652 0 01.16-.177.659.659 0 01.22-.104.752.752 0 01.252-.022c.09.01.18.04.264.083.086.046.162.108.224.184a.758.758 0 01.143.272.788.788 0 01.027.301.852.852 0 01-.097.295.937.937 0 01-.199.252.99.99 0 01-.279.176 1.085 1.085 0 01-.33.081c-.119.01-.24 0-.356-.034a1.108 1.108 0 01-.33-.155 1.122 1.122 0 01-.265-.261 1.19 1.19 0 01-.174-.359 1.257 1.257 0 01-.047-.419c.01-.147.048-.293.116-.428z" /></svg>
        </Btn>
        <Btn title="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
        </Btn>
      </div>

      {/* Toolbar row 2 */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        <Btn title="Insert link" active={editor.isActive('link')} onClick={addLink}>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        </Btn>
        <Btn title="Insert image" onClick={addImage}>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
        </Btn>
        <Btn title="Insert table" onClick={insertTable}>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="1" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></svg>
        </Btn>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
