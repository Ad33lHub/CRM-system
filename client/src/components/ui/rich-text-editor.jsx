import React, { forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Mention from '@tiptap/extension-mention';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

/* ── Mention dropdown rendered for @ suggestions ─────────────────────── */
const MentionList = forwardRef(function MentionList({ items, command }, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => setSelectedIndex(0), [items]);

  const selectItem = (index) => {
    const item = items[index];
    if (item) {
      command({ id: item.id, label: item.name });
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((i) => (i + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (!items.length) {
    return (
      <div className="rounded-md border bg-popover p-2 text-xs text-muted-foreground shadow-md">
        No team members found
      </div>
    );
  }

  return (
    <div className="max-h-56 w-60 overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
      {items.map((item, index) => (
        <button
          type="button"
          key={item.id}
          onClick={() => selectItem(index)}
          className={cn(
            'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm',
            index === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
          )}
        >
          <Avatar className="h-6 w-6">
            {item.avatar && <AvatarImage src={item.avatar} alt={item.name} />}
            <AvatarFallback className="bg-primary/5 text-[10px] text-primary">
              {item.name
                ?.split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium leading-none">{item.name}</p>
            {item.role && (
              <p className="truncate text-[10px] capitalize text-muted-foreground">
                {item.role.replace(/_/g, ' ')}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
});

/* ── Suggestion config (positions dropdown without external deps) ────── */
function buildSuggestion(getSuggestions) {
  return {
    items: ({ query }) => {
      const all = getSuggestions() || [];
      return all
        .filter((u) => u.name?.toLowerCase().includes((query || '').toLowerCase()))
        .slice(0, 5);
    },
    render: () => {
      let component;
      let container;

      const positionContainer = (clientRect) => {
        if (!container || !clientRect) return;
        const rect = clientRect();
        if (!rect) return;
        container.style.position = 'absolute';
        container.style.left = `${rect.left + window.scrollX}px`;
        container.style.top = `${rect.bottom + window.scrollY + 4}px`;
        container.style.zIndex = '60';
      };

      return {
        onStart: (props) => {
          component = new ReactRenderer(MentionList, { props, editor: props.editor });
          if (!props.clientRect) return;
          container = document.createElement('div');
          container.appendChild(component.element);
          document.body.appendChild(container);
          positionContainer(props.clientRect);
        },
        onUpdate: (props) => {
          component?.updateProps(props);
          positionContainer(props.clientRect);
        },
        onKeyDown: (props) => {
          if (props.event.key === 'Escape') {
            container?.remove();
            return true;
          }
          return component?.ref?.onKeyDown(props) ?? false;
        },
        onExit: () => {
          container?.remove();
          component?.destroy();
        },
      };
    },
  };
}

/* ── Toolbar ─────────────────────────────────────────────────────────── */
function ToolbarButton({ onClick, active, disabled, label, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40',
        active && 'bg-accent text-foreground'
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }) {
  if (!editor) return null;
  const sep = <span className="mx-1 h-5 w-px bg-border" />;

  const addLink = () => {
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', prev || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 p-1.5">
      <ToolbarButton
        label="Bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      {sep}
      <ToolbarButton
        label="Heading 1"
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      {sep}
      <ToolbarButton
        label="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      {sep}
      <ToolbarButton
        label="Quote"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Code"
        active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Link" active={editor.isActive('link')} onClick={addLink}>
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

/* ── Editor ──────────────────────────────────────────────────────────── */
export function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Write something...',
  maxLength = 5000,
  mentionSuggestions = [],
  readonly = false,
  autoFocus = false,
  className,
}) {
  // Keep latest suggestions accessible to the static suggestion config.
  const suggestionsRef = React.useRef(mentionSuggestions);
  useEffect(() => {
    suggestionsRef.current = mentionSuggestions;
  }, [mentionSuggestions]);

  const editor = useEditor({
    editable: !readonly,
    autofocus: autoFocus,
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: maxLength }),
      Mention.configure({
        HTMLAttributes: { class: 'mention text-primary font-medium' },
        suggestion: buildSuggestion(() => suggestionsRef.current),
      }),
    ],
    content,
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none min-h-[100px] px-3 py-2',
          'dark:prose-invert'
        ),
      },
    },
  });

  // Sync external content changes (e.g. switching into edit mode).
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '', { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, editor]);

  useEffect(() => {
    if (editor) editor.setEditable(!readonly);
  }, [readonly, editor]);

  const charCount = editor?.storage.characterCount?.characters() ?? 0;
  const overLimit = charCount > maxLength * 0.9;

  if (readonly) {
    return (
      <div
        className={cn('prose prose-sm max-w-none dark:prose-invert', className)}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-md border bg-background', className)}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <div className="flex justify-end border-t bg-muted/20 px-3 py-1.5">
        <span className={cn('text-xs text-muted-foreground', overLimit && 'font-semibold text-destructive')}>
          {charCount} / {maxLength}
        </span>
      </div>
    </div>
  );
}

export default RichTextEditor;
