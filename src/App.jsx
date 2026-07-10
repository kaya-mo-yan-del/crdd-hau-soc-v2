import { useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import CoughChart from './components/CoughChart'
import SummaryPanel from './components/SummaryPanel'
import DetectionHistory from './components/DetectionHistory'
import SettingsPanel from './components/SettingsPanel'
import { aggregateEventsByHour, fetchDetectionEvents, subscribeToDetectionEvents } from './data/detections'

export default function App() {
  const [active, setActive] = useState('dashboard')
  const [nightModeOn, setNightModeOn] = useState(false)

  // Raw event log — one entry per Sick detection, exact millisecond
  // timestamp (Philippine time). This is the single source of truth and
  // feeds Detection History directly.
  const [detectionEvents, setDetectionEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const isSettings = active === 'settings'

  const recordDetectionEvent = incomingEvent => {
    setDetectionEvents(previousEvents => [...previousEvents, incomingEvent])
  }

  // The graph (and summary stats) continue aggregating detections per hour,
  // recomputed any time a new event comes in.
  const hourlyRecords = useMemo(() => aggregateEventsByHour(detectionEvents), [detectionEvents])

  useEffect(() => {
    document.body.classList.toggle('night-mode', nightModeOn)

    return () => {
      document.body.classList.remove('night-mode')
    }
  }, [nightModeOn])

  // Load whatever detections already exist, then subscribe to new ones as
  // the Pi uploads them — this replaces the old simulated live feed with
  // real Supabase data + a realtime subscription.
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

  return (
    <div className="flex min-h-screen flex-col md:flex-row font-body text-ink overflow-x-hidden bg-bg">
      <Sidebar active={active} onNavigate={setActive} />

      <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7 md:ml-60">
        <Header
          title={isSettings ? 'Settings' : 'Detection result'}
          subtitle={isSettings ? '(Farm control)' : '(Daily)'}
        />

        {isSettings ? (
          <SettingsPanel nightModeOn={nightModeOn} onNightModeToggle={setNightModeOn} />
        ) : (
          <div className="flex flex-col xl:flex-row gap-5 xl:gap-6 items-start">
            <div className="flex-1 min-w-0 w-full">
              <CoughChart records={hourlyRecords} />
              <DetectionHistory records={detectionEvents} isLoading={isLoading} />
            </div>
            <SummaryPanel records={hourlyRecords} />
          </div>
        )}
      </main>
    </div>
  )
}
