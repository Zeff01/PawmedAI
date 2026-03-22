import { Link } from '@tanstack/react-router'

function LifeCycle() {
  return (
    <div className="bg-blue-50 border-b border-blue-200 text-center py-1.5 px-4">
      <p className="text-xs leading-none">
        <span className="font-semibold text-blue-600">⚠️ Beta Release — </span>
        <span className="text-blue-500">
          Minor issues may occur as we improve.
        </span>
        <Link
          to="/lifecycle"
          className="ml-1.5 font-medium text-blue-500 underline underline-offset-2 hover:text-blue-700 transition-colors"
        >
          Learn more
        </Link>
      </p>
    </div>
  )
}

export default LifeCycle
