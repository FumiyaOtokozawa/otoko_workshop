import { useEffect, useMemo, useState } from 'react'
import {
  clearDoneTasks,
  createTask,
  emptyFilter,
  filterTasks,
  removeTask,
  summarize,
  toggleTask,
  type Task,
  type TaskFilter,
  type TaskStatus,
} from '../domain/task'
import { loadTasks, saveTasks } from '../storage'
import { TaskForm } from './TaskForm'
import { TaskList } from './TaskList'

const STATUS_TABS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'todo', label: '未完了' },
  { value: 'done', label: '完了' },
]

export function App() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks())
  const [filter, setFilter] = useState<TaskFilter>(emptyFilter)

  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  const visibleTasks = useMemo(() => filterTasks(tasks, filter), [tasks, filter])
  const summary = useMemo(() => summarize(tasks), [tasks])

  function handleAdd(title: string, tags: string[]): boolean {
    const created = createTask({ title, tags })
    if (created === null) {
      return false
    }
    setTasks((current) => [created, ...current])
    return true
  }

  return (
    <main className="app">
      <header className="app__header">
        <h1>Otoko Board</h1>
        <p className="app__summary">
          全 {summary.total} 件 / 未完了 {summary.todo} 件 / 完了 {summary.done} 件（
          {summary.donePercentage}%）
        </p>
      </header>

      <TaskForm onAdd={handleAdd} />

      <div className="toolbar">
        <div className="toolbar__tabs" role="tablist" aria-label="ステータス">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={filter.status === tab.value}
              className={filter.status === tab.value ? 'tab tab--active' : 'tab'}
              onClick={() => setFilter((current) => ({ ...current, status: tab.value }))}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="search"
          className="toolbar__search"
          placeholder="タイトル・タグで検索"
          value={filter.keyword}
          onChange={(event) =>
            setFilter((current) => ({ ...current, keyword: event.target.value }))
          }
        />

        <button
          type="button"
          className="button button--ghost"
          onClick={() => setTasks(clearDoneTasks)}
          disabled={summary.done === 0}
        >
          完了を消す
        </button>
      </div>

      <TaskList
        tasks={visibleTasks}
        onToggle={(id) => setTasks((current) => toggleTask(current, id))}
        onRemove={(id) => setTasks((current) => removeTask(current, id))}
      />
    </main>
  )
}
