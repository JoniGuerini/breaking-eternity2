import React, { createContext, useContext, useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"

export type NotificationType = "save" | "achievement" | "info"

export interface GameNotification {
    id: string
    title: string
    message: string
    date: number // timestamp
    read: boolean
    type: NotificationType
}

interface NotificationContextValue {
    notifications: GameNotification[]
    unreadCount: number
    addNotification: (title: string, message: string, type?: NotificationType) => void
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    clearAll: () => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function useNotification() {
    const ctx = useContext(NotificationContext)
    if (!ctx) throw new Error("useNotification must be used within NotificationProvider")
    return ctx
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<GameNotification[]>(() => {
        try {
            const saved = localStorage.getItem("breaking-eternity-notifications")
            return saved ? JSON.parse(saved) : []
        } catch {
            return []
        }
    })

    useEffect(() => {
        localStorage.setItem("breaking-eternity-notifications", JSON.stringify(notifications))
    }, [notifications])

    const unreadCount = notifications.filter((n) => !n.read).length

    function addNotification(title: string, message: string, type: NotificationType = "info") {
        const newNote: GameNotification = {
            id: uuidv4(),
            title,
            message,
            date: Date.now(),
            read: false,
            type,
        }
        setNotifications((prev) => [newNote, ...prev].slice(0, 50)) // Keep last 50
    }

    function markAsRead(id: string) {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        )
    }

    function markAllAsRead() {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }

    function clearAll() {
        setNotifications([])
    }

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                addNotification,
                markAsRead,
                markAllAsRead,
                clearAll,
            }}
        >
            {children}
        </NotificationContext.Provider>
    )
}
