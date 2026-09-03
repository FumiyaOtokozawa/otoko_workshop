import type { Task } from '../domain/task'

type Props = {
  tasks: Task[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

export function TaskList({ tasks, onToggle, onRemove }: Props) {
  if (tasks.length === 0) {
    return <p className="empty">表示できるタスクがありません。</p>
  }

  return (
    <ul className="list">
      {tasks.map((task) => (
        <li key={task.id} className={task.status === 'done' ? 'item item--done' : 'item'}>
          <label className="item__label">
            <input
              type="checkbox"
              checked={task.status === 'done'}
              onChange={() => onToggle(task.id)}
            />
            <span className="item__title">{task.title}</span>
          </label>
          <span className="item__tags">
            {task.tags.map((tag) => (
              <span key={tag} className="chip">
                {tag}
              </span>
            ))}
          </span>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => onRemove(task.id)}
            aria-label={`${task.title} を削除`}
          >
            削除
          </button>
        </li>
      ))}
    </ul>
  )
}
