import { useMemo, useState } from 'react'
import { CheckCircle2, Play } from 'lucide-react'
import { formatDisplayDate, getAvailableDates } from '../data/detections'

const REVIEW_OPTIONS = ['None', 'Distress']

export default function DetectionHistory({ records = [], isLoading = false, onReviewChange = () => {} }) {
  const [activeAudioId, setActiveAudioId] = useState(null)

  const groupedByDate = useMemo(() => {
    const dates = getAvailableDates(records)

    return dates.map(date => {
      const detectionsForDate = records
        .filter(record => record.date === date)
        .map((record, index) => ({
          id: record.id ?? `${date}-${record.time}-${index}`,
          time: record.time,
          coughs: record.coughs,
          audioFileName: record.audioFileName,
          audioDuration: record.audioDuration,
          audioUrl: record.audioUrl,
          confidence: record.confidence,
          reviewedLabel: record.reviewedLabel,
        }))
        // Timestamps are "HH:MM:SS.mmm", which sorts correctly as a string —
        // most recent detection first, even when events land milliseconds apart.
        .sort((a, b) => b.time.localeCompare(a.time))

      return { date, detections: detectionsForDate }
    })
  }, [records])

  const totalDetections = records.length

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Respiratory distress history</h2>
          <p className="text-sm text-gray-500 mt-1">Every individual detection is logged with its exact timestamp</p>
        </div>
        <div className="text-sm font-bold text-gray-800">
          {totalDetections} detections logged
        </div>
      </div>

      {groupedByDate.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          {isLoading ? 'Loading detections…' : 'No detections recorded yet.'}
        </div>
      ) : (
        <div className="space-y-6 mt-6">
          {groupedByDate.map(({ date, detections }) => (
            <div key={date} className="pb-1">
              <div className="mb-4">
                <h4 className="text-sm font-bold text-gray-900">
                  {formatDisplayDate(date)}{' '}
                  <span className="text-gray-500 font-normal">· {detections.length} detections on this date</span>
                </h4>
              </div>

              <div className="divide-y divide-gray-100 border-t border-gray-100">
                {detections.map((detection, index) => {
                  const isAudioOpen = activeAudioId === detection.id
                  const currentLabel = detection.reviewedLabel ?? null

                  return (
                    <div key={detection.id} className="py-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-emerald-500">
                            <CheckCircle2 size={18} strokeWidth={2} />
                          </span>
                          <span className="text-gray-800 text-sm font-medium">{detection.time}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
                            {REVIEW_OPTIONS.map(option => {
                              const isSelected = currentLabel === option
                              const selectedClass = option === 'None'
                                ? 'text-emerald-700 border-emerald-500 bg-white relative z-10'
                                : 'text-red-600 border-red-500 bg-white relative z-10'

                              return (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() => onReviewChange(detection.id, option)}
                                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                                    isSelected
                                      ? selectedClass
                                      : option === 'None'
                                        ? 'text-gray-600 hover:bg-gray-100 border-r border-gray-200'
                                        : 'text-gray-600 hover:bg-gray-100 border-l border-gray-200'
                                  } ${isSelected ? 'border rounded-md -ml-[1px]' : ''}`}
                                >
                                  {option}
                                </button>
                              )
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={() => setActiveAudioId(isAudioOpen ? null : detection.id)}
                            className={`inline-flex items-center gap-2 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                              isAudioOpen
                                ? 'bg-orange-600'
                                : 'bg-orange-500 hover:bg-orange-600'
                            }`}
                          >
                            <Play size={12} strokeWidth={2.5} />
                            {isAudioOpen ? 'Hide audio' : 'Play audio'}
                          </button>
                        </div>
                      </div>

                      {isAudioOpen && (
                        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                          <p className="text-sm font-semibold text-gray-900">{detection.audioFileName}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {detection.audioDuration} · recorded at {detection.time}
                            {typeof detection.confidence === 'number' && (
                              <> · {(detection.confidence * 100).toFixed(1)}% confidence</>
                            )}
                          </p>
                          {detection.audioUrl ? (
                            <audio controls className="w-full mt-3" src={detection.audioUrl}>
                              Your browser does not support the audio element.
                            </audio>
                          ) : (
                            <p className="text-xs text-red-600 mt-3">Audio clip unavailable.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
