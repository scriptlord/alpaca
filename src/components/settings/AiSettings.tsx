import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { Language } from '@/api/ai-analysis'
import type { ExperienceMode } from '@/lib/types'
import { EXPERIENCE_MODE_KEY } from '@/lib/constants'

const LANG_KEY = 'preferred_language'

const languages: { value: Language; label: string; flag: string }[] = [
  { value: 'english', label: 'English', flag: '🇬🇧' },
  { value: 'pidgin', label: 'Pidgin', flag: '🇳🇬' },
  { value: 'yoruba', label: 'Yorùbá', flag: '🇳🇬' },
  { value: 'igbo', label: 'Igbo', flag: '🇳🇬' },
]

export function getPreferredLanguage(): Language {
  return (localStorage.getItem(LANG_KEY) as Language) ?? 'english'
}

export function getPreferredExperienceMode(): ExperienceMode {
  return (localStorage.getItem(EXPERIENCE_MODE_KEY) as ExperienceMode) ?? 'beginner'
}

export function AiSettings() {
  const [language, setLanguage] = useState<Language>(getPreferredLanguage())
  const [mode, setMode] = useState<ExperienceMode>(getPreferredExperienceMode())

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem(LANG_KEY, lang)
  }

  const handleModeChange = (m: ExperienceMode) => {
    setMode(m)
    localStorage.setItem(EXPERIENCE_MODE_KEY, m)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Select Experience Level</Label>
          <p className="text-xs text-muted-foreground">
            Controls how alerts and insights are explained to you
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={mode === 'beginner' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleModeChange('beginner')}
              className="flex-col items-start h-auto py-3 px-4 cursor-pointer"
            >
              <span className="font-medium">Beginner</span>
              <span className="text-xs font-normal opacity-70">Simple explanations</span>
            </Button>
            <Button
              variant={mode === 'pro' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleModeChange('pro')}
              className="flex-col items-start h-auto py-3 px-4 cursor-pointer"
            >
              <span className="font-medium">Pro</span>
              <span className="text-xs font-normal opacity-70">Data-driven, concise</span>
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label>Select Language</Label>
          <p className="text-xs text-muted-foreground">
            AI insights and Telegram messages will use this language
          </p>
          <div className="grid grid-cols-2 gap-2">
            {languages.map(({ value, label, flag }) => (
              <Button
                key={value}
                variant={language === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleLanguageChange(value)}
                className="justify-start cursor-pointer"
              >
                <span className="mr-2">{flag}</span>
                {label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
