import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseWebSocketOptions {
    url?: string
    autoConnect?: boolean
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
    const { url = 'http://localhost:3000', autoConnect = true } = options
    const [isConnected, setIsConnected] = useState(false)
    const socketRef = useRef<Socket | null>(null)

    useEffect(() => {
        if (!autoConnect) return

        // Initialize socket
        socketRef.current = io(url, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        })

        const socket = socketRef.current

        // Connection handlers
        socket.on('connect', () => {
            console.log('✅ WebSocket connected')
            setIsConnected(true)
            socket.emit('join-dashboard')
        })

        socket.on('disconnect', () => {
            console.log('❌ WebSocket disconnected')
            setIsConnected(false)
        })

        socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error)
        })

        // Cleanup
        return () => {
            socket.disconnect()
        }
    }, [url, autoConnect])

    const subscribe = (event: string, handler: (...args: any[]) => void) => {
        if (!socketRef.current) return

        socketRef.current.on(event, handler)

        return () => {
            socketRef.current?.off(event, handler)
        }
    }

    const emit = (event: string, ...args: any[]) => {
        socketRef.current?.emit(event, ...args)
    }

    return { isConnected, subscribe, emit, socket: socketRef.current }
}
