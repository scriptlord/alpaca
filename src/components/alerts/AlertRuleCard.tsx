import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useAlertsStore } from '@/stores/alerts'
import { formatCondition } from '@/engine/condition-evaluator'
import { timeAgo } from '@/lib/format'
import type { AlertRule } from '@/lib/types'
import { Trash2 } from 'lucide-react'

export function AlertRuleCard({ rule }: { rule: AlertRule }) {
  const toggleRule = useAlertsStore((s) => s.toggleRule)
  const removeRule = useAlertsStore((s) => s.removeRule)

  return (
    <Card className={rule.active ? '' : 'opacity-60'}>
      <CardContent className="flex items-center justify-between p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{rule.symbol}</span>
            <div className="flex gap-1">
              {rule.channels.map((ch) => (
                <Badge key={ch} variant="secondary" className="text-[11px]">
                  {ch === 'in_app' ? 'App' : ch === 'telegram' ? 'TG' : 'Push'}
                </Badge>
              ))}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatCondition(rule)}
          </p>
          <p className="text-xs text-muted-foreground">
            Last triggered: {timeAgo(rule.lastTriggeredAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={rule.active}
            onCheckedChange={() => toggleRule(rule.id)}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeRule(rule.id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
