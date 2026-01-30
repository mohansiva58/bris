import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { riskAPI } from '@/lib/api'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Users, Activity, AlertTriangle, TrendingUp, Wifi, WifiOff, TrendingDown } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function DashboardPage() {
    const { isConnected, subscribe } = useWebSocket()
    const [realtimeMetrics, setRealtimeMetrics] = useState<any>(null)
    const [riskHistory, setRiskHistory] = useState<any[]>([])
    const [eventHistory, setEventHistory] = useState<any[]>([])

    const { data: metrics, refetch } = useQuery({
        queryKey: ['dashboard-metrics'],
        queryFn: async () => {
            const response = await riskAPI.getDashboardMetrics()
            return response.data.data
        },
        refetchInterval: 10000, // Refetch every 10 seconds
    })

    useEffect(() => {
        if (!subscribe) return

        // Subscribe to real-time updates
        const unsubscribe = subscribe('user_activity', (data: any) => {
            console.log('Real-time update:', data)
            setRealtimeMetrics((prev: any) => ({
                ...(prev || metrics || {}),
                ...data.data
            }))
            refetch()
        })

        // Subscribe to risk updates for chart
        const unsubscribeRisk = subscribe('risk_update', (data: any) => {
            const newPoint = {
                time: new Date(data.timestamp).toLocaleTimeString(),
                score: data.data.risk_score,
                user: data.data.user_id,
            }
            setRiskHistory(prev => [...prev, newPoint].slice(-20)) // Keep last 20 points
        })

        return () => {
            unsubscribe?.()
            unsubscribeRisk?.()
        }
    }, [subscribe, refetch])

    // Generate mock historical data for demo
    useEffect(() => {
        if (eventHistory.length === 0) {
            const hours = Array.from({ length: 12 }, (_, i) => {
                const hour = new Date().getHours() - 11 + i
                return {
                    time: `${hour}:00`,
                    events: Math.floor(Math.random() * 100) + 50,
                    alerts: Math.floor(Math.random() * 10),
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
            value: displayMetrics.average_risk_score?.toFixed(1) || '0.0',
            change: '-5%',
            trend: 'down',
            icon: TrendingDown,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
        {
            title: 'High Risk Alerts',
            value: displayMetrics.high_risk_alerts,
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
                        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
                        <p className="text-gray-500 mt-1">Real-time behavioral risk monitoring</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {isConnected ? (
                            <>
                                <Wifi className="w-5 h-5 text-green-600 animate-pulse" />
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Live
                                </Badge>
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-5 h-5 text-gray-400" />
                                <Badge variant="outline" className="text-gray-500">
                                    Disconnected
                                </Badge>
                            </>
                        )}
                    </div>
                </div>

                {/* Stats Grid with Trends */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat) => {
                        const Icon = stat.icon
                        const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown
                        const trendColor = stat.trend === 'up' ? 'text-green-600' : 'text-red-600'

                        return (
                            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                            <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                                        </div>
                                        <div className={`p-3 rounded-full ${stat.bgColor}`}>
                                            <Icon className={`w-6 h-6 ${stat.color}`} />
                                        </div>
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <TrendIcon className={`w-4 h-4 mr-1 ${trendColor}`} />
                                        <span className={trendColor}>{stat.change}</span>
                                        <span className="text-gray-500 ml-2">vs last hour</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {/* Critical Alerts */}
                {displayMetrics.critical_alerts > 0 && (
                    <Card className="border-red-200 bg-red-50 animate-pulse">
                        <CardHeader>
                            <CardTitle className="text-red-800 flex items-center">
                                <AlertTriangle className="w-5 h-5 mr-2" />
                                Critical Alerts Require Immediate Attention
                            </CardTitle>
                            <CardDescription className="text-red-600">
                                {displayMetrics.critical_alerts} critical risk alert
                                {displayMetrics.critical_alerts > 1 ? 's' : ''} detected - automatic lockout initiated
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Real-Time Risk Score Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Real-Time Risk Scores</CardTitle>
                            <CardDescription>Live risk score updates (last 20)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {riskHistory.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={riskHistory}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="score"
                                            stroke="#8b5cf6"
                                            strokeWidth={2}
                                            dot={{ fill: '#8b5cf6', r: 4 }}
                                            activeDot={{ r: 6 }}
                                            name="Risk Score"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[250px] flex items-center justify-center text-gray-400">
                                    <div className="text-center">
                                        <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>Waiting for risk updates...</p>
                                        <p className="text-sm mt-1">Data will appear here in real-time</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Event Volume Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Event Volume (Last 12 Hours)</CardTitle>
                            <CardDescription>Behavioral events and alerts over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={eventHistory}>
                                    <defs>
                                        <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="events"
                                        stroke="#10b981"
                                        fillOpacity={1}
                                        fill="url(#colorEvents)"
                                        name="Events"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="alerts"
                                        stroke="#f59e0b"
                                        fillOpacity={1}
                                        fill="url(#colorAlerts)"
                                        name="Alerts"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* System Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>System Status</CardTitle>
                        <CardDescription>Platform health and performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Backend API</span>
                                    <p className="text-xs text-gray-500 mt-1">Response: 45ms</p>
                                </div>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    ✓ Healthy
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div>
                                    <span className="text-sm font-medium text-gray-700">ML Service</span>
                                    <p className="text-xs text-gray-500 mt-1">Latency: 120ms</p>
                                </div>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    ✓ Healthy
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div>
                                    <span className="text-sm font-medium text-gray-700">WebSocket</span>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {isConnected ? 'Connected' : 'Connecting...'}
                                    </p>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={
                                        isConnected
                                            ? 'bg-green-50 text-green-700 border-green-200'
                                            : 'bg-gray-50 text-gray-500 border-gray-200'
                                    }
                                >
                                    {isConnected ? '✓ Connected' : '⊘ Disconnected'}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                View All Alerts
                            </button>
                            <button className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                                📊 Generate Report
                            </button>
                            <button className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                                📥 Export Data (CSV)
                            </button>
                            <button className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                                📧 Email Summary
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    )
}
