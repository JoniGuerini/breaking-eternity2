import { Bell, CheckCheck, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useNotification, type GameNotification } from "@/context/NotificationContext"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { format, type Locale } from "date-fns"
import { ptBR, enUS } from "date-fns/locale"
import { cn } from "@/lib/utils"

export function NotificationCenter() {
    const { t, i18n } = useTranslation()
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotification()
    const dateLocale = i18n.language === "en" ? enUS : ptBR

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background" />
                    )}
                    <span className="sr-only">{t("notifications.title")}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{t("notifications.title")}</h4>
                        {unreadCount > 0 && (
                            <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full font-mono">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title={t("notifications.markAllRead")}
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0}
                        >
                            <CheckCheck className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            title={t("notifications.clearHistory")}
                            onClick={clearAll}
                            disabled={notifications.length === 0}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mb-3 opacity-20" />
                            <p className="text-sm">{t("notifications.empty")}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification, index) => (
                                <div key={notification.id}>
                                    <NotificationItem
                                        notification={notification}
                                        dateLocale={dateLocale}
                                        onClick={() => markAsRead(notification.id)}
                                        onMouseEnter={() => !notification.read && markAsRead(notification.id)}
                                    />
                                    {index < notifications.length - 1 && <Separator />}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}

function NotificationItem({
    notification,
    dateLocale,
    onClick,
    onMouseEnter,
}: {
    notification: GameNotification
    dateLocale: Locale
    onClick: () => void
    onMouseEnter?: () => void
}) {
    return (
        <button
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            className={cn(
                "w-full text-left px-4 py-3 transition-colors hover:bg-muted/50 flex gap-3 items-start group",
                !notification.read && "bg-primary/5 hover:bg-primary/10"
            )}
        >
            <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                    <p
                        className={cn(
                            "text-sm font-medium leading-none",
                            !notification.read && "text-primary"
                        )}
                    >
                        {notification.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                        {format(notification.date, "HH,mm", { locale: dateLocale })}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                </p>
            </div>
            {!notification.read && (
                <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
            )}
        </button>
    )
}
