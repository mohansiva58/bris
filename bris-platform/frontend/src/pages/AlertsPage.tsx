import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { riskAPI } from '@/lib/api'
import { formatDate, getRiskBadgeVariant, getRiskColor } from '@/lib/utils'
import { AlertCircle, CheckCircle, Clock, Sparkles, X, BrainCircuit, Activity, ShieldCheck } from 'lucide-react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Wifi } from 'lucide-react'

export default function AlertsPage() {
    const [filter, setFilter] = useState<string>('all')
    const [selectedAlert, setSelectedAlert] = useState<any>(null)
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
            <div className="relative space-y-6">
                {/* AI FORENSIC PANEL (Slide-over) */}
                {selectedAlert && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedAlert(null)} />
                        <div className="relative w-full max-w-xl bg-white h-screen shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
                            <div className="p-6 h-full flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center space-x-2">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <BrainCircuit className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">AI forensic Alert Report</h3>
                                            <p className="text-sm text-gray-500">Alert ID: #{selectedAlert.id}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedAlert(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                        <X className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>

                                <div className="space-y-6 flex-1">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Alert Risk</p>
                                            <p className={`text-4xl font-extrabold mt-1 ${getRiskColor(selectedAlert.risk_score)}`}>{selectedAlert.risk_score}<span className="text-lg opacity-50">/100</span></p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Severity</p>
                                            <p className="text-2xl font-black text-gray-900 mt-2 uppercase">{selectedAlert.severity}</p>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-sm">
                                        <div className="flex items-center space-x-2 mb-4 text-indigo-700">
                                            <Activity className="w-5 h-5" />
                                            <h4 className="font-bold text-sm uppercase tracking-wider">Forensic Narrative</h4>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed text-sm italic">
                                            "{selectedAlert.explanation?.split('|')[0].replace('**SUMMARY:**', '').trim() || 'No narrative available for this historical alert.'}"
                                        </p>
                                    </div>

                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 shadow-sm">
                                        <div className="flex items-center space-x-2 mb-4 text-emerald-700">
                                            <ShieldCheck className="w-5 h-5" />
                                            <h4 className="font-bold text-sm uppercase tracking-wider">Mitigation Action Plan</h4>
                                        </div>
                                        <div className="space-y-3">
                                            {selectedAlert.explanation?.split('|')[1]?.replace('**MITIGATION:**', '').split(',').map((step: string, i: number) => (
                                                <div key={i} className="flex items-center space-x-3 text-emerald-900 bg-white/50 p-2 rounded-lg border border-emerald-50">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-sm font-semibold">{step.trim()}</span>
                                                </div>
                                            )) || <p className="text-xs text-gray-500">Standard protocols recommended.</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-sm font-bold h-12" onClick={() => { handleUpdateStatus(selectedAlert.id, 'investigating'); setSelectedAlert(null); }}>
                                        Move to Investigation
                                    </Button>
                                    <Button variant="outline" className="w-full h-12 font-bold" onClick={() => setSelectedAlert(null)}>
                                        Close Report
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {alerts.map((alert: any) => (
                            <Card key={alert.id} className="hover:shadow-md transition-shadow ring-1 ring-gray-100 border-none">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                {getStatusIcon(alert.status)}
                                                <CardTitle className="text-lg font-bold">{alert.title}</CardTitle>
                                                <Badge variant={getRiskBadgeVariant(alert.severity)}>
                                                    {alert.severity.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <div className="space-y-1 text-sm text-gray-600">
                                                <p><span className="font-semibold text-gray-400 uppercase text-[10px]">User:</span> {alert.full_name || `User ${alert.user_id}`} ({alert.email || 'Anonymous'})</p>
                                                <p><span className="font-semibold text-gray-400 uppercase text-[10px]">Score:</span> <span className="font-bold text-red-600">{alert.risk_score}</span></p>
                                                <p className="text-xs text-gray-400">{formatDate(alert.created_at || alert.timestamp)}</p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => setSelectedAlert(alert)}
                                            className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none font-bold text-xs"
                                        >
                                            <Sparkles className="w-3 h-3 mr-1" />
                                            Deep Insight
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex space-x-2">
                                        {alert.status === 'open' && (
                                            <>
                                                <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(alert.id, 'investigating')}>Start Investigation</Button>
                                                <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(alert.id, 'dismissed')}>Dismiss</Button>
                                            </>
                                        )}
                                        {alert.status === 'investigating' && (
                                            <>
                                                <Button size="sm" onClick={() => handleUpdateStatus(alert.id, 'resolved')}>Mark Resolved</Button>
                                                <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(alert.id, 'dismissed')}>Dismiss</Button>
                                            </>
                                        )}
                                        {alert.status === 'resolved' && (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">✓ Resolved</Badge>
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
