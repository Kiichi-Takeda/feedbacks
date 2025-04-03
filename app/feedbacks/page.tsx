'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type InterviewSession = {
  id: string
  candidate_name: string
  interview_date: string
  duration_minutes: number
  overall_score: number
  created_at: string
  interviewers?: {
    id: string
    name: string
  }
}

export default function InterviewSessionsPage() {
  const [data, setData] = useState<InterviewSession[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-100 text-emerald-800'
    if (score >= 70) return 'bg-blue-100 text-blue-800'
    if (score >= 50) return 'bg-amber-100 text-amber-800'
    return 'bg-red-100 text-red-800'
  }

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select(`
          id,
          candidate_name,
          interview_date,
          duration_minutes,
          overall_score,
          created_at,
          interviewers (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('取得エラー:', error)
      } else {
        const fixedData = (data as any[]).map((item) => ({
          ...item,
          interviewers: Array.isArray(item.interviewers) ? item.interviewers[0] : item.interviewers
        }))
        setData(fixedData as InterviewSession[])
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  const filteredData = data.filter((fb) =>
    fb.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (fb.interviewers?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">面接セッション一覧</h1>
            <p className="text-gray-500">面接候補者と面接官の評価セッションを管理・閲覧できます</p>
          </div>
          <Link
            href="/submit"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
          >
            新規セッション登録
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <input
            type="text"
            placeholder="候補者名または面接官で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-gray-600 w-full border border-gray-200 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="mb-4 text-sm text-gray-500">
          全{filteredData.length}件の結果
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">候補者</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">面接日</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">面接官</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">総合評価</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">所要時間</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">登録日時</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      該当するデータがありません
                    </td>
                  </tr>
                ) : (
                  filteredData.map((fb) => (
                    <tr key={fb.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/feedbacks/${fb.id}`} className="text-indigo-600 hover:underline font-medium">
                          {fb.candidate_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{fb.interview_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{fb.interviewers?.name || '（未設定）'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`text-sm font-semibold px-2 py-1 rounded-full ${getScoreColor(fb.overall_score)}`}>
                          {fb.overall_score} 点
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {fb.duration_minutes} 分
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {new Date(fb.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}