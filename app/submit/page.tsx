'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SubmitPage() {
  const router = useRouter()
  const [jsonInput, setJsonInput] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info' | ''; text: string }>({ type: '', text: '' })
  const [interviewers, setInterviewers] = useState<{ id: string; name: string }[]>([])
  const [selectedInterviewerId, setSelectedInterviewerId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchInterviewers = async () => {
      setIsLoading(true)
      const { data, error } = await supabase.from('interviewers').select('id, name')
      if (data) setInterviewers(data)
      if (error) {
        console.error(error)
        setMessage({ type: 'error', text: `面接官の取得に失敗しました: ${error.message}` })
      }
      setIsLoading(false)
    }
    fetchInterviewers()
  }, [])

  const handleSubmit = async () => {
    if (!selectedInterviewerId) {
      setMessage({ type: 'error', text: '面接官を選択してください。' })
      return
    }

    try {
      setIsSubmitting(true)
      setMessage({ type: 'info', text: '保存中...' })

      let parsed
      try {
        parsed = JSON.parse(jsonInput)
      } catch (err) {
        console.error('❌ JSONパースエラー:', err)
        setMessage({ type: 'error', text: 'JSONの形式に誤りがあります。' })
        return
      }

      const { session, sections, evaluations, summary, strategy } = parsed
      if (!session || !sections || !evaluations || !summary) {
        setMessage({ type: 'error', text: 'session / sections / evaluations / summary が不足しています。' })
        return
      }

      // sessionにinterviewer_idを追加
      const sessionToInsert = {
        ...session,
        interviewer_id: selectedInterviewerId
      }

      const { data: sessionData, error: sessionError } = await supabase
        .from('interview_sessions')
        .insert([sessionToInsert])
        .select('id')
        .single()

      if (sessionError || !sessionData) {
        throw sessionError || new Error('セッションの保存に失敗しました。')
      }

      const session_id = sessionData.id

      // interview_sections 保存
      const sectionInsert = sections.map((s: any) => ({
        ...s,
        interview_session_id: session_id
      }))
      const { error: sectionError } = await supabase.from('interview_sections').insert(sectionInsert)
      if (sectionError) console.error('❌ セクション保存エラー:', sectionError)

      // interview_evaluations 保存
      const evaluationInsert = evaluations.map((e: any) => ({
        ...e,
        interview_session_id: session_id
      }))
      const { error: evalError } = await supabase.from('interview_evaluations').insert(evaluationInsert)
      if (evalError) console.error('❌ 評価保存エラー:', evalError)

      // summary 保存
      const { good, bad, advice } = summary
      const { error: summaryError } = await supabase
        .from('summary')
        .insert([{ interview_session_id: session_id, good, bad, advice }])
      if (summaryError) console.error('❌ summary保存エラー:', summaryError)

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
              value={selectedInterviewerId}
              onChange={(e) => setSelectedInterviewerId(e.target.value)}
              disabled={isLoading}
            >
              <option value="">-- 選択してください --</option>
              {interviewers.map((user) => (
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
              placeholder='{"session": {...}, "sections": [...], "evaluations": [...], "summary": {...}}'
              spellCheck="false"
            />
            <p className="text-sm text-gray-500 mt-1">※ interviewer_id は自動で追加されます</p>
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