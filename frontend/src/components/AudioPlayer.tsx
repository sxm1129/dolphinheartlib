interface AudioPlayerProps {
  taskId: string
  className?: string
}

export default function AudioPlayer({ taskId, className = '' }: AudioPlayerProps) {
  const url = `/api/tasks/${taskId}/audio`
  return (
    <div className={className}>
      <audio src={url} controls className="w-full max-w-md" />
    </div>
  )
}
