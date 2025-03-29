'use client'

import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { use } from 'react'

type Feedback = {
  id: string
  candidate_name: string
  interview_date: string
  flow_comment: string
  speaking_ratio_comment: string
  question_type_comment: string
  rapport_comment: string
  improvement_comment: string
  overall_comment: string
  score_structure: number
  score_listening: number
  score_depth: number
  transcript: string
  interview_analysis_summary?: {
    word_count_interviewer: number
    word_count_candidate: number
    speaking_ratio: string
    question_yesno: number
    question_open: number
    question_followup: number
  }
  interview_comments_with_evidence?: {
    id: string
    category: string
    comment: string
    evidence: string
  }[]
}

export default function FeedbackDetail({ params }: { params: any }) {
  const resolvedParams = use(params) as { id: string };
  const id = resolvedParams.id;
  const router = useRouter()
  const [data, setData] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(true)

  const getAverageScore = (feedback: Feedback) => {
    return ((feedback.score_structure + feedback.score_listening + feedback.score_depth) / 3).toFixed(1)
  }

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'bg-emerald-100 text-emerald-800'
    if (score >= 3) return 'bg-blue-100 text-blue-800'
    if (score >= 2) return 'bg-amber-100 text-amber-800'
    return 'bg-red-100 text-red-800'
  }

  const getProgressColor = (score: number) => {
    if (score >= 4) return 'bg-emerald-500'
    if (score >= 3) return 'bg-blue-500'
    if (score >= 2) return 'bg-amber-500'
    return 'bg-red-500'
  }

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('interview_feedbacks')
        .select(`
          *,
          interview_analysis_summary(*),
          interview_comments_with_evidence(*)
        `)
        .eq('id', id)
        .single()

      if (!error && data) setData(data as Feedback)
      setLoading(false)
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium text-lg">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="text-6xl mb-6">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">データが見つかりませんでした</h2>
          <p className="text-gray-500 mb-8">指定されたIDのフィードバックは存在しないか、削除された可能性があります。</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
          >
            一覧に戻る
          </button>
        </div>
      </div>
    )
  }

  const avgScore = Number(getAverageScore(data))
  const scoreColorClass = getScoreColor(avgScore)

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-6 sm:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">フィードバック詳細</h1>
            <p className="text-gray-500 mt-1">面接評価の詳細情報</p>
          </div>
          <button
            onClick={() => router.back()}
            className="text-gray-700 flex items-center px-5 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span>一覧に戻る</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 transform transition-all duration-300 hover:shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center mb-6">
            <div className="h-20 w-20 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
              {data.candidate_name.charAt(0)}
            </div>
            <div className="ml-0 sm:ml-6 mt-4 sm:mt-0 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-800">{data.candidate_name}</h2>
              <div className="flex items-center justify-center sm:justify-start text-gray-500 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span>{data.interview_date}</span>
              </div>
            </div>
            <div className="ml-auto mt-6 sm:mt-0">
              <div className={`text-center p-4 rounded-2xl ${scoreColorClass} transition-all duration-300 transform hover:scale-105`}>
                <div className="text-xs font-bold uppercase tracking-wider">平均スコア</div>
                <div className="text-3xl font-bold mt-1">{avgScore}</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {[
              { label: '構成力', value: data.score_structure, icon: '🏗️' },
              { label: '傾聴力', value: data.score_listening, icon: '👂' },
              { label: '深掘り力', value: data.score_depth, icon: '🔍' },
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md hover:bg-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-gray-700 flex items-center">
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </span>
                  <span className={`font-bold text-lg px-3 py-1 rounded-full ${getScoreColor(item.value)}`}>{item.value}/5</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`${getProgressColor(item.value)} h-3 rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${(item.value / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {[
            { title: '面接の流れ', value: data.flow_comment, icon: '🌊' },
            { title: '発言比率', value: data.speaking_ratio_comment, icon: '🗣️' },
            { title: '質問の質', value: data.question_type_comment, icon: '❓' },
            { title: '関係構築', value: data.rapport_comment, icon: '🤝' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl h-full">
              <div className="flex items-center mb-5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-400 to-blue-400 flex items-center justify-center text-white text-xl font-bold mr-4">
                  {item.icon}
                </div>
                <h2 className="text-xl font-bold text-gray-700">{item.title}</h2>
              </div>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-l-4 border-amber-500 transition-all duration-300 hover:shadow-xl">
          <div className="flex items-center mb-5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 flex items-center justify-center text-white text-xl font-bold mr-4">
              💡
            </div>
            <h2 className="text-xl font-bold text-gray-700">改善点・アドバイス</h2>
          </div>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">{data.improvement_comment}</p>
        </div>

        {data.interview_analysis_summary && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 transition-all duration-300 hover:shadow-xl">
            <h2 className="text-xl font-bold text-gray-700 mb-6 flex items-center">
              <span className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center text-white text-lg mr-4">
                📊
              </span>
              自動分析（定量ログ）
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-5 transition-all duration-300 hover:bg-gray-100">
                <div className="flex items-center mb-2">
                  <span className="text-xl mr-3">🗣️</span>
                  <span className="text-gray-700 font-medium">面接官の発話量</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{data.interview_analysis_summary.word_count_interviewer}文字</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 transition-all duration-300 hover:bg-gray-100">
                <div className="flex items-center mb-2">
                  <span className="text-xl mr-3">🙋‍♂️</span>
                  <span className="text-gray-700 font-medium">応募者の発話量</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{data.interview_analysis_summary.word_count_candidate}文字</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 transition-all duration-300 hover:bg-gray-100">
                <div className="flex items-center mb-2">
                  <span className="text-xl mr-3">📈</span>
                  <span className="text-gray-700 font-medium">発言比率</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{data.interview_analysis_summary.speaking_ratio}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 transition-all duration-300 hover:bg-gray-100">
                <div className="flex items-center mb-2">
                  <span className="text-xl mr-3">✅</span>
                  <span className="text-gray-700 font-medium">Yes/No質問数</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{data.interview_analysis_summary.question_yesno}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 transition-all duration-300 hover:bg-gray-100">
                <div className="flex items-center mb-2">
                  <span className="text-xl mr-3">💬</span>
                  <span className="text-gray-700 font-medium">オープン質問数</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{data.interview_analysis_summary.question_open}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 transition-all duration-300 hover:bg-gray-100">
                <div className="flex items-center mb-2">
                  <span className="text-xl mr-3">🔍</span>
                  <span className="text-gray-700 font-medium">深掘り質問数</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{data.interview_analysis_summary.question_followup}</p>
              </div>
            </div>
          </div>
        )}

{data.interview_comments_with_evidence && data.interview_comments_with_evidence.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 transition-all duration-300 hover:shadow-xl">
            <h2 className="text-xl font-bold text-gray-700 mb-6 flex items-center">
              <span className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 flex items-center justify-center text-white text-lg mr-4">
                🧠
              </span>
              コメントと根拠
            </h2>
            <div className="space-y-6">
              {data.interview_comments_with_evidence.map((item, index) => (
                <div key={item.id} className="border-l-4 border-indigo-500 pl-6 py-4 bg-gray-50 rounded-r-xl transition-all duration-300 hover:bg-gray-100">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center">
                    <span className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold mr-3">
                      {index + 1}
                    </span>
                    【{item.category}】
                  </h3>
                  <p className="text-gray-800 mb-3 ml-11">💬 {item.comment}</p>
                  <div className="ml-11 text-gray-500 text-sm bg-white p-3 rounded-lg border border-gray-200">
                    <p className="font-medium text-indigo-700 mb-1">🧾 根拠:</p>
                    <p>{item.evidence}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl shadow-lg p-8 mb-8 border-l-4 border-indigo-500 transition-all duration-300 hover:shadow-xl">
          <div className="flex items-center mb-5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold mr-4">
              📝
            </div>
            <h2 className="text-xl font-bold text-gray-700">総合コメント</h2>
          </div>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">{data.overall_comment}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 transition-all duration-300 hover:shadow-xl">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-8 py-5 border-b flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center text-white text-lg mr-4">
              📄
            </div>
            <h2 className="text-xl font-bold text-gray-700">面接全文</h2>
          </div>
          <div className="p-8">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-6 rounded-xl border border-gray-200 max-h-96 overflow-y-auto shadow-inner">
              {data.transcript}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}