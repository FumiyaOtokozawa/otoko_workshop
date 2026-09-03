import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearDoneTasks,
  createTask,
  emptyFilter,
  filterTasks,
  parseTags,
  removeTask,
  resetIdSequence,
  summarize,
  toggleTask,
  type Task,
} from './task'

beforeEach(() => {
  resetIdSequence()
})

function task(partial: Partial<Task> & { id: string; title: string }): Task {
  return {
    status: 'todo',
    tags: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

describe('createTask', () => {
  it('タイトルとタグを持つ未完了タスクをつくる', () => {
    const created = createTask({ title: '議事録をまとめる', tags: ['docs'] })
    expect(created).not.toBeNull()
    expect(created?.title).toBe('議事録をまとめる')
    expect(created?.status).toBe('todo')
    expect(created?.tags).toEqual(['docs'])
  })

  it('タイトルが空文字なら null を返す', () => {
    expect(createTask({ title: '' })).toBeNull()
  })

  it('毎回ちがう ID を採番する', () => {
    const a = createTask({ title: 'A' })
    const b = createTask({ title: 'B' })
    expect(a?.id).not.toBe(b?.id)
  })
})

describe('toggleTask', () => {
  it('未完了を完了に変える', () => {
    const tasks = [task({ id: '1', title: 'A' })]
    expect(toggleTask(tasks, '1')[0]?.status).toBe('done')
  })

  it('完了を未完了に戻す', () => {
    const tasks = [task({ id: '1', title: 'A', status: 'done' })]
    expect(toggleTask(tasks, '1')[0]?.status).toBe('todo')
  })

  it('元の配列を書き換えない', () => {
    const tasks = [task({ id: '1', title: 'A' })]
    toggleTask(tasks, '1')
    expect(tasks[0]?.status).toBe('todo')
  })
})

describe('removeTask / clearDoneTasks', () => {
  it('指定した ID のタスクだけを取り除く', () => {
    const tasks = [task({ id: '1', title: 'A' }), task({ id: '2', title: 'B' })]
    expect(removeTask(tasks, '1').map((t) => t.id)).toEqual(['2'])
  })

  it('完了済みをまとめて取り除く', () => {
    const tasks = [
      task({ id: '1', title: 'A', status: 'done' }),
      task({ id: '2', title: 'B' }),
      task({ id: '3', title: 'C', status: 'done' }),
    ]
    expect(clearDoneTasks(tasks).map((t) => t.id)).toEqual(['2'])
  })
})

describe('filterTasks', () => {
  const tasks = [
    task({ id: '1', title: '請求書を送る', tags: ['keiri'] }),
    task({ id: '2', title: '設計レビュー', status: 'done', tags: ['dev'] }),
    task({ id: '3', title: '請求フローの確認', tags: ['keiri', 'dev'] }),
  ]

  it('条件が空なら全件返す', () => {
    expect(filterTasks(tasks, emptyFilter)).toHaveLength(3)
  })

  it('ステータスで絞り込む', () => {
    expect(filterTasks(tasks, { ...emptyFilter, status: 'todo' }).map((t) => t.id)).toEqual([
      '1',
      '3',
    ])
  })

  it('キーワードでタイトルを部分一致検索する', () => {
    expect(filterTasks(tasks, { ...emptyFilter, keyword: '請求' }).map((t) => t.id)).toEqual([
      '1',
      '3',
    ])
  })

  it('キーワードでタグも検索する', () => {
    expect(filterTasks(tasks, { ...emptyFilter, keyword: 'dev' }).map((t) => t.id)).toEqual([
      '2',
      '3',
    ])
  })

  it('ステータスとキーワードを同時に使える', () => {
    const result = filterTasks(tasks, { status: 'todo', keyword: 'dev' })
    expect(result.map((t) => t.id)).toEqual(['3'])
  })
})

describe('summarize', () => {
  it('件数と進捗率を計算する', () => {
    const tasks = [
      task({ id: '1', title: 'A', status: 'done' }),
      task({ id: '2', title: 'B' }),
      task({ id: '3', title: 'C' }),
      task({ id: '4', title: 'D' }),
    ]
    expect(summarize(tasks)).toEqual({ total: 4, todo: 3, done: 1, donePercentage: 25 })
  })

  it('タスクが0件でも壊れない', () => {
    expect(summarize([])).toEqual({ total: 0, todo: 0, done: 0, donePercentage: 0 })
  })
})

describe('parseTags', () => {
  it('カンマ区切りを配列にして前後の空白を落とす', () => {
    expect(parseTags(' dev , keiri ')).toEqual(['dev', 'keiri'])
  })

  it('空の要素は無視する', () => {
    expect(parseTags('dev,,')).toEqual(['dev'])
  })
})
