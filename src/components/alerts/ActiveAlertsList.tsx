import { useState } from 'react'
import { useAlertsStore } from '@/stores/alerts'
import { AlertRuleCard } from './AlertRuleCard'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function ActiveAlertsList({
  onCreateAlert,
}: {
  onCreateAlert: () => void
}) {
  const rules = useAlertsStore((s) => s.rules)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const filtered = rules.filter((r) => {
    if (filter === 'active') return r.active
    if (filter === 'inactive') return !r.active
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Alert Rules</h2>
        <Button size="sm" onClick={onCreateAlert}>
          <Plus className="mr-1 h-4 w-4" />
          Create Alert
        </Button>
      </div>

      <div className="flex gap-1">
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground">
            {rules.length === 0
              ? 'No alerts configured'
              : 'No matching alerts'}
          </p>
          {rules.length === 0 && (
            <Button variant="outline" className="mt-3" onClick={onCreateAlert}>
              Create your first alert
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((rule) => (
            <AlertRuleCard key={rule.id} rule={rule} />
          ))}
        </div>
      )}
    </div>
  )
}
