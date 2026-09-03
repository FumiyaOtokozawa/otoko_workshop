/**
 * localStorage への保存・読み込み。
 * 壊れたデータが入っていても画面が落ちないように、読み込み時に必ず検証する。
 */
import type { Task } from './domain/task'

const STORAGE_KEY = 'otoko-board:tasks:v1'

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    (candidate.status === 'todo' || candidate.status === 'done') &&
    Array.isArray(candidate.tags) &&
    candidate.tags.every((tag) => typeof tag === 'string') &&
    typeof candidate.createdAt === 'string'
  )
}

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isTask)
  } catch {
    return []
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch {
    // 保存できなくてもアプリは動き続ける（シークレットウィンドウなど）
  }
}
