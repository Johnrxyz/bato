import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/api/tasks'
import { useUIStore } from '@/store/uiStore'
import { X, Send, Paperclip, Trash2, MessageSquare, CornerDownRight } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import styles from './TaskPanel.module.css'

export default function TaskPanel() {
  const queryClient = useQueryClient()
  const { activePanelTaskId, closeTaskPanel, toast } = useUIStore()
  const [commentText, setCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)

  const { data: taskResponse, isLoading } = useQuery({
    queryKey: ['tasks', activePanelTaskId],
    queryFn: () => tasksApi.get(activePanelTaskId),
    enabled: !!activePanelTaskId,
  })
  const task = taskResponse?.data

  const { data: commentsResponse } = useQuery({
    queryKey: ['tasks', activePanelTaskId, 'comments'],
    queryFn: () => tasksApi.listComments(activePanelTaskId),
    enabled: !!activePanelTaskId,
  })
  const comments = commentsResponse?.data

  const addComment = useMutation({
    mutationFn: (data) => tasksApi.addComment(activePanelTaskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', activePanelTaskId, 'comments'])
      setCommentText('')
      setReplyingTo(null)
    },
  })

  const uploadFile = useMutation({
    mutationFn: (file) => {
      const formData = new FormData()
      formData.append('file', file)
      return tasksApi.uploadAttachment(activePanelTaskId, formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', activePanelTaskId])
      toast.success('File uploaded')
    },
  })

  if (!activePanelTaskId) return null

  const handleSendComment = (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    addComment.mutate({ body: commentText, parent: replyingTo?.id })
  }

  return (
    <div className={`${styles.overlay} ${activePanelTaskId ? styles.active : ''}`} onClick={closeTaskPanel}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <button className={styles.closeBtn} onClick={closeTaskPanel}>
              <X size={20} />
            </button>
            <div className={styles.headerActions}>
              <StatusBadge status={task?.status} />
              <PriorityBadge priority={task?.priority} />
            </div>
          </div>
          <h2 className={styles.title}>{task?.title || 'Loading...'}</h2>
        </header>

        <div className={styles.content}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Description</h3>
            <div className={styles.description}>
              {task?.description || <span className={styles.placeholder}>No description provided.</span>}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Files</h3>
              <label className={styles.uploadBtn}>
                <Paperclip size={14} />
                <span>Upload</span>
                <input 
                  type="file" 
                  className={styles.hiddenInput} 
                  onChange={(e) => e.target.files?.[0] && uploadFile.mutate(e.target.files[0])}
                />
              </label>
            </div>
            <div className={styles.fileGrid}>
              {task?.attachments?.map(file => (
                <div key={file.id} className={styles.fileCard}>
                  <div className={styles.fileIcon}><Paperclip size={16} /></div>
                  <div className={styles.fileInfo}>
                    <span className={styles.fileName}>{file.filename}</span>
                    <span className={styles.fileMeta}>{Math.round(file.size / 1024)} KB</span>
                  </div>
                  <a href={file.url} target="_blank" rel="noreferrer" className={styles.downloadLink}>View</a>
                </div>
              ))}
              {!task?.attachments?.length && <p className={styles.empty}>No files attached.</p>}
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Discussion</h3>
            <div className={styles.commentList}>
              {comments?.map(comment => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment} 
                  onReply={(c) => setReplyingTo(c)} 
                />
              ))}
            </div>
          </section>
        </div>

        <footer className={styles.footer}>
          {replyingTo && (
            <div className={styles.replyIndicator}>
              <CornerDownRight size={14} />
              <span>Replying to <strong>{replyingTo.author?.full_name}</strong></span>
              <button onClick={() => setReplyingTo(null)}>Cancel</button>
            </div>
          )}
          <form className={styles.commentForm} onSubmit={handleSendComment}>
            <input 
              type="text" 
              placeholder="Write a comment..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className={styles.commentInput}
            />
            <button type="submit" className={styles.sendBtn} disabled={!commentText.trim() || addComment.isLoading}>
              <Send size={18} />
            </button>
          </form>
        </footer>
      </div>
    </div>
  )
}

function CommentItem({ comment, onReply, isReply }) {
  return (
    <div className={styles.commentGroup}>
      <div className={`${styles.comment} ${isReply ? styles.replyItem : ''}`}>
        <div className={styles.commentAvatar}>
          {comment.author?.avatar ? (
            <img src={comment.author.avatar} alt="" />
          ) : (
            <span>{comment.author?.full_name?.[0]}</span>
          )}
        </div>
        <div className={styles.commentBody}>
          <div className={styles.commentHeader}>
            <span className={styles.commentAuthor}>{comment.author?.full_name}</span>
            <span className={styles.commentDate}>{format(new Date(comment.created_at), 'MMM d, h:mm a')}</span>
          </div>
          <p className={styles.commentText}>{comment.body}</p>
          <button className={styles.replyBtn} onClick={() => onReply(comment)}>
            <MessageSquare size={12} />
            Reply
          </button>
        </div>
      </div>
      {comment.replies?.length > 0 && (
        <div className={styles.replies}>
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} onReply={onReply} isReply />
          ))}
        </div>
      )}
    </div>
  )
}
