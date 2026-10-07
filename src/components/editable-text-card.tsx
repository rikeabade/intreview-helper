"use client";

import { useState } from "react";
import { SafeMarkdown } from "@/components/safe-markdown";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocale } from "@/components/locale-provider";

export function EditableTextCard({
  content,
  onSave,
  placeholder,
  emptyText,
  markdown = false,
}: {
  content: string;
  onSave: (content: string) => Promise<void>;
  placeholder?: string;
  emptyText: string;
  markdown?: boolean;
}) {
  const { t } = useLocale();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setDraft(content);
    setError(null);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
      setEditing(false);
    } catch {
      setError(t.common.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div key="editing" className="fade-in-fast space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className="h-48"
          autoFocus
        />
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? t.common.saving : t.common.save}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
            {t.common.cancel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div key="viewing" className="fade-in-fast space-y-2">
      {content.trim() ? (
        markdown ? (
          <div className="max-h-96 overflow-y-auto prose prose-sm dark:prose-invert max-w-none pr-1">
            <SafeMarkdown>{content}</SafeMarkdown>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground max-h-56 overflow-y-auto whitespace-pre-wrap pr-1">
            {content}
          </div>
        )
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
      <Button size="sm" variant="outline" onClick={startEditing}>
        <Pencil className="size-3.5" />
        {t.common.edit}
      </Button>
    </div>
  );
}
