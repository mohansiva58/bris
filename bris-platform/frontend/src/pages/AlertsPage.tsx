import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { riskAPI } from '@/lib/api'
import { formatDate, getRiskBadgeVariant } from '@/lib/utils'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Wifi } from 'lucide-react'

export default function AlertsPage() {
    const [filter, setFilter] = useState<string>('all')
    const { isConnected, subscribe } = useWebSocket()
    const queryClient = useQueryClient()

    const { data: alertsData, refetch } = useQuery({
        queryKey: ['alerts', filter],
        queryFn: async () => {
            const params = filter !== 'all' ? { status: filter } : {}
            const response = await riskAPI.getAlerts(params)
            return response.data.data
        },
    })

    useEffect(() => {
        if (!subscribe) return

        const unsubscribe = subscribe('new_alert', (data: any) => {
            console.log('New alert received:', data)
            // Invalidate query to refetch
            queryClient.invalidateQueries({ queryKey: ['alerts'] })
        })

        return unsubscribe
    }, [subscribe, queryClient])

    const handleUpdateStatus = async (alertId: number, status: string) => {
        try {
            await riskAPI.updateAlertStatus(alertId, status)
            refetch()
        } catch (error) {
            console.error('Failed to update alert:', error)
        }
    }

    const alerts = alertsData || []

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'resolved':
                return <CheckCircle className="w-4 h-4 text-green-600" />
            case 'investigating':
                return <Clock className="w-4 h-4 text-blue-600" />
            default:
                return <AlertCircle className="w-4 h-4 text-orange-600" />
        }
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="flex items-center space-x-3">
                            <h2 className="text-3xl font-bold text-gray-900">Alerts</h2>
                            {isConnected && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 animate-pulse">
                                    <Wifi className="w-3 h-3 mr-1" />
                                    Live
                                </Badge>
                            )}
                        </div>
                        <p className="text-gray-500 mt-1">Manage and review risk alerts</p>
                    </div>
                    <div className="flex space-x-2">
                        {['all', 'open', 'investigating', 'resolved'].map((status) => (
                            <Button
                                key={status}
                                variant={filter === status ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter(status)}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Button>
                        ))}
                    </div>
                </div>

                {alerts.length === 0 ? (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center">
                                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No alerts found</p>
                                <p className="text-gray-400 text-sm mt-2">
                                    {filter === 'all'
                                        ? 'No alerts have been generated yet'
                                        : `No ${filter} alerts`}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {alerts.map((alert: any) => (
                            <Card key={alert.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                {getStatusIcon(alert.status)}
                                                <CardTitle className="text-lg">{alert.title}</CardTitle>
                                                <Badge variant={getRiskBadgeVariant(alert.severity)}>
                                                    {alert.severity.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <div className="space-y-2 text-sm text-gray-600">
                                                <p>
                                                    <span className="font-medium">User:</span> {alert.full_name || `User ${alert.user_id}`} ({alert.email || 'Anonymous'})
                                                </p>
                                                {alert.description && (
                                                    <p>
                                                        <span className="font-medium">Description:</span> {alert.description}
                                                    </p>
                                                )}
                                                {alert.explanation && (
                                                    <p>
                                                        <span className="font-medium">Explanation:</span> {alert.explanation}
                                                    </p>
                                                )}
                                                <p>
                                                    <span className="font-medium">Risk Score:</span>{' '}
                                                    <span className="font-bold text-red-600">{alert.risk_score}</span>
                                                </p>
                                                <p className="text-xs text-gray-400">{formatDate(alert.created_at || alert.timestamp)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex space-x-2">
                                        {alert.status === 'open' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleUpdateStatus(alert.id, 'investigating')}
                                                >
                                                    Start Investigation
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleUpdateStatus(alert.id, 'dismissed')}
                                                >
                                                    Dismiss
                                                </Button>
                                            </>
                                        )}
                                        {alert.status === 'investigating' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleUpdateStatus(alert.id, 'resolved')}
                                                >
                                                    Mark Resolved
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleUpdateStatus(alert.id, 'dismissed')}
                                                >
                                                    Dismiss
                                                </Button>
                                            </>
                                        )}
                                        {alert.status === 'resolved' && (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                ✓ Resolved
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    )
}
