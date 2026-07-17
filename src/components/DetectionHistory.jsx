import { useMemo, useState } from 'react'
import { CheckCircle2, Clock3, PlayCircle } from 'lucide-react'
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
    <section className="bg-surface rounded-xl2 shadow-card p-4 sm:p-5 lg:p-6 mt-4 sm:mt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-5">
        <div>
          <h2 className="font-display font-semibold text-base">Respiratory distress history</h2>
          <p className="text-xs text-muted mt-0.5">Every individual respiratory distress detection is logged with its exact timestamp.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted font-medium">
          <Clock3 size={13} /> {totalDetections} detections logged
        </div>
      </div>

      {groupedByDate.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-bg/60 px-4 py-8 text-center text-sm text-muted">
          {isLoading ? 'Loading detections…' : 'No detections recorded yet.'}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByDate.map(({ date, detections }) => (
            <div key={date} className="pb-1">
              <div className="mb-4">
                <p className="text-sm font-semibold text-ink">{formatDisplayDate(date)}</p>
                <p className="text-xs text-muted mt-0.5">
                  {detections.length} respiratory distress detection{detections.length === 1 ? '' : 's'} on this date
                </p>
              </div>

              <div className="space-y-4">
                {detections.map((detection, index) => {
                  const isLast = index === detections.length - 1
                  const isAudioOpen = activeAudioId === detection.id
                  const currentLabel = detection.reviewedLabel ?? null

                  return (
                    <div key={detection.id} className="relative pl-0">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* A checkmark always indicates the detection was
                              successfully recorded. */}
                          <span className="mt-0.5 text-success">
                            <CheckCircle2 size={18} strokeWidth={2} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink font-mono">{detection.time}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {REVIEW_OPTIONS.map(option => {
                            const isSelected = currentLabel === option
                            const selectedTone = option === 'Distress'
                              ? 'text-white bg-critical'
                              : 'text-white bg-success'
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => onReviewChange(detection.id, option)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                                  isSelected
                                    ? `${selectedTone} border-transparent`
                                    : 'text-muted border-line hover:bg-bg'
                                }`}
                              >
                                {option}
                              </button>
                            )
                          })}

                          <button
                            type="button"
                            onClick={() => setActiveAudioId(isAudioOpen ? null : detection.id)}
                            className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full transition-colors ${
                              isAudioOpen
                                ? 'text-sidebar bg-white border border-line'
                                : 'text-white bg-accent hover:bg-accent/90'
                            }`}
                          >
                            <PlayCircle size={14} strokeWidth={2} />
                            {isAudioOpen ? 'Hide audio' : 'Play audio'}
                          </button>
                        </div>
                      </div>

                      {isAudioOpen && (
                        <div className="mt-3 ml-0 sm:ml-11 rounded-xl border border-line bg-bg px-4 py-3">
                          <p className="text-sm font-semibold text-ink">{detection.audioFileName}</p>
                          <p className="text-xs text-muted mt-1">
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
                            <p className="text-xs text-critical mt-3">Audio clip unavailable.</p>
                          )}
                        </div>
                      )}

                      {!isLast && <div className="mt-4 h-[0.5px] bg-line opacity-60" />}
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
