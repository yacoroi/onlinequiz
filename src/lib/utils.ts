// Color utility functions for quiz options
export const getColorClass = (color: string, isSelected = false, isCorrect = false, hasAnswered = false) => {
  let baseClass = ''
  switch (color) {
    case 'red': baseClass = 'bg-red-500 hover:bg-red-600 text-white'; break
    case 'blue': baseClass = 'bg-blue-500 hover:bg-blue-600 text-white'; break
    case 'yellow': baseClass = 'bg-yellow-500 hover:bg-yellow-600 text-white'; break
    case 'green': baseClass = 'bg-green-500 hover:bg-green-600 text-white'; break
    default: baseClass = 'bg-gray-500 hover:bg-gray-600 text-white'
  }

  if (isSelected) {
    baseClass += ' ring-4 ring-white'
  }
  
  if (hasAnswered && isCorrect) {
    baseClass += ' ring-4 ring-yellow-400'
  }

  return baseClass
}

// Static color class for host view
export const getStaticColorClass = (color: string) => {
  switch (color) {
    case 'red': return 'bg-red-500 text-white'
    case 'blue': return 'bg-blue-500 text-white'
    case 'yellow': return 'bg-yellow-500 text-white'
    case 'green': return 'bg-green-500 text-white'
    default: return 'bg-gray-500 text-white'
  }
}

// Color class for quiz creation/editing with ring effects
export const getQuizEditColorClass = (color: string, isSelected = false) => {
  const base = isSelected ? 'ring-2 ring-offset-2' : ''
  switch (color) {
    case 'red': return `bg-red-500 hover:bg-red-600 text-white ${base} ring-red-500`
    case 'blue': return `bg-blue-500 hover:bg-blue-600 text-white ${base} ring-blue-500`
    case 'yellow': return `bg-yellow-500 hover:bg-yellow-600 text-white ${base} ring-yellow-500`
    case 'green': return `bg-green-500 hover:bg-green-600 text-white ${base} ring-green-500`
    default: return `bg-gray-500 hover:bg-gray-600 text-white ${base} ring-gray-500`
  }
}

// PIN code generation utility
export const generateGamePin = () => {
  return Math.floor(100000 + Math.random() * 900000).toString().padStart(6, '0')
}

// Time formatting utilities
export const formatElapsedTime = (startTime: string) => {
  const startMs = new Date(startTime).getTime()
  const currentMs = Date.now()
  return Math.floor((currentMs - startMs) / 1000)
}

export const calculateTimeRemaining = (startTime: string, duration: number) => {
  const elapsedSeconds = formatElapsedTime(startTime)
  return Math.max(0, duration - elapsedSeconds)
}

// Points calculation utility
export const calculatePoints = (
  isCorrect: boolean,
  maxPoints: number,
  timeElapsedMs: number,
  questionDurationMs: number
) => {
  if (!isCorrect) return 0
  
  const minPoints = Math.floor(maxPoints / 2)
  const pointsRange = maxPoints - minPoints
  const pointReductionPerMs = pointsRange / questionDurationMs
  const totalPointReduction = timeElapsedMs * pointReductionPerMs
  
  return Math.max(minPoints, Math.round(maxPoints - totalPointReduction))
}

// Cleanup utility for mounted state checking
export const createMountedChecker = () => {
  let mounted = true
  const checkMounted = () => mounted
  const cleanup = () => { mounted = false }
  return { checkMounted, cleanup }
}