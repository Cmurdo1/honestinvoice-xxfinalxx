import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Shield, 
  Crown,
  LogOut
} from 'lucide-react'

interface MobileNavProps {
  currentView: string
  onViewChange: (view: string) => void
  onLogout: () => void
}

export default function MobileNav({ currentView, onViewChange, onLogout }: MobileNavProps) {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'invoices', icon: FileText, label: 'Invoices' },
    { id: 'customers', icon: Users, label: 'Customers' },
    { id: 'subscription', icon: Crown, label: 'Plan' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-inset-bottom">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center space-y-1 touch-manipulation ${
                isActive 
                  ? 'text-primary' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{ minHeight: '44px' }} // Touch target size
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
        
        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="flex flex-col items-center justify-center space-y-1 touch-manipulation text-red-600 hover:text-red-700"
          style={{ minHeight: '44px' }}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>
    </nav>
  )
}
