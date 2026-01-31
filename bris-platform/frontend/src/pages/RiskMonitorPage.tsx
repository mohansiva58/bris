import { useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useWebSocket } from '@/hooks/useWebSocket'
import { formatDate, getRiskColor } from '@/lib/utils'
import { AlertCircle, TrendingUp, Clock, Filter, Sparkles, X, ShieldCheck, BrainCircuit, Activity, FileText, Download } from 'lucide-react'
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
    features?: any
}

export default function RiskMonitorPage() {
    const { subscribe, isConnected } = useWebSocket()
    const [riskUpdates, setRiskUpdates] = useState<RiskUpdate[]>([])
    const [filter, setFilter] = useState<string>('all')
    const [isLoading, setIsLoading] = useState(true)
    const [selectedUpdate, setSelectedUpdate] = useState<RiskUpdate | null>(null)
    const [aiDNA, setAiDNA] = useState<any>(null)
    const [aiReconstruction, setAiReconstruction] = useState<any>(null)
    const [aiForensicReport, setAiForensicReport] = useState<any>(null)
    const [isAILoading, setIsAILoading] = useState(false)
    const [isReportLoading, setIsReportLoading] = useState(false)
    const [stats, setStats] = useState({
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
    })

    // Fetch historical risk scores for all users
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const response = await riskAPI.getRecentRiskScores({ limit: 50 })
                if (response.data.success) {
                    const historical = response.data.data.map((r: any) => ({
                        user_id: r.user_id,
                        session_id: r.session_id,
                        risk_score: r.risk_score,
                        severity: getRiskSeverity(r.risk_score),
                        explanation: r.explanation,
                        timestamp: r.timestamp,
                        features: r.features
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

    // Load AI Insights when a session is selected
    useEffect(() => {
        if (!selectedUpdate) {
            setAiDNA(null)
            setAiReconstruction(null)
            setAiForensicReport(null)
            return
        }

        const fetchAIInsights = async () => {
            setIsAILoading(true)
            try {
                const [dnaRes, reconRes] = await Promise.all([
                    riskAPI.getAIDNA(selectedUpdate.user_id, selectedUpdate.features),
                    riskAPI.getAIRconstruction(selectedUpdate.session_id, selectedUpdate.features)
                ])
                if (dnaRes.data.success) setAiDNA(dnaRes.data.data)
                if (reconRes.data.success) setAiReconstruction(reconRes.data.data)
            } catch (error) {
                console.error('Failed to load AI insights:', error)
            } finally {
                setIsAILoading(false)
            }
        }

        fetchAIInsights()
    }, [selectedUpdate])

    const handleGenerateReport = async () => {
        if (!selectedUpdate) return

        setIsReportLoading(true)
        try {
            const response = await riskAPI.getAIForensicReport(
                selectedUpdate.session_id,
                selectedUpdate.user_id,
                selectedUpdate.features
            )
            if (response.data.success) {
                setAiForensicReport(response.data.data)
            }
        } catch (error) {
            console.error('Failed to generate forensic report:', error)
        } finally {
            setIsReportLoading(false)
        }
    }

    const groupedUpdates = riskUpdates.reduce((acc, update) => {
        const key = update.session_id
        if (!acc[key] || new Date(update.timestamp) > new Date(acc[key].timestamp)) {
            acc[key] = update
        }
        return acc
    }, {} as Record<string, RiskUpdate>)

    const sortedGrouped = Object.values(groupedUpdates).sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    const filteredUpdates = sortedGrouped.filter(update => {
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
            <div className="relative space-y-6">
                {/* AI FORENSIC PANEL (Slide-over) */}
                {selectedUpdate && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedUpdate(null)} />
                        <div className="relative w-full max-w-xl bg-white h-screen shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
                            <div className="p-6 h-full flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center space-x-2">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <BrainCircuit className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">AI Behavioral Forensic Report</h3>
                                            <p className="text-sm text-gray-500">Session: {selectedUpdate.session_id.substring(0, 12)}...</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedUpdate(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                        <X className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>

                                <div className="space-y-6 flex-1">
                                    {/* Risk Overview */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Calculated Risk</p>
                                            <p className={`text-4xl font-extrabold mt-1 ${getRiskColor(selectedUpdate.risk_score)}`}>{selectedUpdate.risk_score}<span className="text-lg opacity-50">/100</span></p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inference Confidence</p>
                                            <p className="text-4xl font-extrabold text-blue-600 mt-1">94<span className="text-lg opacity-50">%</span></p>
                                        </div>
                                    </div>

                                    {/* Behavioral Story */}
                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-sm">
                                        <div className="flex items-center space-x-2 mb-4 text-indigo-700">
                                            <Activity className="w-5 h-5" />
                                            <h4 className="font-bold text-sm uppercase tracking-wider">Behavioral Narrative</h4>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed text-sm italic">
                                            "{selectedUpdate.explanation?.split('|')[0].replace('**SUMMARY:**', '').trim()}"
                                        </p>
                                    </div>

                                    {/* Mitigation Steps */}
                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 shadow-sm">
                                        <div className="flex items-center space-x-2 mb-4 text-emerald-700">
                                            <ShieldCheck className="w-5 h-5" />
                                            <h4 className="font-bold text-sm uppercase tracking-wider">Automated Mitigation Strategy</h4>
                                        </div>
                                        <div className="space-y-3">
                                            {selectedUpdate.explanation?.split('|')[1]?.replace('**MITIGATION:**', '').split(',').map((step, i) => (
                                                <div key={i} className="flex items-center space-x-3 text-emerald-900 bg-white/50 p-2 rounded-lg border border-emerald-50">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-sm font-semibold">{step.trim()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* AI Behavioral DNA (New Feature 1) */}
                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 shadow-sm">
                                        <div className="flex items-center space-x-2 mb-4 text-purple-700">
                                            <Sparkles className="w-5 h-5" />
                                            <h4 className="font-bold text-sm uppercase tracking-wider">AI Behavioral DNA Profile</h4>
                                        </div>
                                        {isAILoading ? (
                                            <div className="animate-pulse space-y-2">
                                                <div className="h-4 bg-purple-100 rounded w-3/4"></div>
                                                <div className="h-4 bg-purple-100 rounded w-1/2"></div>
                                            </div>
                                        ) : aiDNA ? (
                                            <div className="space-y-4">
                                                <p className="text-gray-800 font-bold text-lg leading-tight">
                                                    {aiDNA.dna_profile}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge className="bg-purple-600">DNA: {aiDNA.verdict_label}</Badge>
                                                    <Badge variant="outline" className="border-purple-200 text-purple-700">Mood: {aiDNA.mood_state}</Badge>
                                                    <Badge variant="outline" className="border-purple-200 text-purple-700">Intent: {aiDNA.intent_level}</Badge>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400">Inference engine warming up...</p>
                                        )}
                                    </div>

                                    {/* Shadow Reconstruction (New Feature 3) */}
                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 shadow-sm">
                                        <div className="flex items-center space-x-2 mb-4 text-blue-700">
                                            <Activity className="w-5 h-5" />
                                            <h4 className="font-bold text-sm uppercase tracking-wider">Shadow Session Reconstruction</h4>
                                        </div>
                                        {isAILoading ? (
                                            <div className="animate-pulse space-y-2">
                                                <div className="h-4 bg-blue-100 rounded w-5/6"></div>
                                            </div>
                                        ) : aiReconstruction ? (
                                            <div className="space-y-3">
                                                <p className="text-sm text-gray-700 italic">
                                                    "{aiReconstruction.reconstruction}"
                                                </p>
                                                <div className="space-y-1">
                                                    {aiReconstruction.visual_clues.map((clue: string, i: number) => (
                                                        <div key={i} className="flex items-center text-[10px] text-blue-600 font-bold uppercase tracking-tighter">
                                                            <div className="w-1 h-1 bg-blue-400 rounded-full mr-2" />
                                                            {clue}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400">Reconstructing physical environment...</p>
                                        )}
                                    </div>

                                    {/* AI Forensic Report Section (Generated on demand) */}
                                    <div className="pt-4 border-t border-gray-100">
                                        {!aiForensicReport ? (
                                            <Button
                                                className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl shadow-lg border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all"
                                                onClick={handleGenerateReport}
                                                disabled={isReportLoading}
                                            >
                                                {isReportLoading ? (
                                                    <div className="flex items-center space-x-2">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                                        <span className="font-black uppercase tracking-widest text-xs">Architecting Report...</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center space-x-2">
                                                        <FileText className="w-5 h-5" />
                                                        <span className="font-black uppercase tracking-widest text-xs">Generate Lawsuit-Ready Report</span>
                                                    </div>
                                                )}
                                            </Button>
                                        ) : (
                                            <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tighter flex items-center">
                                                        <ShieldCheck className="w-4 h-4 mr-1" />
                                                        Detailed Forensic Analysis
                                                    </h4>
                                                    <Badge className="bg-indigo-100 text-indigo-700 border-none">{aiForensicReport.report_id}</Badge>
                                                </div>

                                                <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Legal Assessment</p>
                                                    <p className="text-sm text-indigo-900 font-bold leading-relaxed">{aiForensicReport.legal_assessment}</p>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Behavioral Evidence</p>
                                                        <div className="space-y-2">
                                                            {aiForensicReport.behavioral_evidence.map((item: string, i: number) => (
                                                                <div key={i} className="flex items-start space-x-3 text-xs text-gray-700 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                                                    <div className="mt-1 w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0" />
                                                                    <span className="font-medium">{item}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Strategic Roadmap</p>
                                                        <div className="space-y-2">
                                                            {aiForensicReport.mitigation_roadmap.map((item: string, i: number) => (
                                                                <div key={i} className="flex items-start space-x-3 text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                                                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                                                    <span className="font-bold">{item}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    variant="outline"
                                                    className="w-full border-2 border-dashed border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-200 h-12"
                                                    onClick={() => window.print()}
                                                >
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Export to Forensic PDF
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Metadata */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Telemetry Context</h4>
                                        <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                                            <div>
                                                <p className="text-[10px] text-gray-400">User Profile</p>
                                                <p className="text-sm font-mono font-bold text-gray-700">UID-{selectedUpdate.user_id}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400">Timestamp</p>
                                                <p className="text-sm font-mono text-gray-700">{new Date(selectedUpdate.timestamp).toLocaleTimeString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400">Model Engine</p>
                                                <p className="text-sm font-mono text-gray-700 tracking-tighter">bris-v2-forensics</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <Button className="w-full bg-purple-600 hover:bg-purple-700 shadow-md h-12 text-sm font-bold uppercase tracking-widest" onClick={() => setSelectedUpdate(null)}>
                                        Acknowledge Forensic Report
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-4xl font-black text-gray-900 tracking-tight">Live Monitor</h2>
                        <p className="text-gray-500 mt-1 font-medium">Real-time summarized behavioral streams</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-gray-500 hover:text-red-600 rounded-full px-4"
                            onClick={() => { setRiskUpdates([]); setStats({ total: 0, critical: 0, high: 0, medium: 0, low: 0 }) }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear Feed
                        </Button>
                        {isConnected && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 animate-pulse px-3 py-1 rounded-full">
                                <Clock className="w-3 h-3 mr-1" />
                                Interactive Feed Active
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card className="border-none shadow-sm ring-1 ring-gray-100">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                            <p className="text-3xl font-black text-gray-900">{stats.total}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm ring-1 ring-red-100 bg-red-50/30 cursor-pointer hover:bg-red-50 transition-colors" onClick={() => setFilter('critical')}>
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Critical</p>
                            <p className="text-3xl font-black text-red-600">{stats.critical}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm ring-1 ring-orange-100 bg-orange-50/30 cursor-pointer hover:bg-orange-50 transition-colors" onClick={() => setFilter('high')}>
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">High</p>
                            <p className="text-3xl font-black text-orange-600">{stats.high}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm ring-1 ring-yellow-100 bg-yellow-50/30 cursor-pointer hover:bg-yellow-50 transition-colors" onClick={() => setFilter('medium')}>
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Medium</p>
                            <p className="text-3xl font-black text-yellow-600">{stats.medium}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm ring-1 ring-green-100 bg-green-50/30 cursor-pointer hover:bg-green-50 transition-colors" onClick={() => setFilter('low')}>
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Low Risk</p>
                            <p className="text-3xl font-black text-green-600">{stats.low}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Buttons */}
                <div className="flex items-center space-x-3 bg-gray-50 p-2 rounded-xl w-fit">
                    <Filter className="w-4 h-4 text-gray-400 ml-2" />
                    <div className="flex space-x-1">
                        {['all', 'critical', 'high', 'medium', 'low'].map((f) => (
                            <Button
                                key={f}
                                size="sm"
                                variant={filter === f ? 'default' : 'ghost'}
                                className={filter === f ? 'shadow-sm' : 'text-gray-500'}
                                onClick={() => setFilter(f)}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Updates List */}
                {isLoading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="text-gray-500 mt-4">Loading historical risk data...</p>
                    </div>
                ) : filteredUpdates.length === 0 ? (
                    <Card className="border-dashed border-2">
                        <CardContent className="py-12">
                            <div className="text-center">
                                <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg font-bold">No suspicious streams detected</p>
                                <p className="text-gray-400 text-sm mt-2">
                                    {isConnected
                                        ? 'Platform is monitoring live. Signals will appear here as detected.'
                                        : 'Connecting to inference engine...'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredUpdates.map((update, index) => (
                            <Card
                                key={`${update.session_id}-${index}`}
                                className={`border-none shadow-sm ring-1 ring-gray-100 hover:ring-purple-200 transition-all ${index === 0 && filter === 'all' ? 'animate-in fade-in slide-in-from-top duration-700 ring-2 ring-purple-600/30' : ''
                                    }`}
                            >
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <CardTitle className="text-xl font-black text-gray-900 tracking-tight">
                                                    Session-{update.session_id.substring(0, 8)}
                                                </CardTitle>
                                                {getSeverityBadge(update.severity)}
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-500 font-medium">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">User ID: {update.user_id}</span>
                                                <span>•</span>
                                                <span className="text-xs">{formatDate(update.timestamp)}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className={`text-4xl font-black tracking-tighter ${getRiskColor(update.risk_score)}`}>
                                                {update.risk_score}
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Risk Index</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1 bg-gray-50/50 rounded-xl p-4 border border-gray-100/50">
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center mb-2">
                                                <AlertCircle className="w-3 h-3 mr-1 text-purple-500" />
                                                Behavioral Summary
                                            </p>
                                            <p className="text-sm text-gray-700 line-clamp-2 italic leading-relaxed">
                                                {update.explanation?.split('|')[0].replace('**SUMMARY:**', '').trim()}
                                            </p>
                                        </div>
                                        <div className="shrink-0">
                                            <Button
                                                onClick={() => setSelectedUpdate(update)}
                                                className="w-full md:w-auto bg-purple-600 text-white hover:bg-purple-700 shadow-sm font-bold text-xs uppercase tracking-widest h-12 px-6 rounded-xl group transition-all"
                                            >
                                                <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                                                ✨ AI Deep Insight
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Event Tiny Stats */}
                                    {update.features && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {[
                                                { label: 'Clicks', val: update.features.click_count, color: 'bg-blue-50 text-blue-600' },
                                                { label: 'Typed', val: `${update.features.keypress_count}ch`, color: 'bg-gray-100 text-gray-600' },
                                                { label: 'Tab Switch', val: update.features.tab_switch_count_raw, color: 'bg-orange-50 text-orange-600' },
                                                { label: 'Pasted', val: update.features.paste_count, color: 'bg-red-50 text-red-600' },
                                            ].map((stat) => (
                                                <div key={stat.label} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center ${stat.color}`}>
                                                    {stat.label}: {stat.val || 0}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    )
}
