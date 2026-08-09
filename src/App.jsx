import { useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import CoughChart from './components/CoughChart'
import DetectionHistory from './components/DetectionHistory'
import SettingsPanel from './components/SettingsPanel'
import {
  aggregateEventsByHour,
  fetchDetectionEvents,
  subscribeToDetectionEvents,
  fetchDeviceLastSeen,
  subscribeToDeviceStatus,
  isDeviceOnline,
  updateReviewedLabel,
} from './data/detections'

// How often we re-check "is it still recent enough to count as online" —
// this is what lets the status flip to offline on its own if the Pi stops
// checking in, not just when a new heartbeat arrives.
const DEVICE_STATUS_POLL_MS = 5000

export default function App() {
  const [active, setActive] = useState('dashboard')
  const [nightModeOn, setNightModeOn] = useState(false)

  // Raw event log — one entry per Sick detection, exact millisecond
  // timestamp (Philippine time). This is the single source of truth and
  // feeds Detection History directly.
  const [detectionEvents, setDetectionEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const [deviceLastSeen, setDeviceLastSeen] = useState(null)
  const [deviceStatus, setDeviceStatus] = useState('checking')

  const isSettings = active === 'settings'

  const recordDetectionEvent = incomingEvent => {
    setDetectionEvents(previousEvents => [...previousEvents, incomingEvent])
  }

  // Applies a vet's None/Distress call to the actual event list (not just
  // local UI state) so the graph's counts and peak immediately reflect it.
  // Rolls back if the Supabase write fails.
  const handleReviewChange = (detectionId, label) => {
    const previousEvents = detectionEvents

    setDetectionEvents(events =>
      events.map(event => (event.id === detectionId ? { ...event, reviewedLabel: label } : event))
    )

    updateReviewedLabel(detectionId, label).catch(() => {
      setDetectionEvents(previousEvents)
    })
  }

  // The graph continues aggregating detections per hour, recomputed any
  // time a new event comes in.
  const hourlyRecords = useMemo(() => aggregateEventsByHour(detectionEvents), [detectionEvents])

  useEffect(() => {
    document.body.classList.toggle('night-mode', nightModeOn)

    return () => {
      document.body.classList.remove('night-mode')
    }
  }, [nightModeOn])

  // Load whatever detections already exist, then subscribe to new ones as
  // the Pi uploads them — real Supabase data + a realtime subscription.
  useEffect(() => {
    let isMounted = true

    fetchDetectionEvents().then(events => {
      if (isMounted) {
        setDetectionEvents(events)
        setIsLoading(false)
      }
    })

    const unsubscribe = subscribeToDetectionEvents(recordDetectionEvent)

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  // Device status: load the Pi's last heartbeat, subscribe to new ones, and
  // separately re-check every few seconds so the badge can flip to offline
  // on its own if the Pi stops checking in (not just when a fresh heartbeat
  // arrives).
  useEffect(() => {
    let isMounted = true

    fetchDeviceLastSeen().then(lastSeen => {
      if (isMounted) setDeviceLastSeen(lastSeen)
    })

    const unsubscribe = subscribeToDeviceStatus(lastSeen => {
      if (isMounted) setDeviceLastSeen(lastSeen)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    const evaluate = () => setDeviceStatus(isDeviceOnline(deviceLastSeen) ? 'online' : 'offline')
    evaluate()
    const interval = setInterval(evaluate, DEVICE_STATUS_POLL_MS)
    return () => clearInterval(interval)
  }, [deviceLastSeen])

  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen overflow-x-hidden md:overflow-hidden font-body text-ink bg-[#f0f0f0]">
      <Sidebar
        active={active}
        onNavigate={setActive}
        deviceStatus={deviceStatus}
        deviceLastSeen={deviceLastSeen}
      />

      <main className="app-main flex-1 flex flex-col min-h-0 md:h-screen overflow-hidden md:ml-64 bg-[#e6e6e6]">
        <Header
          title={isSettings ? 'Settings' : 'Detection result'}
          subtitle={isSettings ? '(Farm control)' : '(Daily)'}
        />

        {isSettings ? (
          <SettingsPanel
            nightModeOn={nightModeOn}
            onNightModeToggle={setNightModeOn}
          />
        ) : (
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-8 space-y-4 sm:space-y-6 scrollbar-hide">
            <CoughChart records={hourlyRecords} nightModeOn={nightModeOn} />
            <DetectionHistory records={detectionEvents} isLoading={isLoading} onReviewChange={handleReviewChange} />
          </div>
        )}
      </main>
    </div>
  )
}
