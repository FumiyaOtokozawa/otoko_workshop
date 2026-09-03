import { useState, type FormEvent } from 'react'
import { parseTags } from '../domain/task'

type Props = {
  /** 追加できたら true、できなかったら false を返す */
  onAdd: (title: string, tags: string[]) => boolean
}

export function TaskForm({ onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const added = onAdd(title, parseTags(tagInput))
    if (!added) {
      setError('タイトルを入力してください')
      return
    }
    setTitle('')
    setTagInput('')
    setError(null)
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <input
        className="form__title"
        placeholder="やることを入力"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        aria-label="タスクのタイトル"
      />
      <input
        className="form__tags"
        placeholder="タグ（カンマ区切り）"
        value={tagInput}
        onChange={(event) => setTagInput(event.target.value)}
        aria-label="タグ"
      />
      <button type="submit" className="button">
        追加
      </button>
      {error !== null && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
