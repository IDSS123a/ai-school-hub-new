import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useT } from '../../features/language/languageStore';

export type AIStatus = 'idle' | 'generating' | 'success' | 'error';

interface AIStatusIndicatorProps {
  status: AIStatus;
  message?: string;
  className?: string;
}

export function AIStatusIndicator({ status, message, className }: AIStatusIndicatorProps) {
  const t = useT();
  
  const config: Record<AIStatus, { icon: any; text: string; color: string; bg: string; animate?: string }> = {
    idle: {
      icon: Sparkles,
      text: t('ai.status.idle', 'AI spreman'),
      color: 'text-slate-400',
      bg: 'bg-slate-50',
    },
    generating: {
      icon: Loader2,
      text: t('ai.status.generating', 'AI generiše...'),
      color: 'text-secondary',
      bg: 'bg-secondary/5',
      animate: 'animate-spin',
    },
    success: {
      icon: CheckCircle2,
      text: t('ai.status.success', 'Generisano uspješno'),
      color: 'text-success',
      bg: 'bg-success/5',
    },
    error: {
      icon: AlertCircle,
      text: t('ai.status.error', 'Greška u generaciji'),
      color: 'text-destructive',
      bg: 'bg-destructive/5',
    },
  };

  const current = config[status];
  const Icon = current.icon;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
      current.bg,
      current.color,
      className
    )}>
      <Icon size={14} className={current.animate || ''} />
      <span>{message || current.text}</span>
      {status === 'generating' && (
        <span className="flex gap-0.5 ml-1">
          <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-1 h-1 rounded-full bg-current animate-bounce"></span>
        </span>
      )}
    </div>
  );
}
