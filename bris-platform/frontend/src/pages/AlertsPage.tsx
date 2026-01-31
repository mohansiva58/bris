import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { riskAPI } from '@/lib/api'
import { formatDate, getRiskBadgeVariant, getRiskColor } from '@/lib/utils'
import { AlertCircle, CheckCircle, Clock, Sparkles, X, BrainCircuit, Activity, ShieldCheck, History, Users, ChevronRight, Wifi } from 'lucide-react'
import { useWebSocket } from '@/hooks/useWebSocket'

export default function AlertsPage() {
    const [filter, setFilter] = useState<string>('all')
    const [selectedAlert, setSelectedAlert] = useState<any>(null)
    const [selectedUserAlerts, setSelectedUserAlerts] = useState<any[] | null>(null)
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

    // Group alerts by user
    const userGroups = alerts.reduce((acc: any, alert: any) => {
        const uid = alert.user_id
        if (!acc[uid]) {
            acc[uid] = {
                user_id: uid,
                full_name: alert.full_name,
                email: alert.email,
                latest: alert,
                all: [alert]
            }
        } else {
            acc[uid].all.push(alert)
            if (new Date(alert.created_at || alert.timestamp) > new Date(acc[uid].latest.created_at || acc[uid].latest.timestamp)) {
                acc[uid].latest = alert
            }
        }
        return acc
    }, {})

    const sortedGroups = Object.values(userGroups).sort((a: any, b: any) =>
        new Date(b.latest.created_at || b.latest.timestamp).getTime() - new Date(a.latest.created_at || a.latest.timestamp).getTime()
    )

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

                {/* USER ALERT HISTORY DRAWER */}
                {selectedUserAlerts && (
                    <div className="fixed inset-0 z-40 flex justify-end">
                        <div className="absolute inset-0 bg-black/20" onClick={() => setSelectedUserAlerts(null)} />
                        <div className="relative w-full max-w-lg bg-gray-50 h-screen shadow-xl animate-in slide-in-from-right overflow-y-auto border-l border-gray-200">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center space-x-2">
                                        <History className="w-5 h-5 text-gray-400" />
                                        <h3 className="font-bold text-gray-900">Alert History: {selectedUserAlerts[0]?.full_name || `User ${selectedUserAlerts[0]?.user_id}`}</h3>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedUserAlerts(null)}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {selectedUserAlerts.sort((a, b) => new Date(b.created_at || b.timestamp).getTime() - new Date(a.created_at || a.timestamp).getTime()).map((alert, idx) => (
                                        <Card key={idx} className="cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all" onClick={() => setSelectedAlert(alert)}>
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center space-x-2">
                                                        {getStatusIcon(alert.status)}
                                                        <p className="text-sm font-bold text-gray-900">{alert.title}</p>
                                                    </div>
                                                    <Badge variant={getRiskBadgeVariant(alert.severity)} className="text-[10px]">
                                                        {alert.severity.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-gray-500 italic line-clamp-2 mb-2">
                                                    {alert.explanation?.split('|')[0].replace('**SUMMARY:**', '').trim() || 'Behavioral anomaly detected.'}
                                                </p>
                                                <div className="flex justify-between items-center">
                                                    <p className="text-[10px] text-gray-400">{formatDate(alert.created_at || alert.timestamp)}</p>
                                                    <div className={`text-lg font-black ${getRiskColor(alert.risk_score)}`}>{alert.risk_score}</div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center">
                    <div>
                        <div className="flex items-center space-x-3">
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Security Alerts</h2>
                            {isConnected && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 animate-pulse">
                                    <Wifi className="w-3 h-3 mr-1" />
                                    Live Monitoring Active
                                </Badge>
                            )}
                        </div>
                        <p className="text-gray-500 mt-1">Behavioral threat management and investigation</p>
                    </div>
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                        {['all', 'open', 'investigating', 'resolved'].map((status) => (
                            <Button
                                key={status}
                                variant={filter === status ? 'secondary' : 'ghost'}
                                size="sm"
                                className={filter === status ? 'bg-white shadow-sm' : 'text-gray-500'}
                                onClick={() => setFilter(status)}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Button>
                        ))}
                    </div>
                </div>

                {sortedGroups.length === 0 ? (
                    <Card className="border-dashed border-2">
                        <CardContent className="py-20 text-center">
                            <ShieldCheck className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg font-bold">No security alerts discovered</p>
                            <p className="text-gray-400 text-sm mt-1">The system is actively scanning behavioral signatures.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedGroups.map((group: any) => (
                            <Card
                                key={group.user_id}
                                className="group border-none shadow-md ring-1 ring-gray-100 hover:ring-2 hover:ring-purple-500 transition-all bg-white cursor-pointer overflow-hidden"
                                onClick={() => setSelectedUserAlerts(group.all)}
                            >
                                <div className={`h-1.5 ${getRiskColor(group.latest.risk_score)} bg-current opacity-80`} />
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-purple-50 group-hover:border-purple-100 transition-colors">
                                                <Users className="w-6 h-6 text-gray-400 group-hover:text-purple-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-gray-900 leading-none">{group.full_name || `User ${group.user_id}`}</h4>
                                                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">{group.email || 'Internal User'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-3xl font-black tracking-tighter ${getRiskColor(group.latest.risk_score)}`}>
                                                {group.latest.risk_score}
                                            </div>
                                            <Badge variant={getRiskBadgeVariant(group.latest.severity)} className="text-[8px] py-0 px-1">
                                                {group.latest.severity.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 group-hover:bg-purple-50/30 group-hover:border-purple-100/50 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                                                    <AlertCircle className="w-3 h-3 mr-1 text-orange-500" />
                                                    Latest Flag
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-bold">{formatDate(group.latest.created_at || group.latest.timestamp)}</p>
                                            </div>
                                            <p className="text-xs text-gray-700 font-bold mb-1">{group.latest.title}</p>
                                            <p className="text-xs text-gray-500 italic line-clamp-2">
                                                "{group.latest.explanation?.split('|')[0].replace('**SUMMARY:**', '').trim() || 'Multiple behavioral triggers detected across sessions.'}"
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none font-black text-[10px]">
                                                    {group.all.length} ALERTS
                                                </Badge>
                                                {group.all.some((a: any) => a.status === 'open') && (
                                                    <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                                )}
                                            </div>
                                            <div className="flex items-center text-xs font-bold text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                Review User <ChevronRight className="w-4 h-4 ml-1" />
                                            </div>
                                        </div>
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
