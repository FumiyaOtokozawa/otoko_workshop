// Astryx の部品が、この箱の中で呼び出せることを確かめる見本ページ。
// 起動: npm run demo → http://localhost:5174
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Theme } from '@astryxdesign/core/theme'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Stack } from '@astryxdesign/core/Stack'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Banner } from '@astryxdesign/core/Banner'
import { Card } from '@astryxdesign/core/Card'
import { Switch } from '@astryxdesign/core/Switch'
import { TextInput } from '@astryxdesign/core/TextInput'
import { Avatar } from '@astryxdesign/core/Avatar'
import { ProgressBar } from '@astryxdesign/core/ProgressBar'
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl'
import { neutralTheme } from '@astryxdesign/theme-neutral/built'
import { butterTheme } from '@astryxdesign/theme-butter/built'
import { chocolateTheme } from '@astryxdesign/theme-chocolate/built'
import { matchaTheme } from '@astryxdesign/theme-matcha/built'
import { stoneTheme } from '@astryxdesign/theme-stone/built'
import { gothicTheme } from '@astryxdesign/theme-gothic/built'
import { y2kTheme } from '@astryxdesign/theme-y2k/built'
import './styles.css'

const THEMES = {
  neutral: neutralTheme,
  butter: butterTheme,
  chocolate: chocolateTheme,
  matcha: matchaTheme,
  stone: stoneTheme,
  gothic: gothicTheme,
  y2k: y2kTheme,
}

function Demo() {
  // URL の ?theme=gothic で最初のテーマを選べる（画面の写真を撮るため）
  const initial = new URLSearchParams(location.search).get('theme') ?? 'neutral'
  const [themeName, setThemeName] = useState(THEMES[initial] ? initial : 'neutral')
  const [name, setName] = useState('')
  const [notify, setNotify] = useState(true)

  return (
    <Theme theme={THEMES[themeName]}>
      <div style={{ padding: 32, minHeight: '100vh', background: 'var(--color-background-body)' }}>
        <Stack gap={6}>
          <Stack gap={2}>
            <Heading level={1}>Astryx 部品の見本</Heading>
            <Text type="supporting">
              174 個の部品のうち、よく使うものを並べています。上のボタンでテーマを切り替えられます。
            </Text>
          </Stack>

          <SegmentedControl label="テーマ" value={themeName} onChange={setThemeName}>
            {Object.keys(THEMES).map((key) => (
              <SegmentedControlItem key={key} value={key} label={key} />
            ))}
          </SegmentedControl>

          <Banner
            status="success"
            title="部品の読み込みに成功しました"
            description={`いまのテーマ: ${themeName}`}
          />

          <Stack direction="horizontal" gap={3}>
            <Button variant="primary" label="保存する" />
            <Button label="キャンセル" />
            <Button variant="ghost" label="あとで" />
            <Button variant="destructive" label="削除" />
          </Stack>

          <Stack direction="horizontal" gap={2}>
            <Badge variant="success" label="完了" />
            <Badge variant="warning" label="確認待ち" />
            <Badge variant="error" label="失敗" />
            <Badge variant="purple" label="デザイン" />
            <Badge variant="teal" label="開発" />
          </Stack>

          <Card>
            <Stack gap={4}>
              <Stack direction="horizontal" gap={3}>
                <Avatar name="Otoko Board" size="lg" />
                <Stack gap={1}>
                  <Heading level={3}>タスクボード</Heading>
                  <Text type="supporting">カード・入力欄・スイッチ・進み具合の例</Text>
                </Stack>
              </Stack>
              <TextInput
                label="名前"
                value={name}
                onChange={setName}
                description="ここに入力できます"
              />
              <Switch label="通知を受け取る" value={notify} onChange={setNotify} />
              <ProgressBar label="進み具合" value={64} />
            </Stack>
          </Card>
        </Stack>
      </div>
    </Theme>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
)
