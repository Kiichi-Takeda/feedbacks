'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SubmitPage() {
  const router = useRouter()
  const [jsonInput, setJsonInput] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info' | ''; text: string }>({ type: '', text: '' })
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      const { data, error } = await supabase.from('users').select('id, name')
      if (data) setUsers(data)
      if (error) {
        console.error(error)
        setMessage({ type: 'error', text: `ユーザー取得に失敗しました: ${error.message}` })
      }
      setIsLoading(false)
    }
    fetchUsers()
  }, [])

  const handleSubmit = async () => {
    if (!selectedUserId) {
      setMessage({ type: 'error', text: '面接官を選択してください。' })
      return
    }

    try {
      setIsSubmitting(true)
      setMessage({ type: 'info', text: '保存中...' })

      const parsed = JSON.parse(jsonInput)
      parsed.user_id = selectedUserId

      // 各部分を分解
      const { comments_with_evidence, analysis_summary, ...mainData } = parsed

      // 1. 面接フィードバックを保存
      const { data: feedbackData, error: feedbackError } = await supabase
      .from('interview_feedbacks')
      .insert([mainData])
      .select('id')
      .single()
    
    if (feedbackError || !feedbackData) {
      throw feedbackError || new Error('保存結果が返ってきませんでした。')
    }
      const interview_feedbacks_id = feedbackData.id

// 分析ログ
console.log('🟦 analysis_summary:', analysis_summary)
if (analysis_summary) {
  const { error: summaryError } = await supabase
    .from('interview_analysis_summary')
    .insert([{ interview_feedbacks_id, ...analysis_summary }])

  if (summaryError) {
    console.error('❌ 分析ログ保存エラー:', summaryError)
  } else {
    console.log('✅ 分析ログ保存成功')
  }
}

// コメント＋根拠
console.log('🟧 comments_with_evidence:', comments_with_evidence)
if (Array.isArray(comments_with_evidence)) {
  const enriched = comments_with_evidence.map((item) => ({
    interview_feedbacks_id,
    ...item
  }))
  const { error: commentError } = await supabase
    .from('interview_comments_with_evidence')
    .insert(enriched)

  if (commentError) {
    console.error('❌ コメント保存エラー:', commentError)
  } else {
    console.log('✅ コメント保存成功')
  }
}
      setMessage({ type: 'success', text: '✅ フィードバックが正常に保存されました！' })
      setJsonInput('')
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: '保存に失敗しました。JSON形式や構造を確認してください。' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getMessageStyles = () => {
    switch (message.type) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200'
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200'
      case 'info':
        return 'bg-blue-50 text-blue-800 border-blue-200'
      default:
        return 'hidden'
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">フィードバック登録</h1>
              <p className="text-gray-600">面接フィードバックをJSON形式で登録します</p>
            </div>
            <button
              onClick={() => router.push('/feedbacks')}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded hover:bg-gray-100"
            >
              一覧に戻る
            </button>
          </div>

          {/* 面接官選択 */}
          <div className="mb-6">
            <label className="block font-medium text-gray-800 mb-2">👤 面接官を選択</label>
            <select
              className="w-full border-gray-300 rounded-lg px-4 py-3"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={isLoading}
            >
              <option value="">-- 選択してください --</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {/* JSON入力 */}
          <div className="mb-6">
            <label className="block font-medium text-gray-800 mb-2">📋 フィードバックデータ (JSON)</label>
            <textarea
              className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{"candidate_name": "山田太郎", "interview_date": "2025-03-27", "score_structure": 4, ...}'
              spellCheck="false"
            />
            <p className="text-sm text-gray-500 mt-1">※ user_id は自動的に追加されます</p>
          </div>

          {/* メッセージ表示 */}
          {message.text && (
            <div className={`mb-6 p-4 border rounded-lg ${getMessageStyles()}`}>
              {message.type === 'error' && <span className="mr-2">⚠️</span>}
              {message.type === 'success' && <span className="mr-2">✅</span>}
              {message.type === 'info' && <span className="mr-2">ℹ️</span>}
              {message.text}
            </div>
          )}

          {/* 送信ボタン */}
          <div className="text-right">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-6 py-3 rounded-lg font-semibold text-white ${
                isSubmitting
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 transition-colors'
              }`}
            >
              {isSubmitting ? '保存中...' : '💾 保存する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}