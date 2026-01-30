import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useWebSocket } from '@/hooks/useWebSocket'
import { formatDate, getRiskColor } from '@/lib/utils'
import { AlertCircle, TrendingUp, Clock, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { riskAPI } from '@/lib/api'
import { Trash2 } from 'lucide-react'

interface RiskUpdate {
    user_id: number
    session_id: string
    risk_score: number
    severity: string
    explanation?: string
    timestamp: string
}

export default function RiskMonitorPage() {
    const { subscribe, isConnected } = useWebSocket()
    const [riskUpdates, setRiskUpdates] = useState<RiskUpdate[]>([])
    const [filter, setFilter] = useState<string>('all')
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState({
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
    })

    // Fetch historical risk scores for demo user
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const response = await riskAPI.getUserRiskScores(1, { limit: 50 })
                if (response.data.success) {
                    const historical = response.data.data.map((r: any) => ({
                        user_id: r.user_id,
                        session_id: r.session_id,
                        risk_score: r.risk_score,
                        severity: getRiskSeverity(r.risk_score),
                        explanation: r.explanation,
                        timestamp: r.timestamp
                    }))
                    setRiskUpdates(historical)
                    updateStats(historical)
                }
            } catch (error) {
                console.error('Error fetching initial risk data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchInitialData()
    }, [])

    const updateStats = (updates: RiskUpdate[]) => {
        const newStats = updates.reduce((acc, u) => {
            acc.total++
            if (acc.hasOwnProperty(u.severity)) {
                acc[u.severity as keyof typeof acc]++
            }
            return acc
        }, { total: 0, critical: 0, high: 0, medium: 0, low: 0 })
        setStats(newStats)
    }

    const getRiskSeverity = (score: number) => {
        if (score >= 90) return 'critical'
        if (score >= 70) return 'high'
        if (score >= 40) return 'medium'
        return 'low'
    }

    useEffect(() => {
        if (!subscribe) return

        const unsubscribe = subscribe('risk_update', (data: any) => {
            console.log('Risk update received:', data)
            const update: RiskUpdate = {
                ...data.data,
                timestamp: data.timestamp,
            }

            setRiskUpdates((prev) => {
                const newUpdates = [update, ...prev].slice(0, 100)
                updateStats(newUpdates)
                return newUpdates
            })
        })

        return unsubscribe
    }, [subscribe])

    const filteredUpdates = riskUpdates.filter(update => {
        if (filter === 'all') return true
        return update.severity === filter
    })

    const getSeverityBadge = (severity: string) => {
        const variants: Record<string, any> = {
            critical: { class: 'bg-red-600 text-white', icon: '🔥' },
            high: { class: 'bg-orange-600 text-white', icon: '⚠️' },
            medium: { class: 'bg-yellow-600 text-white', icon: '⚡' },
            low: { class: 'bg-green-600 text-white', icon: '✓' },
        }
        const variant = variants[severity] || variants.medium
        return (
            <Badge className={variant.class}>
                {variant.icon} {severity.toUpperCase()}
            </Badge>
        )
    }

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Risk Monitor</h2>
                        <p className="text-gray-500 mt-1">Real-time risk score updates</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-gray-500 hover:text-red-600"
                            onClick={() => { setRiskUpdates([]); setStats({ total: 0, critical: 0, high: 0, medium: 0, low: 0 }) }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear
                        </Button>
                        {isConnected && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 animate-pulse">
                                <Clock className="w-3 h-3 mr-1" />
                                Live Feed
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
                        <CardContent className="pt-6">
                            <p className="text-sm text-gray-600">Total Updates</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-red-50 to-red-100 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter('critical')}>
                        <CardContent className="pt-6">
                            <p className="text-sm text-red-700">Critical</p>
                            <p className="text-2xl font-bold text-red-900">{stats.critical}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter('high')}>
                        <CardContent className="pt-6">
                            <p className="text-sm text-orange-700">High</p>
                            <p className="text-2xl font-bold text-orange-900">{stats.high}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter('medium')}>
                        <CardContent className="pt-6">
                            <p className="text-sm text-yellow-700">Medium</p>
                            <p className="text-2xl font-bold text-yellow-900">{stats.medium}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilter('low')}>
                        <CardContent className="pt-6">
                            <p className="text-sm text-green-700">Low</p>
                            <p className="text-2xl font-bold text-green-900">{stats.low}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Buttons */}
                <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Filter:</span>
                    {['all', 'critical', 'high', 'medium', 'low'].map((f) => (
                        <Button
                            key={f}
                            size="sm"
                            variant={filter === f ? 'default' : 'outline'}
                            onClick={() => setFilter(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </Button>
                    ))}
                </div>

                {/* Updates List */}
                {isLoading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="text-gray-500 mt-4">Loading historical risk data...</p>
                    </div>
                ) : filteredUpdates.length === 0 ? (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center">
                                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">
                                    {riskUpdates.length === 0 ? 'No risk updates yet' : 'No updates matching filter'}
                                </p>
                                <p className="text-gray-400 text-sm mt-2">
                                    {isConnected
                                        ? 'Updates will appear here in real-time as behavioral events are processed'
                                        : 'Connecting to real-time feed...'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filteredUpdates.map((update, index) => (
                            <Card
                                key={`${update.session_id}-${index}`}
                                className={`hover:shadow-lg transition-all transform hover:scale-[1.01] ${index === 0 && filter === 'all' ? 'ring-2 ring-purple-600 animate-pulse' : ''
                                    }`}
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <CardTitle className="text-lg">
                                                    User ID: {update.user_id}
                                                </CardTitle>
                                                {getSeverityBadge(update.severity)}
                                                {index === 0 && filter === 'all' && (
                                                    <Badge className="bg-purple-600 text-white">
                                                        ⚡ NEW
                                                    </Badge>
                                                )}
                                            </div>
                                            <CardDescription className="mt-1">
                                                Session: <span className="font-mono text-xs">{update.session_id.substring(0, 30)}...</span>
                                            </CardDescription>
                                        </div>
                                        <div className="text-right ml-4">
                                            <div className={`text-4xl font-bold ${getRiskColor(update.risk_score)}`}>
                                                {update.risk_score}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Risk Score</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                {update.explanation && (
                                    <CardContent>
                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <div className="flex items-start space-x-2">
                                                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900 mb-1">🔍 Risk Factors Detected:</p>
                                                    <p className="text-sm text-gray-700">{update.explanation}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                                            <span>{formatDate(update.timestamp)}</span>
                                            <span className="flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {Math.floor((Date.now() - new Date(update.timestamp).getTime()) / 1000)}s ago
                                            </span>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                    </div>
                )}

                {filteredUpdates.length > 10 && (
                    <div className="text-center">
                        <p className="text-sm text-gray-500">
                            Showing {filteredUpdates.length} updates • Click stat cards above to filter
                        </p>
                    </div>
                )}
            </div>
        </Layout>
    )
}
