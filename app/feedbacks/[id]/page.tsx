'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

type InterviewSession = {
  id: string
  candidate_name: string
  interview_date: string
  duration_minutes: number
  overall_score: number
  transcript: string
  interviewers?: {
    id: string
    name: string
  }
  interview_sections?: {
    id: string
    title: string
    start_time: string
    end_time: string
    percentage: number
  }[]
  interview_evaluations?: {
    id: string
    category: string
    score: number
    reason: string
    advice: string
  }[]
  summary?: {
    good: string
    bad: string
    advice: string
  }
}

export default function FeedbackDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const [data, setData] = useState<InterviewSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select(`
          *,
          interviewers(id, name),
          interview_sections(*),
          interview_evaluations(*),
          summary(*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('❌ Supabaseエラー:', error)
      } else {
        setData(data as InterviewSession)
      }

      setLoading(false)
    }

    fetchData()
  }, [id])

  if (loading) return <div className="p-10 text-gray-500">読み込み中...</div>
  if (!data) return <div className="p-10 text-red-500">データが見つかりません</div>

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        面接評価詳細：{data.candidate_name}
      </h1>
      <p className="text-gray-500 mb-6">
        面接日：{data.interview_date} ｜ 所要時間：{data.duration_minutes}分 ｜ 総合評価：{data.overall_score}点 ｜ 面接官：{data.interviewers?.name || '（未設定）'}
      </p>

      {/* セクション分析 */}
      {data.interview_sections && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">🧩 セクション分析</h2>
          <ul className="space-y-2">
            {data.interview_sections.map((sec) => (
              <li key={sec.id} className="bg-gray-100 p-4 rounded-md border">
                <div className="font-semibold">{sec.title}</div>
                <div className="text-sm text-gray-500">
                  {sec.start_time}〜{sec.end_time}（{sec.percentage}%）
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 評価項目フィードバック */}
      {data.interview_evaluations && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-700 mb-4">🎯 評価項目フィードバック</h2>
          <div className="space-y-5">
            {data.interview_evaluations.map((item, index) => (
              <div key={item.id} className="border-l-4 border-indigo-500 pl-4">
                <div className="font-bold text-gray-800">【{item.category}】 {item.score}/10</div>
                <p className="text-gray-700 mt-1">💬 {item.reason}</p>
                <p className="text-sm text-gray-500 mt-1">🛠 改善提案：{item.advice}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 総評 */}
      {data.summary && (
        <div className="bg-emerald-50 rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-emerald-700 mb-4">📋 総評</h2>
          <p className="mb-2"><strong>✅ 良かった点：</strong>{data.summary.good}</p>
          <p className="mb-2"><strong>⚠️ 改善点：</strong>{data.summary.bad}</p>
          <p><strong>💡 次回へのアドバイス：</strong>{data.summary.advice}</p>
        </div>
      )}

      {/* 文字起こし */}
      {data.transcript && (
        <div className="bg-gray-100 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">📄 面接文字起こし</h2>
          <pre className="whitespace-pre-wrap text-sm text-gray-700">{data.transcript}</pre>
        </div>
      )}
    </div>
  )
}