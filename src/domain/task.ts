/**
 * タスクボードのドメインロジック。
 *
 * ここには React も localStorage も出てこない「純粋な関数」だけを置く。
 * 画面まわり（src/ui）とストレージ（src/storage.ts）から切り離してあるので、
 * ここに書いたロジックはすべて src/domain/task.test.ts でテストできる。
 */

export type TaskStatus = 'todo' | 'done'

export type Task = {
  id: string
  title: string
  status: TaskStatus
  tags: string[]
  /** ISO 8601 形式の作成日時 */
  createdAt: string
}

export type TaskFilter = {
  /** 'all' のときは status で絞り込まない */
  status: TaskStatus | 'all'
  /** タイトル・タグに対する部分一致キーワード。空文字なら絞り込まない */
  keyword: string
}

export const emptyFilter: TaskFilter = { status: 'all', keyword: '' }

export type TaskDraft = {
  title: string
  tags?: string[]
}

let sequence = 0

/** テストを安定させるための ID 採番リセット。テストからのみ使う。 */
export function resetIdSequence(): void {
  sequence = 0
}

function nextId(): string {
  sequence += 1
  return `task-${Date.now().toString(36)}-${sequence}`
}

/**
 * ドラフトから Task を1件つくる。
 * タイトルが空の場合は null を返す（呼び出し側でエラー表示する）。
 */
export function createTask(draft: TaskDraft, now: Date = new Date()): Task | null {
  if (draft.title.length === 0) {
    return null
  }
  return {
    id: nextId(),
    title: draft.title,
    status: 'todo',
    tags: draft.tags ?? [],
    createdAt: now.toISOString(),
  }
}

/** 指定 ID のタスクの完了/未完了を反転した新しい配列を返す。 */
export function toggleTask(tasks: Task[], id: string): Task[] {
  return tasks.map((task) =>
    task.id === id ? { ...task, status: task.status === 'done' ? 'todo' : 'done' } : task,
  )
}

/** 指定 ID のタスクを取り除いた新しい配列を返す。 */
export function removeTask(tasks: Task[], id: string): Task[] {
  return tasks.filter((task) => task.id !== id)
}

/** 完了済みのタスクをすべて取り除いた新しい配列を返す。 */
export function clearDoneTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.status !== 'done')
}

/** フィルタ条件にあてはまるタスクだけを返す。 */
export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  return tasks.filter((task) => {
    if (filter.status !== 'all' && task.status !== filter.status) {
      return false
    }
    if (filter.keyword === '') {
      return true
    }
    return (
      task.title.includes(filter.keyword) || task.tags.some((tag) => tag.includes(filter.keyword))
    )
  })
}

export type TaskSummary = {
  total: number
  todo: number
  done: number
  /** 0〜100 の整数。タスクが1件もないときは 0 */
  donePercentage: number
}

/** 件数と進捗率を集計する。 */
export function summarize(tasks: Task[]): TaskSummary {
  const total = tasks.length
  const done = tasks.filter((task) => task.status === 'done').length
  return {
    total,
    todo: total - done,
    done,
    donePercentage: total === 0 ? 0 : Math.round((done / total) * 100),
  }
}

/** カンマ区切り文字列をタグ配列に変換する。 */
export function parseTags(input: string): string[] {
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}
