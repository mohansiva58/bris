import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from './ui/Button'
import { Activity, AlertCircle, BarChart3, LogOut, Shield } from 'lucide-react'

interface LayoutProps {
    children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
    const location = useLocation()
    const { user, logout } = useAuthStore()

    const navigation = [
        { name: 'Dashboard', path: '/dashboard', icon: BarChart3 },
        { name: 'Risk Monitor', path: '/monitor', icon: Activity },
        { name: 'Alerts', path: '/alerts', icon: AlertCircle },
    ]

    const isActive = (path: string) => location.pathname === path

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">BRIS Platform</h1>
                                <p className="text-xs text-gray-500">Behavioral Risk Intelligence</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-700">
                                <span className="font-medium">{user?.full_name}</span>
                                <span className="text-gray-500 ml-2">({user?.role})</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={logout}>
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        {navigation.map((item) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`
                    inline-flex items-center px-1 pt-1 pb-4 border-b-2 text-sm font-medium transition-colors
                    ${isActive(item.path)
                                            ? 'border-purple-600 text-purple-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }
                  `}
                                >
                                    <Icon className="w-4 h-4 mr-2" />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    )
}
