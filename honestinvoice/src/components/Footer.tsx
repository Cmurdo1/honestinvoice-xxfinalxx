export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="text-sm text-gray-600">
            © {new Date().getFullYear()} HonestInvoice.com. All rights reserved.
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Created by</span>
            <span className="font-semibold text-gray-900">Corin Murdoch</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
