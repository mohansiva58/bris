import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { riskAPI } from '@/lib/api'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Users, Activity, AlertTriangle, TrendingUp, Wifi, WifiOff, TrendingDown, Bell } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
    const { isConnected, subscribe } = useWebSocket()
    const [realtimeMetrics, setRealtimeMetrics] = useState<any>(null)
    const [riskHistory, setRiskHistory] = useState<any[]>([])
    const [recentAlerts, setRecentAlerts] = useState<any[]>([])
    const [eventHistory, setEventHistory] = useState<any[]>([])

    const { data: metrics, refetch } = useQuery({
        queryKey: ['dashboard-metrics'],
        queryFn: async () => {
            const response = await riskAPI.getDashboardMetrics()
            return response.data.data
        }
    })

    useEffect(() => {
        if (!subscribe) return

        // 1. Subscribe to real-time activity metrics
        const unsubscribeActivity = subscribe('user_activity', (data: any) => {
            console.log('Activity update:', data)
            setRealtimeMetrics((prev: any) => ({
                ...(prev || metrics || {}),
                ...data.data
            }))
        })

        // 2. Subscribe to new alerts (instant feed)
        const unsubscribeAlerts = subscribe('new_alert', (data: any) => {
            console.log('New alert for dashboard:', data)
            setRecentAlerts(prev => [data.data, ...prev].slice(0, 5))
            // Refresh counts
            refetch()
        })

        // 3. Subscribe to risk updates for live chart
        const unsubscribeRisk = subscribe('risk_update', (data: any) => {
            const newPoint = {
                time: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                score: data.data.risk_score,
                user: `User ${data.data.user_id}`,
            }
            setRiskHistory(prev => [...prev, newPoint].slice(-15))
        })

        return () => {
            unsubscribeActivity?.()
            unsubscribeAlerts?.()
            unsubscribeRisk?.()
        }
    }, [subscribe, metrics, refetch])

    // Fetch initial alerts
    useEffect(() => {
        riskAPI.getAlerts({ limit: 5 }).then(res => {
            setRecentAlerts(res.data.data)
        })
    }, [])

    // Generate event history demo
    useEffect(() => {
        if (eventHistory.length === 0) {
            const hours = Array.from({ length: 12 }, (_, i) => {
                const hour = new Date().getHours() - 11 + i
                return {
                    time: `${hour < 0 ? 24 + hour : hour}:00`,
                    events: Math.floor(Math.random() * 100) + 50,
                    alerts: Math.floor(Math.random() * 5),
                }
            })
            setEventHistory(hours)
        }
    }, [])

    const displayMetrics = realtimeMetrics || metrics || {
        active_users: 0,
        total_events_today: 0,
        average_risk_score: 0,
        high_risk_alerts: 0,
        critical_alerts: 0,
    }

    const stats = [
        {
            title: 'Active Users',
            value: displayMetrics.active_users,
            change: '+12%',
            trend: 'up',
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            title: 'Events Today',
            value: displayMetrics.total_events_today?.toLocaleString() || '0',
            change: '+24%',
            trend: 'up',
            icon: Activity,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            title: 'Average Risk Score',
            value: typeof displayMetrics.average_risk_score === 'number'
                ? displayMetrics.average_risk_score.toFixed(1)
                : parseFloat(displayMetrics.average_risk_score || '0').toFixed(1),
            change: '-5%',
            trend: 'down',
            icon: TrendingDown,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
        {
            title: 'Active Alerts',
            value: displayMetrics.high_risk_alerts || displayMetrics.alerts_count || 0,
            change: '+3',
            trend: 'up',
            icon: AlertTriangle,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
        },
    ]

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h2>
                        <p className="text-gray-500 mt-1">Real-time behavior analytics & risk monitoring</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {isConnected ? (
                            <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-xs font-semibold text-green-700 uppercase tracking-widest">Live System</span>
                            </div>
                        ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                                <WifiOff className="w-3 h-3 mr-1" />
                                Offline
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat) => {
                        const Icon = stat.icon
                        const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown
                        const trendColor = stat.trend === 'up' ? 'text-green-600' : 'text-red-500'

                        return (
                            <Card key={stat.title} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-gray-100">
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.title}</p>
                                            <p className="text-3xl font-extrabold text-gray-900 mt-1">{stat.value}</p>
                                        </div>
                                        <div className={`p-2.5 rounded-xl ${stat.bgColor} shadow-inner`}>
                                            <Icon className={`w-5 h-5 ${stat.color}`} />
                                        </div>
                                    </div>
                                    <div className="flex items-center mt-4 pt-4 border-t border-gray-50">
                                        <div className={`flex items-center ${trendColor} bg-${stat.trend === 'up' ? 'green' : 'red'}-50 px-2 py-0.5 rounded text-xs font-bold`}>
                                            <TrendIcon className="w-3 h-3 mr-1" />
                                            {stat.change}
                                        </div>
                                        <span className="text-[10px] font-semibold text-gray-400 ml-2 uppercase tracking-tighter">since last hour</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Charts Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Real-Time Risk Score Chart */}
                        <Card className="border-none shadow-sm ring-1 ring-gray-100">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle className="text-lg font-bold">Threat Activity Stream</CardTitle>
                                    <CardDescription>Live risk scores from active user sessions</CardDescription>
                                </div>
                                <Activity className="w-5 h-5 text-purple-500 opacity-50" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full mt-4">
                                    {riskHistory.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={riskHistory}>
                                                <defs>
                                                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                <XAxis
                                                    dataKey="time"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                                                />
                                                <YAxis
                                                    domain={[0, 100]}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                                                />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                />
                                                <Area
                                                    type="stepAfter"
                                                    dataKey="score"
                                                    stroke="#8b5cf6"
                                                    strokeWidth={3}
                                                    fillOpacity={1}
                                                    fill="url(#colorRisk)"
                                                    name="Risk Score"
                                                    animationDuration={500}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-100">
                                            <Activity className="w-10 h-10 text-gray-200 animate-pulse mb-3" />
                                            <p className="text-sm font-medium text-gray-400">Listening for behavioral streams...</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Event Volume Chart */}
                        <Card className="border-none shadow-sm ring-1 ring-gray-100">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-bold">Traffic & Anomaly History</CardTitle>
                                <CardDescription>Consolidated event volume over the last 12 hours</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[250px] w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={eventHistory}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                            <Tooltip />
                                            <Bar dataKey="events" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} name="Normal Events" />
                                            <Bar dataKey="alerts" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} name="Alerts" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar: New Alerts Feed */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-sm ring-1 ring-gray-100 h-full flex flex-col">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-extrabold uppercase tracking-widest text-gray-600">Live Alerts Feed</CardTitle>
                                    <Badge className="bg-red-100 text-red-600 hover:bg-red-100 border-none px-2 py-0 font-bold">{recentAlerts.length}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[640px]">
                                {recentAlerts.length > 0 ? (
                                    <div className="divide-y divide-gray-50">
                                        {recentAlerts.map((alert, idx) => (
                                            <div key={alert.id || idx} className="p-4 hover:bg-gray-50 transition-colors animate-in fade-in slide-in-from-right-4 duration-500">
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-1 p-1.5 rounded-lg ${alert.severity === 'critical' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                                        <AlertTriangle className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start">
                                                            <p className="text-sm font-bold text-gray-900 truncate">{alert.title}</p>
                                                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1 rounded shadow-sm">{alert.risk_score}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{alert.description || alert.explanation}</p>
                                                        <div className="flex items-center mt-2 space-x-2">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">User: {alert.user_id}</span>
                                                            <span className="text-[10px] text-gray-300">•</span>
                                                            <span className="text-[10px] text-gray-400">{new Date(alert.created_at || alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center">
                                        <Bell className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">No Recent Alerts</p>
                                    </div>
                                )}
                            </CardContent>
                            <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                                <button
                                    onClick={() => window.location.href = '/alerts'}
                                    className="w-full py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 hover:shadow-sm transition-all shadow-inner"
                                >
                                    View Full Alert Log
                                </button>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* System Status Banner */}
                <Card className="border-none shadow-sm ring-1 ring-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Activity className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inference Engine</p>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm font-extrabold text-gray-700 underline decoration-green-300 decoration-2">Active</span>
                                        <span className="text-[10px] font-bold text-green-600">99.8% Accuracy</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4 border-l border-gray-100 pl-6">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Users className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Collector Nodes</p>
                                    <p className="text-sm font-extrabold text-gray-700">4 Nodes Streaming</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4 border-l border-gray-100 pl-6">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Wifi className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Latency (Avg)</p>
                                    <p className="text-sm font-extrabold text-gray-700">22ms Response</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    )
}
